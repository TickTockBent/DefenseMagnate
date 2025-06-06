import { useGameStore } from '../state/gameStore-simple'

export function ResourcePanel() {
  const resources = useGameStore((state) => state.resources)

  const resourceEntries = Object.entries(resources)

  return (
    <div className="space-y-6">
      {/* Resources */}
      <div className="terminal-card">
        <div className="terminal-header">
          <span className="ascii-accent">◆</span> RESOURCES
        </div>
        <div className="space-y-3">
          {resourceEntries.map(([name, amount]) => (
            <div key={name} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{name}</span>
              <span className="font-mono text-teal-400">{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Starmap */}
      <div className="terminal-card">
        <div className="terminal-header">
          <span className="ascii-accent">◇</span> STARMAP: SECTOR 3C
        </div>
        <div className="bg-gray-800 rounded p-4 mb-4">
          <div className="grid grid-cols-6 gap-1 font-mono text-center text-sm">
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="status-danger">X</span>
            <span className="text-gray-600">·</span>
            <span className="status-warning">P</span>
            <span className="text-gray-600">·</span>
            
            <span className="status-info">S</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-yellow-400">!</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-600">·</span>
            <span className="status-danger">X</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div><span className="status-danger">X</span> Conflict</div>
          <div><span className="status-warning">P</span> Pirates</div>
          <div><span className="text-yellow-400">!</span> Disruption</div>
          <div><span className="status-info">S</span> Scout</div>
        </div>
      </div>
    </div>
  )
}