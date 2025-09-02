import React, { useState, useEffect } from 'react'
import { PlayerData } from '../../types/Player'

interface Formation {
  id: string
  nome: string
  schema: string
  giocatori: string[]
  isDefault?: boolean
  createdAt: string
}

interface FormationsProps {
  players: PlayerData[]
  onBackToPlayers: () => void
}

export const Formations: React.FC<FormationsProps> = ({ players, onBackToPlayers }) => {
  const [formations, setFormations] = useState<Formation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const ownedPlayers = players.filter(p => p.status === 'owned')

  useEffect(() => {
    loadFormations()
  }, [])

  const loadFormations = async () => {
    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/formations', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setFormations(data.formations || [])
      } else {
        throw new Error('Errore caricamento formazioni')
      }
    } catch (error: any) {
      console.error('❌ Error loading formations:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewFormation = async () => {
    const nome = prompt('Nome della nuova formazione:')
    if (!nome) return

    const schema = prompt('Schema (es. 3-5-2, 4-3-3):') || '4-3-3'

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/formations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome, schema })
      })

      if (response.ok) {
        const data = await response.json()
        setFormations(prev => [...prev, data.formation])
        alert('✅ Formazione creata con successo!')
      } else {
        throw new Error('Errore creazione formazione')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
    }
  }

  const deleteFormation = async (formationId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa formazione?')) return

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/formations/${formationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setFormations(prev => prev.filter(f => f.id !== formationId))
        alert('✅ Formazione eliminata!')
      } else {
        throw new Error('Errore eliminazione formazione')
      }
    } catch (error: any) {
      alert(`❌ Errore: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento formazioni...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">⚽ Formazioni</h2>
          <p className="text-sm text-gray-600">{formations.length} formazioni create</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={createNewFormation}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ➕ Nuova Formazione
          </button>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Torna ai Giocatori
          </button>
        </div>
      </div>

      {/* Info Stats */}
      {ownedPlayers.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <p className="text-sm text-blue-700">
            💡 <strong>Giocatori disponibili:</strong> {ownedPlayers.length} giocatori acquistati pronti per le formazioni
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}

      {formations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚽</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna formazione creata</h3>
          <p className="text-gray-600 mb-4">Crea la tua prima formazione per organizzare i giocatori.</p>
          <button
            onClick={createNewFormation}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            ➕ Crea Prima Formazione
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map(formation => (
            <div key={formation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{formation.nome}</h3>
                  <p className="text-sm text-gray-600">Schema: {formation.schema}</p>
                </div>
                <button
                  onClick={() => deleteFormation(formation.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Elimina formazione"
                >
                  🗑️
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Giocatori: {formation.giocatori?.length || 0}/11</p>
                <p className="text-xs text-gray-500">
                  Creata: {new Date(formation.createdAt).toLocaleDateString('it-IT')}
                </p>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 text-sm transition-colors">
                  ✏️ Modifica
                </button>
                <button className="flex-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 text-sm transition-colors">
                  👁️ Visualizza
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}