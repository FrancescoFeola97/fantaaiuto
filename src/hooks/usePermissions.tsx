import React from 'react'
import { useLeague } from '../contexts/LeagueContext'
import { useNotifications } from './useNotifications'

export interface PermissionConfig {
  requiresLeague?: boolean
  requiresMaster?: boolean
  requiresAuth?: boolean
  customCheck?: () => boolean
}

export const usePermissions = () => {
  const { currentLeague } = useLeague()
  const { error } = useNotifications()

  // Check if user is authenticated (has token)
  const isAuthenticated = () => {
    return !!localStorage.getItem('fantaaiuto_token')
  }

  // Check if user has a league selected
  const hasLeague = () => {
    return !!currentLeague
  }

  // Check if user is master of current league
  const isMaster = () => {
    if (!currentLeague) return false
    return currentLeague.isOwner || false
  }

  // Check if user is member (any role) of current league
  const isMember = () => {
    if (!currentLeague) return false
    return !!currentLeague // If user has access to the league, they are a member
  }

  // Main permission checker
  const checkPermission = (config: PermissionConfig): boolean => {
    // Check authentication if required
    if (config.requiresAuth && !isAuthenticated()) {
      error('🔒 Devi essere autenticato per questa azione')
      return false
    }

    // Check league selection if required
    if (config.requiresLeague && !hasLeague()) {
      error('🏆 Devi selezionare una lega per questa azione')
      return false
    }

    // Check master permissions if required
    if (config.requiresMaster && !isMaster()) {
      error('👑 Solo il master della lega può eseguire questa azione')
      return false
    }

    // Custom permission check
    if (config.customCheck && !config.customCheck()) {
      error('❌ Non hai i permessi necessari per questa azione')
      return false
    }

    return true
  }

  // Convenience method for common permission combinations
  const canManageLeague = () => {
    return checkPermission({ requiresAuth: true, requiresLeague: true, requiresMaster: true })
  }

  const canViewLeague = () => {
    return checkPermission({ requiresAuth: true, requiresLeague: true })
  }

  const canManageData = () => {
    return checkPermission({ requiresAuth: true, requiresLeague: true })
  }

  // Get user role info
  const getUserRole = () => {
    if (!currentLeague) return null
    return {
      role: currentLeague.isOwner ? 'master' : 'member',
      isMaster: isMaster(),
      isMember: isMember(),
      leagueName: currentLeague.name,
      leagueCode: currentLeague.code
    }
  }

  // Create headers with appropriate permissions
  const createAuthorizedHeaders = () => {
    const token = localStorage.getItem('fantaaiuto_token')
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (currentLeague?.id) {
      headers['x-league-id'] = currentLeague.id.toString()
    }
    
    return headers
  }

  return {
    // Permission checkers
    checkPermission,
    isAuthenticated,
    hasLeague,
    isMaster,
    isMember,
    
    // Convenience methods
    canManageLeague,
    canViewLeague,
    canManageData,
    
    // User info
    getUserRole,
    createAuthorizedHeaders,
    
    // Current state
    currentLeague
  }
}

// Higher-order component for protecting components based on permissions
export const withPermissions = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: PermissionConfig
) => {
  return (props: P) => {
    const { checkPermission } = usePermissions()
    
    if (!checkPermission(config)) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🚫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Negato</h3>
            <p className="text-gray-600">Non hai i permessi necessari per accedere a questa funzionalità.</p>
          </div>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
}