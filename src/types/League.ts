// League system types for FantaAiuto

export interface League {
  id: string
  name: string
  code: string // Invite code
  ownerId: string
  gameMode: 'Classic' | 'Mantra'
  totalBudget: number
  maxPlayersPerTeam: number
  maxMembers: number
  status: 'active' | 'draft' | 'completed'
  season: string
  description?: string
  createdAt: string
  updatedAt: string
  // Computed fields
  membersCount?: number
  isOwner?: boolean
}

export interface LeagueMember {
  id: string
  leagueId: string
  userId: string
  role: 'master' | 'member'
  teamName?: string
  budgetUsed: number
  playersCount: number
  joinedAt: string
  // Computed fields
  username?: string
  email?: string
}

export interface LeagueInvite {
  code: string
  leagueName: string
  ownerName: string
  gameMode: 'Classic' | 'Mantra'
  membersCount: number
  maxMembers: number
}

export interface CreateLeagueRequest {
  name: string
  gameMode: 'Classic' | 'Mantra'
  totalBudget: number
  maxPlayersPerTeam: number
  maxMembers: number
  description?: string
}

export interface JoinLeagueRequest {
  code: string
  teamName?: string
}

export interface LeagueSettings {
  id: string
  leagueId: string
  userId: string
  totalBudget: number
  maxPlayers: number
  rolesConfig: Record<string, number>
  gameMode: 'Classic' | 'Mantra'
  createdAt: string
  updatedAt: string
}

// Context for current active league
export interface LeagueContext {
  currentLeague: League | null
  userRole: 'master' | 'member' | null
  isLoading: boolean
  setCurrentLeague: (league: League | null) => void
  refreshLeague: () => Promise<void>
}

// Extended player data with league context
export interface LeaguePlayerData {
  id: string
  leagueId: string
  userId: string
  masterPlayerId: string
  // Player base info (from master_players)
  nome: string
  squadra: string
  ruoli: string[]
  ruoliMantra: string[]
  ruoliClassic: string[]
  prezzo: number
  fvm: number
  // League-specific data
  status: 'available' | 'owned' | 'removed' | 'taken_by_other'
  interessante: boolean
  rimosso: boolean
  costoReale: number
  prezzoAtteso: number
  acquistatore?: string
  dataAcquisto?: string
  dataRimozione?: string
  tier?: string
  note?: string
  createdAt: string
  updatedAt: string
}

// League-specific participant
export interface LeagueParticipant {
  id: string
  leagueId: string
  userId: string
  name: string
  budgetUsed: number
  playersCount: number
  createdAt: string
  updatedAt: string
}