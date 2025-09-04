import React from 'react'
import { PlayerData } from '../../types/Player'

interface StatsCardsProps {
  players: PlayerData[]
}

export const StatsCards: React.FC<StatsCardsProps> = ({ players }) => {
  const ownedPlayers = players.filter(p => p.status === 'owned')
  const totalSpent = ownedPlayers.reduce((sum, p) => sum + (p.prezzoEffettivo || p.costoReale || 0), 0)
  const totalBudget = 500
  const remainingCredits = totalBudget - totalSpent
  const availablePlayers = players.filter(p => p.status === 'available').length
  const takenByOthers = players.filter(p => p.status === 'taken_by_other').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Totali</div>
        <div className="text-2xl font-bold text-gray-900">{totalBudget}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Spesi</div>
        <div className="text-2xl font-bold text-purple-600">{totalSpent}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Rimanenti</div>
        <div className={`text-2xl font-bold ${remainingCredits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {remainingCredits}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Miei Giocatori</div>
        <div className="text-2xl font-bold text-blue-600">{ownedPlayers.length}/30</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Disponibili</div>
        <div className="text-2xl font-bold text-gray-900">{availablePlayers}</div>
        {takenByOthers > 0 && (
          <div className="text-xs text-orange-600 mt-1">
            +{takenByOthers} presi da altri
          </div>
        )}
      </div>
    </div>
  )
}