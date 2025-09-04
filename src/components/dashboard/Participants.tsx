import React, { useState, useEffect } from 'react'

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
}

export const Participants: React.FC<ParticipantsProps> = ({ onBackToPlayers }) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadParticipants()
  }, [])

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

  const createNewParticipant = async () => {
    const name = prompt('Nome del partecipante:')
    if (!name) return

    const squadra = prompt('Nome squadra:') || name
    const defaultBudget = 500 // Always set to initial user budget
    const budget = parseInt(prompt('Budget iniziale:', defaultBudget.toString()) || defaultBudget.toString())

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
        alert('✅ Partecipante aggiunto con successo!')
      } else {
        throw new Error('Errore creazione partecipante')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
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
            onClick={createNewParticipant}
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
            onClick={createNewParticipant}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            ➕ Aggiungi Primo Partecipante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {participants.map(participant => (
            <div key={participant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                  <span className="text-xs font-medium text-gray-500">Budget</span>
                  <span className="text-sm font-bold text-green-600">€{participant.budget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Giocatori</span>
                  <span className="text-sm font-medium text-gray-900">{participant.playersCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Aggiunto</span>
                  <span className="text-xs text-gray-500">
                    {new Date(participant.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => editParticipant(participant)}
                  className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 text-sm transition-colors"
                >
                  ✏️ Modifica
                </button>
                <button 
                  onClick={() => viewParticipantPlayers(participant)}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-sm transition-colors"
                >
                  👁️ Giocatori
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}