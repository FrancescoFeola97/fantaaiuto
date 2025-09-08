import React, { useState, useEffect } from 'react'
import { useLeague } from '../../contexts/LeagueContext'
import { useNotifications } from '../../hooks/useNotifications'

export interface LeagueSettings {
  // Modalità di gioco
  gameMode: 'Mantra' | 'Classic'
  
  // Budget e crediti
  totalBudget: number
  maxBudget: number
  minBudget: number
  
  // Limiti squadra
  maxPlayersPerTeam: number
  minPlayersPerTeam: number
  maxPlayersByRole: {
    // Ruoli Mantra (dettagliati)
    Por: number
    Ds: number
    Dd: number
    Dc: number
    B: number
    E: number
    M: number
    C: number
    W: number
    T: number
    A: number
    Pc: number
  }
  maxPlayersByRoleClassic: {
    // Ruoli Classic (semplificati)
    P: number  // Portieri
    D: number  // Difensori
    C: number  // Centrocampisti
    A: number  // Attaccanti
  }
  
  // Asta e mercato (impostazioni lega)
  auctionDuration: number // minuti
  allowNegativeBudget: boolean
  
  // Informazioni lega
  name: string
  description: string
  season: string
  maxMembers: number
}

const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  gameMode: 'Mantra',
  
  totalBudget: 500,
  maxBudget: 1000,
  minBudget: 100,
  
  maxPlayersPerTeam: 25,
  minPlayersPerTeam: 11,
  maxPlayersByRole: {
    Por: 3,
    Ds: 4,
    Dd: 4, 
    Dc: 4,
    B: 3,
    E: 4,
    M: 6,
    C: 6,
    W: 4,
    T: 3,
    A: 6,
    Pc: 3
  },
  maxPlayersByRoleClassic: {
    P: 3,  // Portieri
    D: 8,  // Difensori
    C: 8,  // Centrocampisti
    A: 6   // Attaccanti
  },
  
  auctionDuration: 120,
  allowNegativeBudget: false,
  
  name: '',
  description: '',
  season: '2024/25',
  maxMembers: 20
}

interface LeagueSettingsProps {
  onBackToPlayers: () => void
}

