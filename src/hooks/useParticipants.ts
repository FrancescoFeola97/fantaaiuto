import { useState, useEffect, useCallback } from 'react'
import { useLeague } from '../contexts/LeagueContext'
import { useAbortController } from './useAbortController'
import { checkRateLimit, activateGlobalRateLimit } from '../utils/rateLimitManager'

interface Participant {
  id: string
  name: string
  squadra: string
}

export const useParticipants = () => {
  const { currentLeague } = useLeague()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { createController, cleanup, clearTimer } = useAbortController()

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

  const loadParticipants = useCallback(async () => {
    // Controlla rate limiting globale prima di tutto
    if (!checkRateLimit('participants loading')) {
      return
    }

    // Evita chiamate multiple simultanee usando una ref invece della dipendenza isLoading
    if (isLoading) {
      console.log('⚠️ Load participants already in progress, skipping...')
      return
    }
    
    try {
      if (!currentLeague) {
        console.log('📊 No league selected, skipping participants load')
        setParticipants([])
        return
      }

      setIsLoading(true)
      console.log('📊 Loading participants for league', currentLeague.id)

      // Create new controller for this request (cancels previous ones)
      const controller = createController(30000) // 30 second timeout
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
        headers: createApiHeaders(),
        signal: controller.signal
      })
      
      // Clear timeout on successful response
      clearTimer()
      
      if (response.ok) {
        const data = await response.json()
        
        // Verify we're still on the same league (prevent race conditions)
        if (data.leagueId && currentLeague && currentLeague.id.toString() !== data.leagueId.toString()) {
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
      } else if (response.status === 403) {
        console.warn('⚠️ Access denied to participants - user may not be league member')
        setParticipants([])
      } else if (response.status === 429) {
        console.warn('⚠️ Rate limited - activating global protection')
        // Attiva rate limiting globale per 3 minuti
        activateGlobalRateLimit(3 * 60 * 1000)
        // Non impostare participants vuoti per rate limiting, mantieni i dati esistenti
      } else {
        console.error(`❌ Failed to load participants: ${response.status} ${response.statusText}`)
        setParticipants([])
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Participants request cancelled (league changed or timeout)')
      } else {
        console.error('❌ Error loading participants:', error)
      }
      // Don't set participants to empty on abort - keep previous data
      if (error.name !== 'AbortError') {
        setParticipants([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentLeague, createApiHeaders, createController, clearTimer])

  // Load participants when league changes
  useEffect(() => {
    if (currentLeague) {
      // Longer delay to avoid rapid successive calls and reduce API load
      const loadTimer = setTimeout(() => {
        loadParticipants()
      }, 500)
      
      // Listen for participants updates with debouncing e rate limiting check
      let updateTimeout: NodeJS.Timeout
      const handleParticipantsUpdate = () => {
        // Controlla rate limiting prima di programmare update
        if (!checkRateLimit('participants update event')) {
          return
        }
        clearTimeout(updateTimeout)
        updateTimeout = setTimeout(() => {
          // Doppio controllo al momento dell'esecuzione
          if (checkRateLimit('participants update execution')) {
            loadParticipants()
          }
        }, 300)
      }
      
      window.addEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
      
      return () => {
        clearTimeout(loadTimer)
        clearTimeout(updateTimeout)
        window.removeEventListener('fantaaiuto_participants_updated', handleParticipantsUpdate)
        // Clean up any pending requests when league changes
        cleanup()
      }
    } else {
      setParticipants([])
      cleanup() // Clean up requests when no league is selected
    }
  }, [currentLeague?.id, cleanup]) // Rimuovere loadParticipants dalle dipendenze per evitare loop infinito

  return {
    participants,
    setParticipants,
    loadParticipants,
    isLoading
  }
}