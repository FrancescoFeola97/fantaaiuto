import React from 'react'
import { Sidebar } from './dashboard/Sidebar'
import { MobileHeader } from './dashboard/MobileHeader'
import { DesktopNavigation } from './dashboard/DesktopNavigation'
import { MainContent } from './dashboard/MainContent'
import { ProgressOverlay } from './ui/ProgressOverlay'
import { usePlayerData } from '../hooks/usePlayerData'
import { useParticipants } from '../hooks/useParticipants'
import { usePlayerFilters } from '../hooks/usePlayerFilters'
import { useExcelImport } from '../hooks/useExcelImport'
import { useNavigation } from '../hooks/useNavigation'
import { useNotifications } from '../hooks/useNotifications'

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
  
  // Custom hooks for different responsibilities
  const {
    players,
    isLoading,
    loadUserData,
    updatePlayer,
    getPlayerRoles
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
  } = useExcelImport(() => ({}), loadUserData)
  
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

      {/* Right Sidebar Actions */}
      <Sidebar 
        onImportExcel={importPlayersFromExcel}
        playersCount={players.length}
        isImporting={isImporting}
        onShowOwnedPlayers={handleShowOwnedPlayers}
        onShowFormations={handleShowFormations}
        onShowParticipants={handleShowParticipants}
        onShowRemovedPlayers={handleShowRemovedPlayers}
        onShowSettings={handleShowSettings}
        onShowLeagueManagement={handleShowLeagueManagement}
        onShowLeagueSelector={handleShowLeagueSelector}
        onShowDataImport={handleShowDataImport}
      />

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