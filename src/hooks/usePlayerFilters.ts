import { useState, useMemo } from 'react'
import { PlayerData } from '../types/Player'
import { useDebounce } from './useDebounce'
import { useGameMode } from '../contexts/LeagueContext'

export const usePlayerFilters = (players: PlayerData[], getPlayerRoles: (player: PlayerData) => string[]) => {
  const gameMode = useGameMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState(false)
  
  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const filteredPlayers = useMemo(() => players.filter(player => {
    // Exclude removed players from main view
    if (player.status === 'removed') {
      return false
    }

    // Search filter (using debounced query)
    if (debouncedSearchQuery) {
      const search = debouncedSearchQuery.toLowerCase()
      if (!player.nome?.toLowerCase().includes(search) && 
          !player.squadra?.toLowerCase().includes(search)) {
        return false
      }
    }

    // Role filter
    if (roleFilter !== 'all') {
      const playerRoles = getPlayerRoles(player)
      if (!playerRoles || !playerRoles.includes(roleFilter)) {
        return false
      }
    }

    // Team filter
    if (teamFilter !== 'all') {
      if (player.squadra !== teamFilter) {
        return false
      }
    }

    // Interest filter
    if (interestFilter && !player.interessante) {
      return false
    }

    return true
  }).sort((a, b) => {
    // If a role filter is applied, sort primarily by FVM (highest first)
    if (roleFilter !== 'all') {
      return (b.fvm || 0) - (a.fvm || 0)
    }
    
    // For unfiltered view, sort by role first, then FVM
    // Define role priority order based on game mode
    const mantraRoleOrder = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']
    const classicRoleOrder = ['P', 'D', 'C', 'A']
    const roleOrder = gameMode === 'Classic' ? classicRoleOrder : mantraRoleOrder
    
    // Get primary role for sorting (first role in array)
    const roleA = getPlayerRoles(a)?.[0] || (gameMode === 'Classic' ? 'A' : 'A')
    const roleB = getPlayerRoles(b)?.[0] || (gameMode === 'Classic' ? 'A' : 'A')
    
    // First sort by role
    const roleIndexA = roleOrder.indexOf(roleA)
    const roleIndexB = roleOrder.indexOf(roleB)
    
    if (roleIndexA !== roleIndexB) {
      return (roleIndexA === -1 ? 999 : roleIndexA) - (roleIndexB === -1 ? 999 : roleIndexB)
    }
    
    // Then sort by FVM (highest first)
    return (b.fvm || 0) - (a.fvm || 0)
  }), [players, debouncedSearchQuery, roleFilter, teamFilter, interestFilter, gameMode, getPlayerRoles])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role)
  }

  const handleTeamFilterChange = (team: string) => {
    setTeamFilter(team)
  }

  const handleInterestFilterToggle = () => {
    setInterestFilter(!interestFilter)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setTeamFilter('all')
    setInterestFilter(false)
  }

  return {
    searchQuery,
    roleFilter,
    teamFilter,
    interestFilter,
    filteredPlayers,
    handleSearchChange,
    handleRoleFilterChange,
    handleTeamFilterChange,
    handleInterestFilterToggle,
    handleClearFilters
  }
}