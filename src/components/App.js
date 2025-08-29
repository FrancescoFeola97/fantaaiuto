import { Utils } from '../utils/Utils.js';
import { StorageManager } from '../services/StorageManager.js';
import { NotificationManager } from '../services/NotificationManager.js';
import { ModalManager } from '../services/ModalManager.js';
import { ExcelManager } from '../services/ExcelManager.js';
import { PlayerManager } from '../services/PlayerManager.js';
import { ViewManager } from '../services/ViewManager.js';
import { FormationManager } from '../services/FormationManager.js';
import { ParticipantsManager } from '../services/ParticipantsManager.js';
import { ImageManager } from '../services/ImageManager.js';
import { DashboardComponent } from './ui/Dashboard.js';
import { TrackerComponent } from './tracker/Tracker.js';
import { FormationComponent } from './formation/Formation.js';
import { AnalyticsComponent } from './ui/Analytics.js';
import { RoleNavigationComponent } from './ui/RoleNavigation.js';
import { ActionsPanelComponent } from './ui/ActionsPanel.js';

export class FantaAiutoApp {
  constructor() {
    this.version = '2.0.0';
    this.appData = {
      players: [],
      formations: [],
      formationImages: [],
      settings: {
        totalBudget: 500,
        maxPlayers: 30,
        roles: { Por: 3, Ds: 2, Dd: 2, Dc: 2, B: 2, E: 2, M: 2, C: 2, W: 2, T: 2, A: 2, Pc: 2 }
      },
      stats: {
        budgetUsed: 0,
        playersOwned: 0,
        roleDistribution: { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 }
      }
    };

    this.services = {};
    this.components = {};
    this.isInitialized = false;
  }

