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