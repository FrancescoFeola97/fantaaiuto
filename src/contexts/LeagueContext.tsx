import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
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
  const isLoadingLeagues = useRef(false)

  const loadLeagues = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    if (isLoadingLeagues.current) {
      console.log('⚠️ League loading already in progress, skipping...')
      return
    }

    isLoadingLeagues.current = true

    const controller = new AbortController()
    let timeoutId: NodeJS.Timeout | null = null

    try {
      setIsLoading(true)
      const token = localStorage.getItem('fantaaiuto_token')
      if (!token) return

      
      timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for leagues
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/leagues', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })
      
      if (timeoutId) clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const userLeagues = data.leagues || []
        setLeagues(userLeagues)
        
        
        // Only auto-select if no saved league exists and no current league
        if (!currentLeague && userLeagues.length > 0 && !localStorage.getItem('fantaaiuto_current_league')) {
          const defaultLeague = userLeagues[0]
          setCurrentLeague(defaultLeague)
          localStorage.setItem('fantaaiuto_current_league', JSON.stringify(defaultLeague))
        }
        // If current league is set, verify it still exists in the loaded leagues
        else if (currentLeague) {
          const stillExists = userLeagues.find((l: League) => l.id === currentLeague.id)
          if (!stillExists) {
            // Current league no longer exists, clear it
            setCurrentLeague(null)
            localStorage.removeItem('fantaaiuto_current_league')
          }
        }
      } else {
        console.error('❌ Failed to load leagues')
        setLeagues([])
      }
    } catch (error: any) {
      console.error('❌ Error loading leagues:', error)
      if (error.name === 'AbortError') {
        console.error('❌ Leagues request timed out')
      }
      setLeagues([])
      if (timeoutId) clearTimeout(timeoutId)
    } finally {
      setIsLoading(false)
      isLoadingLeagues.current = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [userId, currentLeague])

  useEffect(() => {
    if (userId) {
      // Clear any previous user's league data first
      const savedLeague = localStorage.getItem('fantaaiuto_current_league')
      if (savedLeague) {
        // Always clear saved league data when switching users to prevent cross-user contamination
        localStorage.removeItem('fantaaiuto_current_league')
        setCurrentLeague(null)
      }
      loadLeagues()
    } else {
      // Clear data when user logs out
      setCurrentLeague(null)
      setLeagues([])
      localStorage.removeItem('fantaaiuto_current_league')
      setIsLoading(false)
    }
  }, [userId, loadLeagues])

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
    } else {
      localStorage.removeItem('fantaaiuto_current_league')
    }
  }

  // Note: We no longer load saved league on mount since we clear it when user changes
  // This prevents league data from persisting across different users

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