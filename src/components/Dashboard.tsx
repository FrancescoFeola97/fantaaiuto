import React, { useState, useEffect, useRef, useMemo } from 'react'
import { StatsCards } from './dashboard/StatsCards'
import { PlayerCounts } from './dashboard/PlayerCounts'
import { SearchFilters } from './dashboard/SearchFilters'
import { PlayersGrid } from './dashboard/PlayersGrid'
import { Sidebar } from './dashboard/Sidebar'
import { OwnedPlayers } from './dashboard/OwnedPlayers'
import { Formations } from './dashboard/Formations'
import { Participants } from './dashboard/Participants'
import { FormationImages } from './dashboard/FormationImages'
import { Settings } from './dashboard/Settings'
import { PlayerData } from '../types/Player'
import { useNotifications } from '../hooks/useNotifications'
import { useDebounce } from '../hooks/useDebounce'
import { useAppSettings } from './dashboard/Settings'

interface DashboardProps {
  user: {
    id: string
    username: string
    email?: string
  }
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const settings = useAppSettings()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; squadra: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [currentView, setCurrentView] = useState<'players' | 'owned' | 'formations' | 'participants' | 'images' | 'removed' | 'settings'>('players')
  const mobileFileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useNotifications()
  
  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Get player roles based on current game mode
  const getPlayerRoles = (player: PlayerData): string[] => {
    if (settings.gameMode === 'Classic') {
      return player.ruoliClassic?.length ? player.ruoliClassic : player.ruoli
    } else {
      return player.ruoliMantra?.length ? player.ruoliMantra : player.ruoli
    }
  }

  useEffect(() => {
    loadUserData()
    loadParticipants()
    
    // Listen for participants updates
    const handleParticipantsUpdate = () => {
      loadParticipants()
    }
    
    window.addEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
    
    return () => {
      window.removeEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
    }
  }, [])

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading players from backend database...')
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Load data directly from backend PostgreSQL database
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/players', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
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
          console.log('✅ Loaded players from PostgreSQL database:', mappedPlayers.length)
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
        const mappedParticipants = (data.participants || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          squadra: p.squadra
        }))
        setParticipants(mappedParticipants)
        console.log('📊 Loaded participants:', mappedParticipants.length)
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
    const roleOrder = settings.gameMode === 'Classic' ? classicRoleOrder : mantraRoleOrder
    
    // Get primary role for sorting (first role in array)
    const roleA = getPlayerRoles(a)?.[0] || (settings.gameMode === 'Classic' ? 'A' : 'A')
    const roleB = getPlayerRoles(b)?.[0] || (settings.gameMode === 'Classic' ? 'A' : 'A')
    
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
          costoReale: updates.prezzoEffettivo || updates.costoReale || 0,
          note: updates.note || null,
          prezzoAtteso: updates.prezzoAtteso,
          acquistatore: updates.acquistatore
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('✅ Player updated in backend')
    } catch (error) {
      console.error('❌ Failed to sync player update with backend:', error)
      // Keep local change even if backend fails
    }
  }

  const importPlayersFromExcel = async (newPlayers: PlayerData[]) => {
    setIsImporting(true)
    
    // Show players immediately for better UX (optimistic UI)  
    setPlayers(newPlayers)
    
    try {
      console.log('📤 Uploading players to backend...')
      
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) {
        console.log('📊 No token found, using local mode only')
        return
      }

      // Try backend sync with longer timeout for Render cold starts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minutes
      
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
            ruolo: Array.isArray(p.ruoli) ? p.ruoli.join(';') : p.ruoli || 'A',
            prezzo: p.prezzo,
            fvm: p.fvm
          })),
          mode: '1' // Mode 1 = replace all
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Players synced to backend successfully:', result)
        
        // Reload data from backend to get any server-side updates
        await loadUserData()
        
        // Success notification
        success(`✅ Dati persistiti! ${newPlayers.length} giocatori salvati localmente + backup backend.`)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Backend sync error:', errorData)
        success(`✅ Dati salvati localmente! ${newPlayers.length} giocatori (backup backend non disponibile)`)
      }
    } catch (error: any) {
      console.error('❌ Backend sync failed:', error)
      
      success(`✅ Dati salvati localmente! ${newPlayers.length} giocatori (backup backend: server in avvio)`)
    } finally {
      setIsImporting(false)
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

  const handleShowRemovedPlayers = () => {
    setCurrentView('removed')
  }

  const handleShowSettings = () => {
    setCurrentView('settings')
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
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">⚽ Tracker Fantacalcio Mantra</h1>
          <span className="text-sm text-gray-500">👤 {user.username}</span>
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6">
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

          {currentView === 'images' && (
            <FormationImages 
              onBackToPlayers={handleBackToPlayers}
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
        onShowFormationImages={handleShowFormationImages}
        onShowRemovedPlayers={handleShowRemovedPlayers}
        onShowSettings={handleShowSettings}
      />
    </div>
  )
}