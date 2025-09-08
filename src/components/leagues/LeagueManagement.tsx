import React, { useState, useEffect } from 'react'
import { useLeague } from '../../contexts/LeagueContext'
import { useNotifications } from '../../hooks/useNotifications'

interface LeagueMember {
  id: number
  userId: number
  username: string
  email: string
  role: 'master' | 'member'
  teamName: string
  budgetUsed: number
  playersCount: number
  joinedAt: string
}

interface LeagueManagementProps {
  onClose: () => void
}

export const LeagueManagement: React.FC<LeagueManagementProps> = ({ onClose }) => {
  const { currentLeague, updateLeague } = useLeague()
  const { success, error: showError } = useNotifications()
  const [members, setMembers] = useState<LeagueMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteTeamName, setInviteTeamName] = useState('')
  
  // League settings form state
  const [leagueSettings, setLeagueSettings] = useState({
    name: currentLeague?.name || '',
    totalBudget: currentLeague?.totalBudget || 500,
    maxPlayersPerTeam: currentLeague?.maxPlayersPerTeam || 25,
    maxMembers: currentLeague?.maxMembers || 20,
    description: currentLeague?.description || ''
  })

  // Check if user is master
  const isMaster = currentLeague?.isOwner || currentLeague?.userRole === 'master'

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
    if (currentLeague && isMaster) {
      loadLeagueMembers()
    }
  }, [currentLeague, isMaster])

  const loadLeagueMembers = async () => {
    try {
      if (!currentLeague) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${currentLeague.id}/members`, {
        headers: createApiHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      } else {
        showError('❌ Errore nel caricamento dei membri')
      }
    } catch (error) {
      console.error('Error loading league members:', error)
      showError('❌ Errore nel caricamento dei membri')
    } finally {
      setIsLoading(false)
    }
  }

  const inviteUserByUsername = async () => {
    if (!inviteUsername.trim()) return

    try {
      if (!currentLeague) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${currentLeague.id}/invite/username`, {
        method: 'POST',
        headers: createApiHeaders(),
        body: JSON.stringify({
          username: inviteUsername.trim(),
          teamName: inviteTeamName.trim() || inviteUsername.trim()
        })
      })

      if (response.ok) {
        success('✅ Utente invitato con successo!')
        setShowInviteModal(false)
        setInviteUsername('')
        setInviteTeamName('')
        loadLeagueMembers() // Reload members
      } else {
        const errorData = await response.json().catch(() => ({}))
        showError(`❌ ${errorData.error || 'Errore nell\'invito'}`)
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      showError('❌ Errore nell\'invio dell\'invito')
    }
  }

  const updateLeagueSettings = async () => {
    try {
      if (!currentLeague) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${currentLeague.id}`, {
        method: 'PUT',
        headers: createApiHeaders(),
        body: JSON.stringify(leagueSettings)
      })

      if (response.ok) {
        success('✅ Impostazioni lega aggiornate!')
        setShowSettingsModal(false)
        
        // Update the league context with new settings
        const updatedLeague = { ...currentLeague, ...leagueSettings }
        await updateLeague(updatedLeague)
      } else {
        const errorData = await response.json().catch(() => ({}))
        showError(`❌ ${errorData.error || 'Errore nell\'aggiornamento'}`)
      }
    } catch (error) {
      console.error('Error updating league:', error)
      showError('❌ Errore nell\'aggiornamento delle impostazioni')
    }
  }

  if (!currentLeague) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Nessuna lega selezionata</p>
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
          <p className="text-gray-600">Solo il master della lega può gestire queste impostazioni.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🏆 Gestione Lega</h2>
            <p className="text-sm text-gray-600">{currentLeague.name} • Codice: {currentLeague.code}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Indietro
          </button>
        </div>

        {/* League Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Membri</p>
            <p className="text-lg font-bold text-blue-600">{members.length}/{currentLeague.maxMembers}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Modalità</p>
            <p className="text-lg font-bold text-green-600">{currentLeague.gameMode}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-lg font-bold text-purple-600">€{currentLeague.totalBudget}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Max Giocatori</p>
            <p className="text-lg font-bold text-orange-600">{currentLeague.maxPlayersPerTeam}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            👥 Invita Utente
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            ⚙️ Modifica Impostazioni
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(currentLeague.code)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            📋 Copia Codice Invito
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👥 Membri della Lega ({members.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento membri...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-500">Nessun membro nella lega</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${member.role === 'master' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{member.username}</p>
                    <p className="text-sm text-gray-600">{member.teamName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{member.playersCount} giocatori</p>
                    <p className="text-xs text-gray-600">€{member.budgetUsed} spesi</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded ${
                    member.role === 'master' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {member.role === 'master' ? 'Master' : 'Membro'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👥 Invita Utente
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                  placeholder="Inserisci username utente"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Squadra (opzionale)
                </label>
                <input
                  type="text"
                  value={inviteTeamName}
                  onChange={(e) => setInviteTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                  placeholder="Nome della squadra del giocatore"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={inviteUserByUsername}
                  disabled={!inviteUsername.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                >
                  Invita
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* League Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙️ Impostazioni Lega
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Lega
                </label>
                <input
                  type="text"
                  value={leagueSettings.name}
                  onChange={(e) => setLeagueSettings({...leagueSettings, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Totale (€)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={leagueSettings.totalBudget}
                    onChange={(e) => setLeagueSettings({...leagueSettings, totalBudget: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Giocatori
                  </label>
                  <input
                    type="number"
                    min="11"
                    max="50"
                    value={leagueSettings.maxPlayersPerTeam}
                    onChange={(e) => setLeagueSettings({...leagueSettings, maxPlayersPerTeam: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Membri Lega
                </label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={leagueSettings.maxMembers}
                  onChange={(e) => setLeagueSettings({...leagueSettings, maxMembers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={leagueSettings.description}
                  onChange={(e) => setLeagueSettings({...leagueSettings, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                  rows={3}
                  placeholder="Descrizione della lega..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={updateLeagueSettings}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Salva Modifiche
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
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