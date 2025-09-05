import React, { useState, useEffect } from 'react'
import { PlayerData } from '../../types/Player'

interface Participant {
  id: string
  name: string
  squadra: string
  budget: number
  playersCount: number
  createdAt: string
}

interface ParticipantsProps {
  onBackToPlayers: () => void
  players: PlayerData[]
}

export const Participants: React.FC<ParticipantsProps> = ({ onBackToPlayers, players }) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')

  useEffect(() => {
    loadParticipants()
  }, [])

  // Calculate spent budget for a participant
  const getParticipantSpending = (participantName: string): number => {
    return players
      .filter(p => p.status === 'taken_by_other' && p.acquistatore === participantName)
      .reduce((sum, p) => sum + (p.prezzoEffettivo || p.prezzoAtteso || p.prezzo || 0), 0)
  }

  // Calculate remaining budget for a participant
  const getParticipantRemainingBudget = (participant: Participant): number => {
    const spent = getParticipantSpending(participant.name)
    return participant.budget - spent
  }

  const loadParticipants = async () => {
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      } else {
        throw new Error('Errore caricamento partecipanti')
      }
    } catch (error: any) {
      console.error('❌ Error loading participants:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateModal = () => {
    setNewParticipantName('')
    setShowCreateModal(true)
  }

  const createNewParticipant = async () => {
    if (!newParticipantName.trim()) return

    const name = newParticipantName.trim()
    const squadra = name // Use name as team name
    const budget = 500 // Always set to initial user budget

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, squadra, budget })
      })

      if (response.ok) {
        const data = await response.json()
        setParticipants(prev => [...prev, data.participant])
        setShowCreateModal(false)
        setNewParticipantName('')
      } else {
        throw new Error('Errore creazione partecipante')
      }
    } catch (error: any) {
      console.error('❌ Errore creazione partecipante:', error)
      setError(error.message)
    }
  }

  const deleteParticipant = async (participantId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo partecipante?')) return

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/participants/${participantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setParticipants(prev => prev.filter(p => p.id !== participantId))
        alert('✅ Partecipante eliminato!')
      } else {
        throw new Error('Errore eliminazione partecipante')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
    }
  }

  const editParticipant = async (participant: Participant) => {
    const newName = prompt('Nome del partecipante:', participant.name)
    if (!newName) return

    const newSquadra = prompt('Nome squadra:', participant.squadra) || newName
    const newBudget = parseInt(prompt('Budget:', participant.budget.toString()) || participant.budget.toString())

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/participants/${participant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newName, 
          squadra: newSquadra, 
          budget: newBudget 
        })
      })

      if (response.ok) {
        setParticipants(prev => prev.map(p => 
          p.id === participant.id ? { ...p, name: newName, squadra: newSquadra, budget: newBudget } : p
        ))
        alert('✅ Partecipante modificato con successo!')
      } else {
        throw new Error('Errore modifica partecipante')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
    }
  }

  const viewParticipantPlayers = (participant: Participant) => {
    // For now, show a simple alert with participant info
    // This could be expanded to show a modal or navigate to a detailed view
    alert(`👁️ Giocatori di ${participant.name}:\n\nSquadra: ${participant.squadra}\nBudget: €${participant.budget}\nGiocatori: ${participant.playersCount || 0}\n\n(Funzionalità dettagliata in sviluppo)`)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento partecipanti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">👥 Altri Partecipanti</h2>
          <p className="text-sm text-gray-600">{participants.length} partecipanti al fantacalcio</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            ➕ Aggiungi Partecipante
          </button>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Torna ai Giocatori
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {participants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun partecipante aggiunto</h3>
          <p className="text-gray-600 mb-4">Aggiungi altri partecipanti al tuo fantacalcio per tracciare le loro squadre.</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            ➕ Aggiungi Primo Partecipante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participants.map(participant => (
            <div key={participant.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                  <p className="text-sm text-gray-600">{participant.squadra}</p>
                </div>
                <button
                  onClick={() => deleteParticipant(participant.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Elimina partecipante"
                >
                  🗑️
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Budget Iniziale</span>
                  <span className="text-sm font-bold text-green-600">€{participant.budget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Speso</span>
                  <span className="text-sm font-medium text-orange-600">€{getParticipantSpending(participant.name)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Rimanente</span>
                  <span className="text-sm font-bold text-indigo-600">€{getParticipantRemainingBudget(participant)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Giocatori</span>
                  <span className="text-sm font-medium text-gray-900">
                    {players.filter(p => p.status === 'taken_by_other' && p.acquistatore === participant.name).length}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => editParticipant(participant)}
                  className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-sm transition-colors"
                >
                  ✏️ Modifica
                </button>
                <button 
                  onClick={() => viewParticipantPlayers(participant)}
                  className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-sm transition-colors"
                >
                  👁️ Giocatori
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Participant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ➕ Nuovo Partecipante
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Partecipante
                </label>
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                  placeholder="Inserisci il nome"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createNewParticipant()}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  💰 Budget iniziale: <strong>€500</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Il budget sarà uguale al tuo iniziale
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createNewParticipant}
                  disabled={!newParticipantName.trim()}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors"
                >
                  Crea
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
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