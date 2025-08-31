import React, { useState, useEffect } from 'react'
import { StatsCards } from './dashboard/StatsCards'
import { PlayerCounts } from './dashboard/PlayerCounts'
import { SearchFilters } from './dashboard/SearchFilters'
import { PlayersGrid } from './dashboard/PlayersGrid'
import { Sidebar } from './dashboard/Sidebar'
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

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading saved data...')
      
      const savedData = localStorage.getItem('fantaaiuto_data')
      if (savedData) {
        const data = JSON.parse(savedData)
        if (data.players && Array.isArray(data.players)) {
          setPlayers(data.players)
          console.log('📊 Loaded players:', data.players.length)
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

  const updatePlayer = (playerId: string, updates: Partial<PlayerData>) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    ))
    saveData()
  }

  const importPlayersFromExcel = (newPlayers: PlayerData[]) => {
    setPlayers(newPlayers)
    saveData()
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar Navigation */}
      <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">FantaAiuto</h2>
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Logout"
            >
              👤 {user.username}
            </button>
          </div>
          <PlayerCounts players={filteredPlayers} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">⚽ Tracker Fantacalcio Mantra</h1>
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 p-6 space-y-6">
          <StatsCards players={players} />
          
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
        </div>
      </main>

      {/* Right Sidebar Actions */}
      <Sidebar 
        onImportExcel={importPlayersFromExcel}
        playersCount={players.length}
      />
    </div>
  )
}