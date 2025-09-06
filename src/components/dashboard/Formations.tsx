import React, { useState, useEffect } from 'react'
import { PlayerData } from '../../types/Player'
import { Formation, FORMATIONS, Lineup } from '../../types/Formation'

interface FormationsProps {
  players: PlayerData[]
  onBackToPlayers: () => void
}

export const Formations: React.FC<FormationsProps> = ({ players, onBackToPlayers }) => {
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
  const [lineup, setLineup] = useState<Lineup>({ formationId: '', starters: [], bench: [] })
  const [error, setError] = useState('')
  const [showFormationSelector, setShowFormationSelector] = useState(true)

  const ownedPlayers = players.filter(p => p.status === 'owned')

  useEffect(() => {
    loadSavedLineup()
  }, [])

  const loadSavedLineup = () => {
    try {
      const saved = localStorage.getItem('fantaaiuto_lineup')
      if (saved) {
        const savedLineup: Lineup = JSON.parse(saved)
        setLineup(savedLineup)
        const formation = FORMATIONS.find(f => f.id === savedLineup.formationId)
        if (formation) {
          setSelectedFormation(formation)
          setShowFormationSelector(false)
        }
      }
    } catch (error) {
      console.error('Error loading saved lineup:', error)
    }
  }

  const saveLineup = (newLineup: Lineup) => {
    try {
      localStorage.setItem('fantaaiuto_lineup', JSON.stringify(newLineup))
      setLineup(newLineup)
    } catch (error) {
      console.error('Error saving lineup:', error)
    }
  }

  const handleFormationSelect = (formation: Formation) => {
    setSelectedFormation(formation)
    const newLineup: Lineup = {
      formationId: formation.id,
      starters: [],
      bench: []
    }
    saveLineup(newLineup)
    setShowFormationSelector(false)
  }

  const handlePositionAssign = (positionId: string, playerId: string) => {
    const player = ownedPlayers.find(p => p.id === playerId)
    const position = selectedFormation?.positions.find(p => p.id === positionId)
    
    if (!player || !position) return

    // Check if player role is compatible with position
    const playerRoles = player.ruoli || []
    const isCompatible = position.allowedRoles.some(role => playerRoles.includes(role))
    
    if (!isCompatible) {
      setError(`${player.nome} non può giocare in posizione ${position.name}. Ruoli richiesti: ${position.allowedRoles.join('/')}`)
      return
    }

    setError('')
    
    // Remove player from current position if already assigned
    const currentStarters = lineup.starters.filter(s => s.playerId !== playerId)
    const currentBench = lineup.bench.filter(id => id !== playerId)
    
    // Remove any player currently in this position
    const finalStarters = currentStarters.filter(s => s.positionId !== positionId)
    
    // Add new assignment
    finalStarters.push({ positionId, playerId })
    
    const newLineup: Lineup = {
      ...lineup,
      starters: finalStarters,
      bench: currentBench
    }
    
    saveLineup(newLineup)
  }

  const handleBenchToggle = (playerId: string) => {
    const isOnBench = lineup.bench.includes(playerId)
    const isStarter = lineup.starters.some(s => s.playerId === playerId)
    
    if (isOnBench) {
      // Remove from bench
      const newLineup: Lineup = {
        ...lineup,
        bench: lineup.bench.filter(id => id !== playerId)
      }
      saveLineup(newLineup)
    } else if (!isStarter && lineup.bench.length < 19) {
      // Add to bench
      const newLineup: Lineup = {
        ...lineup,
        bench: [...lineup.bench, playerId]
      }
      saveLineup(newLineup)
    }
  }

  const getPlayerInPosition = (positionId: string): PlayerData | null => {
    const assignment = lineup.starters.find(s => s.positionId === positionId)
    if (!assignment) return null
    return ownedPlayers.find(p => p.id === assignment.playerId) || null
  }

  const getUnassignedPlayers = (): PlayerData[] => {
    const assignedIds = new Set([
      ...lineup.starters.map(s => s.playerId),
      ...lineup.bench
    ])
    return ownedPlayers.filter(p => !assignedIds.has(p.id))
  }

  const resetFormation = () => {
    setSelectedFormation(null)
    setLineup({ formationId: '', starters: [], bench: [] })
    setShowFormationSelector(true)
    localStorage.removeItem('fantaaiuto_lineup')
  }

  if (showFormationSelector) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">⚽ Selezione Modulo</h2>
            <p className="text-sm text-gray-600">Scegli il modulo per la tua formazione</p>
          </div>
          <button
            onClick={onBackToPlayers}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            ← Torna ai Giocatori
          </button>
        </div>

        {/* Players Info */}
        {ownedPlayers.length < 11 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <p className="text-sm text-yellow-700">
              ⚠️ Hai solo {ownedPlayers.length} giocatori. Ne servono almeno 11 per una formazione completa.
            </p>
          </div>
        )}

        {ownedPlayers.length >= 11 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
            <p className="text-sm text-green-700">
              ✅ {ownedPlayers.length} giocatori disponibili per le formazioni
            </p>
          </div>
        )}

        {/* Formation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FORMATIONS.map(formation => (
            <div
              key={formation.id}
              onClick={() => handleFormationSelect(formation)}
              className="border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br from-green-50 to-green-100"
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{formation.displayName}</h3>
                
                {/* Mini Field Preview */}
                <div className="relative bg-green-600 rounded-lg h-32 mb-3 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-green-700"></div>
                  
                  {/* Field lines */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-white/30"></div>
                  <div className="absolute top-2 left-1/2 w-8 h-1 bg-white/30 transform -translate-x-1/2"></div>
                  <div className="absolute bottom-2 left-1/2 w-8 h-1 bg-white/30 transform -translate-x-1/2"></div>
                  
                  {/* Position dots */}
                  {formation.positions.map(position => (
                    <div
                      key={position.id}
                      className="absolute w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`
                      }}
                    />
                  ))}
                </div>
                
                <p className="text-sm text-gray-600">{formation.positions.length} posizioni</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedFormation) return null

  const unassignedPlayers = getUnassignedPlayers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">⚽ Formazione {selectedFormation.displayName}</h2>
            <p className="text-sm text-gray-600">
              {lineup.starters.length}/11 titolari • {lineup.bench.length}/19 in panchina
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={resetFormation}
              className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg border border-yellow-300 transition-colors"
            >
              🔄 Cambia Modulo
            </button>
            <button
              onClick={onBackToPlayers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
            >
              ← Torna ai Giocatori
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Formation Field */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative bg-gradient-to-b from-green-400 to-green-600 rounded-lg h-96 mb-6 overflow-hidden">
          {/* Field markings */}
          <div className="absolute inset-0">
            {/* Center line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/40"></div>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            {/* Goal areas */}
            <div className="absolute top-2 left-1/2 w-20 h-8 border border-white/40 transform -translate-x-1/2"></div>
            <div className="absolute bottom-2 left-1/2 w-20 h-8 border border-white/40 transform -translate-x-1/2"></div>
          </div>

          {/* Positions */}
          {selectedFormation.positions.map(position => {
            const assignedPlayer = getPlayerInPosition(position.id)
            return (
              <div
                key={position.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Position Circle - Always shows role */}
                  <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-blue-500 cursor-pointer hover:scale-110 transition-transform">
                    <span className="text-xs font-bold text-gray-800 text-center leading-none">
                      {position.name}
                    </span>
                  </div>
                  
                  {/* Player Name Rectangle - Only shows if player assigned */}
                  {assignedPlayer && (
                    <div className="mt-1 bg-white/90 rounded px-2 py-1 shadow-md border border-gray-300 min-w-max">
                      <span className="text-xs font-medium text-gray-800 whitespace-nowrap">
                        {assignedPlayer.nome.length > 12 
                          ? `${assignedPlayer.nome.substring(0, 12)}...` 
                          : assignedPlayer.nome}
                      </span>
                    </div>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {assignedPlayer 
                      ? `${assignedPlayer.nome} (${assignedPlayer.ruoli?.join('/')})` 
                      : `${position.name} (${position.allowedRoles.join('/')})`
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Players */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            👥 Giocatori Disponibili ({unassignedPlayers.length})
          </h3>
          
          {unassignedPlayers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">✅</div>
              <p className="text-gray-500">Tutti i giocatori sono stati assegnati</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unassignedPlayers.map(player => (
                <div key={player.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{player.nome}</p>
                      <p className="text-xs text-gray-600">{player.squadra} • {player.ruoli?.join('/')}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      FVM {player.fvm || 0}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {/* Position buttons */}
                    {selectedFormation.positions
                      .filter(pos => pos.allowedRoles.some(role => player.ruoli?.includes(role)))
                      .slice(0, 3)
                      .map(position => (
                        <button
                          key={position.id}
                          onClick={() => handlePositionAssign(position.id, player.id)}
                          className="flex-1 py-1 px-2 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs border border-green-200 transition-colors"
                          disabled={!!getPlayerInPosition(position.id)}
                        >
                          {position.name}
                        </button>
                      ))
                    }
                    
                    {/* Bench button */}
                    <button
                      onClick={() => handleBenchToggle(player.id)}
                      disabled={lineup.bench.length >= 19}
                      className="py-1 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-xs border border-orange-200 transition-colors disabled:opacity-50"
                    >
                      Panchina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bench */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🪑 Panchina ({lineup.bench.length}/19)
          </h3>
          
          {lineup.bench.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-3xl mb-2">🪑</div>
              <p className="text-sm text-gray-500">Nessun giocatore in panchina</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lineup.bench.map(playerId => {
                const player = ownedPlayers.find(p => p.id === playerId)
                if (!player) return null
                
                return (
                  <div key={playerId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{player.nome}</p>
                      <p className="text-xs text-gray-600">{player.ruoli?.join('/')}</p>
                    </div>
                    <button
                      onClick={() => handleBenchToggle(playerId)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}