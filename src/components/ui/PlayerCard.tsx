import React from 'react'
import { PlayerData } from '../../types/Player'

interface PlayerCardProps {
  player: PlayerData
  onUpdate: (playerId: string, updates: Partial<PlayerData>) => void
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onUpdate }) => {
  const [prezzoAtteso, setPrezzoAtteso] = React.useState(player.prezzoAtteso || player.prezzo || 0)
  const [acquistatore, setAcquistatore] = React.useState(player.acquistatore || '')
  const [isEditingPrice, setIsEditingPrice] = React.useState(false)
  const [isEditingAcquistatore, setIsEditingAcquistatore] = React.useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owned': return 'bg-green-50 border-green-200'
      case 'removed': return 'bg-red-50 border-red-200 opacity-60'
      default: return 'bg-white border-gray-200'
    }
  }

  const handleToggleInterest = () => {
    onUpdate(player.id, { interessante: !player.interessante })
  }

  const handleRemove = () => {
    onUpdate(player.id, { status: 'removed', rimosso: true })
  }

  const handlePrezzoAttesoSave = () => {
    onUpdate(player.id, { prezzoAtteso })
    setIsEditingPrice(false)
  }

  const handleAcquistatoreSave = () => {
    onUpdate(player.id, { acquistatore: acquistatore.trim() || undefined })
    setIsEditingAcquistatore(false)
  }

  const handleToggleOwned = () => {
    const newStatus = player.status === 'owned' ? 'available' : 'owned'
    const updates: Partial<PlayerData> = { status: newStatus }
    
    if (newStatus === 'owned' && !acquistatore.trim()) {
      updates.acquistatore = 'Me'
      setAcquistatore('Me')
    }
    
    onUpdate(player.id, updates)
  }

  return (
    <div className={`player-card rounded-lg border p-4 hover:shadow-md transition-all ${getStatusColor(player.status)} ${player.interessante ? 'ring-2 ring-yellow-300' : ''}`}>
      {/* Player Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{player.nome}</h4>
          <p className="text-sm text-gray-600">{player.squadra}</p>
        </div>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={handleToggleInterest}
            className={`p-1 rounded transition-colors ${
              player.interessante 
                ? 'text-yellow-600 hover:text-yellow-700' 
                : 'text-gray-400 hover:text-yellow-600'
            }`}
            title={player.interessante ? 'Rimuovi interesse' : 'Aggiungi interesse'}
          >
            ⭐
          </button>
        </div>
      </div>

      {/* Player Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">Ruoli</span>
          <span className="text-sm font-medium text-gray-900">
            {player.ruoli?.join('/') || 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">FVM</span>
          <span className="text-sm font-bold text-blue-600">{player.fvm || 0}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">Prezzo Atteso</span>
          {isEditingPrice ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={prezzoAtteso}
                onChange={(e) => setPrezzoAtteso(Number(e.target.value))}
                className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                onBlur={handlePrezzoAttesoSave}
                onKeyDown={(e) => e.key === 'Enter' && handlePrezzoAttesoSave()}
                autoFocus
              />
              <button
                onClick={handlePrezzoAttesoSave}
                className="text-green-600 hover:text-green-700 text-xs"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPrice(true)}
              className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
            >
              {formatCurrency(prezzoAtteso)}
            </button>
          )}
        </div>

        {player.status === 'owned' && (
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Acquistatore</span>
            {isEditingAcquistatore ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={acquistatore}
                  onChange={(e) => setAcquistatore(e.target.value)}
                  className="w-20 px-1 py-0.5 text-xs border border-gray-300 rounded"
                  onBlur={handleAcquistatoreSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleAcquistatoreSave()}
                  autoFocus
                  placeholder="Me"
                />
                <button
                  onClick={handleAcquistatoreSave}
                  className="text-green-600 hover:text-green-700 text-xs"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingAcquistatore(true)}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {acquistatore || 'Me'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {player.status !== 'removed' && (
          <>
            <button
              onClick={handleToggleOwned}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                player.status === 'owned'
                  ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
                  : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
              }`}
            >
              {player.status === 'owned' ? '❌ Rilascia' : '✅ Prendi'}
            </button>
            
            <button
              onClick={handleRemove}
              className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm transition-colors"
              title="Rimuovi giocatore"
            >
              🗑️
            </button>
          </>
        )}
        
        {player.status === 'removed' && (
          <button
            onClick={() => onUpdate(player.id, { status: 'available', rimosso: false })}
            className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Ripristina
          </button>
        )}
      </div>
    </div>
  )
}