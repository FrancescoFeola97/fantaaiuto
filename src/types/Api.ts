// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Backend Player Data Structure
export interface BackendPlayerData {
  id: string
  master_id?: string
  nome: string
  squadra: string
  ruolo: string
  fvm: number
  prezzo: number
  prezzo_atteso?: number
  costo_reale?: number
  status?: string
  interessante?: boolean
  acquistatore?: string
  note?: string
}

// Backend Participant Data
export interface BackendParticipant {
  id: string
  name: string
  squadra: string
}

// API Error Types
export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Excel Import Row Structure
export interface ExcelRowData {
  Nome?: string | number
  Squadra?: string | number
  R?: string
  RM?: string
  FVM?: string | number
  Prezzo?: string | number
  [key: string]: any
}

// Players API Response
export interface PlayersApiResponse {
  players: BackendPlayerData[]
  leagueId?: string
}

// Participants API Response  
export interface ParticipantsApiResponse {
  participants: BackendParticipant[]
  leagueId?: string
}

// League API Response
export interface LeaguesApiResponse {
  leagues: any[]
}

// Authentication API Response
export interface AuthApiResponse {
  user: {
    id: string
    username: string
    email?: string
  }
  token?: string
}