  async init() {
    try {
      this.showLoadingScreen();
      await this.initializeServices();
      await this.initializeComponents();
      await this.loadUserData();
      this.setupEventListeners();
      this.hideLoadingScreen();
      this.isInitialized = true;
      
      this.services.notifications.show('success', 'Benvenuto!', 'FantaAiuto è stato caricato con successo');
    } catch (error) {
      this.services.notifications?.show('error', 'Errore', 'Errore durante l\'inizializzazione dell\'applicazione');
      console.error('App initialization error:', error);
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 500);
    }
  }

  async initializeServices() {
    this.services.storage = new StorageManager('fantaaiuto_v2');
    this.services.notifications = new NotificationManager();
    this.services.modals = new ModalManager();
    this.services.excel = new ExcelManager(this.services.modals);
    this.services.players = new PlayerManager(this.appData);
    this.services.views = new ViewManager();
    this.services.formations = new FormationManager(this.appData);
    this.services.participants = new ParticipantsManager(this.appData);
    this.services.images = new ImageManager(this.services.modals, this.services.notifications);

    await Promise.all([
      this.services.storage.init(),
      this.services.notifications.init(),
      this.services.modals.init(),
      this.services.excel.init(),
      this.services.players.init(),
      this.services.formations.init(),
      this.services.participants.init(),
      this.services.images.init()
    ]);
  }

  async initializeComponents() {
    this.components.dashboard = new DashboardComponent(this.appData, this.services);
    this.components.tracker = new TrackerComponent(this.appData, this.services);
    this.components.formations = new FormationComponent(this.appData, this.services);
    this.components.analytics = new AnalyticsComponent(this.appData, this.services);
    this.components.roleNavigation = new RoleNavigationComponent(this.appData, this.services);
    this.components.actionsPanel = new ActionsPanelComponent(this.appData, this.services);

    await Promise.all([
      this.components.dashboard.init(),
      this.components.tracker.init(),
      this.components.formations.init(),
      this.components.analytics.init(),
      this.components.roleNavigation.init(),
      this.components.actionsPanel.init()
    ]);
  }

  async loadUserData() {
    try {
      console.log('🔄 Loading saved data...');
      const savedData = await this.services.storage.load();
      if (savedData) {
        console.log('📊 Found saved data - Players:', savedData.players ? savedData.players.length : 0);
        
        // Deep merge to preserve existing structure
        const originalPlayersLength = this.appData.players.length;
        this.appData = Utils.deepMerge(this.appData, savedData);
        
        console.log('🔄 After merge - Players in appData:', this.appData.players.length);
        console.log('📈 Original players:', originalPlayersLength, '-> New players:', this.appData.players.length);
        
        // Restore formation images if available
        if (savedData.formationImages && Array.isArray(savedData.formationImages)) {
          this.services.images.importImages(savedData.formationImages);
        }
        
        this.updateAllComponents();
        
        // Show notification with loaded data info
        const playerCount = this.appData.players ? this.appData.players.length : 0;
        const participantCount = this.appData.participants ? this.appData.participants.length : 0;
        
        console.log('✅ Final counts - Players:', playerCount, 'Participants:', participantCount);
        
        if (playerCount > 0 || participantCount > 0) {
          setTimeout(() => {
            this.services.notifications.show('success', 'Dati Caricati', 
              `Dati salvati caricati: ${playerCount} giocatori, ${participantCount} partecipanti`);
          }, 1000); // Delay to show after loading screen
        }
      } else {
        console.log('ℹ️ No saved data found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      this.services.notifications.show('warning', 'Attenzione', 
        'Errore nel caricamento dei dati salvati. Iniziando con dati vuoti.');
    }
  }

  setupEventListeners() {
    this.setupNavigationListeners();
    this.setupHeaderListeners();
    this.setupKeyboardShortcuts();
    this.setupDataChangeListeners();
    this.setupBeforeUnloadSave();
  }

  setupNavigationListeners() {
    // No navigation buttons in simplified interface
  }

  setupHeaderListeners() {
    // Setup sidebar action buttons
    const loadExcelBtn = document.getElementById('loadExcelBtn');
    if (loadExcelBtn) {
      loadExcelBtn.addEventListener('click', () => this.handleExcelImport());
    }

    const formationImageBtn = document.getElementById('formationImageBtn');
    if (formationImageBtn) {
      formationImageBtn.addEventListener('click', () => this.showFormationImageModal());
    }

    const ownedPlayersBtn = document.getElementById('ownedPlayersBtn');
    if (ownedPlayersBtn) {
      ownedPlayersBtn.addEventListener('click', () => this.showOwnedPlayers());
    }

    const formationBtn = document.getElementById('formationBtn');
    if (formationBtn) {
      formationBtn.addEventListener('click', () => this.showFormationModal());
    }

    const participantsBtn = document.getElementById('participantsBtn');
    if (participantsBtn) {
      participantsBtn.addEventListener('click', () => this.showParticipantsModal());
    }

    const showRemovedButton = document.getElementById('showRemovedButton');
    if (showRemovedButton) {
      showRemovedButton.addEventListener('click', () => this.showRemovedPlayers());
    }

    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.resetData());
    }

    // Setup search and filter controls
    const mainSearchInput = document.getElementById('mainSearchInput');
    if (mainSearchInput) {
      mainSearchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    const mainSearchClear = document.getElementById('mainSearchClear');
    if (mainSearchClear) {
      mainSearchClear.addEventListener('click', () => this.clearMainSearch());
    }

    const interestFilter = document.getElementById('interestFilter');
    if (interestFilter) {
      interestFilter.addEventListener('click', () => this.toggleInterestFilter());
    }

    const mainRoleFilter = document.getElementById('mainRoleFilter');
    if (mainRoleFilter) {
      mainRoleFilter.addEventListener('change', (e) => this.handleMainRoleFilter(e.target.value));
    }

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', () => this.scrollToTop());
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.switchView('dashboard');
            break;
          case '2':
            e.preventDefault();
            this.switchView('tracker');
            break;
          case '3':
            e.preventDefault();
            this.switchView('formations');
            break;
          case '4':
            e.preventDefault();
            this.switchView('analytics');
            break;
          case 'i':
            e.preventDefault();
            this.handleExcelImport();
            break;
        }
      }
    });
  }

  setupDataChangeListeners() {
    document.addEventListener('fantaaiuto:dataChange', (e) => {
      this.handleDataChange(e.detail);
    });

    document.addEventListener('fantaaiuto:playerUpdate', (e) => {
      this.handlePlayerUpdate(e.detail);
    });

    document.addEventListener('fantaaiuto:formationUpdate', (e) => {
      this.handleFormationUpdate(e.detail);
    });

    document.addEventListener('fantaaiuto:imageUploaded', (e) => {
      this.handleImageUpload(e.detail);
    });

    document.addEventListener('fantaaiuto:imageDeleted', (e) => {
      this.handleImageDelete(e.detail);
    });

    // Participants events
    document.addEventListener('fantaaiuto:participantAdded', (e) => {
      this.handleParticipantChange(e.detail);
    });

    document.addEventListener('fantaaiuto:participantRemoved', (e) => {
      this.handleParticipantChange(e.detail);
    });

    document.addEventListener('fantaaiuto:participantUpdated', (e) => {
      this.handleParticipantChange(e.detail);
    });

    document.addEventListener('fantaaiuto:playerAssignedToParticipant', (e) => {
      this.handleParticipantChange(e.detail);
    });

    document.addEventListener('fantaaiuto:playerRemovedFromParticipant', (e) => {
      this.handleParticipantChange(e.detail);
    });

    // Players events
    document.addEventListener('fantaaiuto:playersImported', (e) => {
      this.handlePlayersChange(e.detail);
    });

    document.addEventListener('fantaaiuto:playerStatusChanged', (e) => {
      this.handlePlayersChange(e.detail);
    });

    document.addEventListener('fantaaiuto:playerRestored', (e) => {
      this.handlePlayersChange(e.detail);
    });

    // Player updated event (when status changes, etc.)
    document.addEventListener('fantaaiuto:playerUpdated', (e) => {
      this.handlePlayersChange(e.detail);
    });

    // Data reset event
    document.addEventListener('fantaaiuto:dataReset', () => {
      this.saveData();
    });
  }

  // Removed view switching - single page interface

  async handleExcelImport() {
    try {
      const file = await this.services.excel.selectFileWithModal();
      if (!file) return;

      this.services.notifications.show('info', 'Importazione', 'Caricamento file Excel in corso...');
      
      const result = await this.services.excel.importPlayers(file);
      if (!result) return;

      const { players, mode } = result;
      
      // Process players based on selected mode (like original)
      let processedCount = 0;
      switch(mode) {
        case "1":
          processedCount = await this.services.players.importPlayersWithFVMDistribution(players);
          this.services.notifications.show('success', 'Importazione completata', 
            `Caricati ${processedCount} giocatori con distribuzione automatica! 🎯`);
          break;
        case "2":
          processedCount = await this.services.players.importPlayersWithFVMDistributionAndRemoval(players);
          this.services.notifications.show('success', 'Importazione completata', 
            `Caricati ${processedCount} giocatori con distribuzione automatica e FVM=1 rimossi! 🎯🗑️`);
          break;
        case "3":
          processedCount = await this.services.players.importPlayersToNonInseriti(players);
          this.services.notifications.show('success', 'Importazione completata', 
            `Caricati ${processedCount} giocatori! Tutti in "Non inseriti" 📝`);
          break;
        case "4":
          processedCount = await this.services.players.importPlayersToNonInseritiWithRemoval(players);
          this.services.notifications.show('success', 'Importazione completata', 
            `Caricati ${processedCount} giocatori in "Non inseriti" e FVM=1 rimossi! 📝🗑️`);
          break;
        default:
          processedCount = await this.services.players.importPlayers(players);
          this.services.notifications.show('success', 'Importazione completata', 
            `Importati ${processedCount} giocatori`);
      }
      
      console.log('📊 Excel imported - Players in appData:', this.appData.players.length);
      
      this.updateAllComponents();
      await this.saveData();
      
      console.log('💾 Data saved after Excel import');
      
      // Update tracker component to show loaded players
      if (this.components.tracker) {
        this.components.tracker.update();
        console.log('🔄 Tracker updated after Excel import');
      }
      
    } catch (error) {
      if (error.message !== 'Operazione annullata') {
        this.services.notifications.show('error', 'Errore importazione', 
          error.message || 'Errore durante l\'importazione del file Excel');
        console.error('Excel import error:', error);
      }
    }
  }

  showSettings() {
    console.log('Settings modal - TODO');
  }

  handleDataChange(data) {
    Utils.deepMerge(this.appData, data);
    this.updateStats();
    this.saveData();
  }

  handlePlayerUpdate(playerData) {
    this.services.players.updatePlayer(playerData);
    this.updateStats();
    this.updateAllComponents();
    this.saveData();
  }

  handleFormationUpdate(formationData) {
    this.services.formations.updateFormation(formationData);
    this.updateAllComponents();
    this.saveData();
  }

  handleImageUpload(data) {
    this.appData.formationImages = this.services.images.getImages();
    this.saveData();
    this.services.notifications.show('success', 'Immagine', 'Immagine caricata e salvata!');
  }

  handleImageDelete(data) {
    this.appData.formationImages = this.services.images.getImages();
    this.saveData();
  }

  handleParticipantChange(data) {
    // Update stats if needed
    this.updateStats();
    this.updateAllComponents();
    this.saveData();
  }

  handlePlayersChange(data) {
    // Update stats and components
    this.updateStats();
    this.updateAllComponents();
    this.saveData();
  }

  setupBeforeUnloadSave() {
    // Save data when user closes the window/tab
    window.addEventListener('beforeunload', (e) => {
      // Synchronous save for immediate execution
      try {
        if (this.appData.players && this.appData.players.length > 0) {
          console.log('🚪 Saving before unload - Players:', this.appData.players.length);
          localStorage.setItem('fantaaiuto_v2', JSON.stringify({
            version: '2.0.0',
            timestamp: Date.now(),
            data: this.appData
          }));
        }
      } catch (error) {
        console.error('❌ Error saving before unload:', error);
      }
    });

    // Also save on visibility change (mobile/tablet behavior)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveData();
      }
    });

    // Save every 30 seconds as backup (only if we have data)
    setInterval(() => {
      if (this.appData.players && this.appData.players.length > 0) {
        console.log('⏰ Auto-save triggered - Players count:', this.appData.players.length);
        this.saveData();
      }
    }, 30000);
  }

  showFormationImageModal() {
    this.services.images.showFormationImageModal();
  }

  handleSearch(query) {
    if (this.components.tracker) {
      this.components.tracker.currentFilters.search = query;
      this.components.tracker.updatePlayersList();
    }
  }

  clearMainSearch() {
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    const roleFilter = document.getElementById('mainRoleFilter');
    if (roleFilter) {
      roleFilter.value = 'all';
    }
    
    const interestFilter = document.getElementById('interestFilter');
    if (interestFilter) {
      interestFilter.classList.remove('active');
      interestFilter.setAttribute('aria-pressed', 'false');
    }
    
    this.handleSearch('');
    this.handleMainRoleFilter('all');
  }

  handleMainRoleFilter(role) {
    if (this.components.tracker) {
      this.components.tracker.currentFilters.role = role;
      this.components.tracker.updatePlayersList();
    }
  }

  toggleInterestFilter() {
    const filterBtn = document.getElementById('interestFilter');
    if (filterBtn) {
      const isActive = filterBtn.getAttribute('aria-pressed') === 'true';
      filterBtn.setAttribute('aria-pressed', !isActive);
      filterBtn.classList.toggle('active', !isActive);
      
      if (this.components.tracker) {
        this.components.tracker.currentFilters.status = !isActive ? 'interesting' : 'all';
        this.components.tracker.updatePlayersList();
      }
    }
  }

  showOwnedPlayers() {
    if (this.components.tracker) {
      this.components.tracker.currentFilters.status = 'owned';
      this.components.tracker.updatePlayersList();
    }
  }

  showFormationModal() {
    this.services.notifications.show('info', 'Formazioni', 'Gestione formazioni in sviluppo');
  }

  showParticipantsModal() {
    this.services.notifications.show('info', 'Partecipanti', 'Gestione partecipanti in sviluppo');
  }

  showRemovedPlayers() {
    if (this.components.tracker) {
      this.components.tracker.currentFilters.status = 'removed';
      this.components.tracker.updatePlayersList();
    }
  }

  resetData() {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
      this.appData.players = [];
      this.appData.formations = [];
      this.appData.formationImages = [];
      this.services.storage.clear();
      this.updateAllComponents();
      this.services.notifications.show('info', 'Reset', 'Tutti i dati sono stati cancellati');
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateStats() {
    const stats = this.services.players.getStats();
    this.appData.stats = stats;
  }

  updateAllComponents() {
    // Update main stats in dashboard
    this.updateStats();
    this.updateDashboardStats();
    
    Object.values(this.components).forEach(component => {
      if (typeof component.update === 'function') {
        component.update();
      }
    });
  }

  updateDashboardStats() {
    const totalCreditsEl = document.getElementById('totalCredits');
    const remainingCreditsEl = document.getElementById('remainingCredits');
    const playerCountEl = document.getElementById('playerCount');
    const availablePlayersCountEl = document.getElementById('availablePlayersCount');

    if (totalCreditsEl) totalCreditsEl.textContent = this.appData.settings.totalBudget;
    if (remainingCreditsEl) remainingCreditsEl.textContent = this.appData.stats.budgetRemaining || this.appData.settings.totalBudget;
    if (playerCountEl) playerCountEl.textContent = `${this.appData.stats.playersOwned || 0}/${this.appData.settings.maxPlayers}`;
    if (availablePlayersCountEl) availablePlayersCountEl.textContent = this.appData.players.length;

    this.updateRoleCounts();
  }

  updateRoleCounts() {
    const playerCountsEl = document.getElementById('playerCounts');
    if (!playerCountsEl) return;

    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    playerCountsEl.innerHTML = '';

    roles.forEach(role => {
      const count = this.appData.stats.roleDistribution ? this.appData.stats.roleDistribution[role] || 0 : 0;
      const roleEl = document.createElement('div');
      roleEl.className = 'role-count-item';
      roleEl.innerHTML = `
        <div class="role-count-label">${role}</div>
        <div class="role-count-value">${count}</div>
      `;
      playerCountsEl.appendChild(roleEl);
    });
  }

  async saveData() {
    try {
      console.log('💾 Saving data - Players:', this.appData.players?.length || 0, 'Participants:', this.appData.participants?.length || 0);
      
      await this.services.storage.save(this.appData);
      
      // Debug info for development
      if (window.location.hostname === 'localhost') {
        const storageInfo = await this.services.storage.getStorageInfo();
        console.log('📝 Dati salvati con successo:', {
          players: this.appData.players?.length || 0,
          participants: this.appData.participants?.length || 0,
          storage: storageInfo.sizeFormatted,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('❌ Error saving data:', error);
      this.services.notifications.show('error', 'Errore', 'Impossibile salvare i dati');
    }
  }

  exportData(format = 'json') {
    try {
      const data = {
        version: this.version,
        exportDate: new Date().toISOString(),
        appData: this.appData
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        Utils.downloadFile(blob, `fantaaiuto_backup_${Utils.formatDate(new Date())}.json`);
      }

      this.services.notifications.show('success', 'Esportazione', 'Dati esportati con successo');
    } catch (error) {
      this.services.notifications.show('error', 'Errore', 'Errore durante l\'esportazione');
      console.error('Export error:', error);
    }
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.version && data.appData) {
        this.appData = Utils.deepMerge(this.appData, data.appData);
        this.updateAllComponents();
        await this.saveData();
        
        this.services.notifications.show('success', 'Importazione', 'Dati importati con successo');
      } else {
        throw new Error('File di backup non valido');
      }
    } catch (error) {
      this.services.notifications.show('error', 'Errore', 'File di backup non valido');
      console.error('Import error:', error);
    }
  }

  getAppInfo() {
    return {
      version: this.version,
      initialized: this.isInitialized,
      playersCount: this.appData.players.length,
      formationsCount: this.appData.formations.length,
      budgetUsed: this.appData.stats.budgetUsed,
      playersOwned: this.appData.stats.playersOwned
    };
  }
}

window.FantaAiutoApp = FantaAiutoApp;