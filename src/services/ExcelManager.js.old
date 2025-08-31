import { Utils } from '../utils/Utils.js';

export class ExcelManager {
  constructor(modalManager = null) {
    this.XLSX = null;
    this.modalManager = modalManager;
  }

  async init() {
    if (typeof XLSX !== 'undefined') {
      this.XLSX = XLSX;
      return true;
    }
    throw new Error('XLSX library not loaded');
  }

  async selectFileWithModal() {
    if (!this.modalManager) {
      return this.selectFile();
    }

    return new Promise((resolve) => {
      const content = Utils.createElement('div');
      
      const fileInputContainer = Utils.createElement('div');
      fileInputContainer.style.cssText = `
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        border: 2px dashed var(--color-gray-300);
        border-radius: var(--border-radius-lg);
        text-align: center;
      `;

      const fileInput = Utils.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.xlsx,.xls';
      fileInput.id = 'excel-file-input';
      fileInput.style.cssText = `
        margin-bottom: var(--space-3);
      `;

      const fileLabel = Utils.createElement('label', '', 'Seleziona file Excel (.xlsx, .xls)');
      fileLabel.setAttribute('for', 'excel-file-input');
      fileLabel.style.cssText = `
        display: block;
        margin-bottom: var(--space-3);
        font-weight: var(--font-weight-medium);
        color: var(--color-gray-700);
      `;

      const fileInfo = Utils.createElement('p', '', 'Il file deve contenere almeno le colonne Nome e Ruolo');
      fileInfo.style.cssText = `
        font-size: var(--font-size-sm);
        color: var(--color-gray-500);
      `;

      fileInputContainer.appendChild(fileLabel);
      fileInputContainer.appendChild(fileInput);
      fileInputContainer.appendChild(fileInfo);

      const actions = Utils.createElement('div');
      actions.style.cssText = `
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      `;

      const cancelBtn = Utils.createElement('button', 'btn btn-secondary', 'Annulla');
      const loadBtn = Utils.createElement('button', 'btn btn-primary', 'Carica File');

      cancelBtn.addEventListener('click', () => {
        this.modalManager.hide('excel-import-modal');
        resolve(null);
      });

      loadBtn.addEventListener('click', () => {
        const file = fileInput.files?.[0];
        if (!file) {
          alert('Seleziona un file prima di procedere');
          return;
        }
        this.modalManager.hide('excel-import-modal');
        resolve(file);
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(loadBtn);

      content.appendChild(fileInputContainer);
      content.appendChild(actions);

      this.modalManager.show('excel-import-modal', '📋 Carica Listone Excel', content);
    });
  }

  async selectFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        resolve(file || null);
      });

