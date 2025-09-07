import React from 'react'
import { PlayerData } from '../../types/Player'
import { useAppSettings } from '../dashboard/Settings'

interface PlayerCardProps {
  player: PlayerData
  onUpdate: (playerId: string, updates: Partial<PlayerData>) => void
  participants?: Array<{ id: string; name: string; squadra: string }>
}

const PlayerCard: React.FC<PlayerCardProps> = React.memo(({ player, onUpdate, participants = [] }) => {
  const settings = useAppSettings()
  const [prezzoAtteso, setPrezzoAtteso] = React.useState(player.prezzoAtteso || player.prezzo || '')
  const [acquistatore, setAcquistatore] = React.useState(player.acquistatore || '')
  const [prezzoEffettivoEdit, setPrezzoEffettivoEdit] = React.useState(player.prezzoEffettivo?.toString() || '')
  const [prezzoEffettivoModal, setPrezzoEffettivoModal] = React.useState('')
  const [isEditingPrezzoAtteso, setIsEditingPrezzoAtteso] = React.useState(false)
  const [isEditingAcquistatore, setIsEditingAcquistatore] = React.useState(false)
  const [isEditingPrezzoEffettivo, setIsEditingPrezzoEffettivo] = React.useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false)
  const [purchaseType, setPurchaseType] = React.useState<'me' | 'other'>('me')

  // Get roles based on current game mode
  const getCurrentRoles = () => {
    if (settings.gameMode === 'Classic') {
      return player.ruoliClassic?.length ? player.ruoliClassic : player.ruoli
    } else {
      return player.ruoliMantra?.length ? player.ruoliMantra : player.ruoli
    }
  }

  const currentRoles = getCurrentRoles()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'owned': return 'bg-green-50 border-green-200'
      case 'taken_by_other': return 'bg-orange-50 border-orange-200'
      case 'removed': return 'bg-red-50 border-red-200 opacity-60'
      default: return 'bg-white border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'owned': return '✅'
      case 'taken_by_other': return '👤'
      case 'removed': return '❌'
      default: return ''
    }
  }

  const handleToggleInterest = () => {
    onUpdate(player.id, { interessante: !player.interessante })
  }

  const handlePrezzoAttesoSave = () => {
    const price = prezzoAtteso === '' ? 0 : Number(prezzoAtteso)
    onUpdate(player.id, { prezzoAtteso: price })
    setIsEditingPrezzoAtteso(false)
  }

  const handlePrezzoAttesoCancel = () => {
    setPrezzoAtteso(player.prezzoAtteso || player.prezzo || '')
    setIsEditingPrezzoAtteso(false)
  }

  const handleAcquistatoreSave = () => {
    onUpdate(player.id, { acquistatore: acquistatore.trim() || undefined })
    setIsEditingAcquistatore(false)
  }

  const handlePrezzoEffettivoSave = () => {
    const price = prezzoEffettivoEdit === '' ? 0 : Number(prezzoEffettivoEdit)
    onUpdate(player.id, { prezzoEffettivo: price, costoReale: price })
    setIsEditingPrezzoEffettivo(false)
  }

  const handlePrezzoEffettivoCancel = () => {
    setPrezzoEffettivoEdit(player.prezzoEffettivo?.toString() || '')
    setIsEditingPrezzoEffettivo(false)
  }

  const handleRemove = () => {
    onUpdate(player.id, { status: 'removed', rimosso: true })
  }

  const handlePurchase = (type: 'me' | 'other') => {
    setPurchaseType(type)
    const initialPrice = Number(prezzoAtteso) || player.prezzo || 0
    setPrezzoEffettivoModal(initialPrice.toString())
    setShowPurchaseModal(true)
  }

  const handleConfirmPurchase = () => {
    const finalPrice = prezzoEffettivoModal === '' ? 0 : Number(prezzoEffettivoModal)
    const updates: Partial<PlayerData> = {
      status: purchaseType === 'me' ? 'owned' : 'taken_by_other',
      prezzoEffettivo: finalPrice,
      costoReale: finalPrice
    }
    
    if (purchaseType === 'me') {
      updates.acquistatore = 'Me'
    } else if (acquistatore.trim()) {
      updates.acquistatore = acquistatore.trim()
    }
    
    onUpdate(player.id, updates)
    setShowPurchaseModal(false)
  }

  const handleMakeAvailable = () => {
    onUpdate(player.id, { 
      status: 'available',
      prezzoEffettivo: undefined,
      costoReale: undefined,
      acquistatore: undefined
    })
  }

  return (
    <>
      <div className={`player-card rounded-lg border p-4 hover:shadow-lg transition-all relative ${getStatusColor(player.status)} ${player.interessante ? 'ring-2 ring-yellow-300' : ''}`}>
        {/* Status Badge */}
        {player.status !== 'available' && (
          <div className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm">
            {getStatusIcon(player.status)}
          </div>
        )}

        {/* Player Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate text-base">{player.nome}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-600">{player.squadra}</p>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                {currentRoles?.join('/') || 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleInterest}
            className={`p-1.5 rounded-full transition-all ${
              player.interessante 
                ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' 
                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
            }`}
            title={player.interessante ? 'Rimuovi interesse' : 'Aggiungi interesse'}
          >
            ⭐
          </button>
        </div>

        {/* Player Stats */}
        <div className="space-y-3 mb-4">
          {/* FVM */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">FVM</span>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {player.fvm || 0}
            </span>
          </div>
          
          {/* Expected Price */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Prezzo Atteso</span>
            {isEditingPrezzoAtteso ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={prezzoAtteso}
                  onChange={(e) => setPrezzoAtteso(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePrezzoAttesoSave()
                    if (e.key === 'Escape') handlePrezzoAttesoCancel()
                  }}
                  autoFocus
                  placeholder="0"
                />
                <button
                  onClick={handlePrezzoAttesoSave}
                  className="text-green-600 hover:text-green-700 text-xs p-1"
                  title="Salva"
                >
                  ✓
                </button>
                <button
                  onClick={handlePrezzoAttesoCancel}
                  className="text-red-600 hover:text-red-700 text-xs p-1"
                  title="Annulla"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingPrezzoAtteso(true)}
                className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors bg-green-50 px-2 py-1 rounded"
                title="Clicca per modificare"
              >
                {formatCurrency(Number(prezzoAtteso) || 0)}
              </button>
            )}
          </div>

          {/* Purchase Info for Owned/Taken Players */}
          {(player.status === 'owned' || player.status === 'taken_by_other') && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Acquistato da</span>
                {isEditingAcquistatore ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={acquistatore}
                      onChange={(e) => setAcquistatore(e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-200"
                      onBlur={handleAcquistatoreSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleAcquistatoreSave()}
                      autoFocus
                      placeholder="Nome"
                    />
                    <button
                      onClick={handleAcquistatoreSave}
                      className="text-green-600 hover:text-green-700 text-xs p-1"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingAcquistatore(true)}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors bg-gray-50 px-2 py-1 rounded"
                  >
                    {acquistatore || (player.status === 'owned' ? 'Me' : 'Altro')}
                  </button>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Prezzo Effettivo</span>
                {isEditingPrezzoEffettivo ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={prezzoEffettivoEdit}
                      onChange={(e) => setPrezzoEffettivoEdit(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePrezzoEffettivoSave()
                        if (e.key === 'Escape') handlePrezzoEffettivoCancel()
                      }}
                      autoFocus
                      placeholder="0"
                    />
                    <button
                      onClick={handlePrezzoEffettivoSave}
                      className="text-green-600 hover:text-green-700 text-xs p-1"
                      title="Salva"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handlePrezzoEffettivoCancel}
                      className="text-red-600 hover:text-red-700 text-xs p-1"
                      title="Annulla"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setPrezzoEffettivoEdit(player.prezzoEffettivo?.toString() || '')
                      setIsEditingPrezzoEffettivo(true)
                    }}
                    className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors bg-purple-50 px-2 py-1 rounded"
                    title="Clicca per modificare"
                  >
                    {formatCurrency(player.prezzoEffettivo || 0)}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {player.status === 'available' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePurchase('me')}
                className="py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded-lg text-sm font-medium transition-colors"
              >
                ✅ Preso
              </button>
              <button
                onClick={() => handlePurchase('other')}
                className="py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded-lg text-sm font-medium transition-colors"
              >
                👤 Altri
              </button>
            </div>
          )}

          {(player.status === 'owned' || player.status === 'taken_by_other') && (
            <button
              onClick={handleMakeAvailable}
              className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Rilascia
            </button>
          )}

          <div className="flex space-x-2">
            {player.status === 'available' && (
              <button
                onClick={handleRemove}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm transition-colors"
                title="Rimuovi giocatore"
              >
                🗑️ Rimuovi
              </button>
            )}
            
            {player.status === 'removed' && (
              <button
                onClick={() => onUpdate(player.id, { status: 'available', rimosso: false })}
                className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 Ripristina
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {purchaseType === 'me' ? '✅ Acquista giocatore' : '👤 Giocatore preso da altri'}
            </h3>
            
            <div className="space-y-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{player.nome}</p>
                <p className="text-sm text-gray-600">{player.squadra} • {currentRoles?.join('/')}</p>
              </div>

              {purchaseType === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Acquistatore
                  </label>
                  {participants && participants.length > 0 ? (
                    <select
                      value={acquistatore}
                      onChange={(e) => setAcquistatore(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Seleziona partecipante...</option>
                      {participants.map((participant) => (
                        <option key={participant.id} value={participant.name}>
                          {participant.name}{participant.squadra ? ` (${participant.squadra})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={acquistatore}
                      onChange={(e) => setAcquistatore(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                      placeholder="Nome partecipante (aggiungi nella sezione 👥 Altri Partecipanti)"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prezzo di acquisto
                </label>
                <input
                  type="text"
                  value={prezzoEffettivoModal}
                  onChange={(e) => setPrezzoEffettivoModal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200"
                  placeholder="Prezzo effettivo"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Conferma
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

PlayerCard.displayName = 'PlayerCard'

export { PlayerCard }