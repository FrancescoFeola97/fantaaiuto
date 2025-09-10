import React from 'react'
import { PlayerData } from '../../types/Player'
import { useGameMode } from '../../contexts/LeagueContext'
import { RoleCircle } from '../../utils/roleColors'

interface PlayerDetailModalProps {
  player: PlayerData | null
  isOpen: boolean
  onClose: () => void
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, isOpen, onClose }) => {
  const gameMode = useGameMode()

  if (!isOpen || !player) return null

  const getRoles = () => {
    if (gameMode === 'Classic') {
      return player.ruoliClassic?.length ? player.ruoliClassic : player.ruoli
    } else {
      return player.ruoliMantra?.length ? player.ruoliMantra : player.ruoli
    }
  }

  const roles = getRoles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{player.nome}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{player.squadra}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Roles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🎯 Ruoli</h3>
            <div className="flex flex-wrap gap-2">
              {roles?.map((role, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <RoleCircle role={role} gameMode={gameMode} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-900 mb-1">FVM</div>
              <div className="text-lg font-bold text-blue-800">{player.fvm?.toFixed(1) || '0.0'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs font-medium text-green-900 mb-1">Prezzo Listino</div>
              <div className="text-lg font-bold text-green-800">{player.prezzo?.toFixed(1) || '0.0'}M</div>
            </div>
          </div>

          {/* Purchase Info */}
          {player.status === 'owned' && (
            <div className="space-y-3">
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs font-medium text-yellow-900 mb-1">Prezzo Pagato</div>
                <div className="text-lg font-bold text-yellow-800">
                  {player.costoReale?.toFixed(1) || player.prezzo?.toFixed(1) || '0.0'}M
                </div>
              </div>
              
              {player.acquistatore && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-purple-900 mb-1">Proprietario</div>
                  <div className="text-sm font-semibold text-purple-800">{player.acquistatore}</div>
                </div>
              )}
            </div>
          )}

          {/* Expected Price */}
          {player.prezzoAtteso && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs font-medium text-orange-900 mb-1">Prezzo Atteso</div>
              <div className="text-lg font-bold text-orange-800">{player.prezzoAtteso.toFixed(1)}M</div>
            </div>
          )}

          {/* Notes */}
          {player.note && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">📝 Note</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{player.note}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📊 Stato</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                player.status === 'owned' ? 'bg-green-100 text-green-800' :
                player.status === 'removed' ? 'bg-red-100 text-red-800' :
                player.status === 'taken_by_other' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {player.status === 'owned' ? '✅ Acquistato' :
                 player.status === 'removed' ? '❌ Rimosso' :
                 player.status === 'taken_by_other' ? '👥 Preso da altri' :
                 '⚪ Disponibile'}
              </span>
              {player.interessante && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ⭐ Interessante
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}