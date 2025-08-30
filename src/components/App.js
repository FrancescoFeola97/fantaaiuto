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
import { authManager } from '../services/AuthManager.js';
import { apiClient } from '../services/ApiClient.js';
import { DashboardComponent } from './ui/Dashboard.js';
import { TrackerComponent } from './tracker/Tracker.js';
import { FormationComponent } from './formation/Formation.js';
import { AnalyticsComponent } from './ui/Analytics.js';
import { RoleNavigationComponent } from './ui/RoleNavigation.js';
import { ActionsPanelComponent } from './ui/ActionsPanel.js';
import { LoginForm } from './auth/LoginForm.js';

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
      
      // Initialize authentication first
      console.log('🔐 Initializing authentication...');
      
      let isAuthenticated = false;
      try {
        isAuthenticated = await authManager.init();
      } catch (authError) {
        console.warn('⚠️ Authentication failed, proceeding with offline mode:', authError);
        isAuthenticated = false;
      }
      
      if (!isAuthenticated) {
        // Backend is not available or user not authenticated - proceed with offline mode
        console.log('🔌 Starting in offline mode');
      }
      
      // Initialize app (either authenticated online or offline mode)
      console.log('✅ Initializing app...');
      await this.initializeServices();
      await this.initializeComponents();
      await this.loadUserData();
      this.setupEventListeners();
      this.setupAuthEventListeners();
      this.hideLoadingScreen();
      this.isInitialized = true;
      
      if (isAuthenticated) {
        const user = authManager.getUser();
        this.services.notifications.show('success', 'Benvenuto!', `Ciao ${user.displayName}! FantaAiuto è pronto.`);
      } else {
        this.services.notifications.show('info', 'Modalità Offline', 'FantaAiuto è stato caricato in modalità offline.');
      }
    } catch (error) {
      this.services.notifications?.show('error', 'Errore', 'Errore durante l\'inizializzazione dell\'applicazione');
      console.error('App initialization error:', error);
      this.hideLoadingScreen();
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
      console.log('🔧 Storage available:', this.services.storage.isAvailable);
      console.log('🔧 Current hostname:', window.location.hostname);
      
      const savedData = await this.services.storage.load();
      if (savedData) {
        console.log('📊 Found saved data - Players:', savedData.players ? savedData.players.length : 0);
        
        // Validate saved data integrity
        if (!savedData.players || !Array.isArray(savedData.players)) {
          console.warn('⚠️ Invalid players data in storage, initializing empty array');
          savedData.players = [];
        }
        
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
    // Most sidebar action buttons are handled by ActionsPanel
    // Only keeping Excel import here as it's a core app function
    const loadExcelBtn = document.getElementById('loadExcelBtn');
    if (loadExcelBtn) {
      loadExcelBtn.addEventListener('click', () => this.handleExcelImport());
    }

    // Other sidebar buttons (reset, owned players, etc.) are handled by ActionsPanel

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
    
    // Modal closed event - reset filters to show all players
    document.addEventListener('fantaaiuto:modalClosed', (e) => {
      const modalId = e.detail.modalId;
      // Reset filters when closing modal views to prevent players from staying filtered
      const modalsToReset = [
        'owned-players-modal', 
        'interesting-players-modal', 
        'removed-players-modal',
        'participants-modal',
        'formation-modal'
      ];
      
      if (modalsToReset.includes(modalId)) {
        this.resetFiltersToDefault();
      }
    });
  }

  setupAuthEventListeners() {
    // Handle user logout
    document.addEventListener('fantaaiuto:userLoggedOut', () => {
      this.handleUserLogout();
    });

    // Handle session expired
    document.addEventListener('fantaaiuto:sessionExpired', (e) => {
      this.services.notifications.show('warning', 'Sessione Scaduta', 
        'La tua sessione è scaduta. Effettua di nuovo il login.');
      this.showLoginForm();
    });

    // Handle successful login from login form
    document.addEventListener('fantaaiuto:authFormLoginSuccess', (e) => {
      this.handleUserLogin(e.detail.user);
    });
  }

  async handleUserLogin(user) {
    console.log('🔐 User logged in, initializing app for:', user.displayName);
    
    this.showLoadingScreen();
    
    try {
      // Reinitialize services and components for the authenticated user
      await this.initializeServices();
      await this.initializeComponents();
      await this.loadUserData();
      
      this.hideLoadingScreen();
      this.hideLoginForm();
      this.showMainApp();
      
      this.services.notifications.show('success', 'Benvenuto!', 
        `Ciao ${user.displayName}! FantaAiuto è pronto.`);
        
    } catch (error) {
      console.error('❌ Error initializing app after login:', error);
      this.services.notifications.show('error', 'Errore', 
        'Errore durante l\'inizializzazione dell\'applicazione');
      this.hideLoadingScreen();
    }
  }

  handleUserLogout() {
    console.log('🚪 User logged out, showing login form');
    
    // Clear app data
    this.appData.players = [];
    this.appData.participants = [];
    this.appData.formations = [];
    
    // Clear components
    Object.values(this.components).forEach(component => {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    this.components = {};
    
    this.hideMainApp();
    this.showLoginForm();
  }

  showLoginForm() {
    let loginContainer = document.getElementById('login-container');
    
    if (!loginContainer) {
      // Create login container if it doesn't exist
      loginContainer = document.createElement('div');
      loginContainer.id = 'login-container';
      loginContainer.className = 'login-container';
      document.body.appendChild(loginContainer);
    }

    // Hide main app
    this.hideMainApp();

    // Initialize and show login form
    this.loginForm = new LoginForm('#login-container', {
      showRegister: true,
      redirectOnLogin: false
    });
    
    this.loginForm.render();
    loginContainer.style.display = 'flex';
  }

  hideLoginForm() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
      loginContainer.style.display = 'none';
    }
    
    if (this.loginForm) {
      this.loginForm.destroy();
      this.loginForm = null;
    }
  }

  showMainApp() {
    const appContainer = document.getElementById('app-container') || document.querySelector('.container');
    if (appContainer) {
      appContainer.style.display = 'block';
    }
  }

  hideMainApp() {
    const appContainer = document.getElementById('app-container') || document.querySelector('.container');
    if (appContainer) {
      appContainer.style.display = 'none';
    }
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

    // Save every 30 seconds as backup and verify data integrity
    setInterval(() => {
      if (this.appData.players && this.appData.players.length > 0) {
        console.log('⏰ Auto-save triggered - Players count:', this.appData.players.length);
        this.saveData();
      }
      
      // Check for data integrity issues
      this.checkDataIntegrity();
    }, 30000);
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

  resetFiltersToDefault() {
    if (this.components.tracker) {
      this.components.tracker.currentFilters = {
        search: '',
        role: 'all',
        status: 'all',
        tier: null
      };
      this.components.tracker.updatePlayersList();
      
      // Reset UI elements
      const searchInput = document.getElementById('mainSearchInput');
      const roleFilter = document.getElementById('mainRoleFilter');
      const interestFilter = document.getElementById('interestFilter');
      
      if (searchInput) searchInput.value = '';
      if (roleFilter) roleFilter.value = 'all';
      if (interestFilter) {
        interestFilter.classList.remove('active');
        interestFilter.setAttribute('aria-pressed', 'false');
      }
    }
  }



  // resetData is now handled by ActionsPanel.resetAll() which provides better UX with modal confirmation

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
    const availablePlayers = this.appData.players.filter(p => !p.rimosso);
    if (availablePlayersCountEl) availablePlayersCountEl.textContent = availablePlayers.length;

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
      
      // Add validation before saving
      if (!this.appData.players) {
        this.appData.players = [];
      }
      if (!this.appData.participants) {
        this.appData.participants = [];
      }
      
      await this.services.storage.save(this.appData);
      
      // Enhanced debug info for production and development
      const storageInfo = await this.services.storage.getStorageInfo();
      console.log('📝 Dati salvati con successo:', {
        players: this.appData.players?.length || 0,
        participants: this.appData.participants?.length || 0,
        storage: storageInfo.sizeFormatted,
        timestamp: new Date().toLocaleTimeString(),
        hostname: window.location.hostname,
        storageAvailable: this.services.storage.isAvailable
      });
      
      // Verify save by immediately loading
      const verifyData = await this.services.storage.load();
      if (!verifyData || verifyData.players?.length !== this.appData.players?.length) {
        console.error('⚠️ Save verification failed - data mismatch!');
        this.services.notifications.show('warning', 'Attenzione', 'Potrebbero esserci problemi nel salvataggio dati');
      }
      
    } catch (error) {
      console.error('❌ Error saving data:', error);
      if (error.message === 'Storage quota exceeded') {
        this.services.notifications.show('error', 'Errore', 'Spazio di archiviazione esaurito. Eliminare alcuni dati per continuare.');
      } else {
        this.services.notifications.show('error', 'Errore', 'Impossibile salvare i dati: ' + error.message);
      }
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

  checkDataIntegrity() {
    try {
      const currentPlayersCount = this.appData.players?.length || 0;
      const availablePlayersEl = document.getElementById('availablePlayersCount');
      const displayedCount = availablePlayersEl ? parseInt(availablePlayersEl.textContent) : 0;
      
      if (currentPlayersCount !== displayedCount && currentPlayersCount > 0) {
        console.warn('🔍 Data integrity issue detected:', {
          actualPlayers: currentPlayersCount,
          displayedCount: displayedCount,
          timestamp: new Date().toLocaleTimeString()
        });
        
        // Force update the display
        this.updateDashboardStats();
      }
      
      // Check localStorage persistence
      if (this.services.storage.isAvailable) {
        const storageData = localStorage.getItem('fantaaiuto_v2');
        if (!storageData && currentPlayersCount > 0) {
          console.error('🚨 Critical: Players in memory but not in localStorage!');
          this.services.notifications.show('warning', 'Problema di Persistenza', 
            'I dati potrebbero non essere salvati correttamente. Prova a esportare un backup.');
        }
      }
      
    } catch (error) {
      console.error('❌ Error in data integrity check:', error);
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