// Contracts Content Component
// Shows customer contracts for product sales

import { useGameStore } from '../state/gameStoreWithEquipment';
import { CustomerContract, Customer, ContractRequirement } from '../types';
import { formatGameTime } from '../utils/gameClock';
import { useState, useEffect } from 'react';

// Helper function to format product names for display
function formatProductName(productId: string): string {
  return productId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get customer type color
function getCustomerTypeClass(type: string): string {
  switch (type) {
    case 'military': return 'text-red-400';
    case 'corporate': return 'text-blue-400';
    case 'government': return 'text-purple-400';
    case 'rebel': return 'text-orange-400';
    case 'civilian': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

// Helper function to get quality standard display
function getQualityStandardText(standard: string): string {
  switch (standard) {
    case 'low': return 'Any Quality';
    case 'standard': return 'Standard+';
    case 'high': return 'High Quality';
    case 'military': return 'Military Spec';
    default: return 'Unknown';
  }
}

interface ContractCardProps {
  contract: CustomerContract;
  customer: Customer | undefined;
  onAccept: (contractId: string) => void;
  onFulfill?: (contractId: string) => void;
  currentTime: number;
  canAccept: boolean;
}

function ContractCard({ contract, customer, onAccept, onFulfill, currentTime, canAccept }: ContractCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  
  const handleAccept = () => {
    setAccepting(true);
    onAccept(contract.id);
    setTimeout(() => setAccepting(false), 500);
  };
  
  const handleFulfill = () => {
    if (!onFulfill) return;
    setFulfilling(true);
    onFulfill(contract.id);
    setTimeout(() => setFulfilling(false), 500);
  };
  
  const isAvailable = contract.status === 'available';
  const isActive = contract.status === 'accepted' || contract.status === 'in_progress';
  const isCompleted = contract.status === 'completed';
  const isFailed = contract.status === 'failed';
  
  // Calculate time remaining for active contracts
  let timeRemaining = 0;
  let isOverdue = false;
  if (isActive && contract.acceptedAt) {
    const deadline = contract.acceptedAt + contract.deadlineHours;
    timeRemaining = Math.max(0, deadline - currentTime);
    isOverdue = timeRemaining === 0;
  }
  
  // Get border color based on status
  let borderClass = 'border-gray-600';
  if (isAvailable) borderClass = 'border-yellow-600';
  if (isActive && !isOverdue) borderClass = 'border-green-600';
  if (isActive && isOverdue) borderClass = 'border-red-600';
  if (isCompleted) borderClass = 'border-blue-600';
  if (isFailed) borderClass = 'border-red-600';
  
  return (
    <div className={`terminal-card ${borderClass}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-medium">{contract.title}</h4>
          <p className="text-gray-400 text-sm">{customer?.name || 'Unknown Customer'}</p>
          <p className="text-gray-500 text-xs">
            <span className={getCustomerTypeClass(customer?.type || '')}>
              {customer?.type?.toUpperCase() || 'UNKNOWN'}
            </span>
            {' • '}
            {getQualityStandardText(customer?.qualityStandards || '')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-teal-400 font-mono font-bold">
            {contract.totalPayment.toLocaleString()}cr
          </div>
          {contract.rushOrder && (
            <div className="text-red-400 text-xs font-bold">RUSH ORDER</div>
          )}
          {customer && (
            <div className="text-gray-500 text-xs">
              Rep: {customer.reputation}% • Pay: {customer.paymentReliability}%
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-gray-500 text-xs mb-1">Requirements:</div>
        {contract.requirements.map((req, idx) => (
          <div key={idx} className="text-sm">
            <span className="text-white font-mono">{req.quantity}x</span>
            <span className="text-gray-300 ml-2">{formatProductName(req.productId)}</span>
            <span className="text-gray-500 ml-2">(min {req.minimumQuality}% quality)</span>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mb-3 italic">
        {contract.description}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-gray-400">Deadline:</span>
          <div className="font-mono text-white">
            {isActive ? `${Math.ceil(timeRemaining)}h remaining` : `${contract.deadlineHours}h to complete`}
          </div>
          {contract.allowPartialFulfillment && (
            <div className="text-gray-500 text-xs">
              Min {contract.minimumFulfillmentPercent}% fulfillment
            </div>
          )}
        </div>
        <div>
          <span className="text-gray-400">Payment:</span>
          <div className="font-mono text-white">
            {(contract.totalPayment / contract.requirements[0]?.quantity || 0).toFixed(0)}cr/unit
          </div>
          {contract.bonusRate > 0 && (
            <div className="text-green-400 text-xs">
              +{(contract.bonusRate * 100).toFixed(0)}% early bonus
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs">
          {isAvailable && (
            <span className="text-yellow-400">Available to accept</span>
          )}
          {isActive && !isOverdue && (
            <span className="text-green-400">In progress</span>
          )}
          {isActive && isOverdue && (
            <span className="text-red-400">OVERDUE</span>
          )}
          {isCompleted && (
            <span className="text-blue-400">Completed</span>
          )}
          {isFailed && (
            <span className="text-red-400">Failed</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {isAvailable && (
            <button 
              onClick={handleAccept}
              disabled={!canAccept || accepting}
              className={`text-xs px-3 py-1 border transition-colors ${
                accepting 
                  ? 'bg-green-700 border-green-500 text-green-100' 
                  : canAccept
                    ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-100 border-yellow-600'
                    : 'bg-gray-800 text-gray-500 border-gray-600 cursor-not-allowed'
              }`}
            >
              {accepting ? 'Accepted!' : 'Accept Contract'}
            </button>
          )}
          
          {isActive && onFulfill && (
            <button 
              onClick={handleFulfill}
              disabled={fulfilling}
              className={`text-xs px-3 py-1 border transition-colors ${
                fulfilling 
                  ? 'bg-blue-700 border-blue-500 text-blue-100' 
                  : 'bg-teal-800 hover:bg-teal-700 text-teal-100 border-teal-600'
              }`}
            >
              {fulfilling ? 'Fulfilling...' : 'Fulfill Contract'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractsContent() {
  const { 
    contractState, 
    contractGenerator,
    gameTime, 
    selectedFacilityId,
    acceptCustomerContract,
    fulfillContract,
    refreshContracts
  } = useGameStore();
  
  // For now, we'll use mock contracts since the generator isn't fully integrated
  const [mockContracts] = useState<CustomerContract[]>([
    {
      id: 'contract-1',
      customerId: 'customer-1',
      title: 'Rebel Coalition Weapon Order',
      description: 'Resistance forces require reliable equipment. Any functional condition acceptable.',
      requirements: [{
        productId: 'basic_sidearm',
        quantity: 25,
        minimumQuality: 30,
        maxAcceptableDefects: 2
      }],
      totalPayment: 3750,
      deadlineHours: 168, // 1 week
      rushOrder: false,
      allowPartialFulfillment: true,
      minimumFulfillmentPercent: 80,
      penaltyRate: 0.05,
      bonusRate: 0.02,
      status: 'available'
    },
    {
      id: 'contract-2',
      customerId: 'customer-2',
      title: 'Corporate Security Premium Contract',
      description: 'Official corporate procurement contract. High quality standards required.',
      requirements: [{
        productId: 'basic_sidearm',
        quantity: 50,
        minimumQuality: 80,
        maxAcceptableDefects: 1
      }],
      totalPayment: 11250,
      deadlineHours: 336, // 2 weeks
      rushOrder: false,
      allowPartialFulfillment: true,
      minimumFulfillmentPercent: 90,
      penaltyRate: 0.03,
      bonusRate: 0.05,
      status: 'available'
    },
    {
      id: 'contract-3',
      customerId: 'customer-3',
      title: 'Emergency Military Procurement',
      description: 'Urgent military procurement for active operations. Military specification quality mandatory.',
      requirements: [{
        productId: 'tactical_knife',
        quantity: 15,
        minimumQuality: 90,
        maxAcceptableDefects: 0
      }],
      totalPayment: 1950,
      deadlineHours: 72, // 3 days
      rushOrder: true,
      allowPartialFulfillment: false,
      minimumFulfillmentPercent: 100,
      penaltyRate: 0.10,
      bonusRate: 0.15,
      status: 'available'
    }
  ]);
  
  const [mockCustomers] = useState<Customer[]>([
    {
      id: 'customer-1',
      name: 'Free Coalition',
      type: 'rebel',
      reputation: 65,
      paymentReliability: 75,
      qualityStandards: 'low',
      preferredProducts: ['basic_sidearm', 'tactical_knife']
    },
    {
      id: 'customer-2',
      name: 'Titan Corporation',
      type: 'corporate',
      reputation: 85,
      paymentReliability: 95,
      qualityStandards: 'high',
      preferredProducts: ['basic_sidearm']
    },
    {
      id: 'customer-3',
      name: 'Vega Military Command',
      type: 'military',
      reputation: 95,
      paymentReliability: 100,
      qualityStandards: 'military',
      preferredProducts: ['basic_sidearm', 'tactical_knife']
    }
  ]);
  
  const handleAcceptContract = (contractId: string) => {
    acceptCustomerContract(contractId);
  };
  
  const handleFulfillContract = (contractId: string) => {
    if (!selectedFacilityId) return;
    fulfillContract(contractId, selectedFacilityId);
  };
  
  const availableContracts = contractState.availableCustomerContracts;
  const activeContracts = contractState.activeCustomerContracts;
  
  return (
    <div className="space-y-6 font-mono text-sm">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">◈</span> CUSTOMER CONTRACTS
      </div>
      
      {/* Implementation Status Notice */}
      <div className="terminal-card border-green-600">
        <div className="text-center">
          <div className="text-green-400 font-mono text-lg mb-2">⚡ CONTRACTS V1 ACTIVE</div>
          <div className="text-gray-400 text-sm">
            Customer contract system online. Accept contracts and fulfill with manufactured products.
          </div>
        </div>
      </div>
      
      {/* Contract Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Available</div>
          <div className="font-mono text-yellow-400 text-lg">{availableContracts.length}</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Active</div>
          <div className="font-mono text-green-400 text-lg">{activeContracts.length}</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs">Completed Today</div>
          <div className="font-mono text-blue-400 text-lg">{contractState.completedContracts.length}</div>
        </div>
      </div>
      
      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div>
          <h3 className="text-gray-400 font-bold mb-3">ACTIVE CONTRACTS</h3>
          <div className="space-y-3">
            {activeContracts.map(contract => {
              const customer = contractGenerator.getCustomer(contract.customerId);
              return (
                <ContractCard 
                  key={contract.id}
                  contract={contract}
                  customer={customer}
                  onAccept={handleAcceptContract}
                  onFulfill={handleFulfillContract}
                  currentTime={gameTime.totalGameHours}
                  canAccept={true}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Available Contracts */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-400 font-bold">AVAILABLE CONTRACTS</h3>
          <button 
            onClick={refreshContracts}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 border border-gray-600"
          >
            Refresh Contracts
          </button>
        </div>
        
        {availableContracts.length === 0 ? (
          <div className="terminal-card border-gray-600">
            <div className="text-center text-gray-500">
              No contracts currently available. Check back later or refresh.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {availableContracts.map(contract => {
              const customer = contractGenerator.getCustomer(contract.customerId);
              return (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  customer={customer}
                  onAccept={handleAcceptContract}
                  currentTime={gameTime.totalGameHours}
                  canAccept={true}
                />
              );
            })}
          </div>
        )}
      </div>
      
      {/* Contract Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={refreshContracts}
          className="btn-secondary"
        >
          Scout New Customers
        </button>
        <button 
          className="btn-secondary opacity-50 cursor-not-allowed" 
          disabled
        >
          Negotiate Terms
        </button>
      </div>
      
      {/* Current Time Display */}
      <div className="text-xs text-gray-500 text-center">
        Contract Time: {formatGameTime(gameTime)}
      </div>
    </div>
  );
}