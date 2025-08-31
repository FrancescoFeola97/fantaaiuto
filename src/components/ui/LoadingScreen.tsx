import React from 'react'

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Caricamento FantaAiuto...</h2>
      </div>
    </div>
  )
}