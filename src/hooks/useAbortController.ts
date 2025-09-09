import { useEffect, useRef } from 'react'

/**
 * Hook per gestire AbortController con cleanup automatico
 */
export const useAbortController = () => {
  const controllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const createController = (timeout = 30000) => {
    // Cleanup previous controller
    cleanup()
    
    const controller = new AbortController()
    controllerRef.current = controller
    
    // Set timeout
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        controller.abort()
      }, timeout)
    }
    
    return controller
  }

  const cleanup = () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
      controllerRef.current = null
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])

  return {
    createController,
    cleanup,
    clearTimer,
    get signal() {
      return controllerRef.current?.signal
    }
  }
}