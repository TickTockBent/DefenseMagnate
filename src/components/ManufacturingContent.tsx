import { useGameStore } from '../state/gameStore'
import { getAllProductIds, getProductData, canAffordMaterials } from '../data/productHelpers'

export function ManufacturingContent() {
  const facilities = useGameStore((state) => state.facilities)
  const materials = useGameStore((state) => state.materials)
  const productionLines = useGameStore((state) => state.productionLines)
  const startProduction = useGameStore((state) => state.startProduction)
  
  const availableProducts = getAllProductIds()
  const garage = facilities[0] // Our starting garage

  const handleStartProduction = (productId: string) => {
    if (garage) {
      startProduction(garage.id, productId, 1) // Make 1 unit
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">⚙</span> MANUFACTURING
      </div>

      {/* Garage Status */}
      {garage && (
        <div className="terminal-card">
          <h3 className="text-white font-medium mb-3">{garage.name}</h3>
          <div className="text-sm text-gray-400 mb-4">
            {garage.description}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Type:</span>
              <div className="text-teal-400">{garage.type}</div>
            </div>
            <div>
              <span className="text-gray-400">Production Lines:</span>
              <div className="text-teal-400">{garage.production_lines}</div>
            </div>
            <div>
              <span className="text-gray-400">Max Size:</span>
              <div className="text-teal-400">{garage.max_item_size}</div>
            </div>
          </div>
        </div>
      )}

      {/* Available Products */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">AVAILABLE PRODUCTS</h3>
        <div className="space-y-3">
          {availableProducts.map((productId) => {
            const product = getProductData(productId)
            const canAfford = canAffordMaterials(productId, 1, materials)
            
            if (!product) return null
            
            return (
              <div key={productId} className="terminal-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{product.name}</h4>
                    <div className="text-sm text-gray-400 mt-1">
                      Materials needed:
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.materials_required.map(req => (
                        <div key={req.material_id}>
                          • {req.quantity_per_unit}x {req.material_id} 
                          <span className={`ml-2 ${(materials[req.material_id] || 0) >= req.quantity_per_unit ? 'text-green-400' : 'text-red-400'}`}>
                            ({materials[req.material_id] || 0} available)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Labor: {product.base_labor_hours} hours • Complexity: {product.complexity_rating}/10
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartProduction(productId)}
                    disabled={!canAfford}
                    className={`px-3 py-1 text-sm font-mono rounded ${
                      canAfford 
                        ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'START PRODUCTION' : 'INSUFFICIENT MATERIALS'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Production */}
      {productionLines.length > 0 && (
        <div>
          <h3 className="text-sm font-mono text-gray-400 mb-4">ACTIVE PRODUCTION</h3>
          <div className="space-y-3">
            {productionLines.map((line) => {
              const product = getProductData(line.productId)
              if (!product) return null
              
              return (
                <div key={line.id} className="terminal-card border-teal-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium">{product.name}</h4>
                      <div className="text-sm text-gray-400">
                        Quantity: {line.quantity} • Progress: {line.progress}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: {line.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 text-sm font-mono">IN PROGRESS</div>
                      <div className="text-xs text-gray-500">ETA: Next turn</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${line.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}