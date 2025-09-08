import React, { useState } from 'react'
import { UserSettings } from './UserSettings'
import { LeagueSettings } from './LeagueSettings'
import { useLeague } from '../../contexts/LeagueContext'

interface SettingsProps {
  onBackToPlayers: () => void
  players?: Array<{
    id: string
    nome: string
    prezzoAtteso?: number
    interessante: boolean
  }>
  onUpdatePlayers?: (updates: Array<{id: string, prezzoAtteso?: number, interessante: boolean}>) => void
}

export const Settings: React.FC<SettingsProps> = ({ onBackToPlayers, players, onUpdatePlayers }) => {
  const { currentLeague } = useLeague()
  const [activeSection, setActiveSection] = useState<'user' | 'league'>('user')

  // Check if user is master
  const isMaster = currentLeague?.isOwner || false

  // If showing league settings component directly
  if (activeSection === 'league') {
    return <LeagueSettings onBackToPlayers={() => setActiveSection('user')} />
  }

  // If showing user settings component directly  
  if (activeSection === 'user') {
    return (
      <div className="space-y-6">
        {/* Settings Selection Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">⚙️ Impostazioni</h2>
              <p className="text-sm text-gray-600">Configura le tue preferenze e le impostazioni della lega</p>
            </div>
            <button
              onClick={onBackToPlayers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
            >
              ← Torna ai Giocatori
            </button>
          </div>

          {/* Settings Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Settings Card */}
            <div 
              onClick={() => setActiveSection('user')}
              className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="text-center">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Impostazioni Utente</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Personalizza la tua esperienza: notifiche, visualizzazione, backup delle scelte
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Vista</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Notifiche</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Backup</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Aste</span>
                </div>
                <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Configura
                </button>
              </div>
            </div>

            {/* League Settings Card */}
            <div 
              onClick={() => isMaster ? setActiveSection('league') : null}
              className={`p-6 border-2 rounded-lg transition-all ${
                isMaster 
                  ? 'border-purple-200 bg-purple-50 cursor-pointer hover:border-purple-400' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className={`text-lg font-semibold mb-2 ${isMaster ? 'text-purple-900' : 'text-gray-600'}`}>
                  Impostazioni Lega
                </h3>
                <p className={`text-sm mb-3 ${isMaster ? 'text-purple-700' : 'text-gray-500'}`}>
                  Configura modalità gioco, budget, limiti giocatori e regole della lega
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  <span className={`px-2 py-1 rounded ${isMaster ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    Modalità
                  </span>
                  <span className={`px-2 py-1 rounded ${isMaster ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    Budget
                  </span>
                  <span className={`px-2 py-1 rounded ${isMaster ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    Limiti
                  </span>
                  <span className={`px-2 py-1 rounded ${isMaster ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    Membri
                  </span>
                </div>
                <button 
                  disabled={!isMaster}
                  className={`mt-4 w-full py-2 rounded-lg transition-colors ${
                    isMaster 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isMaster ? 'Configura' : 'Solo Master'}
                </button>
                {!isMaster && (
                  <p className="text-xs text-gray-500 mt-2">
                    👑 Richiedono privilegi di master della lega
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Current League Info */}
          {currentLeague && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Lega Attuale</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-medium text-gray-900">{currentLeague.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Codice</p>
                  <p className="font-medium text-gray-900">{currentLeague.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modalità</p>
                  <p className="font-medium text-gray-900">{currentLeague.gameMode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Il tuo ruolo</p>
                  <p className={`font-medium ${isMaster ? 'text-purple-600' : 'text-blue-600'}`}>
                    {isMaster ? '👑 Master' : '👤 Membro'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Settings Component */}
        <UserSettings 
          onBackToPlayers={() => setActiveSection('user')}
          players={players}
          onUpdatePlayers={onUpdatePlayers}
        />
      </div>
    )
  }

  return null
}

// Re-export the legacy interface for compatibility
export interface AppSettings {
  gameMode: 'Mantra' | 'Classic'
  defaultBudget: number
  maxPlayersPerTeam: number
  // ... other legacy settings
}

// Legacy hook for backward compatibility - now uses user settings
export const useAppSettings = () => {
  // This could be enhanced to merge user + league settings if needed
  // For now, return basic defaults to maintain compatibility
  return {
    gameMode: 'Mantra' as const,
    defaultBudget: 500,
    maxPlayersPerTeam: 25,
    showFVM: true,
    compactView: false,
    enableNotifications: true
  }
}