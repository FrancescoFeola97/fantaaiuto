import React from 'react'
import { useLeague } from '../../contexts/LeagueContext'

interface NavigationItem {
  id: string
  label: string
  icon: string
  onClick: () => void
}

interface DesktopNavigationProps {
  user: {
    username: string
  }
  currentView: string
  navigationItems: NavigationItem[]
  onLogout: () => void
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  user,
  currentView,
  navigationItems,
  onLogout
}) => {
  const { currentLeague } = useLeague()

  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.username}</p>
              {currentLeague && (
                <p className="text-sm text-gray-500">{currentLeague.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Logout"
          >
            🚪
          </button>
        </div>
        
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}