export const LeagueSettings: React.FC<LeagueSettingsProps> = ({ onBackToPlayers }) => {
  const { currentLeague, updateLeague } = useLeague()
  const [settings, setSettings] = useState<LeagueSettings>(DEFAULT_LEAGUE_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'limits' | 'auction' | 'advanced'>('general')
  const [isDirty, setIsDirty] = useState(false)
  const { success, error } = useNotifications()

  // Check if user is master
  const isMaster = currentLeague?.isOwner || false

  // Helper function to create headers with league ID
  const createApiHeaders = () => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (currentLeague?.id) {
      headers['x-league-id'] = currentLeague.id.toString()
    }
    
    return headers
  }

  useEffect(() => {
    if (currentLeague) {
      loadLeagueSettings()
    }
  }, [currentLeague])

  const loadLeagueSettings = () => {
    if (!currentLeague) return
    
    try {
      // Map league data to settings format
      setSettings({
        gameMode: currentLeague.gameMode,
        totalBudget: currentLeague.totalBudget,
        maxBudget: currentLeague.totalBudget * 2, // Esempio: max è doppio del budget
        minBudget: 100,
        maxPlayersPerTeam: currentLeague.maxPlayersPerTeam,
        minPlayersPerTeam: 11,
        maxPlayersByRole: DEFAULT_LEAGUE_SETTINGS.maxPlayersByRole, // TODO: get from API if stored
        maxPlayersByRoleClassic: DEFAULT_LEAGUE_SETTINGS.maxPlayersByRoleClassic, // TODO: get from API if stored
        auctionDuration: 120, // TODO: get from league data
        allowNegativeBudget: false, // TODO: get from league data
        name: currentLeague.name,
        description: currentLeague.description || '',
        season: currentLeague.season || '2024/25',
        maxMembers: currentLeague.maxMembers
      })
    } catch (err) {
      console.error('Error loading league settings:', err)
      error('Errore caricamento impostazioni lega')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!isMaster) {
      error('❌ Solo il master della lega può modificare queste impostazioni')
      return
    }

    try {
      if (!currentLeague) return

      // Update league via API
      const updateData = {
        name: settings.name,
        totalBudget: settings.totalBudget,
        maxPlayersPerTeam: settings.maxPlayersPerTeam,
        maxMembers: settings.maxMembers,
        description: settings.description
      }

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${currentLeague.id}`, {
        method: 'PUT',
        headers: createApiHeaders(),
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update league context with new settings
        const updatedLeague = { 
          ...currentLeague, 
          ...updateData,
          gameMode: settings.gameMode
        }
        await updateLeague(updatedLeague)
        
        success('✅ Impostazioni lega salvate con successo!')
        setIsDirty(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        error(`❌ ${errorData.error || 'Errore salvataggio impostazioni lega'}`)
      }
    } catch (err) {
      console.error('Error saving league settings:', err)
      error('Errore salvataggio impostazioni lega')
    }
  }

  const resetSettings = () => {
    if (!isMaster) {
      error('❌ Solo il master della lega può modificare queste impostazioni')
      return
    }

    if (confirm('⚠️ Sei sicuro di voler ripristinare le impostazioni predefinite per questa lega?')) {
      setSettings({ ...DEFAULT_LEAGUE_SETTINGS, name: currentLeague?.name || '' })
      setIsDirty(true)
      success('🔄 Impostazioni lega ripristinate')
    }
  }

  const updateSetting = <K extends keyof LeagueSettings>(key: K, value: LeagueSettings[K]) => {
    if (!isMaster) {
      error('❌ Solo il master della lega può modificare queste impostazioni')
      return
    }

    setSettings(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
    
    // Se si cambia a Mantra e si è nella sezione Limiti, torna alla sezione Generale
    if (key === 'gameMode' && value === 'Mantra' && activeTab === 'limits') {
      setActiveTab('general')
    }
  }

  const updateClassicRoleSetting = (role: keyof LeagueSettings['maxPlayersByRoleClassic'], value: number) => {
    if (!isMaster) {
      error('❌ Solo il master della lega può modificare queste impostazioni')
      return
    }

    setSettings(prev => ({
      ...prev,
      maxPlayersByRoleClassic: { ...prev.maxPlayersByRoleClassic, [role]: value }
    }))
    setIsDirty(true)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento impostazioni lega...</p>
        </div>
      </div>
    )
  }

  if (!currentLeague) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Lega Selezionata</h3>
          <p className="text-gray-600">Seleziona una lega per modificare le sue impostazioni.</p>
        </div>
      </div>
    )
  }

  if (!isMaster) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Negato</h3>
          <p className="text-gray-600">Solo il master della lega può modificare queste impostazioni.</p>
          <p className="text-sm text-gray-500 mt-2">Puoi visualizzare ma non modificare le impostazioni correnti.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🏆 Impostazioni Lega</h2>
          <p className="text-sm text-gray-600">{currentLeague.name} • Codice: {currentLeague.code}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={saveSettings}
            disabled={!isDirty || !isMaster}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDirty && isMaster
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            💾 Salva
          </button>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Indietro
          </button>
        </div>
      </div>

      {/* Master Only Warning */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="text-purple-600 mr-2">👑</div>
          <div>
            <p className="text-sm font-medium text-purple-800">Privilegi Master</p>
            <p className="text-xs text-purple-700">Hai i permessi di master per modificare le impostazioni di questa lega.</p>
          </div>
        </div>
      </div>

      {/* Dirty Changes Warning */}
      {isDirty && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-amber-600 mr-2">⚠️</div>
            <div>
              <p className="text-sm font-medium text-amber-800">Modifiche non salvate</p>
              <p className="text-xs text-amber-700">Ricordati di salvare le impostazioni prima di uscire</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'general', label: '🏠 Generale', icon: '🏠' },
            ...(settings.gameMode === 'Classic' ? [{ id: 'limits', label: '📊 Limiti', icon: '📊' }] : []),
            { id: 'auction', label: '🔨 Asta', icon: '🔨' },
            { id: 'advanced', label: '🚀 Avanzate', icon: '🚀' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Game Mode Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🎮 Modalità di Gioco</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    settings.gameMode === 'Mantra' 
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}>
                    <input
                      type="radio"
                      name="gameMode"
                      value="Mantra"
                      checked={settings.gameMode === 'Mantra'}
                      onChange={(e) => updateSetting('gameMode', e.target.value as 'Mantra' | 'Classic')}
                      className="sr-only"
                      disabled={!isMaster}
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="font-semibold text-gray-900">Mantra</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Ruoli dettagliati (Por, Ds, Dd, Dc, B, E, M, C, W, T, A, Pc)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Usa colonna RM del file Excel
                      </div>
                    </div>
                  </label>
                  
                  <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    settings.gameMode === 'Classic' 
                      ? 'border-green-500 bg-green-100' 
                      : 'border-gray-300 bg-white hover:border-green-300'
                  }`}>
                    <input
                      type="radio"
                      name="gameMode"
                      value="Classic"
                      checked={settings.gameMode === 'Classic'}
                      onChange={(e) => updateSetting('gameMode', e.target.value as 'Mantra' | 'Classic')}
                      className="sr-only"
                      disabled={!isMaster}
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏛️</div>
                      <div className="font-semibold text-gray-900">Classic</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Ruoli semplificati (P, D, C, A)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Usa colonna R del file Excel
                      </div>
                    </div>
                  </label>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Importante:</strong> Cambiare modalità richiede che tutti i membri ricarichino il file Excel per aggiornare i ruoli dei giocatori.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Lega
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Es: Lega Serie A"
                  disabled={!isMaster}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stagione
                </label>
                <input
                  type="text"
                  value={settings.season}
                  onChange={(e) => updateSetting('season', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Es: 2024/25"
                  disabled={!isMaster}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Totale (€)
                </label>
                <input
                  type="number"
                  value={settings.totalBudget}
                  onChange={(e) => updateSetting('totalBudget', parseInt(e.target.value) || 500)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="100"
                  max="2000"
                  step="50"
                  disabled={!isMaster}
                />
                <p className="text-xs text-gray-500 mt-1">Budget iniziale per tutti i membri della lega</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Giocatori per Squadra
                </label>
                <input
                  type="number"
                  value={settings.maxPlayersPerTeam}
                  onChange={(e) => updateSetting('maxPlayersPerTeam', parseInt(e.target.value) || 25)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="11"
                  max="50"
                  disabled={!isMaster}
                />
                <p className="text-xs text-gray-500 mt-1">Numero massimo di giocatori per ogni squadra</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Membri Lega
                </label>
                <input
                  type="number"
                  value={settings.maxMembers}
                  onChange={(e) => updateSetting('maxMembers', parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2"
                  max="50"
                  disabled={!isMaster}
                />
                <p className="text-xs text-gray-500 mt-1">Numero massimo di membri che possono unirsi alla lega</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione Lega
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Descrizione della lega (opzionale)"
                disabled={!isMaster}
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex space-x-3">
                <button
                  onClick={resetSettings}
                  disabled={!isMaster}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 Reset Impostazioni Lega
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Limits Settings - Only visible in Classic mode */}
        {activeTab === 'limits' && settings.gameMode === 'Classic' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Limiti per Ruolo (Modalità Classic)</h3>
              <p className="text-sm text-blue-700">
                Configura il numero massimo di giocatori per ogni ruolo. La somma totale non deve superare il numero massimo di giocatori per squadra ({settings.maxPlayersPerTeam}).
              </p>
            </div>

            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {Object.entries(settings.maxPlayersByRoleClassic).map(([role, max]) => (
                  <div key={role}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {role === 'P' ? '🥅 Portieri' : role === 'D' ? '🛡️ Difensori' : role === 'C' ? '⚽ Centrocampisti' : '🚀 Attaccanti'}
                    </label>
                    <input
                      type="number"
                      value={max}
                      onChange={(e) => updateClassicRoleSetting(role as keyof LeagueSettings['maxPlayersByRoleClassic'], parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max={settings.maxPlayersPerTeam}
                      disabled={!isMaster}
                    />
                  </div>
                ))}
              </div>
              
              {(() => {
                const totalRolePlayers = Object.values(settings.maxPlayersByRoleClassic).reduce((sum, count) => sum + count, 0)
                const isValid = totalRolePlayers <= settings.maxPlayersPerTeam
                return (
                  <div className={`p-3 rounded-lg border ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center">
                      <div className={`mr-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {isValid ? '✅' : '⚠️'}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
                          Totale giocatori per ruolo: {totalRolePlayers} / {settings.maxPlayersPerTeam}
                        </p>
                        {!isValid && (
                          <p className="text-xs text-red-700 mt-1">
                            La somma dei limiti per ruolo ({totalRolePlayers}) supera il massimo giocatori per squadra ({settings.maxPlayersPerTeam})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Auction Settings */}
        {activeTab === 'auction' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durata Asta (minuti)
                </label>
                <input
                  type="number"
                  value={settings.auctionDuration}
                  onChange={(e) => updateSetting('auctionDuration', parseInt(e.target.value) || 120)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="30"
                  max="300"
                  disabled={!isMaster}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeBudget}
                  onChange={(e) => updateSetting('allowNegativeBudget', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!isMaster}
                />
                <span className="ml-2 text-sm text-gray-700">Permetti budget negativo</span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Nota:</strong> Le preferenze di asta personali (rilanci automatici) si trovano nelle Impostazioni Utente.
              </p>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-600 mr-2">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Zona Pericolosa - Solo Master</p>
                  <p className="text-xs text-yellow-700 mb-3">
                    Queste azioni sono irreversibili e influenzeranno tutti i membri della lega.
                  </p>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Questo resetterà TUTTE le impostazioni della lega ai valori predefiniti. Sei sicuro?')) {
                          resetSettings()
                        }
                      }}
                      disabled={!isMaster}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white text-sm rounded transition-colors disabled:cursor-not-allowed"
                    >
                      🔄 Reset Completo Lega
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export default settings for use in other components
export { DEFAULT_LEAGUE_SETTINGS }