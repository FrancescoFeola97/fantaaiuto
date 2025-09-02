import React from 'react'
import { PlayerData } from '../../types/Player'
import { PlayerCard } from '../ui/PlayerCard'

interface OwnedPlayersProps {
  players: PlayerData[]
  onUpdatePlayer: (playerId: string, updates: Partial<PlayerData>) => void
  onBackToPlayers: () => void
}

export const OwnedPlayers: React.FC<OwnedPlayersProps> = ({ 
  players, 
  onUpdatePlayer, 
  onBackToPlayers 
}) => {
  const ownedPlayers = players.filter(p => p.status === 'owned')
  const totalValue = ownedPlayers.reduce((sum, p) => sum + (p.costoReale || p.prezzo || 0), 0)
  const totalFvm = ownedPlayers.reduce((sum, p) => sum + (p.fvm || 0), 0)
  const avgFvm = ownedPlayers.length > 0 ? Math.round(totalFvm / ownedPlayers.length) : 0

  // Group by role
  const playersByRole = ownedPlayers.reduce((acc, player) => {
    const role = player.ruoli?.[0] || 'A'
    if (!acc[role]) acc[role] = []
    acc[role].push(player)
    return acc
  }, {} as Record<string, PlayerData[]>)

  const roleOrder = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']
  const roleLabels: Record<string, string> = {
    Por: '🥅 Portieri',
    Ds: '🛡️ Dif. Sx', Dd: '🛡️ Dif. Dx', Dc: '🛡️ Dif. Cen.', B: '🛡️ Braccetto',
    E: '⚽ Esterni', M: '⚽ Mediani', C: '⚽ Centrocamp.',
    W: '💜 Ali', T: '💜 Trequart.',
    A: '🚀 Attaccanti', Pc: '🚀 Punte Cen.'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📊 Giocatori Presi</h2>
          <p className="text-sm text-gray-600">{ownedPlayers.length} giocatori acquistati</p>
        </div>
        <button
          onClick={onBackToPlayers}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
        >
          ← Torna ai Giocatori
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-600">Valore Totale</div>
          <div className="text-2xl font-bold text-blue-900">€{totalValue.toLocaleString('it-IT')}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-600">FVM Medio</div>
          <div className="text-2xl font-bold text-green-900">{avgFvm}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-600">Giocatori</div>
          <div className="text-2xl font-bold text-purple-900">{ownedPlayers.length}</div>
        </div>
      </div>

      {ownedPlayers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun giocatore acquistato</h3>
          <p className="text-gray-600 mb-4">Inizia a selezionare i tuoi giocatori dalla lista principale.</p>
          <button
            onClick={onBackToPlayers}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            🔍 Vai ai Giocatori
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Players by Role */}
          {roleOrder.map(role => {
            const rolePlayers = playersByRole[role]
            if (!rolePlayers || rolePlayers.length === 0) return null
            
            return (
              <div key={role}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {roleLabels[role] || role} ({rolePlayers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rolePlayers.map(player => (
                    <PlayerCard 
                      key={player.id} 
                      player={player} 
                      onUpdate={onUpdatePlayer}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}