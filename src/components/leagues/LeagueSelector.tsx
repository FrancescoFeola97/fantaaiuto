import React, { useState, useEffect } from 'react'
import { League, CreateLeagueRequest, JoinLeagueRequest } from '../../types/League'
import { useNotifications } from '../../hooks/useNotifications'
import { useLeague } from '../../contexts/LeagueContext'

interface LeagueSelectorProps {
  onLeagueSelect: (league: League) => void
  currentLeague: League | null
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = () => {
  const { currentLeague, leagues, isLoading, setCurrentLeague, loadLeagues } = useLeague()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [isCreatingLeague, setIsCreatingLeague] = useState(false)
  const [isJoiningLeague, setIsJoiningLeague] = useState(false)
  const { success, error: showError } = useNotifications()

  // Create league form
  const [createForm, setCreateForm] = useState<CreateLeagueRequest>({
    name: '',
    gameMode: 'Mantra',
    totalBudget: 500,
    maxPlayersPerTeam: 25,
    maxMembers: 8,
    description: ''
  })

  // Join league form
  const [joinForm, setJoinForm] = useState<JoinLeagueRequest>({
    code: '',
    teamName: ''
  })

  useEffect(() => {
    // Leagues are loaded by the context, nothing to do here
  }, [])

  const createLeague = async () => {
    if (!createForm.name.trim()) {
      showError('Nome lega richiesto')
      return
    }

    // Previeni chiamate multiple simultanee
    if (isCreatingLeague) {
      console.log('⚠️ League creation already in progress, skipping...')
      return
    }

    try {
      setIsCreatingLeague(true)
      console.log('🏆 Creating league:', createForm.name)
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const data = await response.json()
        const newLeague = data.league
        
        setShowCreateModal(false)
        setCreateForm({
          name: '',
          gameMode: 'Mantra',
          totalBudget: 500,
          maxPlayersPerTeam: 25,
          maxMembers: 8,
          description: ''
        })
        
        // Reload leagues and automatically select the new league
        await loadLeagues()
        setCurrentLeague(newLeague)
        success(`🏆 Lega "${newLeague.name}" creata con successo! Codice invito: ${newLeague.code}`)
        console.log('✅ League created successfully:', newLeague.name)
      } else {
        const errorText = await response.text()
        console.error('❌ League creation failed:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText || '{}')
          throw new Error(errorData.error || errorData.message || 'Validation failed')
        } catch (parseError) {
          throw new Error('Validation failed: ' + errorText)
        }
      }
    } catch (error: any) {
      console.error('❌ Error creating league:', error)
      showError(`❌ Errore: ${error.message}`)
    } finally {
      setIsCreatingLeague(false)
    }
  }

  const joinLeague = async () => {
    if (!joinForm.code.trim()) {
      showError('Codice lega richiesto')
      return
    }

    // Previeni chiamate multiple simultanee
    if (isJoiningLeague) {
      console.log('⚠️ League join already in progress, skipping...')
      return
    }

    try {
      setIsJoiningLeague(true)
      console.log('🎯 Joining league with code:', joinForm.code)
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/leagues/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(joinForm)
      })

