// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://fantaaiuto-backend.onrender.com',
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
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
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