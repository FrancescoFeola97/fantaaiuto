import React, { useRef } from 'react'
import { useLeague } from '../../contexts/LeagueContext'

interface MobileHeaderProps {
  user: {
    username: string
  }
  onLogout: () => void
  onError: (message: string) => void
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ user, onLogout, onError }) => {
  const { currentLeague } = useLeague()
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="md:hidden bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.username}</p>
            {currentLeague && (
              <p className="text-xs text-gray-500">{currentLeague.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            ref={mobileFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onError('📱 Per caricare file Excel su mobile, usa un dispositivo desktop o ruota in modalità landscape.')
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => mobileFileInputRef.current?.click()}
            className="px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 text-sm"
          >
            📋 Excel
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  )
}