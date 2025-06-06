import { useGameStore } from '../state/gameStore'

export function ResearchContent() {
  const research = useGameStore((state) => state.research)
  const credits = useGameStore((state) => state.credits)
  const startResearch = useGameStore((state) => state.startResearch)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">◯</span> RESEARCH & DEVELOPMENT
      </div>

      {/* Current Project */}
      {research.current && (
        <div className="bg-gray-800 rounded-lg p-4 border border-teal-500">
          <div className="text-sm text-gray-400 mb-2">ACTIVE PROJECT</div>
          <div className="text-white font-medium">{research.current}</div>
          <div className="mt-3">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '40%' }}></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">40% Complete • 3 turns remaining</div>
          </div>
        </div>
      )}

      {/* Available Projects */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">AVAILABLE PROJECTS</h3>
        <div className="space-y-3">
          {research.available.map((item) => {
            const isComplete = research.completed.includes(item.id)
            const isCurrent = research.current === item.id
            const canStart = item.prerequisites.every((p: string) => research.completed.includes(p)) && !isComplete && !isCurrent
            const canAfford = credits >= item.cost

            let statusText = ''
            let statusClass = ''
            
            if (isComplete) {
              statusText = 'COMPLETE'
              statusClass = 'status-good'
            } else if (isCurrent) {
              statusText = 'IN PROGRESS'
              statusClass = 'text-yellow-400'
            } else if (!canStart) {
              statusText = 'LOCKED'
              statusClass = 'text-gray-600'
            } else if (!canAfford) {
              statusText = 'INSUFFICIENT FUNDS'
              statusClass = 'status-danger'
            } else {
              statusText = 'READY'
              statusClass = 'status-good'
            }

            return (
              <div
                key={item.id}
                className={`bg-gray-800 rounded-lg p-4 border transition-all duration-200 ${
                  canStart && canAfford 
                    ? 'border-gray-600 hover:border-yellow-500 cursor-pointer' 
                    : 'border-gray-700'
                }`}
                onClick={() => canStart && canAfford && startResearch(item.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className={`font-medium ${canStart && canAfford ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {item.name}
                    </h4>
                    <div className="text-sm text-gray-500 mt-1">
                      Cost: <span className="font-mono">{item.cost.toLocaleString()}cr</span>
                    </div>
                  </div>
                  <div className={`text-xs font-mono px-2 py-1 rounded ${statusClass}`}>
                    {statusText}
                  </div>
                </div>
                
                {item.prerequisites.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Requires: {item.prerequisites.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400">Research Speed</div>
          <div className="font-mono text-teal-400">10 points/turn</div>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400">Available Funds</div>
          <div className="font-mono status-good">{credits.toLocaleString()}cr</div>
        </div>
      </div>
    </div>
  )
}