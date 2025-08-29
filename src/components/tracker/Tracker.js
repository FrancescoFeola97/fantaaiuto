import { Utils } from '../../utils/Utils.js';
import { PlayerCardComponent } from '../ui/PlayerCard.js';

export class TrackerComponent {
  constructor(appData, services) {
    this.appData = appData;
    this.services = services;
    this.currentFilters = {
      search: '',
      role: 'all',
      status: 'all',
      tier: null
    };
  }

  async init() {
    this.setupElements();
    this.setupEventListeners();
    this.update();
    return Promise.resolve();
  }

  setupElements() {
    this.searchInput = document.getElementById('search-input');
    this.searchClear = document.getElementById('search-clear');
    this.playersGrid = document.getElementById('players-grid');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.roleTabs = document.querySelectorAll('.role-tab');
  }

  setupEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', 
        Utils.debounce(() => this.handleSearchChange(), 300)
      );
    }

    if (this.searchClear) {
      this.searchClear.addEventListener('click', () => this.clearSearch());
    }

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleFilterChange(e));
    });

    this.roleTabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.handleRoleChange(e));
    });

    // Listen for navigation filters
    document.addEventListener('fantaaiuto:navigationFilter', (e) => {
      this.handleNavigationFilter(e.detail);
    });

    // Listen for data changes
    document.addEventListener('fantaaiuto:playersImported', () => {
      this.update();
    });

    document.addEventListener('fantaaiuto:playerUpdated', () => {
      this.updatePlayersList();
    });

    document.addEventListener('fantaaiuto:playerStatusChanged', () => {
      this.updatePlayersList();
    });
  }

  handleNavigationFilter(filterData) {
    console.log('TrackerComponent: Navigation filter received:', filterData);
    this.currentFilters.role = filterData.role || 'all';
    this.currentFilters.tier = filterData.tier;
    console.log('TrackerComponent: Updated filters:', this.currentFilters);
    this.updatePlayersList();
  }

  handleSearchChange() {
    if (this.searchInput) {
      this.currentFilters.search = this.searchInput.value;
      this.updatePlayersList();
    }
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.currentFilters.search = '';
      this.updatePlayersList();
    }
  }

  handleFilterChange(e) {
    this.filterButtons.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    this.currentFilters.status = e.currentTarget.dataset.filter;
    this.updatePlayersList();
  }

  handleRoleChange(e) {
    this.roleTabs.forEach(tab => tab.classList.remove('active'));
    e.currentTarget.classList.add('active');
    this.currentFilters.role = e.currentTarget.dataset.role;
    this.updatePlayersList();
  }

  update() {
    this.updatePlayersList();
  }

  updatePlayersList() {
    if (!this.playersGrid) return;

    console.log('Updating players list with filters:', this.currentFilters);
    console.log('Total players in data:', this.appData.players.length);

    // Map filter values to what the backend expects
    let statusFilter = null;
    if (this.currentFilters.status !== 'all') {
      switch (this.currentFilters.status) {
        case 'owned': statusFilter = 'owned'; break;
        case 'interesting': statusFilter = 'interesting'; break;
        case 'removed': statusFilter = 'removed'; break;
        default: statusFilter = this.currentFilters.status;
      }
    }

    const filteredPlayers = this.services.players.searchPlayers(
      this.currentFilters.search,
      {
        role: this.currentFilters.role,
        status: statusFilter,
        tier: this.currentFilters.tier
      }
    );

    console.log('Filtered players count:', filteredPlayers.length);

    Utils.emptyElement(this.playersGrid);

    if (filteredPlayers.length === 0) {
      const emptyState = this.createEmptyState();
      this.playersGrid.appendChild(emptyState);
    } else {
      // If viewing all players (no specific role filter), organize by roles and tiers
      if (this.currentFilters.role === 'all' || !this.currentFilters.role) {
        this.renderPlayersByRolesAndTiers(filteredPlayers);
      } else {
        // If specific role selected, show flat list
        this.renderPlayersFlat(filteredPlayers);
      }
    }
  }

  renderPlayersByRolesAndTiers(players) {
    // Group players by role
    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    const playersByRole = {};
    
    roles.forEach(role => {
      playersByRole[role] = players.filter(player => 
        player.ruoli && player.ruoli.includes(role)
      );
    });
    
    // Render each role section
    roles.forEach(role => {
      const rolePlayers = playersByRole[role];
      if (rolePlayers.length === 0) return;
      
      this.createRoleSection(role, rolePlayers);
    });
  }
  
  renderPlayersFlat(players) {
    // Simple flat rendering for specific role/filter
    players.forEach(player => {
      const card = this.createPlayerCard(player);
      this.playersGrid.appendChild(card);
    });
  }
  
  createRoleSection(role, players) {
    const roleColor = Utils.getRoleColor(role);
    
    // Role section container
    const roleSection = Utils.createElement('div', 'role-section');
    roleSection.style.cssText = `
      margin-bottom: var(--space-6);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    `;
    
    // Role header
    const roleHeader = Utils.createElement('div', 'role-header');
    roleHeader.style.cssText = `
      background: linear-gradient(135deg, ${roleColor.primary}, ${roleColor.dark});
      color: white;
      padding: var(--space-3) var(--space-4);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--font-size-lg);
    `;
    
    const headerTitle = Utils.createElement('span', '', `${role} - ${Utils.getRoleDisplayName(role)}`);
    const headerCount = Utils.createElement('span', 'role-count-badge');
    headerCount.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--border-radius-full);
      font-size: var(--font-size-sm);
    `;
    headerCount.textContent = players.length;
    
    roleHeader.appendChild(headerTitle);
    roleHeader.appendChild(headerCount);
    
    // Group players by tier
    const playersByTier = this.groupPlayersByTier(players);
    const tiers = ['Top', 'Titolari', 'Low cost', 'Jolly', 'Riserve', 'Non inseriti'];
    
    // Role content container
    const roleContent = Utils.createElement('div', 'role-content');
    roleContent.style.cssText = `
      background: white;
      border: 1px solid ${roleColor.primary}30;
      border-top: none;
    `;
    
    tiers.forEach(tier => {
      const tierPlayers = playersByTier[tier];
      if (tierPlayers && tierPlayers.length > 0) {
        this.createTierSubsection(roleContent, tier, tierPlayers, roleColor);
      }
    });
    
    roleSection.appendChild(roleHeader);
    roleSection.appendChild(roleContent);
    this.playersGrid.appendChild(roleSection);
  }
  
  groupPlayersByTier(players) {
    const playersByTier = {
      'Top': [],
      'Titolari': [],
      'Low cost': [],
      'Jolly': [],
      'Riserve': [],
      'Non inseriti': []
    };
    
    players.forEach(player => {
      const tier = player.tier || 'Non inseriti';
      if (playersByTier[tier]) {
        playersByTier[tier].push(player);
      } else {
        playersByTier['Non inseriti'].push(player);
      }
    });
    
    return playersByTier;
  }
  
  createTierSubsection(container, tier, players, roleColor) {
    // Tier subsection
    const tierSection = Utils.createElement('div', 'tier-subsection');
    tierSection.style.cssText = `
      border-bottom: 1px solid var(--color-gray-200);
    `;
    
    // Tier header
    const tierHeader = Utils.createElement('div', 'tier-header');
    tierHeader.style.cssText = `
      background: ${roleColor.light};
      padding: var(--space-2) var(--space-4);
      font-weight: var(--font-weight-medium);
      color: ${roleColor.dark};
      font-size: var(--font-size-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    const tierTitle = this.getTierIcon(tier) + ' ' + tier;
    const tierCount = `(${players.length})`;
    
    tierHeader.innerHTML = `<span>${tierTitle}</span><span>${tierCount}</span>`;
    
    // Players grid for this tier
    const playersGrid = Utils.createElement('div', 'tier-players-grid');
    playersGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-3);
      padding: var(--space-4);
    `;
    
    players.forEach(player => {
      const card = this.createPlayerCard(player);
      playersGrid.appendChild(card);
    });
    
    tierSection.appendChild(tierHeader);
    tierSection.appendChild(playersGrid);
    container.appendChild(tierSection);
  }
  
  getTierIcon(tier) {
    const icons = {
      'Top': '🏆',
      'Titolari': '⭐',
      'Low cost': '💰',
      'Jolly': '🃏',
      'Riserve': '🔄',
      'Non inseriti': '📝'
    };
    return icons[tier] || '📝';
  }

  createEmptyState() {
    const emptyState = Utils.createElement('div', 'empty-state');
    const title = Utils.createElement('h3', '', 'Nessun giocatore trovato');
    const message = Utils.createElement('p', '', 'Prova a modificare i filtri di ricerca');
    
    emptyState.appendChild(title);
    emptyState.appendChild(message);
    
    return emptyState;
  }

  createPlayerCard(player) {
    const playerCard = new PlayerCardComponent(
      player, 
      this.services, 
      () => this.updatePlayersList()
    );
    return playerCard.render();
  }

  handlePlayerAction(player, action) {
    switch (action) {
      case 'own':
        this.services.players.setPlayerStatus(player.id, 'owned');
        break;
      case 'interest':
        this.services.players.toggleInteresting(player.id);
        break;
      case 'remove':
        this.services.players.removePlayer(player.id);
        break;
    }
    
    this.updatePlayersList();
  }

  onViewActive() {
    this.update();
  }
}