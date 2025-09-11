// API Configuration with fallback support
const PRODUCTION_BASE_URL = 'https://fantaaiuto-backend.onrender.com'
const LOCAL_BASE_URL = 'http://localhost:3002'

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || PRODUCTION_BASE_URL, // Back to production backend
  FALLBACK_URL: LOCAL_BASE_URL,
  TIMEOUT: {
    AUTH: 30000,        // 30 seconds for authentication (cold start)
    API: 20000,         // 20 seconds for standard API calls
    LEAGUES: 25000,     // 25 seconds for leagues loading
    UPLOAD: 300000,     // 5 minutes for Excel uploads
    PLAYERS: 15000,     // 15 seconds for players
    PARTICIPANTS: 20000, // 20 seconds for participants
  },
  RETRY_ATTEMPTS: 3,
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
  },
  PLAYERS: {
    LIST: '/api/players',
    IMPORT: '/api/players/import',
    UPDATE_STATUS: (id: string) => `/api/players/${id}/status`,
  },
  PARTICIPANTS: {
    LIST: '/api/participants',
    CREATE: '/api/participants',
    UPDATE: (id: string) => `/api/participants/${id}`,
    DELETE: (id: string) => `/api/participants/${id}`,
  },
  FORMATIONS: {
    LIST: '/api/formations',
    CREATE: '/api/formations',
    UPDATE: (id: string) => `/api/formations/${id}`,
    DELETE: (id: string) => `/api/formations/${id}`,
  },
} as const

// Helper function to build full URL
export const buildApiUrl = (endpoint: string, useFallback: boolean = false): string => {
  const baseUrl = useFallback ? API_CONFIG.FALLBACK_URL : API_CONFIG.BASE_URL
  return `${baseUrl}${endpoint}`
}

// Helper function to try API call with fallback
export const fetchWithFallback = async (endpoint: string, options: RequestInit = {}) => {
  // First try production backend
  try {
    const response = await fetch(buildApiUrl(endpoint), options)
    
    // If we get a 503 (service unavailable), try fallback immediately
    if (response.status === 503) {
      console.warn('Production backend is sleeping, trying local fallback...')
      throw new Error('Service temporarily unavailable')
    }
    
    return response
  } catch (error) {
    // If production fails, try local fallback
    console.warn('Production backend failed, trying local fallback:', error)
    
    try {
      return await fetch(buildApiUrl(endpoint, true), options)
    } catch (fallbackError) {
      console.error('Both production and local backends failed:', fallbackError)
      throw fallbackError
    }
  }
}

// HTTP Client configuration
export const createRequestConfig = (options: {
  timeout?: number
  signal?: AbortSignal
} = {}) => {
  const token = localStorage.getItem('fantaaiuto_token')
  
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...(options.signal && { signal: options.signal }),
  }
}