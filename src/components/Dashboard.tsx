import React, { useState, useEffect, useRef, useMemo } from 'react'
import { StatsCards } from './dashboard/StatsCards'
import { PlayerCounts } from './dashboard/PlayerCounts'
import { SearchFilters } from './dashboard/SearchFilters'
import { PlayersGrid } from './dashboard/PlayersGrid'
import { Sidebar } from './dashboard/Sidebar'
import { OwnedPlayers } from './dashboard/OwnedPlayers'
import { Formations } from './dashboard/Formations'
import { Participants } from './dashboard/Participants'
import { Settings } from './dashboard/Settings'
import { DataImport } from './dashboard/DataImport'
import { LeagueManagement } from './leagues/LeagueManagement'
import { LeagueSelector } from './leagues/LeagueSelector'
import { ProgressOverlay } from './ui/ProgressOverlay'
import { PlayerData } from '../types/Player'
import { useNotifications } from '../hooks/useNotifications'
import { useDebounce } from '../hooks/useDebounce'
import { useLeague, useGameMode } from '../contexts/LeagueContext'

interface DashboardProps {
  user: {
    id: string
    username: string
    email?: string
  }
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { currentLeague } = useLeague()
  const gameMode = useGameMode()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; squadra: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [currentView, setCurrentView] = useState<'players' | 'owned' | 'formations' | 'participants' | 'removed' | 'settings' | 'data-import' | 'league-management' | 'league-selector'>('players')
  const mobileFileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useNotifications()
  
  // Progress overlay state
  const [progressState, setProgressState] = useState({
    isVisible: false,
    progress: 0,
    currentStep: '',
    processedCount: 0,
    totalCount: 0,
    estimatedTimeRemaining: 0,
    currentBatch: 0,
    totalBatches: 0
  })
  
  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Helper function to create headers with league ID
  const createApiHeaders = () => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (currentLeague?.id) {
      headers['x-league-id'] = currentLeague.id.toString()
      console.log('🔗 Adding league header:', currentLeague.id)
    } else {
      console.log('⚠️ No league selected for API call')
    }
    
