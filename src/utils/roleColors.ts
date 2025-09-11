import React from 'react'

// Utility for role colors based on game mode
export const getRoleColor = (role: string, gameMode: 'Classic' | 'Mantra') => {
  if (gameMode === 'Classic') {
    // Classic colors
    switch (role) {
      case 'P': return 'bg-orange-200 text-orange-800 border-orange-300'
      case 'D': return 'bg-green-200 text-green-800 border-green-300'
      case 'C': return 'bg-blue-200 text-blue-800 border-blue-300'
      case 'A': return 'bg-red-200 text-red-800 border-red-300'
      default: return 'bg-gray-200 text-gray-800 border-gray-300'
    }
  } else {
    // Mantra colors
    switch (role) {
      case 'Por': return 'bg-orange-200 text-orange-800 border-orange-300'
      case 'Dc': case 'Ds': case 'Dd': case 'B': return 'bg-green-200 text-green-800 border-green-300'
      case 'E': case 'M': case 'C': return 'bg-blue-200 text-blue-800 border-blue-300'
      case 'W': case 'T': return 'bg-purple-200 text-purple-800 border-purple-300'
      case 'A': case 'Pc': return 'bg-red-200 text-red-800 border-red-300'
      default: return 'bg-gray-200 text-gray-800 border-gray-300'
    }
  }
}

// Get background style for position circles in formations
export const getPositionBackgroundStyle = (allowedRoles: string[], gameMode: 'Classic' | 'Mantra'): { backgroundColor?: string; background?: string; className: string } => {
  if (allowedRoles.length === 0) return { className: 'bg-gray-300' }
  
  // Get unique color categories for the allowed roles with more vibrant colors
  const colorMap = (role: string) => {
    if (gameMode === 'Classic') {
      switch (role) {
        case 'P': return '#FF8C00' // Dark orange (mandarino)
        case 'D': return '#32CD32' // Lime green (distinguibile dal campo)
        case 'C': return '#1E90FF' // Dodger blue
        case 'A': return '#DC143C' // Crimson red
        default: return '#9CA3AF' // gray-400
      }
    } else {
      switch (role) {
        // Portieri
        case 'Por': 
          return '#FF8C00' // Dark orange (mandarino)
        
        // Difensori - Verde lime
        case 'Dc': 
        case 'Ds': 
        case 'Dd': 
        case 'B': 
          return '#32CD32'
        
        // Centrocampisti - Blu
        case 'E': 
        case 'M': 
        case 'C': 
          return '#1E90FF'
        
        // Fantasisti - Viola
        case 'W': 
        case 'T': 
          return '#8A2BE2'
        
        // Attaccanti - Rosso
        case 'A': 
        case 'Pc': 
          return '#DC143C'
        
        default: 
          console.warn(`Role '${role}' not mapped to color, using default gray`)
          return '#9CA3AF' // gray-400
      }
    }
  }

  // Map each role to its color (without removing duplicates)
  const roleColors = allowedRoles.map(colorMap)
  
  // Get unique colors to check if we need gradients
  const uniqueColors = [...new Set(roleColors)]

  // Single role OR all roles have same color
  if (allowedRoles.length === 1 || uniqueColors.length === 1) {
    return { backgroundColor: uniqueColors[0], className: '' }
  }

  // Multiple roles with different colors - create vertical split gradient
  if (allowedRoles.length === 2) {
    return { 
      background: `linear-gradient(90deg, ${roleColors[0]} 50%, ${roleColors[1]} 50%)`,
      className: ''
    }
  }

  if (allowedRoles.length === 3) {
    return { 
      background: `linear-gradient(90deg, ${roleColors[0]} 33.33%, ${roleColors[0]} 33.33%, ${roleColors[1]} 33.33%, ${roleColors[1]} 66.66%, ${roleColors[2]} 66.66%, ${roleColors[2]} 100%)`,
      className: ''
    }
  }

  // More than 3 roles, use equal vertical segments
  const segments = roleColors.map((color, index) => {
    const start = (index / roleColors.length) * 100
    const end = ((index + 1) / roleColors.length) * 100
    return `${color} ${start}%, ${color} ${end}%`
  }).join(', ')
  
  return { 
    background: `linear-gradient(90deg, ${segments})`,
    className: ''
  }
}

// Component for role circle
export const RoleCircle: React.FC<{
  role: string
  gameMode: 'Classic' | 'Mantra'
  size?: 'sm' | 'md' | 'lg'
}> = ({ role, gameMode, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm', 
    lg: 'w-8 h-8 text-base'
  }

  const colorClasses = getRoleColor(role, gameMode)
  
  return React.createElement('span', {
    className: `${sizeClasses[size]} flex items-center justify-center rounded-full font-medium border ${colorClasses}`
  }, role)
}