      input.click();
    });
  }

  async showLoadingModeDialog() {
    if (!this.modalManager) {
      // Fallback to prompt if no modal manager
      const choice = prompt(
        "🎯 Scegli la modalità di caricamento:\n\n" +
        "1️⃣ Compilazione automatica basata su FVM\n" +
        "2️⃣ Compilazione automatica + rimuovi giocatori FVM=1\n" +
        "3️⃣ Tutti i giocatori in 'Non inseriti'\n" +
        "4️⃣ Tutti in 'Non inseriti' + rimuovi giocatori FVM=1\n" +
        "5️⃣ Annulla caricamento\n\n" +
        "Inserisci il numero della tua scelta:"
      );
      return choice === "5" ? null : choice;
    }

    const choices = [
      { text: "1️⃣ Compilazione automatica basata su FVM", value: "1" },
      { text: "2️⃣ Compilazione automatica + rimuovi giocatori FVM=1", value: "2" },
      { text: "3️⃣ Tutti i giocatori in 'Non inseriti'", value: "3" },
      { text: "4️⃣ Tutti in 'Non inseriti' + rimuovi giocatori FVM=1", value: "4" }
    ];

    return await this.modalManager.select(
      '🎯 Modalità di Caricamento',
      'Scegli come vuoi caricare i giocatori dal file Excel:',
      choices
    );
  }

  async importPlayers(file) {
    if (!this.XLSX) {
      throw new Error('Excel library not initialized');
    }

    try {
      const data = await Utils.readFile(file);
      const workbook = this.XLSX.read(data, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = this.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Remove header rows like in original
      if (jsonData.length > 0) {
        jsonData.shift(); // Remove first row
      }
      if (jsonData.length > 0) {
        jsonData.shift(); // Remove second row
      }

      // Ask for loading mode
      const mode = await this.showLoadingModeDialog();
      if (!mode) {
        throw new Error('Operazione annullata');
      }

      return {
        players: this.processPlayerData(jsonData),
        mode: mode,
        rawData: jsonData
      };
    } catch (error) {
      throw new Error(`Errore durante l'importazione: ${error.message}`);
    }
  }

  processPlayerData(jsonData) {
    const players = [];
    
    console.log(`Processing ${jsonData.length} rows from Excel file`);
    
    jsonData.forEach((row, index) => {
      try {
        const player = this.mapRowToPlayer(row, index);
        if (player) {
          players.push(player);
        }
      } catch (error) {
        console.warn(`Error processing row ${index + 3}:`, error); // +3 because we removed 2 header rows
      }
    });

    console.log(`Successfully processed ${players.length} players`);
    return players;
  }

  mapRowToPlayer(row, index) {
    // Handle array format from original Excel (like in fantaiutoV2.html)
    if (Array.isArray(row)) {
      if (row.length < 13) {
        // Skip rows that are too short (likely empty or incomplete)
        return null;
      }
      
      const [id, r, rm, nome, squadra, , , , , , , , fvmm] = row;
      
      if (!nome || nome.trim() === '' || !rm || rm.trim() === '') {
        // Skip rows without valid name or role data
        return null;
      }

      const ruoli = rm.split(';').map(role => role.trim()).filter(role => role);
      
      // Validate roles against the expected role list
      const validRoles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
      const filteredRoles = ruoli.filter(role => validRoles.includes(role));
      
      if (filteredRoles.length === 0) {
        console.warn(`Player ${nome} has no valid roles from: ${ruoli.join(', ')}`);
        return null;
      }

      const fvm = parseFloat(fvmm) || 0;

      return {
        id: Utils.generateId(),
        nome: Utils.normalizePlayerName(nome),
        ruoli: filteredRoles,
        squadra: squadra?.trim() || '',
        fvm,
        prezzo: fvm > 1 ? Math.max(1, Math.floor(fvm / 4)) : 1, // Simple price calculation
        status: 'available',
        tier: Utils.getPlayerTier(fvm),
        interessante: false,
        rimosso: false,
        dataAggiunta: new Date().toISOString()
      };
    }

    // Handle object format (fallback for different Excel structures)
    const possibleNameFields = ['Nome', 'NOME', 'nome', 'Player', 'PLAYER', 'player'];
    const possibleRoleFields = ['Ruolo', 'RUOLO', 'ruolo', 'Role', 'ROLE', 'role', 'R', 'Ruoli', 'RM', 'rm'];
    const possibleTeamFields = ['Squadra', 'SQUADRA', 'squadra', 'Team', 'TEAM', 'team', 'Club'];
    const possibleFvmFields = ['FVM', 'fvm', 'Fvm', 'FVMM', 'fvmm', 'Value', 'Valore'];
    const possiblePriceFields = ['Prezzo', 'PREZZO', 'prezzo', 'Price', 'PRICE', 'price', 'Costo'];

    const nome = this.getFieldValue(row, possibleNameFields);
    if (!nome || !Utils.validatePlayerName(nome)) {
      return null;
    }

    const ruoloStr = this.getFieldValue(row, possibleRoleFields) || '';
    const ruoli = Utils.parseRole(ruoloStr);
    if (ruoli.length === 0) {
      console.warn(`Player ${nome} has no valid roles`);
      return null;
    }

    const squadra = this.getFieldValue(row, possibleTeamFields) || '';
    const fvm = parseFloat(this.getFieldValue(row, possibleFvmFields)) || 0;
    const prezzo = parseFloat(this.getFieldValue(row, possiblePriceFields)) || Math.max(1, Math.floor(fvm / 4));

    return {
      id: Utils.generateId(),
      nome: Utils.normalizePlayerName(nome),
      ruoli,
      squadra: squadra.trim(),
      fvm,
      prezzo,
      status: 'available',
      tier: Utils.getPlayerTier(fvm),
      interessante: false,
      rimosso: false,
      dataAggiunta: new Date().toISOString()
    };
  }

  getFieldValue(row, possibleFields) {
    for (const field of possibleFields) {
      if (row.hasOwnProperty(field) && row[field] !== undefined && row[field] !== null) {
        return row[field].toString().trim();
      }
    }
    return null;
  }

  async exportPlayers(players, filename = 'fantaaiuto_players.xlsx') {
    if (!this.XLSX) {
      throw new Error('Excel library not initialized');
    }

    try {
      const exportData = players.map(player => ({
        Nome: player.nome,
        Ruoli: player.ruoli.join('/'),
        Squadra: player.squadra,
        FVM: player.fvm,
        Prezzo: player.prezzo,
        Status: player.status,
        Tier: player.tier,
        Interessante: player.interessante ? 'Sì' : 'No',
        Rimosso: player.rimosso ? 'Sì' : 'No'
      }));

      const worksheet = this.XLSX.utils.json_to_sheet(exportData);
      const workbook = this.XLSX.utils.book_new();
      
      this.XLSX.utils.book_append_sheet(workbook, worksheet, 'Giocatori');

      const excelBuffer = this.XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });

      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      Utils.downloadFile(blob, filename);
      return true;
    } catch (error) {
      throw new Error(`Errore durante l'esportazione: ${error.message}`);
    }
  }

  validateExcelStructure(file) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await Utils.readFile(file);
        const workbook = this.XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('File Excel vuoto'));
          return;
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = this.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(new Error('File deve contenere almeno una riga di dati'));
          return;
        }

        const headers = jsonData[0];
        const requiredFields = ['nome', 'ruolo'];
        const hasRequiredFields = requiredFields.some(field => 
          headers.some(header => 
            header && header.toString().toLowerCase().includes(field)
          )
        );

        if (!hasRequiredFields) {
          reject(new Error('File deve contenere almeno le colonne Nome e Ruolo'));
          return;
        }

        resolve({
          valid: true,
          sheets: workbook.SheetNames,
          headers,
          rowCount: jsonData.length - 1
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}