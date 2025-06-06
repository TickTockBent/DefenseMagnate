export function SupplyContent() {
  const suppliers = [
    {
      id: '1',
      name: 'Junk Yard Pete',
      materials: ['Scrap Metal'],
      status: 'operational',
      price: 12,
      reliability: 95,
      location: 'Local Moon',
      risk: 'low'
    },
    {
      id: '2',
      name: 'Asteroid Mining Corp',
      materials: ['Raw Ore', 'Basic Components'],
      status: 'disrupted',
      price: 35,
      reliability: 78,
      location: 'Asteroid Belt',
      risk: 'medium'
    },
    {
      id: '3',
      name: 'Black Market Dealer',
      materials: ['Advanced Electronics', 'Rare Materials'],
      status: 'available',
      price: 85,
      reliability: 60,
      location: 'Unknown',
      risk: 'high'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">◊</span> SUPPLY LINES
      </div>

      {/* Not Implemented Notice */}
      <div className="terminal-card border-yellow-600">
        <div className="text-center">
          <div className="text-yellow-400 font-mono text-lg mb-2">⚠ NOT YET IMPLEMENTED</div>
          <div className="text-gray-400 text-sm">
            Supply chain management is planned but not yet functional. Currently showing placeholder data.
          </div>
        </div>
      </div>

      {/* Active Suppliers */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">ACTIVE SUPPLIERS</h3>
        <div className="space-y-4">
          {suppliers.filter(s => s.status === 'operational').map((supplier) => (
            <div key={supplier.id} className="terminal-card border-green-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-medium">{supplier.name}</h4>
                  <p className="text-gray-400 text-sm">{supplier.materials.join(', ')}</p>
                  <p className="text-gray-500 text-xs">{supplier.location}</p>
                </div>
                <div className="text-right">
                  <div className="status-good text-sm">OPERATIONAL</div>
                  <div className="text-gray-400 text-xs">{supplier.reliability}% reliable</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="font-mono text-teal-400 ml-2">{supplier.price}cr/unit</span>
                </div>
                <button className="btn-secondary text-xs" disabled>
                  Order Materials
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disrupted Suppliers */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">DISRUPTED SUPPLIERS</h3>
        <div className="space-y-3">
          {suppliers.filter(s => s.status === 'disrupted').map((supplier) => (
            <div key={supplier.id} className="bg-gray-800 rounded-lg p-4 border border-orange-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-gray-300 font-medium">{supplier.name}</h4>
                  <p className="text-gray-500 text-sm">{supplier.materials.join(', ')}</p>
                  <p className="text-gray-600 text-xs">{supplier.location}</p>
                </div>
                <div className="text-right">
                  <div className="status-warning text-sm">DISRUPTED</div>
                  <div className="text-gray-500 text-xs">Pirate Activity</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Route blocked • Estimated restoration: 3-5 turns
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Suppliers */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">POTENTIAL SUPPLIERS</h3>
        <div className="space-y-3">
          {suppliers.filter(s => s.status === 'available').map((supplier) => {
            const riskClass = supplier.risk === 'high' ? 'status-danger' : 
                             supplier.risk === 'medium' ? 'status-warning' : 'status-good'
            
            return (
              <div 
                key={supplier.id} 
                className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-yellow-500 cursor-pointer transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-yellow-400 font-medium">{supplier.name}</h4>
                    <p className="text-gray-400 text-sm">{supplier.materials.join(', ')}</p>
                    <p className="text-gray-500 text-xs">{supplier.location}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono px-2 py-1 rounded ${riskClass}`}>
                      {supplier.risk.toUpperCase()} RISK
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-mono text-teal-400 ml-2">{supplier.price}cr/unit</span>
                  </div>
                  <button className="btn-secondary text-xs" disabled>
                    Establish Route
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="btn-secondary" disabled>
          Scout New Suppliers
        </button>
        <button className="btn-secondary" disabled>
          Negotiate Prices
        </button>
      </div>

      {/* Supply Chain Stats */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">SUPPLY CHAIN STATUS</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400">Active Routes</div>
            <div className="font-mono status-good">1</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400">Disruptions</div>
            <div className="font-mono status-warning">1</div>
          </div>
          <div className="bg-gray-800 rounded p-3">
            <div className="text-gray-400">Avg. Price</div>
            <div className="font-mono text-teal-400">44cr/unit</div>
          </div>
        </div>
      </div>
    </div>
  )
}