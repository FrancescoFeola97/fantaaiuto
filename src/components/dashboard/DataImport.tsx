import React, { useState, useEffect } from 'react'
import { useLeague } from '../../contexts/LeagueContext'
import { useNotifications } from '../../hooks/useNotifications'
import { League } from '../../types/League'
import { PlayerData } from '../../types/Player'

interface DataImportProps {
  onBackToPlayers: () => void
  onDataImported?: () => void
}

interface ImportData {
  players: PlayerData[]
  participants: Array<{ id: string; name: string; squadra: string }>
  formations: any[]
}

export const DataImport: React.FC<DataImportProps> = ({ onBackToPlayers, onDataImported }) => {
  const { currentLeague, leagues } = useLeague()
  const { success, error: showError } = useNotifications()
  const [sourceLeagues, setSourceLeagues] = useState<League[]>([])
  const [selectedSourceLeague, setSelectedSourceLeague] = useState<League | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importOptions, setImportOptions] = useState({
    players: true,
    participants: true,
    formations: false
  })
  const [previewData, setPreviewData] = useState<ImportData | null>(null)

  const createApiHeaders = (leagueId?: string) => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (leagueId) {
      headers['x-league-id'] = leagueId
    }
    
    return headers
  }

  useEffect(() => {
    loadAvailableLeagues()
  }, [leagues, currentLeague])

  const loadAvailableLeagues = () => {
    if (!currentLeague || !leagues) {
      return
    }

    // Show only other leagues (not the current one)
    const otherLeagues = leagues.filter(league => league.id !== currentLeague.id)
    setSourceLeagues(otherLeagues)
  }

  const loadPreviewData = async (sourceLeague: League) => {
    try {

      const promises = []

      if (importOptions.players) {
        promises.push(
          fetch('https://fantaaiuto-backend.onrender.com/api/players', {
            headers: createApiHeaders(sourceLeague.id)
          }).then(res => res.ok ? res.json() : { players: [] })
        )
      } else {
        promises.push(Promise.resolve({ players: [] }))
      }

      if (importOptions.participants) {
        promises.push(
          fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
            headers: createApiHeaders(sourceLeague.id)
          }).then(res => res.ok ? res.json() : { participants: [] })
        )
      } else {
        promises.push(Promise.resolve({ participants: [] }))
      }

      if (importOptions.formations) {
        promises.push(
          fetch('https://fantaaiuto-backend.onrender.com/api/formations', {
            headers: createApiHeaders(sourceLeague.id)
          }).then(res => res.ok ? res.json() : { formations: [] })
        )
      } else {
        promises.push(Promise.resolve({ formations: [] }))
      }

      const [playersData, participantsData, formationsData] = await Promise.all(promises)

      setPreviewData({
        players: playersData.players || [],
        participants: participantsData.participants || [],
        formations: formationsData.formations || []
      })

    } catch (error) {
      console.error('Error loading preview data:', error)
      setPreviewData({ players: [], participants: [], formations: [] })
    }
  }

  const handleSourceLeagueChange = (league: League | null) => {
    setSelectedSourceLeague(league)
    setPreviewData(null)
    if (league) {
      loadPreviewData(league)
    }
  }

  const handleImportOptionsChange = (option: keyof typeof importOptions) => {
    const newOptions = { ...importOptions, [option]: !importOptions[option] }
    setImportOptions(newOptions)
    
    if (selectedSourceLeague) {
      loadPreviewData(selectedSourceLeague)
    }
  }

  const executeImport = async () => {
    if (!selectedSourceLeague || !previewData || !currentLeague) return

    try {
      setIsImporting(true)

      // Import players (only interesting ones and owned ones)
      if (importOptions.players && previewData.players.length > 0) {
        const playersToImport = previewData.players.filter(p => 
          p.interessante || p.status === 'owned'
        )

        if (playersToImport.length > 0) {
          await fetch('https://fantaaiuto-backend.onrender.com/api/players/import/preferences', {
            method: 'POST',
            headers: createApiHeaders(currentLeague.id),
            body: JSON.stringify({
              players: playersToImport.map(p => ({
                nome: p.nome,
                interessante: p.interessante,
                status: p.status,
                prezzoAtteso: p.prezzoAtteso,
                costoReale: p.costoReale,
                acquistatore: p.acquistatore,
                note: p.note
              }))
            })
          })
        }
      }

      // Import participants
      if (importOptions.participants && previewData.participants.length > 0) {
        await fetch('https://fantaaiuto-backend.onrender.com/api/participants/import', {
          method: 'POST',
          headers: createApiHeaders(currentLeague.id),
          body: JSON.stringify({
            participants: previewData.participants
          })
        })
      }

      // Import formations
      if (importOptions.formations && previewData.formations.length > 0) {
        await fetch('https://fantaaiuto-backend.onrender.com/api/formations/import', {
          method: 'POST',
          headers: createApiHeaders(currentLeague.id),
          body: JSON.stringify({
            formations: previewData.formations
          })
        })
      }

      success(`✅ Dati importati con successo da ${selectedSourceLeague.name}!`)
      
      if (onDataImported) {
        onDataImported()
      }

      // Reset state
      setSelectedSourceLeague(null)
      setPreviewData(null)
      setImportOptions({ players: true, participants: true, formations: false })

    } catch (error) {
      console.error('Import error:', error)
      showError('❌ Errore durante l\'importazione dei dati')
    } finally {
      setIsImporting(false)
    }
  }

  if (!currentLeague) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Lega Selezionata</h3>
          <p className="text-gray-600 mb-4">Seleziona una lega per importare dati da altre tue leghe.</p>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            ← Torna al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📥 Import Dati da Altre Leghe</h2>
            <p className="text-sm text-gray-600">
              Copia giocatori interessanti, partecipanti e formazioni dalle tue altre leghe
            </p>
          </div>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Torna ai Giocatori
          </button>
        </div>

        {/* Current League Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Lega di Destinazione</h3>
          <div className="text-blue-800">
            <span className="font-medium">{currentLeague.name}</span>
            <span className="text-blue-600 ml-2">• {currentLeague.gameMode} • {currentLeague.code}</span>
          </div>
        </div>

        {sourceLeagues.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Altra Lega</h3>
            <p className="text-gray-600">Non hai altre leghe da cui importare dati.</p>
          </div>
        ) : (
          <>
            {/* Source League Selection */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Lega di Origine
                </label>
                <select
                  value={selectedSourceLeague?.id || ''}
                  onChange={(e) => {
                    const league = sourceLeagues.find(l => l.id === e.target.value)
                    handleSourceLeagueChange(league || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Seleziona una lega --</option>
                  {sourceLeagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name} ({league.gameMode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Import Options */}
            {selectedSourceLeague && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tipi di Dati da Importare</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.players}
                      onChange={() => handleImportOptionsChange('players')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Giocatori (interessanti e presi)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.participants}
                      onChange={() => handleImportOptionsChange('participants')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Altri Partecipanti
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.formations}
                      onChange={() => handleImportOptionsChange('formations')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      Formazioni Salvate
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Preview Data */}
            {previewData && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Anteprima Dati</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {previewData.players.filter(p => p.interessante || p.status === 'owned').length}
                    </div>
                    <div className="text-xs text-gray-500">Giocatori</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {previewData.participants.length}
                    </div>
                    <div className="text-xs text-gray-500">Partecipanti</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {previewData.formations.length}
                    </div>
                    <div className="text-xs text-gray-500">Formazioni</div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Actions */}
            {selectedSourceLeague && previewData && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedSourceLeague(null)
                    setPreviewData(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isImporting}
                >
                  Annulla
                </button>
                <button
                  onClick={executeImport}
                  disabled={isImporting}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isImporting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isImporting ? '⏳ Importando...' : '📥 Importa Dati'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}