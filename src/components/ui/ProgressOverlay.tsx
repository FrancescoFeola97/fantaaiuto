import React from 'react'

interface ProgressOverlayProps {
  isVisible: boolean
  progress: number // 0-100
  currentStep: string
  processedCount: number
  totalCount: number
  estimatedTimeRemaining?: number // in seconds
  currentBatch?: number
  totalBatches?: number
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  isVisible,
  progress,
  currentStep,
  processedCount,
  totalCount,
  estimatedTimeRemaining,
  currentBatch,
  totalBatches
}) => {
  if (!isVisible) return null

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  const progressPercentage = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Caricamento Excel</h3>
          <p className="text-sm text-gray-500">Importazione dati nel database...</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{processedCount} / {totalCount} giocatori</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Stato attuale:</p>
          <p className="text-sm text-gray-600">{currentStep}</p>
        </div>

        {/* Batch Info */}
        {currentBatch && totalBatches && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Progresso batch:</p>
            <p className="text-sm text-gray-600">
              Batch {currentBatch} di {totalBatches}
            </p>
          </div>
        )}

        {/* Time Estimation */}
        {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Tempo stimato rimanente:</p>
            <p className="text-sm text-gray-600">{formatTime(estimatedTimeRemaining)}</p>
          </div>
        )}

        {/* Processing Speed */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {processedCount > 0 && (window as any).importStartTime && (
              <>Velocità: ~{Math.round(processedCount / Math.max((Date.now() - (window as any).importStartTime) / 1000, 1))} giocatori/sec</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}