      if (response.ok) {
        setShowJoinModal(false)
        setJoinForm({ code: '', teamName: '' })
        
        // Reload leagues to get the new one
        await loadLeagues()
        success('🎉 Entrato nella lega con successo!')
        console.log('✅ Successfully joined league')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Errore unione lega')
      }
    } catch (error: any) {
      console.error('❌ Error joining league:', error)
      showError(`❌ Errore: ${error.message}`)
    } finally {
      setIsJoiningLeague(false)
    }
  }

  const leaveLeague = async (leagueId: number) => {
    const league = leagues.find(l => parseInt(l.id) === leagueId)
    
    let confirmMessage = 'Sei sicuro di voler uscire da questa lega? Questa azione non può essere annullata.'
    if (league?.isOwner) {
      confirmMessage = 'Sei sicuro di voler abbandonare questa lega? Il membro più anziano diventerà il nuovo proprietario. Questa azione non può essere annullata.'
    }
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${leagueId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // If leaving the current league, clear it
        if (currentLeague?.id === leagueId.toString()) {
          setCurrentLeague(null)
        }
        
        // Reload leagues
        await loadLeagues()
        
        if (league?.isOwner) {
          success('👑 Hai abbandonato la lega e trasferito il controllo al membro più anziano!')
        } else {
          success('👋 Sei uscito dalla lega con successo!')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Errore uscita lega')
      }
    } catch (error: any) {
      console.error('❌ Error leaving league:', error)
      showError(`❌ Errore: ${error.message}`)
    }
  }

  const deleteLeague = async (leagueId: number) => {
    if (!confirm('⚠️ ATTENZIONE: Sei sicuro di voler CANCELLARE definitivamente questa lega? Tutti i membri verranno rimossi e tutti i dati andranno persi. Questa azione NON può essere annullata!')) {
      return
    }

    if (!confirm('Conferma di nuovo: CANCELLARE DEFINITIVAMENTE la lega e tutti i suoi dati?')) {
      return
    }

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${leagueId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // If deleting the current league, clear it
        if (currentLeague?.id === leagueId.toString()) {
          setCurrentLeague(null)
        }
        
        // Reload leagues
        await loadLeagues()
        success('🗑️ Lega cancellata definitivamente!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Errore cancellazione lega')
      }
    } catch (error: any) {
      console.error('❌ Error deleting league:', error)
      showError(`❌ Errore: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento leghe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🏆 Le Mie Leghe</h2>
          <p className="text-sm text-gray-600">
            {leagues.length === 0 
              ? 'Nessuna lega trovata. Crea o unisciti a una lega per iniziare!'
              : `${leagues.length} ${leagues.length === 1 ? 'lega' : 'leghe'}`
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
          >
            ➕ Unisciti
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            🏆 Crea Lega
          </button>
        </div>
      </div>


      {/* Current League Indicator */}
      {currentLeague && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Lega attiva:</span> {currentLeague.name} 
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
              {currentLeague.gameMode}
            </span>
          </p>
        </div>
      )}

      {/* Leagues Grid */}
      {leagues.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna lega</h3>
          <p className="text-gray-600 mb-6">Crea la tua prima lega o unisciti a una esistente usando un codice invito.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              🏆 Crea Prima Lega
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              ➕ Unisciti a Lega
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map(league => (
            <div
              key={league.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                currentLeague?.id === league.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCurrentLeague(league)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{league.name}</h3>
                  <p className="text-xs text-gray-600">
                    {league.isOwner ? '👑 Proprietario' : '👤 Membro'}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    league.gameMode === 'Mantra' 
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {league.gameMode}
                  </span>
                  {currentLeague?.id === league.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Attiva
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Codice:</span>
                  <span className="font-mono font-medium text-gray-900">{league.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Membri:</span>
                  <span>{league.membersCount || 0}/{league.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget:</span>
                  <span>€{league.totalBudget}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max giocatori:</span>
                  <span>{league.maxPlayersPerTeam}</span>
                </div>
              </div>

              {league.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 truncate" title={league.description}>
                    {league.description}
                  </p>
                </div>
              )}

              {/* League actions */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {league.isOwner ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        leaveLeague(parseInt(league.id))
                      }}
                      className="w-full text-xs py-1 px-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded border border-orange-200 transition-colors"
                    >
                      🚪 Abbandona lega (trasferisci ownership)
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLeague(parseInt(league.id))
                      }}
                      className="w-full text-xs py-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                    >
                      🗑️ Cancella lega
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      leaveLeague(parseInt(league.id))
                    }}
                    className="w-full text-xs py-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                  >
                    🚪 Esci dalla lega
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create League Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreatingLeague) {
              setShowCreateModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🏆 Crea Nuova Lega
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Lega</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                  placeholder="Inserisci il nome della lega"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Gioco</label>
                <select
                  value={createForm.gameMode}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, gameMode: e.target.value as 'Classic' | 'Mantra' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                >
                  <option value="Mantra">Mantra</option>
                  <option value="Classic">Classic</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Totale</label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    step="1"
                    value={createForm.totalBudget}
                    onChange={(e) => {
                      const numValue = parseInt(e.target.value) || 500
                      if (numValue >= 100 && numValue <= 2000) {
                        setCreateForm(prev => ({ ...prev, totalBudget: numValue }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Crediti disponibili per tutti i membri (100-2000)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Membri</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    step="1"
                    value={createForm.maxMembers}
                    onChange={(e) => {
                      const numValue = parseInt(e.target.value) || 8
                      if (numValue >= 2 && numValue <= 50) {
                        setCreateForm(prev => ({ ...prev, maxMembers: numValue }))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                    placeholder="8"
                  />
                  <p className="text-xs text-gray-500 mt-1">Numero massimo partecipanti (2-50)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Giocatori per Team</label>
                <input
                  type="number"
                  min="11"
                  max="50"
                  step="1"
                  value={createForm.maxPlayersPerTeam}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value) || 25
                    if (numValue >= 11 && numValue <= 50) {
                      setCreateForm(prev => ({ ...prev, maxPlayersPerTeam: numValue }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                  placeholder="25"
                />
                <p className="text-xs text-gray-500 mt-1">Numero massimo di giocatori per squadra (11-50)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 resize-none"
                  rows={3}
                  placeholder="Descrivi la tua lega..."
                  maxLength={500}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createLeague}
                  disabled={!createForm.name.trim() || isCreatingLeague}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                >
                  {isCreatingLeague ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </span>
                  ) : (
                    'Crea Lega'
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreatingLeague}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join League Modal */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isJoiningLeague) {
              setShowJoinModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ➕ Unisciti a Lega
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Lega</label>
                <input
                  type="text"
                  value={joinForm.code}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 font-mono"
                  placeholder="Inserisci il codice"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Team (opzionale)</label>
                <input
                  type="text"
                  value={joinForm.teamName}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, teamName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200"
                  placeholder="Il Mio Team"
                  maxLength={100}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={joinLeague}
                  disabled={!joinForm.code.trim() || isJoiningLeague}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                >
                  {isJoiningLeague ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Unendosi...
                    </span>
                  ) : (
                    'Unisciti'
                  )}
                </button>
                <button
                  onClick={() => setShowJoinModal(false)}
                  disabled={isJoiningLeague}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}