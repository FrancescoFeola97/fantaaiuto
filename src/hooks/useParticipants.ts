import { useState, useEffect, useCallback } from 'react'
import { useLeague } from '../contexts/LeagueContext'

interface Participant {
  id: string
  name: string
  squadra: string
}

export const useParticipants = () => {
  const { currentLeague } = useLeague()
  const [participants, setParticipants] = useState<Participant[]>([])

  const createApiHeaders = useCallback(() => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (currentLeague?.id) {
      headers['x-league-id'] = currentLeague.id.toString()
      console.log('🔍 Participants API Headers:', { leagueId: currentLeague.id, hasToken: !!token })
    } else {
      console.warn('⚠️ Participants: No current league available for API call')
    }
    
    return headers
  }, [currentLeague?.id])

  const loadParticipants = useCallback(async () => {
    try {
      if (!currentLeague) {
        console.log('📊 No league selected, skipping participants load')
        setParticipants([])
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/participants', {
        headers: createApiHeaders(),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
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
      }
    } catch (error) {
      console.error('❌ Failed to load participants:', error)
    }
  }, [currentLeague, createApiHeaders])

  // Load participants when league changes
  useEffect(() => {
    if (currentLeague) {
      const loadTimer = setTimeout(() => {
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
      setParticipants([])
    }
  }, [currentLeague?.id, loadParticipants])

  return {
    participants,
    setParticipants,
    loadParticipants
  }
}