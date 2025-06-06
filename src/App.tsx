import { useGameStore } from './state/gameStore-simple'
import { HorizontalTabs } from './components/HorizontalTabs'
import { ContentPanel } from './components/ContentPanel'
import { ResourcePanel } from './components/ResourcePanel'

function App() {
  const turn = useGameStore((state) => state.turn)
  const credits = useGameStore((state) => state.credits)
  const advanceTurn = useGameStore((state) => state.advanceTurn)
  
  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <header className="terminal-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="ascii-accent text-lg">▲</span>
            <h1 className="text-xl font-bold text-white">DEFENSE MAGNATE</h1>
            <span className="ascii-accent text-lg">▼</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-gray-400">TURN:</span>
              <span className="text-teal-400 font-mono ml-2">{turn.toString().padStart(3, '0')}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">CREDITS:</span>
              <span className="status-good font-mono ml-2">{credits.toLocaleString()}cr</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="terminal-card">
            <HorizontalTabs />
          </div>
          
          {/* Content */}
          <div className="terminal-card min-h-96">
            <ContentPanel />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ResourcePanel />
        </div>
      </div>

      {/* Actions */}
      <div className="terminal-card">
        <div className="flex items-center justify-between">
          <div className="ascii-accent text-sm">
            {`> STATUS: OPERATIONAL`}
          </div>
          <button 
            onClick={advanceTurn}
            className="btn-primary"
          >
            ADVANCE TURN
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
