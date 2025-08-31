import React from 'react'
import { PlayerData } from '../../types/Player'
import { PlayerCard } from '../ui/PlayerCard.tsx'

interface PlayersGridProps {
  players: PlayerData[]
  isLoading: boolean
  onUpdatePlayer: (playerId: string, updates: Partial<PlayerData>) => void
}

export const PlayersGrid: React.FC<PlayersGridProps> = ({ 
  players, 
  isLoading, 
  onUpdatePlayer 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento giocatori...</p>
        </div>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun giocatore trovato</h3>
          <p className="text-gray-500">Importa un file Excel o modifica i filtri</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.map(player => (
          <PlayerCard 
            key={player.id} 
            player={player} 
            onUpdate={onUpdatePlayer}
          />
        ))}
      </div>
    </div>
  )
}