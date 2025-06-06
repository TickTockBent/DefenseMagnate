import { useGameStore } from '../state/gameStore'

export function ContractsContent() {
  const contracts = useGameStore((state) => state.contracts)
  const gameTime = useGameStore((state) => state.gameTime)
  const acceptContract = useGameStore((state) => state.acceptContract)

  const activeContracts = contracts.filter(c => c.status === 'active')
  const availableContracts = contracts.filter(c => c.status === 'available')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-header">
        <span className="ascii-accent">◈</span> CONTRACTS
      </div>

      {/* Active Contracts */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">ACTIVE CONTRACTS</h3>
        {activeContracts.length > 0 ? (
          <div className="space-y-3">
            {activeContracts.map((contract) => {
              const timeLeft = contract.deadline - gameTime.days
              const urgencyClass = timeLeft <= 1 ? 'status-danger' : timeLeft <= 2 ? 'status-warning' : 'status-good'
              
              return (
                <div key={contract.id} className="bg-gray-800 rounded-lg p-4 border border-green-600">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-medium">{contract.faction}</h4>
                      <p className="text-gray-400 text-sm">{contract.requirements.join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="status-good font-mono">{contract.payment.toLocaleString()}cr</div>
                      <div className={`text-xs ${urgencyClass}`}>
                        {timeLeft} days remaining
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No active contracts</div>
        )}
      </div>

      {/* Available Contracts */}
      <div>
        <h3 className="text-sm font-mono text-gray-400 mb-4">AVAILABLE CONTRACTS</h3>
        {availableContracts.length > 0 ? (
          <div className="space-y-3">
            {availableContracts.map((contract) => {
              const riskClass = contract.risk === 'high' ? 'status-danger' : contract.risk === 'medium' ? 'status-warning' : 'status-good'
              
              return (
                <div 
                  key={contract.id} 
                  className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-yellow-500 cursor-pointer transition-all duration-200"
                  onClick={() => acceptContract(contract.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-medium">{contract.faction}</h4>
                      <p className="text-gray-400 text-sm">{contract.requirements.join(', ')}</p>
                      <div className="mt-2">
                        <span className={`text-xs font-mono px-2 py-1 rounded ${riskClass}`}>
                          {contract.risk.toUpperCase()} RISK
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="status-good font-mono text-lg">{contract.payment.toLocaleString()}cr</div>
                      <div className="text-xs text-gray-500">
                        Due: {contract.deadline} days
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">No available contracts</div>
        )}
      </div>
    </div>
  )
}