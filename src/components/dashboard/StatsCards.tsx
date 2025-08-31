import React from 'react'
import { PlayerData } from '../../types/Player'

interface StatsCardsProps {
  players: PlayerData[]
}

export const StatsCards: React.FC<StatsCardsProps> = ({ players }) => {
  const ownedPlayers = players.filter(p => p.status === 'owned')
  const totalSpent = ownedPlayers.reduce((sum, p) => sum + (p.prezzo || 0), 0)
  const totalBudget = 500
  const remainingCredits = totalBudget - totalSpent
  const availablePlayers = players.filter(p => p.status === 'available').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Totali</div>
        <div className="text-2xl font-bold text-gray-900">{totalBudget}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Rimanenti</div>
        <div className={`text-2xl font-bold ${remainingCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {remainingCredits}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Giocatori Presi</div>
        <div className="text-2xl font-bold text-blue-600">{ownedPlayers.length}/30</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Giocatori Disponibili</div>
        <div className="text-2xl font-bold text-gray-900">{availablePlayers}</div>
      </div>
    </div>
  )
}