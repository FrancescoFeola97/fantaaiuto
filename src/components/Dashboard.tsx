import React from 'react'
import { MobileHeader } from './dashboard/MobileHeader'
import { DesktopNavigation } from './dashboard/DesktopNavigation'
import { MainContent } from './dashboard/MainContent'
import { PlayerCounts } from './dashboard/PlayerCounts'
import { ProgressOverlay } from './ui/ProgressOverlay'
import { usePlayerData } from '../hooks/usePlayerData'
import { useParticipants } from '../hooks/useParticipants'
import { usePlayerFilters } from '../hooks/usePlayerFilters'
import { useExcelImport } from '../hooks/useExcelImport'
import { useNavigation } from '../hooks/useNavigation'
import { useNotifications } from '../hooks/useNotifications'
import { useLeague } from '../contexts/LeagueContext'

interface DashboardProps {
  user: {
    id: string
    username: string
    email?: string
  }
  onLogout: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { error } = useNotifications()
  const { currentLeague, isLoading: leagueLoading } = useLeague()
  
  // Custom hooks for different responsibilities
  const {
    players,
    isLoading,
    loadUserData,
    updatePlayer,
    getPlayerRoles,
    createApiHeaders
  } = usePlayerData()
  
  const { participants } = useParticipants()
  
  const {
    searchQuery,
    roleFilter,
    interestFilter,
    filteredPlayers,
    handleSearchChange,
    handleRoleFilterChange,
    handleInterestFilterToggle,
    handleClearFilters
  } = usePlayerFilters(players, getPlayerRoles)
  
  const {
    isImporting,
    progressState,
    importPlayersFromExcel
  } = useExcelImport(createApiHeaders, loadUserData)
  
  const {
    currentView,
    handleBackToPlayers,
    handleShowLeagueSelector,
    handleShowOwnedPlayers,
    handleShowFormations,
    handleShowParticipants,
    handleShowRemovedPlayers,
    handleShowSettings,
    handleShowLeagueManagement,
    handleShowDataImport
  } = useNavigation()

  // Navigation items for desktop navigation
  const navigationItems = [
    {
      id: 'players',
      label: 'Giocatori',
      icon: '⚽',
      onClick: handleBackToPlayers
    },
    {
      id: 'owned',
      label: 'Giocatori Presi',
      icon: '✅',
      onClick: handleShowOwnedPlayers
    },
    {
      id: 'formations',
      label: 'Formazioni',
      icon: '📋',
      onClick: handleShowFormations
    },
    {
      id: 'participants',
      label: 'Partecipanti',
      icon: '👥',
      onClick: handleShowParticipants
    },
    {
      id: 'removed',
      label: 'Rimossi',
      icon: '👻',
      onClick: handleShowRemovedPlayers
    },
    {
      id: 'settings',
      label: 'Impostazioni',
      icon: '⚙️',
      onClick: handleShowSettings
    },
    {
      id: 'data-import',
      label: 'Import Dati',
      icon: '📥',
      onClick: handleShowDataImport
    },
    {
      id: 'league-management',
      label: 'Gestione Lega',
      icon: '🏆',
      onClick: handleShowLeagueManagement
    },
    {
      id: 'league-selector',
      label: 'Cambia Lega',
      icon: '🔄',
      onClick: handleShowLeagueSelector
    }
  ]

  const handleDataImported = () => {
    loadUserData()
  }

  // Show league selector if no current league
  if (!leagueLoading && !currentLeague) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile Header */}
        <MobileHeader
          user={user}
          onLogout={onLogout}
          onError={error}
        />
        
        {/* Desktop Navigation */}
        <DesktopNavigation
          user={user}
          currentView="league-selector"
          navigationItems={navigationItems}
          onLogout={onLogout}
          onImportExcel={undefined}
          playersCount={0}
          isImporting={false}
        />

        {/* Main Content - League Selector */}
        <div className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  👋 Benvenuto, {user.username}!
                </h1>
                <p className="text-gray-600 mb-6">
                  Per iniziare, devi creare una nuova lega o unirti a una esistente.
                </p>
                <MainContent
                  currentView="league-selector"
                  players={[]}
                  filteredPlayers={[]}
                  participants={[]}
                  isLoading={false}
                  searchQuery=""
                  roleFilter=""
                  interestFilter={false}
                  onSearchChange={() => {}}
                  onRoleFilterChange={() => {}}
                  onInterestFilterToggle={() => {}}
                  onClearFilters={() => {}}
                  onBackToPlayers={() => {}}
                  onUpdatePlayer={async () => {}}
                  onDataImported={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <MobileHeader
        user={user}
        onLogout={onLogout}
        onError={error}
      />
      
      {/* Desktop Navigation */}
      <DesktopNavigation
        user={user}
        currentView={currentView}
        navigationItems={navigationItems}
        onLogout={onLogout}
        onImportExcel={importPlayersFromExcel}
        playersCount={players.length}
        isImporting={isImporting}
      />

      {/* Main Content */}
      <MainContent
        currentView={currentView}
        players={players}
        filteredPlayers={filteredPlayers}
        participants={participants}
        isLoading={isLoading}
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        interestFilter={interestFilter}
        onSearchChange={handleSearchChange}
        onRoleFilterChange={handleRoleFilterChange}
        onInterestFilterToggle={handleInterestFilterToggle}
        onClearFilters={handleClearFilters}
        onBackToPlayers={handleBackToPlayers}
        onUpdatePlayer={updatePlayer}
        onDataImported={handleDataImported}
      />

      {/* Right Panel - Player Counts (Role Filter) */}
      <aside className="w-64 bg-white border-l border-gray-200 flex-shrink-0 hidden xl:block">
        <div className="p-4">
          <PlayerCounts
            players={players}
            currentRoleFilter={roleFilter}
            onRoleFilterChange={handleRoleFilterChange}
            onBackToPlayers={handleBackToPlayers}
          />
        </div>
      </aside>

      {/* Progress Overlay for Excel Upload */}
      <ProgressOverlay
        isVisible={progressState.isVisible}
        progress={progressState.progress}
        currentStep={progressState.currentStep}
        processedCount={progressState.processedCount}
        totalCount={progressState.totalCount}
        estimatedTimeRemaining={progressState.estimatedTimeRemaining}
        currentBatch={progressState.currentBatch}
        totalBatches={progressState.totalBatches}
      />
    </div>
  )
}