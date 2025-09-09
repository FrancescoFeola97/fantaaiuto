import { useState } from 'react'

export type ViewType = 'players' | 'owned' | 'formations' | 'participants' | 'removed' | 'settings' | 'data-import' | 'league-management' | 'league-selector'

export const useNavigation = () => {
  const [currentView, setCurrentView] = useState<ViewType>('players')

  const handleBackToPlayers = () => {
    setCurrentView('players')
  }

  const handleShowLeagueSelector = () => {
    setCurrentView('league-selector')
  }

  const handleShowOwnedPlayers = () => {
    setCurrentView('owned')
  }

  const handleShowFormations = () => {
    setCurrentView('formations')
  }

  const handleShowParticipants = () => {
    setCurrentView('participants')
  }

  const handleShowRemovedPlayers = () => {
    setCurrentView('removed')
  }

  const handleShowSettings = () => {
    setCurrentView('settings')
  }

  const handleShowLeagueManagement = () => {
    setCurrentView('league-management')
  }

  const handleShowDataImport = () => {
    setCurrentView('data-import')
  }

  return {
    currentView,
    setCurrentView,
    handleBackToPlayers,
    handleShowLeagueSelector,
    handleShowOwnedPlayers,
    handleShowFormations,
    handleShowParticipants,
    handleShowRemovedPlayers,
    handleShowSettings,
    handleShowLeagueManagement,
    handleShowDataImport
  }
}