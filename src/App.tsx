import { useGameStore } from './state/gameStoreWithEquipment'
import { HorizontalTabs } from './components/HorizontalTabs'
import { ContentPanel } from './components/ContentPanel'
import { ResourcePanel } from './components/ResourcePanel'
import { formatGameTime, formatGameSpeed } from './utils/gameClock'
import { useEffect } from 'react'

function App() {
  const gameTime = useGameStore((state) => state.gameTime)
  const credits = useGameStore((state) => state.credits)
  const updateGameTime = useGameStore((state) => state.updateGameTime)
  const togglePause = useGameStore((state) => state.togglePause)
  const setGameSpeed = useGameStore((state) => state.setGameSpeed)
  const updateProduction = useGameStore((state) => state.updateProduction)
  
  // Global game clock - runs every second, but game speed affects time passage
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameTime.isPaused) {
        // Apply game speed multiplier to time passage
        const effectiveMs = 1000 * gameTime.gameSpeed;
        updateGameTime(effectiveMs) // Game time elapsed based on speed
        updateProduction() // Update production systems
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [updateGameTime, updateProduction, gameTime.isPaused, gameTime.gameSpeed])
  
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
              <span className="text-gray-400">TIME:</span>
              <span className="text-teal-400 font-mono ml-2">{formatGameTime(gameTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">SPEED:</span>
              <span className={`font-mono text-sm ${gameTime.isPaused ? 'text-orange-400' : 'text-teal-400'}`}>
                {formatGameSpeed(gameTime.isPaused ? 0 : gameTime.gameSpeed)}
              </span>
              <div className="flex space-x-1 ml-2">
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors border ${
                      gameTime.gameSpeed === speed
                        ? 'bg-teal-600 border-teal-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
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

      {/* Time Controls */}
      <div className="terminal-card">
        <div className="flex items-center justify-between">
          <div className="ascii-accent text-sm">
            {`> STATUS: ${gameTime.isPaused ? 'PAUSED' : 'OPERATIONAL'}`}
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={togglePause}
              className={`px-4 py-2 font-mono rounded transition-colors ${
                gameTime.isPaused 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-orange-600 hover:bg-orange-500 text-white'
              }`}
            >
              {gameTime.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
