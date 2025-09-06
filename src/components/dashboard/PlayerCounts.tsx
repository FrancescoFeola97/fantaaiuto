import React from 'react'
import { PlayerData } from '../../types/Player'
import { useAppSettings } from './Settings'

interface PlayerCountsProps {
  players: PlayerData[]
  currentRoleFilter?: string
  onRoleFilterChange?: (role: string) => void
  onBackToPlayers?: () => void
}

export const PlayerCounts: React.FC<PlayerCountsProps> = ({ players, currentRoleFilter, onRoleFilterChange, onBackToPlayers }) => {
  const settings = useAppSettings()
  
  const mantraRoles = [
    { key: 'Por', label: '🥅 Portieri', emoji: '🥅' },
    { key: 'Ds', label: '🛡️ Dif. Sx', emoji: '🛡️' },
    { key: 'Dd', label: '🛡️ Dif. Dx', emoji: '🛡️' },
    { key: 'Dc', label: '🛡️ Dif. Cen.', emoji: '🛡️' },
    { key: 'B', label: '🛡️ Braccetto', emoji: '🛡️' },
    { key: 'E', label: '⚽ Esterni', emoji: '⚽' },
    { key: 'M', label: '⚽ Mediani', emoji: '⚽' },
    { key: 'C', label: '⚽ Centrocamp.', emoji: '⚽' },
    { key: 'W', label: '💜 Ali', emoji: '💜' },
    { key: 'T', label: '💜 Trequart.', emoji: '💜' },
    { key: 'A', label: '🚀 Attaccanti', emoji: '🚀' },
    { key: 'Pc', label: '🚀 Punte Cen.', emoji: '🚀' }
  ]

  const classicRoles = [
    { key: 'P', label: '🥅 Portieri', emoji: '🥅' },
    { key: 'D', label: '🛡️ Difensori', emoji: '🛡️' },
    { key: 'C', label: '⚽ Centrocampisti', emoji: '⚽' },
    { key: 'A', label: '🚀 Attaccanti', emoji: '🚀' }
  ]

  const currentRoles = settings.gameMode === 'Classic' ? classicRoles : mantraRoles

  const getCountByRole = (role: string) => {
    return players.filter(p => {
      if (settings.gameMode === 'Classic') {
        const playerClassicRoles = p.ruoliClassic?.length ? p.ruoliClassic : p.ruoli
        return playerClassicRoles && playerClassicRoles.includes(role)
      } else {
        const playerMantraRoles = p.ruoliMantra?.length ? p.ruoliMantra : p.ruoli
        return playerMantraRoles && playerMantraRoles.includes(role)
      }
    }).length
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Giocatori per Ruolo</h3>
      
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
        <span className="text-sm font-medium text-gray-700">🏠 Tutti i giocatori</span>
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
            <span className="text-sm text-gray-600">{role.label}</span>
            <span className="text-sm font-medium text-gray-900">{count}</span>
          </button>
        )
      })}
    </div>
  )
}