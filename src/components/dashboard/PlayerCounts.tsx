import React from 'react'
import { PlayerData } from '../../types/Player'
import { useGameMode } from '../../contexts/LeagueContext'
import { RoleCircle } from '../../utils/roleColors'

interface PlayerCountsProps {
  players: PlayerData[]
  currentRoleFilter?: string
  onRoleFilterChange?: (role: string) => void
  onBackToPlayers?: () => void
}

export const PlayerCounts: React.FC<PlayerCountsProps> = ({ 
  players, 
  currentRoleFilter, 
  onRoleFilterChange, 
  onBackToPlayers 
}) => {
  const gameMode = useGameMode()
  
  const mantraRoles = [
    { key: 'Por', label: 'Portieri' },
    { key: 'Ds', label: 'Dif. Sx' },
    { key: 'Dd', label: 'Dif. Dx' },
    { key: 'Dc', label: 'Dif. Cen.' },
    { key: 'B', label: 'Braccetto' },
    { key: 'E', label: 'Esterni' },
    { key: 'M', label: 'Mediani' },
    { key: 'C', label: 'Centrocamp.' },
    { key: 'W', label: 'Ali' },
    { key: 'T', label: 'Trequart.' },
    { key: 'A', label: 'Attaccanti' },
    { key: 'Pc', label: 'Punte Cen.' }
  ]

  const classicRoles = [
    { key: 'P', label: 'Portieri' },
    { key: 'D', label: 'Difensori' },
    { key: 'C', label: 'Centrocampisti' },
    { key: 'A', label: 'Attaccanti' }
  ]

  const currentRoles = gameMode === 'Classic' ? classicRoles : mantraRoles

  const getCountByRole = (role: string) => {
    return players.filter(p => {
      if (gameMode === 'Classic') {
        const playerClassicRoles = p.ruoliClassic?.length ? p.ruoliClassic : p.ruoli
        return playerClassicRoles && playerClassicRoles.includes(role)
      } else {
        const playerMantraRoles = p.ruoliMantra?.length ? p.ruoliMantra : p.ruoli
        return playerMantraRoles && playerMantraRoles.includes(role)
      }
    }).length
  }


  return (
    <div className="space-y-4">
      {/* Role Filter Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Filtra per Ruolo</h3>
        
        {/* All Players */}
        <button 
          onClick={() => {
            onRoleFilterChange?.('all')
            onBackToPlayers?.()
          }}
          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
            currentRoleFilter === 'all' || !currentRoleFilter 
              ? 'bg-blue-100 border border-blue-200' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium text-gray-700">⚽ Tutti i ruoli</span>
          <span className="text-sm font-bold text-gray-900">{players.length}</span>
        </button>
      
      {/* Role Counts */}
      {currentRoles.map(role => {
        const count = getCountByRole(role.key)
        return (
          <button 
            key={role.key}
            onClick={() => onRoleFilterChange?.(role.key)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              currentRoleFilter === role.key 
                ? 'bg-blue-100 border border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <RoleCircle role={role.key} gameMode={gameMode} size="sm" />
              <span className="text-sm text-gray-600">{role.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{count}</span>
          </button>
        )
      })}
      </div>
    </div>
  )
}