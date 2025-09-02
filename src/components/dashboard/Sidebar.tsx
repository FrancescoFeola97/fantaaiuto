import React, { useRef } from 'react'
import { PlayerData } from '../../types/Player'
import * as XLSX from 'xlsx'

interface SidebarProps {
  onImportExcel: (players: PlayerData[]) => void
  playersCount: number
  onShowOwnedPlayers: () => void
  onShowFormations: () => void
  onShowParticipants: () => void
  onShowFormationImages: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onImportExcel, 
  playersCount, 
  onShowOwnedPlayers, 
  onShowFormations, 
  onShowParticipants, 
  onShowFormationImages 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      console.log('📋 Processing Excel file:', file.name)
      
      // Validate file type
      if (!file.name.match(/\.(xlsx?|csv)$/i)) {
        throw new Error('Formato file non supportato. Usa .xlsx, .xls o .csv')
      }
      
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      
      // Use 'Tutti' sheet if available, otherwise first sheet
      const sheetName = workbook.SheetNames.includes('Tutti') ? 'Tutti' : workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Skip header rows and get data starting from row 3 (skip title and headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        range: 2, // Skip first two rows (title + headers)
        header: ['Id', 'R', 'RM', 'Nome', 'Squadra', 'QtA', 'QtI', 'Diff', 'QtAM', 'QtIM', 'DiffM', 'FVM', 'FVMM']
      })

      if (!jsonData || jsonData.length === 0) {
        throw new Error('File Excel vuoto o formato non valido')
      }

      console.log('📋 Sample Excel row:', jsonData[0])

      const players: PlayerData[] = jsonData.map((row: any, index) => ({
        id: `player_${Date.now()}_${index}`,
        nome: row.Nome?.toString().trim() || '',
        squadra: row.Squadra?.toString().trim() || '',
        ruoli: parseRoles(row.RM || row.R || ''), // Use RM (detailed role) or R (basic role)
        fvm: parseFloat(row.FVM || '0') || 0,
        prezzo: parseFloat(row.QtA || '0') || 0, // Qt.A = prezzo attuale
        status: 'available' as const,
        interessante: false,
        createdAt: new Date().toISOString()
      })).filter(p => p.nome.trim().length > 0 && p.nome !== 'Nome')

      if (players.length === 0) {
        throw new Error('Nessun giocatore valido trovato. Verifica le colonne (Nome, Squadra, Ruoli, FVM, Prezzo)')
      }

      console.log(`✅ Imported ${players.length} players from Excel`)
      onImportExcel(players)
      
      // Show success message
      alert(`✅ Importati ${players.length} giocatori con successo!`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('❌ Error processing Excel file:', error)
      alert(`❌ Errore: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const parseRoles = (roleStr: string): string[] => {
    if (!roleStr) return []
    
    const roleString = roleStr.toString().trim()
    if (!roleString) return ['A'] // Default fallback
    
    // Handle multiple roles separated by semicolon
    const roles = roleString.split(';').map(r => r.trim()).filter(r => r.length > 0)
    
    // Map each role and flatten the results
    const mappedRoles: string[] = []
    
    roles.forEach(role => {
      // Direct role mapping
      const roleMapping: Record<string, string[]> = {
        'P': ['Por'],
        'Por': ['Por'],
        'D': ['Ds', 'Dd', 'Dc'],
        'B': ['B'], // Braccetto di difesa
        'Ds': ['Ds'],
        'Dd': ['Dd'], 
        'Dc': ['Dc'],
        'E': ['E'], // Esterno
        'C': ['C'],
        'M': ['M'],
        'W': ['W'], // Wing
        'T': ['T'], // Trequartista
        'A': ['A'],
        'Pc': ['Pc'] // Prima Punta Centrale
      }
      
      const mapped = roleMapping[role] || [role]
      mappedRoles.push(...mapped)
    })
    
    // Remove duplicates and return
    return [...new Set(mappedRoles)].filter(r => r.length > 0) || ['A']
  }

  const handleResetData = () => {
    if (confirm('⚠️ Sei sicuro di voler cancellare tutti i dati? Questa azione è irreversibile.')) {
      localStorage.clear()
      location.reload()
    }
  }

  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex-shrink-0 hidden xl:block">
      {/* Management Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Gestione</h3>
        <div className="space-y-2">
          <button 
            onClick={onShowOwnedPlayers}
            className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors text-left">
            📊 Giocatori Presi
          </button>
          
          <button 
            onClick={onShowFormations}
            className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors text-left">
            ⚽ Formazioni
          </button>
          
          <button 
            onClick={onShowParticipants}
            className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors text-left">
            👥 Altri Partecipanti
          </button>
        </div>
      </div>
      
      {/* Tools Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Strumenti</h3>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full px-4 py-3 rounded-lg border transition-colors text-left ${
              isUploading 
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}
          >
            {isUploading ? '⏳ Caricamento...' : '📋 Carica Excel'}
          </button>
          
          <button 
            onClick={onShowFormationImages}
            className="w-full px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors text-left">
            📸 Immagini Formazioni
          </button>
          
          <button 
            onClick={handleResetData}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors text-left"
          >
            🔄 Reset Dati
          </button>
        </div>
        
        {playersCount > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              {playersCount} giocatori caricati
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}