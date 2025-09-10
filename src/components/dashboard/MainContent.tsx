import React from 'react'
import { StatsCards } from './StatsCards'
import { OwnedPlayersOverview } from './OwnedPlayersOverview'
import { SearchFilters } from './SearchFilters'
import { PlayersGrid } from './PlayersGrid'
import { OwnedPlayers } from './OwnedPlayers'
import { Formations } from './Formations'
import { Participants } from './Participants'
import { Settings } from './Settings'
import { DataImport } from './DataImport'
import { LeagueManagement } from '../leagues/LeagueManagement'
import { LeagueSelector } from '../leagues/LeagueSelector'
import { PlayerData } from '../../types/Player'
import { ViewType } from '../../hooks/useNavigation'

interface MainContentProps {
  currentView: ViewType
  players: PlayerData[]
  filteredPlayers: PlayerData[]
  participants: Array<{ id: string; name: string; squadra: string }>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLoading: boolean
  searchQuery: string
  roleFilter: string
  teamFilter: string
  interestFilter: boolean
  onSearchChange: (query: string) => void
  onRoleFilterChange: (role: string) => void
  onTeamFilterChange: (team: string) => void
  onInterestFilterToggle: () => void
  onClearFilters: () => void
  onBackToPlayers: () => void
  onUpdatePlayer: (playerId: string, updates: Partial<PlayerData>) => Promise<void>
  onDataImported?: () => void
}

export const MainContent: React.FC<MainContentProps> = ({
  currentView,
  players,
  filteredPlayers,
  participants: _participants,
  isLoading,
  searchQuery,
  roleFilter,
  teamFilter: _teamFilter,
  interestFilter,
  onSearchChange,
  onRoleFilterChange,
  onTeamFilterChange: _onTeamFilterChange,
  onInterestFilterToggle,
  onClearFilters,
  onBackToPlayers,
  onUpdatePlayer,
  onDataImported
}) => {
  // Render different views based on currentView
  const renderMainContent = () => {
    switch (currentView) {
      case 'owned':
        return (
          <OwnedPlayers 
            players={players}
            onBackToPlayers={onBackToPlayers}
            onUpdatePlayer={onUpdatePlayer}
          />
        )
      case 'formations':
        return <Formations players={players} onBackToPlayers={onBackToPlayers} />
      case 'participants':
        return <Participants players={[]} onBackToPlayers={onBackToPlayers} />
      case 'removed':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">👻 Giocatori Rimossi</h2>
              <button
                onClick={onBackToPlayers}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                ← Torna ai Giocatori
              </button>
            </div>
            <PlayersGrid
              players={players.filter(p => p.status === 'removed')}
              isLoading={isLoading}
              onUpdatePlayer={onUpdatePlayer}
            />
          </div>
        )
      case 'settings':
        return <Settings onBackToPlayers={onBackToPlayers} />
      case 'data-import':
        return (
          <DataImport 
            onBackToPlayers={onBackToPlayers}
            onDataImported={onDataImported}
          />
        )
      case 'league-management':
        return <LeagueManagement onClose={onBackToPlayers} />
      case 'league-selector':
        return <LeagueSelector onLeagueSelect={onBackToPlayers} currentLeague={null} />
      default:
        return (
          <div className="space-y-6">
            <StatsCards players={filteredPlayers} />
            <OwnedPlayersOverview players={players} />
            <SearchFilters
              searchQuery={searchQuery}
              roleFilter={roleFilter}
              teamFilter={_teamFilter}
              interestFilter={interestFilter}
              players={players}
              onSearchChange={onSearchChange}
              onRoleFilterChange={onRoleFilterChange}
              onTeamFilterChange={_onTeamFilterChange}
              onInterestFilterToggle={onInterestFilterToggle}
              onClearFilters={onClearFilters}
            />
            <PlayersGrid
              players={filteredPlayers}
              isLoading={isLoading}
              onUpdatePlayer={onUpdatePlayer}
            />
          </div>
        )
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderMainContent()}
      </div>
    </main>
  )
}