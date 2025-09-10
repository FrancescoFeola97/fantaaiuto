import React, { useState } from 'react'
import { PlayerData } from '../../types/Player'
import { useGameMode } from '../../contexts/LeagueContext'
import { RoleCircle } from '../../utils/roleColors'
import { PlayerDetailModal } from '../ui/PlayerDetailModal'

interface OwnedPlayersOverviewProps {
  players: PlayerData[]
}

export const OwnedPlayersOverview: React.FC<OwnedPlayersOverviewProps> = ({ players }) => {
  const gameMode = useGameMode()
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Get only owned players
  const ownedPlayers = players.filter(p => p.status === 'owned' && p.acquistatore)

  const handlePlayerClick = (player: PlayerData) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPlayer(null)
  }
  
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

  const getPlayersByRole = (role: string) => {
    return ownedPlayers.filter(p => {
      if (gameMode === 'Classic') {
        const playerClassicRoles = p.ruoliClassic?.length ? p.ruoliClassic : p.ruoli
        return playerClassicRoles && playerClassicRoles.includes(role)
      } else {
        const playerMantraRoles = p.ruoliMantra?.length ? p.ruoliMantra : p.ruoli
        return playerMantraRoles && playerMantraRoles.includes(role)
      }
    })
  }

  const totalCost = ownedPlayers.reduce((sum, p) => sum + (p.costoReale || p.prezzo || 0), 0)

  if (ownedPlayers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 I Tuoi Giocatori</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">📋 Nessun giocatore acquistato ancora</p>
          <p className="text-sm text-gray-400">I giocatori che acquisti appariranno qui organizzati per ruolo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 I Tuoi Giocatori</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Totale investito</div>
          <div className="text-lg font-bold text-green-600">{totalCost.toFixed(1)}M</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentRoles.map(role => {
          const rolePlayers = getPlayersByRole(role.key)
          const roleCount = rolePlayers.length
          const roleCost = rolePlayers.reduce((sum, p) => sum + (p.costoReale || p.prezzo || 0), 0)

          return (
            <div key={role.key} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RoleCircle role={role.key} gameMode={gameMode} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{role.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{roleCount}</span>
              </div>
              
              {roleCount > 0 && (
                <>
                  <div className="text-xs text-gray-500 mb-2">
                    Costo: {roleCost.toFixed(1)}M
                  </div>
                  <div className="space-y-1">
                    {rolePlayers.slice(0, 3).map(player => (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                      >
                        <div className="font-medium">{player.nome}</div>
                        <div className="text-gray-500">
                          {player.squadra} • {(player.costoReale || player.prezzo || 0).toFixed(1)}M
                        </div>
                      </button>
                    ))}
                    {rolePlayers.length > 3 && (
                      <div className="text-xs text-gray-400 text-center py-1">
                        +{rolePlayers.length - 3} altri
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {roleCount === 0 && (
                <div className="text-xs text-gray-400 text-center py-2">
                  Nessun giocatore
                </div>
              )}
            </div>
          )
        })}
      </div>

      {ownedPlayers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Totale giocatori: <span className="font-medium">{ownedPlayers.length}</span>
            </span>
            <span className="text-gray-600">
              Budget utilizzato: <span className="font-bold text-green-600">{totalCost.toFixed(1)}M</span>
            </span>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}