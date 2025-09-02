import React, { useState, useEffect, useRef } from 'react'
import { StatsCards } from './dashboard/StatsCards'
import { PlayerCounts } from './dashboard/PlayerCounts'
import { SearchFilters } from './dashboard/SearchFilters'
import { PlayersGrid } from './dashboard/PlayersGrid'
import { Sidebar } from './dashboard/Sidebar'
import { OwnedPlayers } from './dashboard/OwnedPlayers'
import { Formations } from './dashboard/Formations'
import { Participants } from './dashboard/Participants'
import { FormationImages } from './dashboard/FormationImages'
import { PlayerData } from '../types/Player'

interface DashboardProps {
  user: {
    id: string
    username: string
    email?: string
  }
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'players' | 'owned' | 'formations' | 'participants' | 'images'>('players')
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading players from backend...')
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const response = await fetch('https://fantaaiuto-backend.onrender.com/api/players', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          const mappedPlayers = data.players.map((p: any) => ({
            id: p.id.toString(),
            nome: p.nome,
            squadra: p.squadra,
            ruoli: [p.ruolo], // Backend stores single role, frontend expects array
            fvm: p.fvm,
            prezzo: p.prezzo,
            status: p.status,
            interessante: p.interessante,
            costoReale: p.costoReale,
            note: p.note,
            createdAt: new Date().toISOString()
          }))
          setPlayers(mappedPlayers)
          console.log('📊 Loaded players from backend:', mappedPlayers.length)
        } else {
          console.warn('⚠️ Failed to load players from backend, using local storage fallback')
          // Fallback to localStorage only if backend fails
          const savedData = localStorage.getItem('fantaaiuto_data')
          if (savedData) {
            const localData = JSON.parse(savedData)
            if (localData.players && Array.isArray(localData.players)) {
              setPlayers(localData.players)
              console.log('📊 Loaded players from localStorage:', localData.players.length)
            }
          }
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('❌ Backend connection failed, using localStorage:', error)
        // Fallback to localStorage
        const savedData = localStorage.getItem('fantaaiuto_data')
        if (savedData) {
          const localData = JSON.parse(savedData)
          if (localData.players && Array.isArray(localData.players)) {
            setPlayers(localData.players)
            console.log('📊 Loaded players from localStorage:', localData.players.length)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveData = () => {
    try {
      const dataToSave = {
        players,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      }
      localStorage.setItem('fantaaiuto_data', JSON.stringify(dataToSave))
      console.log('💾 Data saved successfully')
    } catch (error) {
      console.error('❌ Error saving data:', error)
    }
  }

  const filteredPlayers = players.filter(player => {
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      if (!player.nome?.toLowerCase().includes(search) && 
          !player.squadra?.toLowerCase().includes(search)) {
        return false
      }
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (!player.ruoli || !player.ruoli.includes(roleFilter)) {
        return false
      }
    }

    // Interest filter
    if (interestFilter && !player.interessante) {
      return false
    }

    return true
  })

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role)
  }

  const handleInterestFilterToggle = () => {
    setInterestFilter(!interestFilter)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setInterestFilter(false)
  }

