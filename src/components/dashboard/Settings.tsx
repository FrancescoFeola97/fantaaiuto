import React, { useState, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

export interface AppSettings {
  // Modalità di gioco
  gameMode: 'Mantra' | 'Classic'
  
  // Budget e crediti
  defaultBudget: number
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
  
  // Asta e mercato
  auctionDuration: number // minuti
  marketDeadline: string // data ISO
  enableAutoBid: boolean
  maxAutoBidAmount: number
  
  // Visualizzazione
  showFVM: boolean
  showPriceHistory: boolean
  compactView: boolean
  darkMode: boolean
  
  // Notifiche
  enableNotifications: boolean
  notifyPlayerTaken: boolean
  notifyBudgetLow: boolean
  budgetWarningThreshold: number // %
  
  // Esportazione e backup
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  exportFormat: 'json' | 'excel' | 'csv'
  
  // Avanzate
  allowNegativeBudget: boolean
  leagueName: string
  season: string
}

const DEFAULT_SETTINGS: AppSettings = {
  gameMode: 'Mantra',
  
  defaultBudget: 500,
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
  marketDeadline: '',
  enableAutoBid: false,
  maxAutoBidAmount: 50,
  
  showFVM: true,
  showPriceHistory: true,
  compactView: false,
  darkMode: false,
  
  enableNotifications: true,
  notifyPlayerTaken: true,
  notifyBudgetLow: true,
  budgetWarningThreshold: 20,
  
  autoBackup: true,
  backupFrequency: 'weekly',
  exportFormat: 'excel',
  
  allowNegativeBudget: false,
  leagueName: 'La Mia Lega',
  season: '2024/25'
}

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

export const Settings: React.FC<SettingsProps> = ({ onBackToPlayers, players = [], onUpdatePlayers }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'limits' | 'auction' | 'display' | 'notifications' | 'advanced'>('general')
  const [isDirty, setIsDirty] = useState(false)
  const { success, error } = useNotifications()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('fantaaiuto_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      error('Errore caricamento impostazioni')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      localStorage.setItem('fantaaiuto_settings', JSON.stringify(settings))
      
      // Update all existing participants' budgets if budget changed
      if (isDirty) {
        await updateParticipantBudgets()
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('fantaaiuto_settings_updated'))
      
      success('✅ Impostazioni salvate con successo!')
      setIsDirty(false)
    } catch (err) {
      console.error('Error saving settings:', err)
      error('Errore salvataggio impostazioni')
    }
  }

  const updateParticipantBudgets = async () => {
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      await fetch('https://fantaaiuto-backend.onrender.com/api/participants/update-budgets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newBudget: settings.defaultBudget })
      })
    } catch (err) {
      console.warn('Failed to update participant budgets on server:', err)
    }
  }

  const resetSettings = () => {
    if (confirm('⚠️ Sei sicuro di voler ripristinare tutte le impostazioni predefinite?')) {
      setSettings(DEFAULT_SETTINGS)
      setIsDirty(true)
      success('🔄 Impostazioni ripristinate')
    }
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
    
    // Se si cambia a Mantra e si è nella sezione Limiti, torna alla sezione Generale
    if (key === 'gameMode' && value === 'Mantra' && activeTab === 'limits') {
      setActiveTab('general')
    }
  }

  const updateClassicRoleSetting = (role: keyof AppSettings['maxPlayersByRoleClassic'], value: number) => {
    setSettings(prev => ({
      ...prev,
      maxPlayersByRoleClassic: { ...prev.maxPlayersByRoleClassic, [role]: value }
    }))
    setIsDirty(true)
  }

  const exportPlayerChoices = () => {
    // Esporta solo giocatori con prezzoAtteso o interessante settati
    const playerChoices = players.filter(p => p.prezzoAtteso || p.interessante).map(p => ({
      id: p.id,
      nome: p.nome,
      prezzoAtteso: p.prezzoAtteso,
      interessante: p.interessante
    }))

    const exportData = {
      exportDate: new Date().toISOString(),
      totalPlayers: players.length,
      savedChoices: playerChoices.length,
      choices: playerChoices
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fantaaiuto-scelte-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    success(`📥 Esportate ${playerChoices.length} scelte giocatori!`)
  }

  const importPlayerChoices = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        
        if (!imported.choices || !Array.isArray(imported.choices)) {
          throw new Error('Formato file non valido')
        }

        // Applica le scelte importate
        const updates = imported.choices.map((choice: any) => ({
          id: choice.id,
          prezzoAtteso: choice.prezzoAtteso || undefined,
          interessante: choice.interessante || false
        }))

        if (onUpdatePlayers) {
          onUpdatePlayers(updates)
          success(`📤 Importate ${updates.length} scelte giocatori!`)
        } else {
          error('❌ Impossibile applicare le importazioni')
        }
        
        // Reset input file
        event.target.value = ''
      } catch (err) {
        error('❌ File scelte giocatori non valido')
      }
    }
    reader.readAsText(file)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento impostazioni...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">⚙️ Impostazioni</h2>
          <p className="text-sm text-gray-600">Configura l'applicazione secondo le tue preferenze</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={saveSettings}
            disabled={!isDirty}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDirty 
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
            ← Torna ai Giocatori
          </button>
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
            { id: 'display', label: '🎨 Vista', icon: '🎨' },
            { id: 'notifications', label: '🔔 Notifiche', icon: '🔔' },
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
                    <strong>⚠️ Importante:</strong> Cambiare modalità richiede di ricaricare il file Excel per aggiornare i ruoli dei giocatori.
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
                  value={settings.leagueName}
                  onChange={(e) => updateSetting('leagueName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Es: Lega Serie A"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Predefinito (€)
                </label>
                <input
                  type="number"
                  value={settings.defaultBudget}
                  onChange={(e) => updateSetting('defaultBudget', parseInt(e.target.value) || 500)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="50"
                />
                <p className="text-xs text-gray-500 mt-1">Budget iniziale per nuovi partecipanti</p>
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
                />
                <p className="text-xs text-gray-500 mt-1">Numero massimo di giocatori per ogni squadra</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">💾 Backup delle tue scelte</h4>
              <p className="text-xs text-gray-600 mb-3">
                Salva ed importa i tuoi prezzi attesi e giocatori interessanti per non perdere il lavoro di analisi.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={exportPlayerChoices}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                >
                  📥 Esporta Scelte
                </button>
                <label className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors cursor-pointer">
                  📤 Importa Scelte
                  <input
                    type="file"
                    accept=".json"
                    onChange={importPlayerChoices}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors"
                >
                  🔄 Reset Impostazioni
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
                      onChange={(e) => updateClassicRoleSetting(role as keyof AppSettings['maxPlayersByRoleClassic'], parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max={settings.maxPlayersPerTeam}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rilancio Automatico Max (€)
                </label>
                <input
                  type="number"
                  value={settings.maxAutoBidAmount}
                  onChange={(e) => updateSetting('maxAutoBidAmount', parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  disabled={!settings.enableAutoBid}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableAutoBid}
                  onChange={(e) => updateSetting('enableAutoBid', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Abilita rilanci automatici</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.allowNegativeBudget}
                  onChange={(e) => updateSetting('allowNegativeBudget', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Permetti budget negativo</span>
              </label>
            </div>
          </div>
        )}

        {/* Display Settings */}
        {activeTab === 'display' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showFVM}
                  onChange={(e) => updateSetting('showFVM', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mostra valori FVM</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showPriceHistory}
                  onChange={(e) => updateSetting('showPriceHistory', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mostra storico prezzi</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.compactView}
                  onChange={(e) => updateSetting('compactView', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Vista compatta</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting('darkMode', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Modalità scura (prossimamente)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato Esportazione Predefinito
              </label>
              <select
                value={settings.exportFormat}
                onChange={(e) => updateSetting('exportFormat', e.target.value as 'json' | 'excel' | 'csv')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Abilita notifiche</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyPlayerTaken}
                  onChange={(e) => updateSetting('notifyPlayerTaken', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!settings.enableNotifications}
                />
                <span className="ml-2 text-sm text-gray-700">Notifica quando un giocatore viene preso</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifyBudgetLow}
                  onChange={(e) => updateSetting('notifyBudgetLow', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={!settings.enableNotifications}
                />
                <span className="ml-2 text-sm text-gray-700">Notifica quando il budget è basso</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soglia Avviso Budget (%)
              </label>
              <input
                type="number"
                value={settings.budgetWarningThreshold}
                onChange={(e) => updateSetting('budgetWarningThreshold', parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="50"
                disabled={!settings.notifyBudgetLow}
              />
              <p className="text-xs text-gray-500 mt-1">
                Avvisa quando il budget rimanente scende sotto questa percentuale
              </p>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Backup automatico dati</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequenza Backup
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => updateSetting('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!settings.autoBackup}
              >
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </div>


            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-600 mr-2">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Zona Pericolosa</p>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Questo eliminerà TUTTI i dati dell\'applicazione. Sei sicuro?')) {
                          localStorage.clear()
                          success('🗑️ Tutti i dati eliminati')
                          setTimeout(() => window.location.reload(), 1000)
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      🗑️ Elimina Tutti i Dati
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
export { DEFAULT_SETTINGS }

// Hook for accessing settings with real-time updates
export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('fantaaiuto_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (err) {
        console.error('Error loading settings:', err)
      }
    }
  }
  
  useEffect(() => {
    loadSettings()
    
    // Listen for storage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fantaaiuto_settings') {
        loadSettings()
      }
    }
    
    // Listen for custom settings update event
    const handleSettingsUpdate = () => {
      loadSettings()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('fantaaiuto_settings_updated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('fantaaiuto_settings_updated', handleSettingsUpdate)
    }
  }, [])
  
  return settings
}