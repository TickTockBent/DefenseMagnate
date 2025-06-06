import { useGameStore } from '../state/gameStore-simple'

export function ManufacturingContent() {
  const factories = useGameStore((state) => state.factories)
  // const facilities = useGameStore((state) => state.facilities) // TODO: Use when migrating from factories

  // Sample production queue data
  const productionQueue = [
    { id: '1', name: 'Basic Sidearm', progress: 75, eta: 1, materials: true },
    { id: '2', name: 'Scrap Refurbishment', progress: 0, eta: 3, materials: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">⚙</span> MANUFACTURING
      </div>

      {/* Facilities Overview */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">FACILITIES</h3>
        <div className="space-y-4">
          {/* Garage Workshop */}
          <div className="terminal-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-medium">My Garage</h4>
                <p className="text-gray-400 text-sm">Garage Workshop</p>
              </div>
              <div className="text-right">
                <div className="status-good text-sm">OPERATIONAL</div>
                <div className="text-gray-400 text-xs">1 Production Line</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Max Item Size</div>
                <div className="font-mono text-teal-400">Small</div>
              </div>
              <div>
                <div className="text-gray-400">Storage</div>
                <div className="font-mono text-teal-400">15/100</div>
              </div>
              <div>
                <div className="text-gray-400">Efficiency</div>
                <div className="font-mono text-teal-400">100%</div>
              </div>
            </div>
          </div>

          {/* Legacy Factories */}
          {factories.map((factory) => {
            const efficiencyPercent = Math.round(factory.efficiency * 100)
            const statusClass = factory.status === 'online' ? 'status-good' : 
                              factory.status === 'offline' ? 'status-danger' : 'status-warning'
            
            return (
              <div key={factory.id} className="terminal-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-medium">{factory.name}</h4>
                    <p className="text-gray-400 text-sm">Industrial Facility</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${statusClass}`}>{factory.status.toUpperCase()}</div>
                    <div className="text-gray-400 text-xs">{efficiencyPercent}% efficiency</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  Queue: {factory.queue.length} items
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Production Queue */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">PRODUCTION QUEUE</h3>
        {productionQueue.length > 0 ? (
          <div className="space-y-3">
            {productionQueue.map((item, index) => (
              <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">#{index + 1} {item.name}</h4>
                    <div className="text-xs text-gray-500 mt-1">
                      Materials: {item.materials ? 
                        <span className="status-good">Loaded</span> : 
                        <span className="status-warning">Required</span>
                      }
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">ETA: {item.eta} turns</div>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{item.progress}% Complete</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No items in production queue</div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="btn-secondary">
          Add to Queue
        </button>
        <button className="btn-secondary">
          Retool Facility
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400">Total Capacity</div>
          <div className="font-mono text-teal-400">1 Line Active</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400">Retooling Cost</div>
          <div className="font-mono status-warning">250cr</div>
        </div>
      </div>
    </div>
  )
}