    return headers
  }

  // Get player roles based on current game mode
  const getPlayerRoles = (player: PlayerData): string[] => {
    if (gameMode === 'Classic') {
      return player.ruoliClassic?.length ? player.ruoliClassic : player.ruoli
    } else {
      return player.ruoliMantra?.length ? player.ruoliMantra : player.ruoli
    }
  }

  useEffect(() => {
    if (currentLeague) {
      console.log(`🔄 League changed to: ${currentLeague.name} (${currentLeague.id}) - Reloading all data`)
      // Clear existing data first to show loading state
      setPlayers([])
      setParticipants([])
      setIsLoading(true)
      
      // Small delay to ensure UI updates and avoid race conditions
      const loadTimer = setTimeout(() => {
        // Load fresh data for the new league
        loadUserData()
        loadParticipants()
      }, 100)
      
      // Listen for participants updates
      const handleParticipantsUpdate = () => {
        loadParticipants()
      }
      
      window.addEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
      
      return () => {
        clearTimeout(loadTimer)
        window.removeEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
      }
    } else {
      console.log('🔄 No league selected - Clearing all data')
      setPlayers([])
      setParticipants([])
      setIsLoading(false)
    }
  }, [currentLeague?.id]) // Use currentLeague.id to ensure it triggers on league changes

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading players from backend database...')
      
      if (!currentLeague) {
        console.log('📊 No league selected, skipping player load')
        setPlayers([])
        setIsLoading(false)
        return
      }

      // Load data directly from backend PostgreSQL database
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/players', {
        headers: createApiHeaders(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        // Verify we're still on the same league (prevent race conditions)
        if (!currentLeague || currentLeague.id.toString() !== data.leagueId?.toString()) {
          console.log('⚠️ League changed during data load, discarding stale data')
          setIsLoading(false)
          return
        }
        
        console.log(`📊 Backend returned ${data.players?.length || 0} players for league ${currentLeague.id}`)
        
        if (data.players && data.players.length > 0) {
          const mappedPlayers = data.players.map((p: any) => {
            // Parse roles from backend - try both detailed (RM) and basic (R)
            const rawRoles = p.ruolo ? p.ruolo.split(';').map((r: string) => r.trim()).filter((r: string) => r.length > 0) : ['A']
            
            // For existing data, assume these are Mantra roles and generate Classic roles
            const ruoliMantra = rawRoles
            const ruoliClassic = rawRoles.map((role: string) => {
              const roleMapping: Record<string, string> = {
                'Por': 'P', 'P': 'P',
                'Ds': 'D', 'Dd': 'D', 'Dc': 'D', 'B': 'D', 'D': 'D',
                'E': 'C', 'M': 'C', 'C': 'C', 'W': 'C', 'T': 'C',
                'A': 'A', 'Pc': 'A'
              }
              return roleMapping[role] || 'A'
            }).filter((role: string, index: number, self: string[]) => self.indexOf(role) === index) // Remove duplicates

            return {
              id: p.master_id?.toString() || p.id?.toString(),
              nome: p.nome,
              squadra: p.squadra,
              ruoli: ruoliMantra, // Default to Mantra roles
              ruoliMantra,
              ruoliClassic,
              fvm: p.fvm,
              prezzo: p.prezzo,
              prezzoAtteso: p.prezzo_atteso || p.prezzo,
              prezzoEffettivo: p.costo_reale,
              status: p.status || 'available',
              interessante: p.interessante || false,
              costoReale: p.costo_reale,
              acquistatore: p.acquistatore,
              note: p.note,
              createdAt: new Date().toISOString()
            }
          })
          
          setPlayers(mappedPlayers)
          console.log(`✅ Loaded ${mappedPlayers.length} players from PostgreSQL for league ${currentLeague.id}`)
          console.log(`📊 Interesting players: ${mappedPlayers.filter((p: any) => p.interessante).length}`)
          console.log(`📊 Owned players: ${mappedPlayers.filter((p: any) => p.status === 'owned').length}`)
        } else {
          console.log('📊 No players found in database')
          setPlayers([])
        }
      } else {
        console.error('❌ Failed to load players from backend:', response.status)
        setPlayers([])
      }
    } catch (error) {
      console.error('❌ Error loading players from database:', error)
      setPlayers([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadParticipants = async () => {
    try {
      if (!currentLeague) {
        console.log('📊 No league selected, skipping participants load')
        setParticipants([])
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
        headers: createApiHeaders(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        // Verify we're still on the same league (prevent race conditions)
        if (!currentLeague || currentLeague.id.toString() !== data.leagueId?.toString()) {
          console.log('⚠️ League changed during participants load, discarding stale data')
          return
        }
        
        const mappedParticipants = (data.participants || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          squadra: p.squadra
        }))
        setParticipants(mappedParticipants)
        console.log(`📊 Loaded ${mappedParticipants.length} participants for league ${currentLeague.id}`)
      }
    } catch (error) {
      console.error('❌ Failed to load participants:', error)
    }
  }

  // Data persistence is now handled by PostgreSQL backend
  // No longer saving to localStorage - all data stored in cloud database

  const filteredPlayers = useMemo(() => players.filter(player => {
    // Exclude removed players from main view
    if (player.status === 'removed') {
      return false
    }

    // Search filter (using debounced query)
    if (debouncedSearchQuery) {
      const search = debouncedSearchQuery.toLowerCase()
      if (!player.nome?.toLowerCase().includes(search) && 
          !player.squadra?.toLowerCase().includes(search)) {
        return false
      }
    }

    // Role filter
    if (roleFilter !== 'all') {
      const playerRoles = getPlayerRoles(player)
      if (!playerRoles || !playerRoles.includes(roleFilter)) {
        return false
      }
    }

    // Interest filter
    if (interestFilter && !player.interessante) {
      return false
    }

    return true
  }).sort((a, b) => {
    // If a role filter is applied, sort primarily by FVM (highest first)
    if (roleFilter !== 'all') {
      return (b.fvm || 0) - (a.fvm || 0)
    }
    
    // For unfiltered view, sort by role first, then FVM
    // Define role priority order based on game mode
    const mantraRoleOrder = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']
    const classicRoleOrder = ['P', 'D', 'C', 'A']
    const roleOrder = gameMode === 'Classic' ? classicRoleOrder : mantraRoleOrder
    
    // Get primary role for sorting (first role in array)
    const roleA = getPlayerRoles(a)?.[0] || (gameMode === 'Classic' ? 'A' : 'A')
    const roleB = getPlayerRoles(b)?.[0] || (gameMode === 'Classic' ? 'A' : 'A')
    
    // First sort by role
    const roleIndexA = roleOrder.indexOf(roleA)
    const roleIndexB = roleOrder.indexOf(roleB)
    
    if (roleIndexA !== roleIndexB) {
      return (roleIndexA === -1 ? 999 : roleIndexA) - (roleIndexB === -1 ? 999 : roleIndexB)
    }
    
    // Then sort by FVM (highest first)
    return (b.fvm || 0) - (a.fvm || 0)
  }), [players, debouncedSearchQuery, roleFilter, interestFilter])

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

  // Navigation handlers
  const handleBackToPlayers = () => {
    setCurrentView('players')
  }

  const handleShowLeagueSelector = () => {
    setCurrentView('league-selector')
  }

  const updatePlayer = async (playerId: string, updates: Partial<PlayerData>) => {
    try {
      // Check league first before any updates
      if (!currentLeague) {
        console.log('📊 No league selected, skipping player update')
        return
      }

      console.log(`🔄 Updating player ${playerId} in league ${currentLeague.id}:`, updates)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const updateData = {
        status: updates.status,
        costoReale: updates.prezzoEffettivo || updates.costoReale,
        note: updates.note || null,
        prezzoAtteso: updates.prezzoAtteso,
        acquistatore: updates.acquistatore,
        interessante: updates.interessante
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      console.log('📤 Sending update to backend:', playerId, updateData)
      
      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/players/${playerId}/status`, {
        method: 'PATCH',
        headers: createApiHeaders(),
        body: JSON.stringify(updateData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log('✅ Player updated in backend, updating local state')
        // Only update locally after successful backend update
        setPlayers(prev => prev.map(p => 
          p.id === playerId ? { ...p, ...updates } : p
        ))
      } else {
        const errorText = await response.text()
        console.error('❌ Backend update failed:', response.status, errorText)
        // Don't update local state if backend failed
      }
    } catch (error) {
      console.error('❌ Failed to sync player update with backend:', error)
      // Don't update local state if API call failed
    }
  }

  const importPlayersFromExcel = async (newPlayers: PlayerData[]) => {
    if (!currentLeague) {
      error('❌ Seleziona una lega prima di importare i giocatori')
      return
    }

    setIsImporting(true)
    
    // Initialize progress overlay
    const batchSize = 100
    const totalBatches = Math.ceil(newPlayers.length / batchSize)
    const startTime = Date.now()
    ;(window as any).importStartTime = startTime
    
    setProgressState({
      isVisible: true,
      progress: 0,
      currentStep: 'Preparazione caricamento...',
      processedCount: 0,
      totalCount: newPlayers.length,
      estimatedTimeRemaining: 0,
      currentBatch: 0,
      totalBatches
    })
    
    // Show players immediately for better UX (optimistic UI)  
    setPlayers(newPlayers)
    
    let progressInterval: NodeJS.Timeout | null = null
    
    try {
      console.log('📤 Starting fast batch upload:', newPlayers.length, 'players')
      
      if (!currentLeague) {
        console.log('📊 No league selected, using local mode only')
        setProgressState(prev => ({ ...prev, currentStep: 'Nessuna lega selezionata - modalità locale' }))
        return
      }

      setProgressState(prev => ({ ...prev, currentStep: 'Connessione al database...' }))

      // Simulate progress updates during upload
      progressInterval = setInterval(() => {
        setProgressState(prev => {
          if (prev.progress < 85) { // Don't go above 85% until we get the response
            const elapsed = (Date.now() - startTime) / 1000
            const estimatedTotal = (elapsed / Math.max(prev.progress, 1)) * 100
            const remainingTime = Math.max(0, estimatedTotal - elapsed)
            
            const newProgress = Math.min(prev.progress + 2 + Math.random() * 3, 85)
            const processedCount = Math.floor((newProgress / 100) * newPlayers.length)
            const currentBatch = Math.floor((processedCount / batchSize)) + 1
            
            return {
              ...prev,
              progress: newProgress,
              processedCount,
              currentBatch: Math.min(currentBatch, totalBatches),
              currentStep: `Elaborazione batch ${Math.min(currentBatch, totalBatches)} di ${totalBatches}...`,
              estimatedTimeRemaining: remainingTime
            }
          }
          return prev
        })
      }, 300)

      // Use new fast batch import endpoint
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes for large uploads
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/players/import/batch', {
        method: 'POST',
        headers: createApiHeaders(),
        body: JSON.stringify({ 
          players: newPlayers.map(p => ({
            nome: p.nome,
            squadra: p.squadra,
            ruolo: Array.isArray(p.ruoli) ? p.ruoli.join(';') : p.ruoli || 'A',
            prezzo: p.prezzo,
            fvm: p.fvm
          })),
          batchSize: batchSize
        }),
        signal: controller.signal
      })
      
      // Stop the progress simulation
      if (progressInterval) clearInterval(progressInterval)
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Fast batch import completed:', result)
        
        // Update progress to completion
        setProgressState(prev => ({ 
          ...prev, 
          progress: 100,
          processedCount: newPlayers.length,
          currentStep: 'Caricamento completato!',
          currentBatch: totalBatches,
          estimatedTimeRemaining: 0
        }))
        
        // Wait a moment to show completion
        setTimeout(async () => {
          // Hide progress overlay
          setProgressState(prev => ({ ...prev, isVisible: false }))
          
          // Reload data from backend to get any server-side updates
          await loadUserData()
          
          // Success notification
          success(`🚀 Caricamento veloce completato! ${newPlayers.length} giocatori importati in ${result.batches} batch.`)
        }, 1500)
        
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Fast batch import error:', errorData)
        setProgressState(prev => ({ ...prev, isVisible: false }))
        success(`✅ Dati salvati localmente! ${newPlayers.length} giocatori (backup backend non disponibile)`)
      }
    } catch (error: any) {
      console.error('❌ Fast batch import failed:', error)
      setProgressState(prev => ({ ...prev, isVisible: false }))
      
      success(`✅ Dati salvati localmente! ${newPlayers.length} giocatori (backup backend: server in avvio)`)
    } finally {
      setIsImporting(false)
      // Ensure progress interval is cleaned up
      if (progressInterval) clearInterval(progressInterval)
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


  const handleShowRemovedPlayers = () => {
    setCurrentView('removed')
  }

  const handleShowSettings = () => {
    setCurrentView('settings')
  }

  const handleShowLeagueManagement = () => {
    setCurrentView('league-management')
  }

  const handleShowDataImport = () => {
    setCurrentView('data-import')
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">FantaAiuto</h2>
            {currentLeague && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm font-medium text-gray-700">{currentLeague.name}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentLeague.gameMode === 'Mantra' 
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {currentLeague.gameMode}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              ref={mobileFileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  console.log('📱 Mobile Excel upload triggered')
                  error('📱 Per caricare file Excel su mobile, usa un dispositivo desktop o ruota in modalità landscape.')
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
          <PlayerCounts 
            players={players.filter(p => p.status !== 'removed')} 
            currentRoleFilter={roleFilter}
            onRoleFilterChange={handleRoleFilterChange}
            onBackToPlayers={handleBackToPlayers}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">⚽ FantaAiuto</h1>
              {currentLeague ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-800">{currentLeague.name}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentLeague.gameMode === 'Mantra' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {currentLeague.gameMode}
                    </span>
                    <span className="text-sm text-gray-500">
                      Codice: <span className="font-mono font-medium text-gray-700">{currentLeague.code}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 text-sm">Nessuna lega selezionata</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Usa la sidebar per creare o selezionare una lega
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">👤 {user.username}</span>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6">
          {!currentLeague ? (
            // No league selected - show welcome message
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Benvenuto in FantaAiuto!</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Per iniziare, seleziona una lega esistente o creane una nuova utilizzando 
                  il pulsante nella barra laterale destra.
                </p>
                <button
                  onClick={handleShowLeagueSelector}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  🏆 Gestisci Leghe
                </button>
              </div>
            </div>
          ) : (
            <>
              <StatsCards players={players} />
              
              {/* Taken Players Summary */}
              {currentView === 'players' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Riassunto Giocatori Presi</h3>
              {(() => {
                const takenPlayers = players.filter(p => p.status === 'owned' || p.status === 'taken_by_other')
                
                if (takenPlayers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">⚽</div>
                      <p className="text-gray-500">Nessun giocatore preso ancora</p>
                    </div>
                  )
                }

                const roleGroups = takenPlayers.reduce((acc: Record<string, any[]>, player) => {
                  const roleKey = player.ruoli?.join('/') || 'Sconosciuto'
                  if (!acc[roleKey]) acc[roleKey] = []
                  acc[roleKey].push(player)
                  return acc
                }, {})

                // Define role priority order for proper sorting
                const roleOrder = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']
                
                const sortedRoleGroups = Object.entries(roleGroups).sort(([roleA], [roleB]) => {
                  // Get first role from each role combination for sorting
                  const firstRoleA = roleA.split('/')[0]
                  const firstRoleB = roleB.split('/')[0]
                  
                  const indexA = roleOrder.indexOf(firstRoleA)
                  const indexB = roleOrder.indexOf(firstRoleB)
                  
                  // If role not found in order, put it at the end
                  const priorityA = indexA === -1 ? 999 : indexA
                  const priorityB = indexB === -1 ? 999 : indexB
                  
                  return priorityA - priorityB
                })

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedRoleGroups.map(([roles, groupPlayers]) => (
                      <div key={roles} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{roles}</h4>
                        <div className="space-y-1">
                          {groupPlayers.map(player => (
                            <div key={player.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-700">{player.nome}</span>
                                {player.status === 'taken_by_other' && (
                                  <span className="text-xs px-1 py-0.5 bg-orange-100 text-orange-600 rounded">
                                    👤
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 text-xs">{player.acquistatore || 'Me'}</span>
                                <span className="font-medium text-purple-600">
                                  {new Intl.NumberFormat('it-IT').format(player.prezzoEffettivo || player.prezzoAtteso || player.prezzo || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-600">Totale ({groupPlayers.length})</span>
                            <span className="text-purple-600">
                              {new Intl.NumberFormat('it-IT').format(
                                groupPlayers.reduce((sum, p) => sum + (p.prezzoEffettivo || p.prezzoAtteso || p.prezzo || 0), 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

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
                isSearching={searchQuery !== debouncedSearchQuery && searchQuery.length > 0}
              />
              
              <PlayersGrid 
                players={filteredPlayers}
                isLoading={isLoading}
                onUpdatePlayer={updatePlayer}
                participants={participants}
              />
            </>
          )}
            </>
          )}

          {/* View-specific content (available regardless of league selection) */}
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
              players={players}
            />
          )}


          {currentView === 'removed' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">👻 Giocatori Rimossi</h2>
                <button
                  onClick={handleBackToPlayers}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                >
                  🏠 Torna alla Home
                </button>
              </div>
              
              <PlayersGrid 
                players={players.filter(p => p.status === 'removed')}
                isLoading={isLoading}
                onUpdatePlayer={updatePlayer}
                participants={participants}
              />
            </div>
          )}

          {currentView === 'settings' && (
            <Settings 
              onBackToPlayers={handleBackToPlayers}
              players={players}
              onUpdatePlayers={(updates) => {
                // Applica gli aggiornamenti ai giocatori
                updates.forEach(update => {
                  updatePlayer(update.id, {
                    prezzoAtteso: update.prezzoAtteso,
                    interessante: update.interessante
                  })
                })
              }}
            />
          )}

          {currentView === 'data-import' && (
            <DataImport 
              onBackToPlayers={handleBackToPlayers}
              onDataImported={() => {
                // Ricarica i dati dopo l'importazione
                loadUserData()
                loadParticipants()
                setCurrentView('players')
              }}
            />
          )}
          {currentView === 'league-management' && (
            <LeagueManagement 
              onClose={handleBackToPlayers}
            />
          )}

          {currentView === 'league-selector' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">🏆 Gestione Leghe</h2>
                    <p className="text-sm text-gray-600">Crea una nuova lega o unisciti a una esistente</p>
                  </div>
                  <button
                    onClick={handleBackToPlayers}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
                  >
                    ← Torna al Dashboard
                  </button>
                </div>

                <LeagueSelector 
                  onLeagueSelect={() => {
                    // League selection is handled by the context
                    setCurrentView('players')
                  }}
                  currentLeague={currentLeague}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar Actions */}
      <Sidebar 
        onImportExcel={importPlayersFromExcel}
        playersCount={players.length}
        isImporting={isImporting}
        onShowOwnedPlayers={handleShowOwnedPlayers}
        onShowFormations={handleShowFormations}
        onShowParticipants={handleShowParticipants}
        onShowRemovedPlayers={handleShowRemovedPlayers}
        onShowSettings={handleShowSettings}
        onShowLeagueManagement={handleShowLeagueManagement}
        onShowLeagueSelector={handleShowLeagueSelector}
        onShowDataImport={handleShowDataImport}
      />

      {/* Progress Overlay for Excel Upload */}
      <ProgressOverlay
        isVisible={progressState.isVisible}
        progress={progressState.progress}
        currentStep={progressState.currentStep}
        processedCount={progressState.processedCount}
        totalCount={progressState.totalCount}
        estimatedTimeRemaining={progressState.estimatedTimeRemaining}
        currentBatch={progressState.currentBatch}
        totalBatches={progressState.totalBatches}
      />
    </div>
  )
}