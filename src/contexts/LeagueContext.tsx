import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { League } from '../types/League'

interface LeagueContextType {
  currentLeague: League | null
  leagues: League[]
  isLoading: boolean
  setCurrentLeague: (league: League | null) => void
  loadLeagues: () => Promise<void>
  refreshLeague: () => Promise<void>
  updateLeague: (updatedLeague: League) => Promise<void>
}

const LeagueContext = createContext<LeagueContextType | null>(null)

interface LeagueProviderProps {
  children: ReactNode
  userId: string | null
}

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children, userId }) => {
  const [currentLeague, setCurrentLeague] = useState<League | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadLeagues()
    } else {
      // Clear data when user logs out
      setCurrentLeague(null)
      setLeagues([])
      setIsLoading(false)
    }
  }, [userId])

  const loadLeagues = async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      console.log('🏆 Loading user leagues...')
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/leagues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const userLeagues = data.leagues || []
        setLeagues(userLeagues)
        
        console.log(`🏆 Loaded ${userLeagues.length} leagues`)
        
        // If no current league is selected and user has leagues, select the first one
        if (!currentLeague && userLeagues.length > 0) {
          const defaultLeague = userLeagues[0]
          setCurrentLeague(defaultLeague)
          
          // Save the selected league in localStorage for persistence
          localStorage.setItem('fantaaiuto_current_league', JSON.stringify(defaultLeague))
          console.log(`🏆 Auto-selected league: ${defaultLeague.name}`)
        }
        // If current league is set, verify it still exists
        else if (currentLeague) {
          const stillExists = userLeagues.find((l: League) => l.id === currentLeague.id)
          if (!stillExists) {
            // Current league no longer exists, select first available or null
            const newLeague = userLeagues.length > 0 ? userLeagues[0] : null
            setCurrentLeague(newLeague)
            
            if (newLeague) {
              localStorage.setItem('fantaaiuto_current_league', JSON.stringify(newLeague))
            } else {
              localStorage.removeItem('fantaaiuto_current_league')
            }
          }
        }
      } else {
        console.error('❌ Failed to load leagues')
        setLeagues([])
      }
    } catch (error) {
      console.error('❌ Error loading leagues:', error)
      setLeagues([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshLeague = async () => {
    if (!currentLeague) return

    try {
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/leagues/${currentLeague.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const updatedLeague = data.league
        setCurrentLeague(updatedLeague)
        localStorage.setItem('fantaaiuto_current_league', JSON.stringify(updatedLeague))
        
        // Also update in leagues list
        setLeagues(prev => prev.map((l: League) => l.id === updatedLeague.id ? updatedLeague : l))
      }
    } catch (error) {
      console.error('❌ Error refreshing league:', error)
    }
  }

  const updateLeague = async (updatedLeague: League) => {
    // Update current league if it's the one being updated
    if (currentLeague?.id === updatedLeague.id) {
      setCurrentLeague(updatedLeague)
      localStorage.setItem('fantaaiuto_current_league', JSON.stringify(updatedLeague))
    }
    
    // Update in leagues list
    setLeagues(prev => prev.map((l: League) => l.id === updatedLeague.id ? updatedLeague : l))
  }

  const handleSetCurrentLeague = (league: League | null) => {
    setCurrentLeague(league)
    
    if (league) {
      localStorage.setItem('fantaaiuto_current_league', JSON.stringify(league))
      console.log(`🏆 Selected league: ${league.name} (${league.gameMode})`)
    } else {
      localStorage.removeItem('fantaaiuto_current_league')
      console.log('🏆 No league selected')
    }
  }

  // Load saved league on component mount
  useEffect(() => {
    const savedLeague = localStorage.getItem('fantaaiuto_current_league')
    if (savedLeague && !currentLeague) {
      try {
        const league = JSON.parse(savedLeague)
        setCurrentLeague(league)
        console.log('🏆 Restored saved league:', league.name)
      } catch (error) {
        console.error('❌ Error parsing saved league:', error)
        localStorage.removeItem('fantaaiuto_current_league')
      }
    }
  }, [])

  const value: LeagueContextType = {
    currentLeague,
    leagues,
    isLoading,
    setCurrentLeague: handleSetCurrentLeague,
    loadLeagues,
    refreshLeague,
    updateLeague
  }

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  )
}

export const useLeague = (): LeagueContextType => {
  const context = useContext(LeagueContext)
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider')
  }
  return context
}

// Helper hook to get current league game mode
export const useGameMode = (): 'Classic' | 'Mantra' => {
  const { currentLeague } = useLeague()
  return currentLeague?.gameMode || 'Mantra'
}