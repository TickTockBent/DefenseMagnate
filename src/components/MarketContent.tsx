// Market Content Component
// Shows open market for material purchasing and product sales

import { useGameStore } from '../state/gameStoreWithEquipment';
import { MaterialLot, MarketSupplier, PurchaseOrder, PlayerListing } from '../types';
import { formatGameTime } from '../utils/gameClock';
import { useState, useEffect } from 'react';

// Helper function to format material names for display
function formatMaterialName(materialId: string): string {
  return materialId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get quality grade color
function getQualityGradeClass(grade: string): string {
  switch (grade) {
    case 'salvage': return 'text-orange-400';
    case 'standard': return 'text-teal-400';
    case 'premium': return 'text-blue-400';
    case 'military': return 'text-purple-400';
    default: return 'text-gray-400';
  }
}

interface MaterialLotCardProps {
  lot: MaterialLot;
  supplier: MarketSupplier | undefined;
  onPurchase: (lotId: string) => void;
  canAfford: boolean;
  currentTime: number;
}

function MaterialLotCard({ lot, supplier, onPurchase, canAfford, currentTime }: MaterialLotCardProps) {
  const [purchasing, setPurchasing] = useState(false);
  
  const handlePurchase = () => {
    setPurchasing(true);
    onPurchase(lot.id);
    // Reset after animation
    setTimeout(() => setPurchasing(false), 500);
  };
  
  const timeUntilExpiry = lot.expiresAt - currentTime;
  const isExpiringSoon = timeUntilExpiry < 12; // Less than 12 hours
  
  return (
    <div className={`terminal-card border-gray-600 ${isExpiringSoon ? 'border-yellow-600' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-teal-400 font-medium">{formatMaterialName(lot.materialId)}</h4>
          <p className="text-gray-400 text-sm">{supplier?.name || 'Unknown Supplier'}</p>
          <p className="text-gray-500 text-xs">
            <span className={getQualityGradeClass(lot.qualityGrade)}>
              {lot.qualityGrade.toUpperCase()}
            </span>
            {' • '}
            {lot.quantity} units available
          </p>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-xs">
            {supplier && (
              <div>Rep: {supplier.reputation}% • Rel: {supplier.reliability}%</div>
            )}
          </div>
          {isExpiringSoon && (
            <div className="text-yellow-400 text-xs font-bold">EXPIRES SOON</div>
          )}
        </div>
      </div>
      
      {lot.description && (
        <p className="text-gray-500 text-xs mb-3 italic">{lot.description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-400">Price:</span>
          <div className="font-mono text-white">
            {lot.pricePerUnit}cr/unit
          </div>
          <div className="font-mono text-teal-400 font-bold">
            {lot.totalPrice}cr total
          </div>
        </div>
        <div>
          <span className="text-gray-400">Delivery:</span>
          <div className="font-mono text-white">
            {Math.ceil(lot.deliveryTimeHours)} hours
          </div>
          <div className="text-gray-500 text-xs">
            Est. arrival
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Expires in {Math.max(0, Math.ceil(timeUntilExpiry))}h
        </div>
        <button 
          onClick={handlePurchase}
          disabled={!canAfford || purchasing}
          className={`text-xs px-3 py-1 border transition-colors ${
            purchasing 
              ? 'bg-green-700 border-green-500 text-green-100' 
              : canAfford
                ? 'bg-teal-800 hover:bg-teal-700 text-teal-100 border-teal-600'
                : 'bg-gray-800 text-gray-500 border-gray-600 cursor-not-allowed'
          }`}
        >
          {purchasing ? 'Ordered!' : canAfford ? 'Purchase' : 'Insufficient Credits'}
        </button>
      </div>
    </div>
  );
}

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  supplier: MarketSupplier | undefined;
  currentTime: number;
}

function PurchaseOrderCard({ order, supplier, currentTime }: PurchaseOrderCardProps) {
  const isDelivered = currentTime >= order.deliveryAt;
  const timeRemaining = Math.max(0, order.deliveryAt - currentTime);
  
  return (
    <div className={`terminal-card ${isDelivered ? 'border-green-600' : 'border-blue-600'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-white font-medium">{formatMaterialName(order.materialId)}</h4>
          <p className="text-gray-400 text-sm">{supplier?.name || 'Unknown Supplier'}</p>
        </div>
        <div className="text-right">
          <div className={`text-xs px-2 py-1 rounded ${
            isDelivered ? 'bg-green-800 text-green-200' : 'bg-blue-800 text-blue-200'
          }`}>
            {isDelivered ? 'DELIVERED' : 'IN TRANSIT'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Quantity:</span>
          <div className="font-mono text-white">{order.quantity} units</div>
        </div>
        <div>
          <span className="text-gray-400">{isDelivered ? 'Delivered:' : 'ETA:'}:</span>
          <div className="font-mono text-white">
            {isDelivered ? 'Complete' : `${Math.ceil(timeRemaining)}h`}
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Total paid: {order.totalPaid}cr
      </div>
    </div>
  );
}

interface PlayerListingCardProps {
  listing: PlayerListing;
  onRemove: (listingId: string) => void;
  currentTime: number;
}

function PlayerListingCard({ listing, onRemove, currentTime }: PlayerListingCardProps) {
  const [removing, setRemoving] = useState(false);
  
  const handleRemove = () => {
    setRemoving(true);
    onRemove(listing.id);
    setTimeout(() => setRemoving(false), 500);
  };
  
  const soldPercentage = (listing.soldQuantity / listing.quantity) * 100;
  const remainingQuantity = listing.quantity - listing.soldQuantity;
  const timeUntilExpiry = listing.expiresAt - currentTime;
  const isExpired = timeUntilExpiry <= 0;
  
  const getStatusClass = () => {
    if (listing.status === 'sold') return 'border-green-600';
    if (listing.status === 'partially_sold') return 'border-blue-600';
    if (listing.status === 'expired') return 'border-red-600';
    if (isExpired) return 'border-orange-600';
    return 'border-teal-600';
  };
  
  const getStatusText = () => {
    if (listing.status === 'sold') return 'SOLD OUT';
    if (listing.status === 'expired') return 'EXPIRED';
    if (isExpired) return 'EXPIRED';
    if (listing.soldQuantity > 0) return 'SELLING';
    return 'LISTED';
  };
  
  return (
    <div className={`terminal-card ${getStatusClass()}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-teal-400 font-medium">{formatMaterialName(listing.productId)}</h4>
          <p className="text-gray-400 text-sm">Your Listing</p>
          <p className="text-gray-500 text-xs">
            <span className={getQualityGradeClass(listing.qualityGrade)}>
              {listing.qualityGrade.toUpperCase()}
            </span>
            {' • '}
            Listed {Math.floor(currentTime - listing.listedAt)}h ago
          </p>
        </div>
        <div className="text-right">
          <div className={`text-xs px-2 py-1 rounded ${
            listing.status === 'sold' ? 'bg-green-800 text-green-200' :
            listing.status === 'partially_sold' ? 'bg-blue-800 text-blue-200' :
            'bg-teal-800 text-teal-200'
          }`}>
            {getStatusText()}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-400">Progress:</span>
          <div className="font-mono text-white">
            {listing.soldQuantity}/{listing.quantity} sold
          </div>
          <div className="text-gray-500 text-xs">
            {soldPercentage.toFixed(0)}% complete
          </div>
        </div>
        <div>
          <span className="text-gray-400">Revenue:</span>
          <div className="font-mono text-white">
            {listing.pricePerUnit}cr/unit
          </div>
          <div className="font-mono text-teal-400">
            {(listing.soldQuantity * listing.pricePerUnit).toLocaleString()}cr earned
          </div>
        </div>
      </div>
      
      {listing.soldQuantity > 0 && (
        <div className="mb-3">
          <div className="text-teal-400 text-xs">
            {'█'.repeat(Math.floor(soldPercentage / 10))}{'░'.repeat(10 - Math.floor(soldPercentage / 10))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {isExpired ? 'Expired' : `Expires in ${Math.max(0, Math.ceil(timeUntilExpiry))}h`}
        </div>
        {(listing.status === 'active' || listing.status === 'partially_sold') && remainingQuantity > 0 && (
          <button 
            onClick={handleRemove}
            disabled={removing}
            className={`text-xs px-3 py-1 border transition-colors ${
              removing 
                ? 'bg-red-700 border-red-500 text-red-100' 
                : 'bg-red-800 hover:bg-red-700 text-red-100 border-red-600'
            }`}
          >
            {removing ? 'Removing...' : 'Remove Listing'}
          </button>
        )}
      </div>
    </div>
  );
}

interface ProductListingInterfaceProps {
  facility: any;
}

function ProductListingInterface({ facility }: ProductListingInterfaceProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [pricePerUnit, setPricePerUnit] = useState<number>(100);
  const [listing, setListing] = useState(false);
  const { listProductForSale } = useGameStore();
  
  // Get available products from facility inventory (new system) or legacy storage
  const availableProducts = facility.inventory ? 
    // Use new inventory system
    Array.from(facility.inventory.groups.values())
      .flatMap(group => group.slots)
      .filter(slot => ['basic_sidearm', 'tactical_knife'].includes(slot.baseItemId))
      .filter(slot => slot.available > 0)
      .map(slot => {
        const tags = slot.stack.uniqueTags;
        const quality = slot.stack.averageQuality;
        const qualityLabel = quality >= 90 ? 'pristine' : 
                            quality >= 75 ? 'functional' : 
                            quality >= 50 ? 'standard' : 'junk';
        const tagLabels = tags.join(', ');
        
        return {
          key: `${slot.baseItemId}_${qualityLabel}_${tags.join('_')}`,
          productId: slot.baseItemId,
          quality: qualityLabel,
          tags: tagLabels,
          quantity: slot.available,
          averageQuality: quality
        };
      }) :
    // Fall back to legacy storage
    Object.keys(facility.current_storage)
      .filter(key => key.includes('_') && facility.current_storage[key] > 0)
      .map(key => {
        const [productId, quality] = key.split('_');
        return {
          key,
          productId,
          quality,
          tags: '',
          quantity: facility.current_storage[key],
          averageQuality: 0
        };
      })
      .filter(item => ['basic_sidearm', 'tactical_knife'].includes(item.productId));
  
  const handleListProduct = () => {
    if (!selectedProduct || quantity <= 0 || pricePerUnit <= 0) return;
    
    const selectedInfo = availableProducts.find(p => p.key === selectedProduct);
    if (!selectedInfo) return;
    
    setListing(true);
    listProductForSale(facility.id, selectedInfo.productId, quantity, pricePerUnit);
    
    // Reset form
    setSelectedProduct('');
    setQuantity(1);
    setPricePerUnit(100);
    setTimeout(() => setListing(false), 500);
  };
  
  const selectedProductInfo = availableProducts.find(p => p.key === selectedProduct);
  
  return (
    <div className="terminal-card border-gray-600">
      <h3 className="text-gray-400 font-bold mb-3">LIST PRODUCTS FOR SALE</h3>
      
      {availableProducts.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <div>No manufactured products available to sell.</div>
          <div className="text-xs mt-2">Complete manufacturing jobs to create products, then return here to list them for sale.</div>
          {facility.inventory && (
            <div className="text-xs mt-1 text-gray-400">
              Inventory system: {facility.inventory.totalItems} total items stored
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Product Selection */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Select Product:</div>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-xs p-2 focus:border-teal-400 focus:outline-none"
            >
              <option value="">-- Choose Product --</option>
              {availableProducts.map(product => (
                <option key={product.key} value={product.key}>
                  {formatMaterialName(product.productId)} ({product.quality}){product.tags && ` [${product.tags}]`} - {product.quantity} available
                </option>
              ))}
            </select>
          </div>
          
          {selectedProductInfo && (
            <>
              {/* Quantity */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Quantity:</div>
                <input
                  type="number"
                  min="1"
                  max={selectedProductInfo.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProductInfo.quantity, parseInt(e.target.value) || 1)))}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-xs p-2 focus:border-teal-400 focus:outline-none"
                />
              </div>
              
              {/* Price Per Unit */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Price per Unit (cr):</div>
                <input
                  type="number"
                  min="1"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-300 text-xs p-2 focus:border-teal-400 focus:outline-none"
                />
              </div>
              
              {/* Summary */}
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-xs text-gray-400">Listing Summary:</div>
                <div className="text-sm text-white">
                  {quantity}x {formatMaterialName(selectedProductInfo.productId)} ({selectedProductInfo.quality}){selectedProductInfo.tags && ` [${selectedProductInfo.tags}]`}
                </div>
                <div className="text-sm text-teal-400 font-mono">
                  Total Value: {(quantity * pricePerUnit).toLocaleString()}cr
                </div>
              </div>
              
              {/* List Button */}
              <button
                onClick={handleListProduct}
                disabled={listing}
                className={`w-full px-3 py-2 text-sm border transition-colors ${
                  listing 
                    ? 'bg-green-700 border-green-500 text-green-100' 
                    : 'bg-teal-800 hover:bg-teal-700 text-teal-100 border-teal-600'
                }`}
              >
                {listing ? 'Listed!' : 'List for Sale'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MarketContent() {
  const { 
    marketState, 
    marketGenerator,
    credits, 
    gameTime, 
    selectedFacilityId,
    facilities,
    purchaseMarketLot,
    removePlayerListing,
    refreshMarketLots
  } = useGameStore();
  
  const handlePurchase = (lotId: string) => {
    if (!selectedFacilityId) return;
    purchaseMarketLot(lotId, selectedFacilityId);
  };
  
  const handleRemoveListing = (listingId: string) => {
    removePlayerListing(listingId);
  };
  
  const availableLots = marketState.availableLots;
  const activeOrders = marketState.activePurchaseOrders;
  const playerListings = marketState.playerListings;
  const currentFacility = facilities.find(f => f.id === selectedFacilityId);
  
  return (
    <div className="space-y-6 font-mono text-sm">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">◊</span> MATERIAL MARKET
      </div>
      
      {/* Implementation Status Notice */}
      <div className="terminal-card border-blue-600">
        <div className="text-center">
          <div className="text-blue-400 font-mono text-lg mb-2">⚡ MARKET V1 ACTIVE</div>
          <div className="text-gray-400 text-sm">
            Open market for material purchasing. Dynamic lot generation and contract system coming online.
          </div>
        </div>
      </div>
      
      {/* Market Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Available Lots</div>
          <div className="font-mono text-teal-400 text-lg">{availableLots.length}</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Active Orders</div>
          <div className="font-mono text-blue-400 text-lg">{activeOrders.length}</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Credits Available</div>
          <div className="font-mono text-yellow-400 text-lg">{credits.toLocaleString()}cr</div>
        </div>
      </div>
      
      {/* Active Purchase Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-gray-400 font-bold mb-3">ACTIVE ORDERS</h3>
          <div className="space-y-3">
            {activeOrders.map(order => {
              const supplier = marketGenerator.getSupplier(order.supplierId);
              return (
                <PurchaseOrderCard 
                  key={order.id}
                  order={order}
                  supplier={supplier}
                  currentTime={gameTime.totalGameHours}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Player Product Listings */}
      {playerListings.length > 0 && (
        <div>
          <h3 className="text-gray-400 font-bold mb-3">YOUR PRODUCT LISTINGS</h3>
          <div className="space-y-3">
            {playerListings.map(listing => (
              <PlayerListingCard 
                key={listing.id}
                listing={listing}
                onRemove={handleRemoveListing}
                currentTime={gameTime.totalGameHours}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Product Listing Interface */}
      {currentFacility ? (
        <ProductListingInterface facility={currentFacility} />
      ) : (
        <div className="terminal-card border-yellow-600">
          <h3 className="text-gray-400 font-bold mb-3">LIST PRODUCTS FOR SALE</h3>
          <div className="text-center text-yellow-400 py-4">
            No facility selected. Please select a facility to list products for sale.
          </div>
        </div>
      )}
      
      {/* Available Material Lots */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-400 font-bold">AVAILABLE LOTS</h3>
          <button 
            onClick={refreshMarketLots}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 border border-gray-600"
          >
            Refresh Market
          </button>
        </div>
        
        {availableLots.length === 0 ? (
          <div className="terminal-card border-gray-600">
            <div className="text-center text-gray-500">
              No lots currently available. Check back later or refresh the market.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {availableLots.map(lot => {
              const supplier = marketGenerator.getSupplier(lot.supplierId);
              const canAfford = credits >= lot.totalPrice;
              
              return (
                <MaterialLotCard
                  key={lot.id}
                  lot={lot}
                  supplier={supplier}
                  onPurchase={handlePurchase}
                  canAfford={canAfford}
                  currentTime={gameTime.totalGameHours}
                />
              );
            })}
          </div>
        )}
      </div>
      
      {/* Market Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={refreshMarketLots}
          className="btn-secondary"
        >
          Scout New Suppliers
        </button>
        <button 
          className="btn-secondary opacity-50 cursor-not-allowed" 
          disabled
        >
          Request Custom Lot
        </button>
      </div>
      
      {/* Current Time Display */}
      <div className="text-xs text-gray-500 text-center">
        Market Time: {formatGameTime(gameTime)}
      </div>
    </div>
  );
}