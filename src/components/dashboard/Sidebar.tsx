import React, { useRef } from 'react'
import { PlayerData } from '../../types/Player'
import * as XLSX from 'xlsx'

interface SidebarProps {
  onImportExcel: (players: PlayerData[]) => void
  playersCount: number
}

export const Sidebar: React.FC<SidebarProps> = ({ onImportExcel, playersCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      console.log('📋 Processing Excel file:', file.name)
      
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const players: PlayerData[] = jsonData.map((row: any, index) => ({
        id: `player_${Date.now()}_${index}`,
        nome: row.Nome || row.nome || '',
        squadra: row.Squadra || row.squadra || '',
        ruoli: parseRoles(row.Ruoli || row.ruoli || row.Ruolo || row.ruolo || ''),
        fvm: parseFloat(row.FVM || row.fvm || '0') || 0,
        prezzo: parseFloat(row.Prezzo || row.prezzo || '0') || 0,
        status: 'available' as const,
        interessante: false,
        createdAt: new Date().toISOString()
      })).filter(p => p.nome.trim().length > 0)

      console.log(`✅ Imported ${players.length} players from Excel`)
      onImportExcel(players)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('❌ Error processing Excel file:', error)
      alert('Errore durante l\'importazione del file Excel. Verifica il formato.')
    }
  }

  const parseRoles = (roleStr: string): string[] => {
    if (!roleStr) return []
    return roleStr
      .toString()
      .split(/[,;\/]/)
      .map(r => r.trim())
      .filter(r => ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'].includes(r))
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
          <button className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors text-left">
            📊 Giocatori Presi
          </button>
          
          <button className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors text-left">
            ⚽ Formazioni
          </button>
          
          <button className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors text-left">
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
            className="w-full px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 transition-colors text-left"
          >
            📋 Carica Excel
          </button>
          
          <button className="w-full px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors text-left">
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