  const updatePlayer = async (playerId: string, updates: Partial<PlayerData>) => {
    try {
      // Update locally first for immediate UI feedback
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, ...updates } : p
      ))

      // Then sync with backend
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      await fetch(`https://fantaaiuto-backend.onrender.com/api/players/${playerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updates.status,
          costoReale: updates.costoReale || 0,
          note: updates.note || null
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('✅ Player updated in backend')
    } catch (error) {
      console.error('❌ Failed to sync player update with backend:', error)
      // Keep local change even if backend fails
    }
    
    saveData()
  }

  const importPlayersFromExcel = async (newPlayers: PlayerData[]) => {
    try {
      console.log('📤 Uploading players to backend...')
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s for large uploads
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/players/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          players: newPlayers.map(p => ({
            nome: p.nome,
            squadra: p.squadra,
            ruolo: Array.isArray(p.ruoli) ? p.ruoli[0] : p.ruoli || 'A',
            prezzo: p.prezzo,
            fvm: p.fvm
          })),
          mode: '1' // Mode 1 = replace all
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        await response.json()
        setPlayers(newPlayers)
        console.log('✅ Players imported to backend successfully')
        alert(`✅ Importati ${newPlayers.length} giocatori nel database!`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Errore HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('❌ Backend import failed:', error)
      
      let errorMessage = 'Errore sconosciuto'
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: Il server sta impiegando troppo tempo (>60s). Il database potrebbe essere occupato.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossibile connettersi al server. Verifica la connessione internet.'
      } else {
        errorMessage = error.message
      }
      
      // Fallback to local storage
      setPlayers(newPlayers)
      saveData()
      alert(`⚠️ Import locale completato (${newPlayers.length} giocatori). Errore database: ${errorMessage}`)
      console.log(`📊 Import locale completato (${newPlayers.length} giocatori). Errore database: ${errorMessage}`)
    }
  }

  // View handlers
  const handleShowOwnedPlayers = () => {
    setCurrentView('owned')
    setRoleFilter('all')
    setSearchQuery('')
    setInterestFilter(false)
  }

  const handleShowFormations = () => {
    setCurrentView('formations')
  }

  const handleShowParticipants = () => {
    setCurrentView('participants')
  }

  const handleShowFormationImages = () => {
    setCurrentView('images')
  }

  const handleBackToPlayers = () => {
    setCurrentView('players')
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">FantaAiuto</h2>
          <div className="flex items-center space-x-2">
            <input
              ref={mobileFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  console.log('📱 Mobile Excel upload triggered')
                  alert('📱 Per caricare file Excel su mobile, usa un dispositivo desktop o ruota in modalità landscape.')
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => mobileFileInputRef.current?.click()}
              className="px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 text-sm"
            >
              📋 Excel
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
      
      {/* Left Sidebar Navigation */}
      <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">FantaAiuto</h2>
            <button
              onClick={onLogout}
              className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors"
              title="Logout"
            >
              🚪 Esci
            </button>
          </div>
          <PlayerCounts players={filteredPlayers} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">⚽ Tracker Fantacalcio Mantra</h1>
          <span className="text-sm text-gray-500">👤 {user.username}</span>
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6">
          <StatsCards players={players} />
          
{currentView === 'players' && (
            <>
              <SearchFilters
                searchQuery={searchQuery}
                roleFilter={roleFilter}
                interestFilter={interestFilter}
                onSearchChange={handleSearchChange}
                onRoleFilterChange={handleRoleFilterChange}
                onInterestFilterToggle={handleInterestFilterToggle}
                onClearFilters={handleClearFilters}
              />
              
              <PlayersGrid 
                players={filteredPlayers}
                isLoading={isLoading}
                onUpdatePlayer={updatePlayer}
              />
            </>
          )}

          {currentView === 'owned' && (
            <OwnedPlayers 
              players={players}
              onUpdatePlayer={updatePlayer}
              onBackToPlayers={handleBackToPlayers}
            />
          )}

          {currentView === 'formations' && (
            <Formations 
              players={players}
              onBackToPlayers={handleBackToPlayers}
            />
          )}

          {currentView === 'participants' && (
            <Participants 
              onBackToPlayers={handleBackToPlayers}
            />
          )}

          {currentView === 'images' && (
            <FormationImages 
              onBackToPlayers={handleBackToPlayers}
            />
          )}
        </div>
      </main>

      {/* Right Sidebar Actions */}
      <Sidebar 
        onImportExcel={importPlayersFromExcel}
        playersCount={players.length}
        onShowOwnedPlayers={handleShowOwnedPlayers}
        onShowFormations={handleShowFormations}
        onShowParticipants={handleShowParticipants}
        onShowFormationImages={handleShowFormationImages}
      />
    </div>
  )
}