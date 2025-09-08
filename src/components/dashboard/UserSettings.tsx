import React, { useState, useEffect } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

export interface UserSettings {
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
  
  // Asta e mercato (preferenze utente)
  enableAutoBid: boolean
  maxAutoBidAmount: number
}

const DEFAULT_USER_SETTINGS: UserSettings = {
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
  
  enableAutoBid: false,
  maxAutoBidAmount: 50
}

interface UserSettingsProps {
  onBackToPlayers: () => void
  players?: Array<{
    id: string
    nome: string
    prezzoAtteso?: number
    interessante: boolean
  }>
  onUpdatePlayers?: (updates: Array<{id: string, prezzoAtteso?: number, interessante: boolean}>) => void
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onBackToPlayers, players = [], onUpdatePlayers }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'display' | 'notifications' | 'auction' | 'advanced' | 'backup'>('display')
  const [isDirty, setIsDirty] = useState(false)
  const { success, error } = useNotifications()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('fantaaiuto_user_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_USER_SETTINGS, ...parsed })
      }
    } catch (err) {
      console.error('Error loading user settings:', err)
      error('Errore caricamento impostazioni utente')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      localStorage.setItem('fantaaiuto_user_settings', JSON.stringify(settings))
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('fantaaiuto_user_settings_updated'))
      
      success('✅ Impostazioni utente salvate con successo!')
      setIsDirty(false)
    } catch (err) {
      console.error('Error saving user settings:', err)
      error('Errore salvataggio impostazioni utente')
    }
  }

  const resetSettings = () => {
    if (confirm('⚠️ Sei sicuro di voler ripristinare tutte le impostazioni utente predefinite?')) {
      setSettings(DEFAULT_USER_SETTINGS)
      setIsDirty(true)
      success('🔄 Impostazioni utente ripristinate')
    }
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
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
          <p className="text-gray-500">Caricamento impostazioni utente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">👤 Impostazioni Utente</h2>
          <p className="text-sm text-gray-600">Personalizza la tua esperienza con FantaAiuto</p>
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
            ← Indietro
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
            { id: 'display', label: '🎨 Vista', icon: '🎨' },
            { id: 'notifications', label: '🔔 Notifiche', icon: '🔔' },
            { id: 'auction', label: '🔨 Asta', icon: '🔨' },
            { id: 'backup', label: '💾 Backup', icon: '💾' },
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

        {/* Auction Settings */}
        {activeTab === 'auction' && (
          <div className="space-y-6">
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
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Nota:</strong> Le impostazioni dell'asta specifiche della lega (durata, budget negativo) si trovano nelle Impostazioni Lega.
              </p>
            </div>
          </div>
        )}

        {/* Backup Settings */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-600 mr-2">⚠️</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Zona Pericolosa</p>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Questo eliminerà TUTTE le impostazioni utente. Sei sicuro?')) {
                          localStorage.removeItem('fantaaiuto_user_settings')
                          success('🗑️ Impostazioni utente eliminate')
                          setTimeout(() => window.location.reload(), 1000)
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      🗑️ Elimina Impostazioni Utente
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
export { DEFAULT_USER_SETTINGS }

// Hook for accessing user settings with real-time updates
export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('fantaaiuto_user_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_USER_SETTINGS, ...parsed })
      } catch (err) {
        console.error('Error loading user settings:', err)
      }
    }
  }
  
  useEffect(() => {
    loadSettings()
    
    // Listen for storage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fantaaiuto_user_settings') {
        loadSettings()
      }
    }
    
    // Listen for custom settings update event
    const handleSettingsUpdate = () => {
      loadSettings()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('fantaaiuto_user_settings_updated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('fantaaiuto_user_settings_updated', handleSettingsUpdate)
    }
  }, [])
  
  return settings
}