export interface PlayerData {
  id: string
  nome: string
  squadra: string
  ruoli: string[]
  fvm: number
  prezzo: number
  status: 'available' | 'owned' | 'removed'
  interessante: boolean
  rimosso?: boolean
  costoReale?: number
  note?: string
  tier?: string
  createdAt?: string
  updatedAt?: string
}

export interface PlayerFilters {
  search?: string
  role?: string
  status?: string
  tier?: string
  minFvm?: number
  maxFvm?: number
  interessante?: boolean
}

export interface AppData {
  players: PlayerData[]
  budget: {
    total: number
    remaining: number
  }
  formations: Formation[]
  participants: Participant[]
  settings: AppSettings
}

export interface Formation {
  id: string
  nome: string
  schema: string // "3-4-3", "3-5-2", etc.
  giocatori: string[] // player IDs
  isDefault?: boolean
  createdAt: string
}

export interface Participant {
  id: string
  nome: string
  squadra: string
  budget: number
  giocatori: string[]
}

export interface AppSettings {
  theme: 'light' | 'dark'
  notifications: boolean
  autoSave: boolean
  language: 'it' | 'en'
}