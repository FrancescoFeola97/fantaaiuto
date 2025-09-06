import React from 'react'
import { useAppSettings } from './Settings'

interface SearchFiltersProps {
  searchQuery: string
  roleFilter: string
  interestFilter: boolean
  onSearchChange: (query: string) => void
  onRoleFilterChange: (role: string) => void
  onInterestFilterToggle: () => void
  onClearFilters: () => void
  isSearching?: boolean
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  roleFilter,
  interestFilter,
  onSearchChange,
  onRoleFilterChange,
  onInterestFilterToggle,
  onClearFilters,
  isSearching = false
}) => {
  const settings = useAppSettings()

  const getMantraRoleOptions = () => [
    { value: 'all', label: 'Tutti i ruoli' },
    { value: 'Por', label: '🥅 Portieri' },
    { value: 'Ds', label: '🛡️ Dif. Sx' },
    { value: 'Dd', label: '🛡️ Dif. Dx' },
    { value: 'Dc', label: '🛡️ Dif. Cen.' },
    { value: 'B', label: '🛡️ Braccetto' },
    { value: 'E', label: '⚽ Esterni' },
    { value: 'M', label: '⚽ Mediani' },
    { value: 'C', label: '⚽ Centrocamp.' },
    { value: 'W', label: '💜 Ali' },
    { value: 'T', label: '💜 Trequart.' },
    { value: 'A', label: '🚀 Attaccanti' },
    { value: 'Pc', label: '🚀 Punte Cen.' }
  ]

  const getClassicRoleOptions = () => [
    { value: 'all', label: 'Tutti i ruoli' },
    { value: 'P', label: '🥅 Portieri' },
    { value: 'D', label: '🛡️ Difensori' },
    { value: 'C', label: '⚽ Centrocampisti' },
    { value: 'A', label: '🚀 Attaccanti' }
  ]

  const currentRoleOptions = settings.gameMode === 'Classic' ? getClassicRoleOptions() : getMantraRoleOptions()
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <label htmlFor="mainSearchInput" className="sr-only">Cerca giocatori</label>
          <div className="relative">
            <input 
              type="text" 
              id="mainSearchInput"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Cerca giocatori per cognome..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <span className="text-gray-400">🔍</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {(roleFilter !== 'all' || interestFilter || searchQuery) && (
            <button 
              onClick={onClearFilters}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg border border-blue-300 transition-colors"
            >
              🏠 Home
            </button>
          )}
          
          <button 
            onClick={onInterestFilterToggle}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              interestFilter 
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
          >
            ⭐ Solo Interessanti
          </button>
          
          <select 
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {currentRoleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button 
            onClick={onClearFilters}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg border border-red-300 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  )
}