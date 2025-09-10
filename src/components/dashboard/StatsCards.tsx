import React from 'react'
import { PlayerData } from '../../types/Player'
import { useLeague } from '../../contexts/LeagueContext'

interface StatsCardsProps {
  players: PlayerData[]
}

export const StatsCards: React.FC<StatsCardsProps> = ({ players }) => {
  const { currentLeague } = useLeague()
  const ownedPlayers = players.filter(p => p.status === 'owned')
  const totalSpent = ownedPlayers.reduce((sum, p) => sum + (p.prezzoEffettivo || p.costoReale || 0), 0)
  const totalBudget = currentLeague?.totalBudget || 500
  const maxPlayersPerTeam = currentLeague?.maxPlayersPerTeam || 25
  const remainingCredits = totalBudget - totalSpent
  const availablePlayers = players.filter(p => p.status === 'available').length
  const takenByOthers = players.filter(p => p.status === 'taken_by_other').length
  
  // Budget warning check
  const budgetWarning = remainingCredits > 0 && (remainingCredits / totalBudget) * 100 <= 20

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Totali</div>
        <div className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('it-IT').format(totalBudget)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Spesi</div>
        <div className="text-2xl font-bold text-purple-600">{new Intl.NumberFormat('it-IT').format(totalSpent)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Crediti Rimanenti</div>
        <div className={`text-2xl font-bold ${
          remainingCredits < 0 ? 'text-red-600' : 
          budgetWarning ? 'text-amber-600' : 'text-green-600'
        }`}>
          {new Intl.NumberFormat('it-IT').format(remainingCredits)}
        </div>
        {budgetWarning && (
          <div className="text-xs text-amber-600 mt-1">
            ⚠️ Budget basso ({Math.round((remainingCredits / totalBudget) * 100)}%)
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-500">Miei Giocatori</div>
        <div className={`text-2xl font-bold ${
          ownedPlayers.length >= maxPlayersPerTeam ? 'text-red-600' : 
          ownedPlayers.length >= maxPlayersPerTeam * 0.8 ? 'text-amber-600' : 'text-blue-600'
        }`}>
          {ownedPlayers.length}/{maxPlayersPerTeam}
        </div>
        {ownedPlayers.length >= maxPlayersPerTeam && (
          <div className="text-xs text-red-600 mt-1">
            🚫 Limite raggiunto
          </div>
        )}
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