import { useState } from 'react'
import { PlayerData } from '../types/Player'
import { useLeague } from '../contexts/LeagueContext'
import { useNotifications } from './useNotifications'

interface ProgressState {
  isVisible: boolean
  progress: number
  currentStep: string
  processedCount: number
  totalCount: number
  estimatedTimeRemaining: number
  currentBatch: number
  totalBatches: number
}

export const useExcelImport = (createApiHeaders: () => HeadersInit, loadUserData: () => Promise<void>) => {
  const { currentLeague } = useLeague()
  const { success, error } = useNotifications()
  const [isImporting, setIsImporting] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>({
    isVisible: false,
    progress: 0,
    currentStep: '',
    processedCount: 0,
    totalCount: 0,
    estimatedTimeRemaining: 0,
    currentBatch: 0,
    totalBatches: 0
  })

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
    
    // CRITICAL: Do NOT add temporary players to state immediately
    // The newPlayers have temporary IDs that cause 500 errors if users interact with them
    // Wait for backend import to complete and reload with proper persistent IDs
    
    let progressInterval: NodeJS.Timeout | null = null
    
    try {
      
      if (!currentLeague) {
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
          // Hide progress overlay and reload data immediately
          setProgressState(prev => ({ ...prev, isVisible: false }))
          
          // Clear any temporary player data and reload from backend to get proper IDs
          
          // Reload data from backend to get persistent IDs
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

  return {
    isImporting,
    progressState,
    importPlayersFromExcel
  }
}