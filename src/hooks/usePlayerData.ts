import { useState, useEffect, useCallback } from 'react'
import { PlayerData } from '../types/Player'
import { BackendPlayerData } from '../types/Api'
import { useLeague, useGameMode } from '../contexts/LeagueContext'
import { useNotifications } from './useNotifications'

export const usePlayerData = () => {
  const { currentLeague } = useLeague()
  const gameMode = useGameMode()
  const { error } = useNotifications()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to create headers with league ID
  const createApiHeaders = useCallback(() => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (currentLeague?.id) {
      headers['x-league-id'] = currentLeague.id.toString()
    }
    
    return headers
  }, [currentLeague?.id])

  // Get player roles based on current game mode
  const getPlayerRoles = useCallback((player: PlayerData): string[] => {
    if (gameMode === 'Classic') {
      return player.ruoliClassic?.length ? player.ruoliClassic : player.ruoli
    } else {
      return player.ruoliMantra?.length ? player.ruoliMantra : player.ruoli
    }
  }, [gameMode])

  const loadUserData = useCallback(async () => {
    try {
      console.log('🔄 Loading players from backend database...')
      
      if (!currentLeague) {
        console.log('📊 No league selected, skipping player load')
        setPlayers([])
        setIsLoading(false)
        return
      }

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
        if (data.leagueId && currentLeague && currentLeague.id.toString() !== data.leagueId.toString()) {
          console.log('⚠️ League changed during data load, discarding stale data')
          setIsLoading(false)
          return
        }
        
        console.log(`📊 Backend returned ${data.players?.length || 0} players for league ${currentLeague.id}`)
        
        if (data.players && data.players.length > 0) {
          const mappedPlayers = data.players.map((p: BackendPlayerData) => {
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
  }, [currentLeague, createApiHeaders])

  const updatePlayer = useCallback(async (playerId: string, updates: Partial<PlayerData>) => {
    try {
      if (!currentLeague) {
        console.log('📊 No league selected, skipping player update')
        return
      }

      console.log(`🔄 Updating player ${playerId} in league ${currentLeague.id}:`, updates)

      // Find the current player to get existing values
      const currentPlayer = players.find(p => p.id === playerId)
      if (!currentPlayer) {
        console.error('❌ Player not found in current state:', playerId)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      const updateData = {
        // Always include current status to avoid validation errors
        status: updates.status || currentPlayer.status || 'available',
        costoReale: updates.prezzoEffettivo || updates.costoReale,
        note: updates.note || null,
        prezzoAtteso: updates.prezzoAtteso,
        acquistatore: updates.acquistatore,
        interessante: updates.interessante
      }

      const response = await fetch(`https://fantaaiuto-backend.onrender.com/api/players/${playerId}/status`, {
        method: 'PATCH',
        headers: createApiHeaders(),
        body: JSON.stringify(updateData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const updatedPlayer = await response.json()
        console.log('✅ Player updated successfully:', updatedPlayer)
        
        // Update local state with server response
        setPlayers(prevPlayers => 
          prevPlayers.map(p => 
            p.id === playerId 
              ? { ...p, ...updates, ...updatedPlayer } 
              : p
          )
        )
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to update player:', response.status, errorData)
        error(`❌ Errore aggiornamento giocatore: ${errorData.message || 'Errore server'}`)
      }
    } catch (err) {
      console.error('❌ Failed to sync player update with backend:', err)
      error('❌ Errore di connessione durante l\'aggiornamento')
    }
  }, [players, currentLeague, createApiHeaders, error])

  // Load data when league changes
  useEffect(() => {
    if (currentLeague) {
      console.log(`🔄 League changed to: ${currentLeague.name} (${currentLeague.id}) - Reloading all data`)
      setPlayers([])
      setIsLoading(true)
      
      const loadTimer = setTimeout(() => {
        loadUserData()
      }, 100)
      
      return () => clearTimeout(loadTimer)
    } else {
      console.log('🔄 No league selected - Clearing all data')
      setPlayers([])
      setIsLoading(false)
    }
  }, [currentLeague?.id, loadUserData])

  return {
    players,
    setPlayers,
    isLoading,
    setIsLoading,
    loadUserData,
    updatePlayer,
    getPlayerRoles,
    createApiHeaders
  }
}