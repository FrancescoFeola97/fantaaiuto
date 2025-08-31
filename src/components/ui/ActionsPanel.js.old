import { Utils } from '../../utils/Utils.js';

export class ActionsPanelComponent {
  constructor(appData, services) {
    this.appData = appData;
    this.services = services;
  }

  async init() {
    this.setupEventListeners();
    return Promise.resolve();
  }

  setupEventListeners() {
    // Remove existing listeners to prevent duplicates
    this.removeExistingListeners();
    
    // Owned players
    const ownedBtn = document.getElementById('ownedPlayersBtn');
    if (ownedBtn) {
      ownedBtn.removeEventListener('click', this.showOwnedPlayers);
      ownedBtn.addEventListener('click', () => this.showOwnedPlayers());
    }

    // Interesting players
    const interestingBtn = document.getElementById('interestingPlayersBtn');
    if (interestingBtn) {
      interestingBtn.addEventListener('click', () => this.showInterestingPlayers());
    }

    // Removed players
    const removedBtn = document.getElementById('showRemovedButton');
    if (removedBtn) {
      removedBtn.addEventListener('click', () => this.showRemovedPlayers());
    }

    // Formation builder
    const formationBtn = document.getElementById('formationBtn');
    if (formationBtn) {
      formationBtn.addEventListener('click', () => this.openFormationBuilder());
    }

    // Upload formation image
    const uploadFormationBtn = document.getElementById('formationImageBtn');
    if (uploadFormationBtn) {
      uploadFormationBtn.addEventListener('click', () => this.uploadFormationImage());
    }

    // Participants
    const participantsBtn = document.getElementById('participantsBtn');
    if (participantsBtn) {
      participantsBtn.addEventListener('click', () => this.manageParticipants());
    }

    // Export Excel - using loadExcelBtn for now (could be changed to have separate export button)
    const exportBtn = document.getElementById('loadExcelBtn');
    if (exportBtn) {
      // Note: This button is used for loading Excel, not exporting
      // You may want to add a separate export button in the HTML
    }

    // Reset
    const resetBtn = document.getElementById('resetButton');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAll());
    }
  }

  removeExistingListeners() {
    // Clean up any existing event listeners to prevent duplicates
    const buttons = [
      'ownedPlayersBtn', 'interestingPlayersBtn', 'showRemovedButton',
      'formationBtn', 'formationImageBtn', 'participantsBtn', 'resetButton'
    ];
    
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        // Clone node to remove all event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
      }
    });
  }

  showOwnedPlayers() {
    const ownedPlayers = this.services.players.getOwnedPlayers();
    
    if (ownedPlayers.length === 0) {
      this.services.notifications.show('info', 'Nessun giocatore', 'Non hai ancora acquistato giocatori');
      return;
    }

    const content = this.createOwnedPlayersModal(ownedPlayers);
    this.services.modals.show('owned-players-modal', '📊 Giocatori Presi', content);
  }

  showInterestingPlayers() {
    const interestingPlayers = this.services.players.getInterestingPlayers();
    
    if (interestingPlayers.length === 0) {
      this.services.notifications.show('info', 'Nessun giocatore', 'Non hai marcato giocatori come interessanti');
      return;
    }

    const content = this.createPlayersListModal(interestingPlayers, '⭐ Giocatori Interessanti');
    this.services.modals.show('interesting-players-modal', '⭐ Giocatori Interessanti', content);
  }

  showRemovedPlayers() {
    const removedPlayers = this.services.players.getRemovedPlayers();
    
    if (removedPlayers.length === 0) {
      this.services.notifications.show('info', 'Nessun giocatore', 'Non hai rimosso alcun giocatore');
      return;
    }

    const content = this.createRemovedPlayersModal(removedPlayers);
    this.services.modals.show('removed-players-modal', '🗑️ Giocatori Rimossi', content);
  }

  createOwnedPlayersModal(players) {
    const container = Utils.createElement('div', 'owned-players-modal');
    
    // Search and filter section
    const filtersSection = this.createOwnedPlayersFilters();
    container.appendChild(filtersSection);
    
    // Team statistics overview
    const stats = this.calculateOwnedPlayersStats(players);
    const statsSection = this.createOwnedPlayersStats(stats);
    container.appendChild(statsSection);
    
    // Players organized by role
    const playersSection = this.createOwnedPlayersByRole(players);
    container.appendChild(playersSection);
    
    return container;
  }

  createOwnedPlayersFilters() {
    const filtersDiv = Utils.createElement('div', 'owned-filters');
    filtersDiv.style.cssText = `
      background: var(--color-gray-50);
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-4);
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: var(--space-3);
      align-items: end;
    `;

    // Search input
    const searchGroup = Utils.createElement('div', 'search-group');
    const searchLabel = Utils.createElement('label', 'form-label', 'Cerca giocatore:');
    const searchInput = Utils.createElement('input', 'form-control');
    searchInput.type = 'text';
    searchInput.placeholder = 'Nome giocatore o squadra...';
    searchInput.id = 'ownedPlayersSearch';
    searchGroup.appendChild(searchLabel);
    searchGroup.appendChild(searchInput);

    // Role filter
    const roleGroup = Utils.createElement('div', 'role-filter-group');
    const roleLabel = Utils.createElement('label', 'form-label', 'Ruolo:');
    const roleSelect = Utils.createElement('select', 'form-control');
    roleSelect.id = 'ownedRoleFilter';
    
    const defaultRoleOption = Utils.createElement('option', '');
    defaultRoleOption.value = '';
    defaultRoleOption.textContent = 'Tutti i ruoli';
    roleSelect.appendChild(defaultRoleOption);
    
    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    roles.forEach(role => {
      const option = Utils.createElement('option', '');
      option.value = role;
      option.textContent = `${role} - ${Utils.getRoleDisplayName(role)}`;
      roleSelect.appendChild(option);
    });
    roleGroup.appendChild(roleLabel);
    roleGroup.appendChild(roleSelect);

    // Sort by
    const sortGroup = Utils.createElement('div', 'sort-group');
    const sortLabel = Utils.createElement('label', 'form-label', 'Ordina per:');
    const sortSelect = Utils.createElement('select', 'form-control');
    sortSelect.id = 'ownedSortBy';
    
    const sortOptions = [
      { value: 'costoReale', text: 'Prezzo pagato' },
      { value: 'fvm', text: 'FVM' },
      { value: 'nome', text: 'Nome' },
      { value: 'squadra', text: 'Squadra' },
      { value: 'ruoli', text: 'Ruolo' }
    ];
    
    sortOptions.forEach(option => {
      const optionEl = Utils.createElement('option', '');
      optionEl.value = option.value;
      optionEl.textContent = option.text;
      if (option.value === 'costoReale') optionEl.selected = true;
      sortSelect.appendChild(optionEl);
    });
    sortGroup.appendChild(sortLabel);
    sortGroup.appendChild(sortSelect);

    // Clear button
    const clearBtn = Utils.createElement('button', 'btn btn--secondary btn--sm');
    clearBtn.textContent = '🔄 Reset';
    clearBtn.addEventListener('click', () => this.clearOwnedPlayersFilters());

    filtersDiv.appendChild(searchGroup);
    filtersDiv.appendChild(roleGroup);
    filtersDiv.appendChild(sortGroup);
    filtersDiv.appendChild(clearBtn);

    // Setup filtering
    this.setupOwnedPlayersFiltering(searchInput, roleSelect, sortSelect);

    return filtersDiv;
  }

  createOwnedPlayersStats(stats) {
    const statsDiv = Utils.createElement('div', 'owned-stats');
    statsDiv.style.cssText = `
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-4);
      border: 1px solid var(--color-gray-200);
    `;

    const title = Utils.createElement('h3', '', '📊 Riepilogo Squadra');
    title.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-900);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      text-align: center;
    `;
    statsDiv.appendChild(title);

    // Main stats grid
    const mainStats = Utils.createElement('div', 'main-stats-grid');
    mainStats.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    `;

    const mainStatsData = [
      { label: 'Giocatori Totali', value: stats.totalPlayers, icon: '👥' },
      { label: 'Spesa Totale', value: Utils.formatCurrency(stats.totalSpent), icon: '💰' },
      { label: 'Crediti Rimanenti', value: Utils.formatCurrency(stats.remainingBudget), icon: '💳' },
      { label: 'FVM Medio', value: stats.avgFVM, icon: '⚽' }
    ];

    mainStatsData.forEach(stat => {
      const statCard = this.createStatCard(stat.label, stat.value, stat.icon);
      mainStats.appendChild(statCard);
    });

    statsDiv.appendChild(mainStats);

    // Role distribution
    const roleTitle = Utils.createElement('h4', '', '👥 Distribuzione per Ruolo');
    roleTitle.style.cssText = `
      margin-bottom: var(--space-3);
      color: var(--color-gray-800);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      text-align: center;
    `;
    statsDiv.appendChild(roleTitle);

    const rolesGrid = Utils.createElement('div', 'roles-stats-grid');
    rolesGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    `;

    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    roles.forEach(role => {
      const count = stats.roleDistribution[role] || 0;
      const roleCard = this.createRoleStatCard(role, count);
      rolesGrid.appendChild(roleCard);
    });

    statsDiv.appendChild(rolesGrid);

    return statsDiv;
  }

  createStatCard(label, value, icon) {
    const card = Utils.createElement('div', 'stat-card');
    card.style.cssText = `
      background: white;
      padding: var(--space-3);
      border-radius: var(--border-radius-md);
      text-align: center;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-gray-200);
    `;

    const iconDiv = Utils.createElement('div', 'stat-icon');
    iconDiv.style.cssText = `
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-2);
    `;
    iconDiv.textContent = icon;

    const valueDiv = Utils.createElement('div', 'stat-value');
    valueDiv.style.cssText = `
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin-bottom: var(--space-1);
    `;
    valueDiv.textContent = value;

    const labelDiv = Utils.createElement('div', 'stat-label');
    labelDiv.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    `;
    labelDiv.textContent = label;

    card.appendChild(iconDiv);
    card.appendChild(valueDiv);
    card.appendChild(labelDiv);

    return card;
  }

  createRoleStatCard(role, count) {
    const roleColor = Utils.getRoleColor(role);
    const card = Utils.createElement('div', 'role-stat-card');
    card.style.cssText = `
      background: linear-gradient(135deg, ${roleColor.background}, rgba(255, 255, 255, 0.9));
      padding: var(--space-2);
      border-radius: var(--border-radius-md);
      text-align: center;
      border: 2px solid ${roleColor.primary}30;
      position: relative;
    `;

    const roleDiv = Utils.createElement('div', 'role-name');
    roleDiv.style.cssText = `
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: ${roleColor.primary};
      margin-bottom: var(--space-1);
    `;
    roleDiv.textContent = role;

    const countDiv = Utils.createElement('div', 'role-count');
    countDiv.style.cssText = `
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: ${roleColor.dark};
    `;
    countDiv.textContent = count;

    card.appendChild(roleDiv);
    card.appendChild(countDiv);

    return card;
  }

  createOwnedPlayersByRole(players) {
    const container = Utils.createElement('div', 'owned-players-by-role');
    container.id = 'ownedPlayersContainer';

    // Group players by role
    const playersByRole = this.groupPlayersByRole(players);
    
    Object.entries(playersByRole).forEach(([role, rolePlayers]) => {
      if (rolePlayers.length === 0) return;

      const roleSection = this.createRoleSection(role, rolePlayers);
      container.appendChild(roleSection);
    });

    return container;
  }

  groupPlayersByRole(players) {
    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    const grouped = {};
    
    roles.forEach(role => {
      grouped[role] = players.filter(player => 
        player.ruoli && player.ruoli.includes(role)
      );
    });

    return grouped;
  }

  createRoleSection(role, players) {
    const roleColor = Utils.getRoleColor(role);
    const section = Utils.createElement('div', 'role-section');
    section.style.cssText = `
      margin-bottom: var(--space-4);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    `;

    // Role header
    const header = Utils.createElement('div', 'role-header');
    header.style.cssText = `
      background: linear-gradient(135deg, ${roleColor.primary}, ${roleColor.dark});
      color: white;
      padding: var(--space-3) var(--space-4);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      justify-content: space-between;
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

    header.appendChild(headerTitle);
    header.appendChild(headerCount);

    // Players list
    const playersList = Utils.createElement('div', 'role-players-list');
    playersList.style.cssText = `
      background: white;
      border: 1px solid ${roleColor.primary}30;
      border-top: none;
    `;

    players.forEach((player, index) => {
      const playerCard = this.createOwnedPlayerCard(player, roleColor, index % 2 === 0);
      playersList.appendChild(playerCard);
    });

    section.appendChild(header);
    section.appendChild(playersList);

    return section;
  }

  createOwnedPlayerCard(player, roleColor, isEven) {
    const card = Utils.createElement('div', 'owned-player-card');
    card.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3);
      background: ${isEven ? 'var(--color-gray-50)' : 'white'};
      border-bottom: 1px solid var(--color-gray-200);
      transition: all 0.2s ease;
    `;

    card.addEventListener('mouseenter', () => {
      card.style.background = `linear-gradient(135deg, ${roleColor.light}, rgba(255, 255, 255, 0.95))`;
      card.style.transform = 'translateX(2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.background = isEven ? 'var(--color-gray-50)' : 'white';
      card.style.transform = 'translateX(0)';
    });

    // Player info
    const playerInfo = Utils.createElement('div', 'player-info');
    playerInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
    `;

    // Role indicator
    const roleIndicator = Utils.createElement('div', 'role-indicator');
    roleIndicator.style.cssText = `
      width: 4px;
      height: 40px;
      background: linear-gradient(to bottom, ${roleColor.primary}, ${roleColor.dark});
      border-radius: var(--border-radius-full);
    `;

    const details = Utils.createElement('div', 'player-details');
    const name = Utils.createElement('div', 'player-name');
    name.style.cssText = `
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin-bottom: var(--space-1);
      font-size: var(--font-size-md);
    `;
    name.textContent = player.nome;

    const info = Utils.createElement('div', 'player-info-line');
    info.style.cssText = `
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    `;
    
    const roles = Utils.createElement('span', 'roles');
    roles.textContent = player.ruoli?.join('/') || '';
    roles.style.fontWeight = 'var(--font-weight-medium)';

    const team = Utils.createElement('span', 'team');
    team.textContent = player.squadra || '';

    const fvm = Utils.createElement('span', 'fvm');
    fvm.textContent = `FVM: ${player.fvm || 0}`;
    fvm.style.cssText = `
      background: ${roleColor.background};
      padding: var(--space-1) var(--space-2);
      border-radius: var(--border-radius-md);
      font-weight: var(--font-weight-medium);
      color: ${roleColor.primary};
    `;

    info.appendChild(roles);
    info.appendChild(Utils.createElement('span', '', '•'));
    info.appendChild(team);
    info.appendChild(Utils.createElement('span', '', '•'));
    info.appendChild(fvm);

    details.appendChild(name);
    details.appendChild(info);

    playerInfo.appendChild(roleIndicator);
    playerInfo.appendChild(details);

    // Price and actions
    const priceSection = Utils.createElement('div', 'price-section');
    priceSection.style.cssText = `
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-2);
    `;

    const priceDiv = Utils.createElement('div', 'player-price');
    priceDiv.style.cssText = `
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: ${roleColor.primary};
      background: white;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--border-radius-md);
      border: 2px solid ${roleColor.primary}30;
      min-width: 80px;
    `;
    priceDiv.textContent = Utils.formatCurrency(player.costoReale || player.prezzo || 0);

    // Quick actions
    const actions = Utils.createElement('div', 'quick-actions');
    actions.style.cssText = `
      display: flex;
      gap: var(--space-1);
    `;

    const editBtn = Utils.createElement('button', 'btn btn--sm btn--outline');
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Modifica giocatore';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.editOwnedPlayer(player);
    });

    const releaseBtn = Utils.createElement('button', 'btn btn--sm btn--warning');
    releaseBtn.innerHTML = '🔄';
    releaseBtn.title = 'Libera giocatore';
    releaseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.releasePlayer(player);
    });

    actions.appendChild(editBtn);
    actions.appendChild(releaseBtn);

    priceSection.appendChild(priceDiv);
    priceSection.appendChild(actions);

    card.appendChild(playerInfo);
    card.appendChild(priceSection);

    return card;
  }

  calculateOwnedPlayersStats(players) {
    const totalSpent = players.reduce((sum, p) => sum + (p.costoReale || p.prezzo || 0), 0);
    const avgFVM = players.length > 0 ? (players.reduce((sum, p) => sum + (p.fvm || 0), 0) / players.length).toFixed(1) : 0;
    const remainingBudget = 500 - totalSpent;
    
    const roleDistribution = {};
    ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'].forEach(role => {
      roleDistribution[role] = 0;
    });
    
    players.forEach(player => {
      if (player.ruoli && player.ruoli.length > 0) {
        player.ruoli.forEach(role => {
          if (roleDistribution.hasOwnProperty(role)) {
            roleDistribution[role]++;
          }
        });
      }
    });

    return {
      totalPlayers: players.length,
      totalSpent,
      remainingBudget,
      avgFVM,
      roleDistribution
    };
  }

  setupOwnedPlayersFiltering(searchInput, roleSelect, sortSelect) {
    const filterPlayers = () => {
      const searchQuery = searchInput.value.toLowerCase().trim();
      const selectedRole = roleSelect.value;
      const sortBy = sortSelect.value;
      
      let filteredPlayers = this.services.players.getOwnedPlayers();
      
      // Apply search filter
      if (searchQuery) {
        filteredPlayers = filteredPlayers.filter(player =>
          player.nome.toLowerCase().includes(searchQuery) ||
          (player.squadra && player.squadra.toLowerCase().includes(searchQuery))
        );
      }
      
      // Apply role filter
      if (selectedRole) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.ruoli && player.ruoli.includes(selectedRole)
        );
      }
      
      // Apply sorting
      filteredPlayers = this.sortOwnedPlayers(filteredPlayers, sortBy);
      
      // Update the display
      this.updateOwnedPlayersDisplay(filteredPlayers);
    };

    searchInput.addEventListener('input', Utils.debounce(filterPlayers, 300));
    roleSelect.addEventListener('change', filterPlayers);
    sortSelect.addEventListener('change', filterPlayers);
  }

  sortOwnedPlayers(players, sortBy) {
    return [...players].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'costoReale':
          aVal = a.costoReale || a.prezzo || 0;
          bVal = b.costoReale || b.prezzo || 0;
          return bVal - aVal; // Descending
        case 'fvm':
          aVal = a.fvm || 0;
          bVal = b.fvm || 0;
          return bVal - aVal; // Descending
        case 'nome':
          aVal = (a.nome || '').toLowerCase();
          bVal = (b.nome || '').toLowerCase();
          return aVal.localeCompare(bVal); // Ascending
        case 'squadra':
          aVal = (a.squadra || '').toLowerCase();
          bVal = (b.squadra || '').toLowerCase();
          return aVal.localeCompare(bVal); // Ascending
        case 'ruoli':
          aVal = (a.ruoli && a.ruoli.length > 0) ? a.ruoli[0] : 'ZZZ';
          bVal = (b.ruoli && b.ruoli.length > 0) ? b.ruoli[0] : 'ZZZ';
          return aVal.localeCompare(bVal); // Ascending
        default:
          return 0;
      }
    });
  }

  updateOwnedPlayersDisplay(players) {
    const container = document.getElementById('ownedPlayersContainer');
    if (!container) return;

    // Clear current content
    Utils.emptyElement(container);

    if (players.length === 0) {
      const emptyMsg = Utils.createElement('p', '', 'Nessun giocatore trovato con i filtri selezionati');
      emptyMsg.style.cssText = `
        text-align: center;
        color: var(--color-gray-500);
        padding: var(--space-6);
        font-style: italic;
      `;
      container.appendChild(emptyMsg);
      return;
    }

    // Group filtered players by role and recreate sections
    const playersByRole = this.groupPlayersByRole(players);
    
    Object.entries(playersByRole).forEach(([role, rolePlayers]) => {
      if (rolePlayers.length === 0) return;

      const roleSection = this.createRoleSection(role, rolePlayers);
      container.appendChild(roleSection);
    });
  }

  clearOwnedPlayersFilters() {
    const searchInput = document.getElementById('ownedPlayersSearch');
    const roleSelect = document.getElementById('ownedRoleFilter');
    const sortSelect = document.getElementById('ownedSortBy');

    if (searchInput) searchInput.value = '';
    if (roleSelect) roleSelect.value = '';
    if (sortSelect) sortSelect.value = 'costoReale';

    // Trigger update
    const allPlayers = this.services.players.getOwnedPlayers();
    const sortedPlayers = this.sortOwnedPlayers(allPlayers, 'costoReale');
    this.updateOwnedPlayersDisplay(sortedPlayers);
  }

  editOwnedPlayer(player) {
    // Use existing edit functionality from PlayerCard
    Utils.dispatchCustomEvent('fantaaiuto:editPlayer', { player });
    this.services.notifications.show('info', 'Modifica giocatore', `Funzionalità di modifica per ${player.nome}`);
  }

  releasePlayer(player) {
    if (confirm(`Vuoi davvero liberare ${player.nome}? Il giocatore tornerà disponibile.`)) {
      // Update player status
      const updateData = { 
        ...player, 
        status: 'available',
        costoReale: 0 
      };
      
      this.services.players.updatePlayer(updateData);
      this.services.notifications.show('success', 'Giocatore liberato', `${player.nome} è stato liberato`);
      
      // Refresh the owned players modal without closing
      this.refreshOwnedPlayersModal();
    }
  }

  createPlayersListModal(players, title) {
    const container = Utils.createElement('div');
    
    if (players.length === 0) {
      const emptyMsg = Utils.createElement('p', '', 'Nessun giocatore trovato');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = 'var(--color-gray-500)';
      container.appendChild(emptyMsg);
      return container;
    }

    const stats = this.calculatePlayersStats(players);
    const statsDiv = Utils.createElement('div', 'players-stats');
    statsDiv.style.cssText = `
      background: var(--color-gray-50);
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-4);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--space-3);
    `;

    Object.entries(stats).forEach(([key, value]) => {
      const statDiv = Utils.createElement('div', 'stat-item');
      statDiv.style.textAlign = 'center';
      
      const label = Utils.createElement('div', 'stat-label', this.getStatLabel(key));
      label.style.cssText = `
        font-size: var(--font-size-xs);
        color: var(--color-gray-600);
        margin-bottom: var(--space-1);
      `;
      
      const valueDiv = Utils.createElement('div', 'stat-value', value.toString());
      valueDiv.style.cssText = `
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-gray-900);
      `;
      
      statDiv.appendChild(label);
      statDiv.appendChild(valueDiv);
      statsDiv.appendChild(statDiv);
    });

    const playersList = Utils.createElement('div', 'players-list');
    playersList.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-lg);
    `;

    players.forEach((player, index) => {
      const playerRow = this.createPlayerRow(player, index % 2 === 0);
      playersList.appendChild(playerRow);
    });

    container.appendChild(statsDiv);
    container.appendChild(playersList);

    return container;
  }

  createRemovedPlayersModal(players) {
    const container = Utils.createElement('div');
    
    const description = Utils.createElement('p', '', 
      'Questi giocatori sono stati rimossi dalla lista. Puoi ripristinarli cliccando sul pulsante "Ripristina".');
    description.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-600);
      font-size: var(--font-size-sm);
    `;

    const playersList = Utils.createElement('div', 'players-list');
    playersList.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--border-radius-lg);
    `;

    players.forEach((player, index) => {
      const playerRow = this.createRemovedPlayerRow(player, index % 2 === 0);
      playersList.appendChild(playerRow);
    });

    container.appendChild(description);
    container.appendChild(playersList);

    return container;
  }

  createPlayerRow(player, isEven) {
    const row = Utils.createElement('div', 'player-row');
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3);
      background: ${isEven ? 'var(--color-gray-50)' : 'white'};
      border-bottom: 1px solid var(--color-gray-200);
    `;

    const playerInfo = Utils.createElement('div', 'player-info');
    const name = Utils.createElement('div', 'player-name', player.nome);
    name.style.cssText = `
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
      margin-bottom: var(--space-1);
    `;

    const details = Utils.createElement('div', 'player-details');
    details.textContent = `${player.ruoli.join('/')} - ${player.squadra} - FVM: ${player.fvm} - €${player.prezzo}`;
    details.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    `;

    playerInfo.appendChild(name);
    playerInfo.appendChild(details);
    row.appendChild(playerInfo);

    return row;
  }

  createRemovedPlayersModal(removedPlayers) {
    const container = Utils.createElement('div', 'removed-players-modal');
    
    if (removedPlayers.length === 0) {
      const emptyMsg = Utils.createElement('p', '', 'Nessun giocatore rimosso');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = 'var(--color-gray-500)';
      container.appendChild(emptyMsg);
      return container;
    }

    // Search and filter section
    const filtersSection = this.createRemovedPlayersFilters();
    container.appendChild(filtersSection);

    // Group players by team
    const playersByTeam = this.services.players.getRemovedPlayersByTeam();
    
    // Create content for each team
    Object.entries(playersByTeam).forEach(([team, players]) => {
      const teamSection = Utils.createElement('div', 'team-section');
      teamSection.style.cssText = `
        margin-bottom: var(--space-6);
        border: 1px solid var(--color-gray-200);
        border-radius: var(--border-radius-lg);
        overflow: hidden;
      `;

      // Team header
      const teamHeader = Utils.createElement('div', 'team-header');
      teamHeader.style.cssText = `
        background: var(--color-gray-100);
        padding: var(--space-3) var(--space-4);
        font-weight: var(--font-weight-semibold);
        color: var(--color-gray-900);
        border-bottom: 1px solid var(--color-gray-200);
      `;
      teamHeader.textContent = `${team} (${players.length} giocatori)`;
      teamSection.appendChild(teamHeader);

      // Players list for this team
      const playersList = Utils.createElement('div', 'players-list');
      players.forEach((player, index) => {
        const playerRow = this.createRemovedPlayerRow(player, index % 2 === 0);
        playersList.appendChild(playerRow);
      });
      
      teamSection.appendChild(playersList);
      container.appendChild(teamSection);
    });

    return container;
  }

  createRemovedPlayersFilters() {
    const filtersDiv = Utils.createElement('div', 'removed-filters');
    filtersDiv.style.cssText = `
      background: var(--color-gray-50);
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-6);
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: var(--space-3);
      align-items: end;
    `;

    // Search input
    const searchGroup = Utils.createElement('div', 'search-group');
    const searchLabel = Utils.createElement('label', 'form-label', 'Cerca giocatore:');
    const searchInput = Utils.createElement('input', 'form-control');
    searchInput.type = 'text';
    searchInput.placeholder = 'Nome giocatore o squadra...';
    searchInput.id = 'removedPlayersSearch';
    
    searchGroup.appendChild(searchLabel);
    searchGroup.appendChild(searchInput);

    // Team filter
    const teamGroup = Utils.createElement('div', 'team-filter-group');
    const teamLabel = Utils.createElement('label', 'form-label', 'Squadra:');
    const teamSelect = Utils.createElement('select', 'form-control');
    teamSelect.id = 'removedTeamFilter';
    
    const defaultTeamOption = Utils.createElement('option', '');
    defaultTeamOption.value = '';
    defaultTeamOption.textContent = 'Tutte le squadre';
    teamSelect.appendChild(defaultTeamOption);
    
    // Get unique teams from removed players
    const removedPlayers = this.services.players.getRemovedPlayers();
    const teams = [...new Set(removedPlayers.map(p => p.squadra).filter(Boolean))];
    teams.sort().forEach(team => {
      const option = Utils.createElement('option', '');
      option.value = team;
      option.textContent = team;
      teamSelect.appendChild(option);
    });

    teamGroup.appendChild(teamLabel);
    teamGroup.appendChild(teamSelect);

    // Role filter
    const roleGroup = Utils.createElement('div', 'role-filter-group');
    const roleLabel = Utils.createElement('label', 'form-label', 'Ruolo:');
    const roleSelect = Utils.createElement('select', 'form-control');
    roleSelect.id = 'removedRoleFilter';
    
    const defaultRoleOption = Utils.createElement('option', '');
    defaultRoleOption.value = '';
    defaultRoleOption.textContent = 'Tutti i ruoli';
    roleSelect.appendChild(defaultRoleOption);
    
    const roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    roles.forEach(role => {
      const option = Utils.createElement('option', '');
      option.value = role;
      option.textContent = role;
      roleSelect.appendChild(option);
    });

    roleGroup.appendChild(roleLabel);
    roleGroup.appendChild(roleSelect);

    filtersDiv.appendChild(searchGroup);
    filtersDiv.appendChild(teamGroup);
    filtersDiv.appendChild(roleGroup);

    // Add event listeners for filtering
    this.setupRemovedPlayersFiltering(searchInput, teamSelect, roleSelect);

    return filtersDiv;
  }

  setupRemovedPlayersFiltering(searchInput, teamSelect, roleSelect) {
    const filterPlayers = () => {
      const searchQuery = searchInput.value.toLowerCase().trim();
      const selectedTeam = teamSelect.value;
      const selectedRole = roleSelect.value;
      
      let filteredPlayers = this.services.players.getRemovedPlayers();
      
      // Apply search filter
      if (searchQuery) {
        filteredPlayers = filteredPlayers.filter(player =>
          player.nome.toLowerCase().includes(searchQuery) ||
          (player.squadra && player.squadra.toLowerCase().includes(searchQuery))
        );
      }
      
      // Apply team filter
      if (selectedTeam) {
        filteredPlayers = filteredPlayers.filter(player => player.squadra === selectedTeam);
      }
      
      // Apply role filter
      if (selectedRole) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.ruoli && player.ruoli.includes(selectedRole)
        );
      }
      
      // Update the modal content
      this.updateRemovedPlayersDisplay(filteredPlayers);
    };

    searchInput.addEventListener('input', filterPlayers);
    teamSelect.addEventListener('change', filterPlayers);
    roleSelect.addEventListener('change', filterPlayers);
  }

  updateRemovedPlayersDisplay(players) {
    // Re-create the modal with filtered players
    const modalBody = document.querySelector('#removed-players-modal .modal-body');
    if (modalBody) {
      // Clear current content except filters
      const filtersSection = modalBody.querySelector('.removed-filters');
      modalBody.innerHTML = '';
      if (filtersSection) {
        modalBody.appendChild(filtersSection);
      }
      
      if (players.length === 0) {
        const emptyMsg = Utils.createElement('p', '', 'Nessun giocatore trovato con i filtri selezionati');
        emptyMsg.style.cssText = `
          text-align: center;
          color: var(--color-gray-500);
          padding: var(--space-6);
        `;
        modalBody.appendChild(emptyMsg);
        return;
      }
      
      // Group filtered players by team
      const grouped = {};
      players.forEach(player => {
        const team = player.squadra || 'Sconosciuta';
        if (!grouped[team]) {
          grouped[team] = [];
        }
        grouped[team].push(player);
      });

      // Create sections for each team
      Object.entries(grouped).forEach(([team, teamPlayers]) => {
        const teamSection = Utils.createElement('div', 'team-section');
        teamSection.style.cssText = `
          margin-bottom: var(--space-6);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        `;

        const teamHeader = Utils.createElement('div', 'team-header');
        teamHeader.style.cssText = `
          background: var(--color-gray-100);
          padding: var(--space-3) var(--space-4);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          border-bottom: 1px solid var(--color-gray-200);
        `;
        teamHeader.textContent = `${team} (${teamPlayers.length} giocatori)`;
        teamSection.appendChild(teamHeader);

        const playersList = Utils.createElement('div', 'players-list');
        teamPlayers.forEach((player, index) => {
          const playerRow = this.createRemovedPlayerRow(player, index % 2 === 0);
          playersList.appendChild(playerRow);
        });
        
        teamSection.appendChild(playersList);
        modalBody.appendChild(teamSection);
      });
    }
  }

  createRemovedPlayerRow(player, isEven) {
    const row = this.createPlayerRow(player, isEven);
    
    const restoreBtn = Utils.createElement('button', 'btn btn-sm btn-success', '🔄 Ripristina');
    restoreBtn.style.marginLeft = 'var(--space-3)';
    
    restoreBtn.addEventListener('click', () => {
      this.services.players.restorePlayer(player.id);
      this.services.notifications.show('success', 'Giocatore ripristinato', `${player.nome} è stato ripristinato`);
      this.services.modals.hide('removed-players-modal');
      
      // Update UI
      Utils.dispatchCustomEvent('fantaaiuto:playerRestored', { player });
    });

    row.appendChild(restoreBtn);
    return row;
  }

  calculatePlayersStats(players) {
    const totalValue = players.reduce((sum, p) => sum + (p.prezzo || 0), 0);
    const avgValue = players.length > 0 ? (totalValue / players.length).toFixed(1) : 0;
    const roleDistribution = { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 };
    
    players.forEach(player => {
      if (player.ruoli && player.ruoli.length > 0) {
        player.ruoli.forEach(role => {
          if (roleDistribution.hasOwnProperty(role)) {
            roleDistribution[role]++;
          }
        });
      }
    });

    return {
      total: players.length,
      totalValue,
      avgValue,
      ...roleDistribution
    };
  }

  getStatLabel(key) {
    const labels = {
      total: 'Totale',
      totalValue: 'Valore Tot.',
      avgValue: 'Valore Med.',
      Por: 'Portieri',
      Ds: 'Dif. Sx',
      Dd: 'Dif. Dx',
      Dc: 'Dif. Cen.',
      B: 'Braccetto',
      E: 'Esterni',
      M: 'Mediani',
      C: 'Centrocamp.',
      W: 'Ali',
      T: 'Trequart.',
      A: 'Attaccanti',
      Pc: 'Punte Cen.'
    };
    return labels[key] || key;
  }

  openFormationBuilder() {
    this.services.notifications.show('info', 'In sviluppo', 'Il builder di formazioni sarà disponibile presto!');
  }

  uploadFormationImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.handleFormationImageUpload(file);
      }
    });

    input.click();
  }

  handleFormationImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      // Store in app data
      this.appData.formationImage = imageData;
      this.services.notifications.show('success', 'Immagine caricata', 'Immagine formazione salvata con successo');
    };
    reader.readAsDataURL(file);
  }

  manageParticipants() {
    const participants = this.services.participants.getAllParticipants();
    const content = this.createParticipantsModal(participants);
    this.services.modals.show('participants-modal', '👥 Gestione Altri Partecipanti', content);
  }

  createParticipantsModal(participants) {
    const container = Utils.createElement('div', 'participants-modal');
    
    // Add new participant section
    const addSection = this.createAddParticipantSection();
    container.appendChild(addSection);
    
    // Participants list
    const listSection = Utils.createElement('div', 'participants-list-section');
    const listTitle = Utils.createElement('h3', '', 'Altri Partecipanti');
    listTitle.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-900);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    `;
    listSection.appendChild(listTitle);
    
    if (participants.length === 0) {
      const emptyMsg = Utils.createElement('p', '', 'Nessun partecipante aggiunto');
      emptyMsg.style.cssText = `
        text-align: center;
        color: var(--color-gray-500);
        padding: var(--space-6);
        font-style: italic;
      `;
      listSection.appendChild(emptyMsg);
    } else {
      const participantsList = Utils.createElement('div', 'participants-list');
      participantsList.style.cssText = `
        display: grid;
        gap: var(--space-4);
        max-height: 400px;
        overflow-y: auto;
      `;
      
      participants.forEach(participant => {
        const participantCard = this.createParticipantCard(participant);
        participantsList.appendChild(participantCard);
      });
      
      listSection.appendChild(participantsList);
    }
    
    container.appendChild(listSection);
    return container;
  }

  createAddParticipantSection() {
    const section = Utils.createElement('div', 'add-participant-section');
    section.style.cssText = `
      background: var(--color-gray-50);
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-6);
    `;
    
    const title = Utils.createElement('h3', '', 'Aggiungi Nuovo Partecipante');
    title.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-900);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    `;
    section.appendChild(title);
    
    const form = Utils.createElement('div', 'add-participant-form');
    form.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-3);
      align-items: end;
    `;
    
    // Name input
    const nameGroup = Utils.createElement('div', 'form-group');
    const nameLabel = Utils.createElement('label', 'form-label', 'Nome Partecipante:');
    const nameInput = Utils.createElement('input', 'form-control');
    nameInput.type = 'text';
    nameInput.placeholder = 'Es: Mario Rossi';
    nameInput.id = 'participantName';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    
    // Add button
    const addBtn = Utils.createElement('button', 'btn btn--success');
    addBtn.textContent = '➕ Aggiungi';
    addBtn.addEventListener('click', () => this.addParticipant());
    
    form.appendChild(nameGroup);
    form.appendChild(addBtn);
    section.appendChild(form);
    
    return section;
  }

  createParticipantCard(participant) {
    const card = Utils.createElement('div', 'participant-card');
    card.style.cssText = `
      background: white;
      padding: var(--space-4);
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--color-gray-200);
      box-shadow: var(--shadow-sm);
    `;
    
    const header = Utils.createElement('div', 'participant-header');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    `;
    
    const nameDiv = Utils.createElement('div', 'participant-name');
    nameDiv.style.cssText = `
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
    `;
    nameDiv.textContent = participant.name;
    
    const actions = Utils.createElement('div', 'participant-actions');
    actions.style.cssText = `
      display: flex;
      gap: var(--space-2);
    `;
    
    const viewBtn = Utils.createElement('button', 'btn btn--sm btn--info');
    viewBtn.textContent = '👁️ Squadra';
    viewBtn.addEventListener('click', () => this.viewParticipantTeam(participant));
    
    const editBtn = Utils.createElement('button', 'btn btn--sm btn--secondary');
    editBtn.textContent = '✏️ Modifica';
    editBtn.addEventListener('click', () => this.editParticipant(participant));
    
    const deleteBtn = Utils.createElement('button', 'btn btn--sm btn--danger');
    deleteBtn.textContent = '🗑️ Elimina';
    deleteBtn.addEventListener('click', () => this.deleteParticipant(participant));
    
    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(nameDiv);
    header.appendChild(actions);
    
    const stats = Utils.createElement('div', 'participant-stats');
    stats.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      text-align: center;
    `;
    
    const playersCount = participant.players ? participant.players.length : 0;
    const totalSpent = participant.totalSpent || 0;
    
    const playersCountDiv = this.createStatDiv('Giocatori', playersCount.toString());
    const totalSpentDiv = this.createStatDiv('Speso', Utils.formatCurrency(totalSpent));
    const budgetLeftDiv = this.createStatDiv('Rimanente', Utils.formatCurrency(500 - totalSpent));
    
    stats.appendChild(playersCountDiv);
    stats.appendChild(totalSpentDiv);
    stats.appendChild(budgetLeftDiv);
    
    // Removed email display section
    
    card.appendChild(header);
    card.appendChild(stats);
    
    return card;
  }

  createStatDiv(label, value) {
    const statDiv = Utils.createElement('div', 'stat');
    const labelDiv = Utils.createElement('div', 'stat-label');
    labelDiv.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin-bottom: var(--space-1);
    `;
    labelDiv.textContent = label;
    
    const valueDiv = Utils.createElement('div', 'stat-value');
    valueDiv.style.cssText = `
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    `;
    valueDiv.textContent = value;
    
    statDiv.appendChild(labelDiv);
    statDiv.appendChild(valueDiv);
    return statDiv;
  }

  addParticipant() {
    const nameInput = document.getElementById('participantName');
    
    const name = nameInput.value.trim();
    
    if (!name) {
      this.services.notifications.show('warning', 'Campo obbligatorio', 'Il nome del partecipante è obbligatorio');
      return;
    }
    
    try {
      const participant = this.services.participants.addParticipant(name, '');
      this.services.notifications.show('success', 'Partecipante aggiunto', `${participant.name} è stato aggiunto alla lista`);
      
      // Clear inputs
      nameInput.value = '';
      
      // Refresh modal content intelligently - only update the participants list
      this.refreshParticipantsModal();
      
    } catch (error) {
      this.services.notifications.show('error', 'Errore', error.message);
    }
  }

  viewParticipantTeam(participant) {
    const players = this.services.participants.getParticipantPlayers(participant.id);
    const content = this.createParticipantTeamModal(participant, players);
    this.services.modals.show(`team-${participant.id}`, `🏆 Squadra di ${participant.name}`, content);
  }

  createParticipantTeamModal(participant, players) {
    const container = Utils.createElement('div', 'participant-team');
    
    if (players.length === 0) {
      const emptyMsg = Utils.createElement('p', '', 'Nessun giocatore assegnato');
      emptyMsg.style.cssText = `
        text-align: center;
        color: var(--color-gray-500);
        padding: var(--space-6);
      `;
      container.appendChild(emptyMsg);
    } else {
      // Team stats
      const statsDiv = Utils.createElement('div', 'team-stats');
      statsDiv.style.cssText = `
        background: var(--color-gray-50);
        padding: var(--space-4);
        border-radius: var(--border-radius-lg);
        margin-bottom: var(--space-4);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-4);
        text-align: center;
      `;
      
      const totalSpent = players.reduce((sum, p) => sum + (p.otherCost || 0), 0);
      const playersCountStat = this.createStatDiv('Giocatori', players.length.toString());
      const totalSpentStat = this.createStatDiv('Totale Speso', Utils.formatCurrency(totalSpent));
      const remainingStat = this.createStatDiv('Budget Rimanente', Utils.formatCurrency(500 - totalSpent));
      
      statsDiv.appendChild(playersCountStat);
      statsDiv.appendChild(totalSpentStat);
      statsDiv.appendChild(remainingStat);
      container.appendChild(statsDiv);
      
      // Players list
      const playersDiv = Utils.createElement('div', 'team-players');
      playersDiv.style.cssText = `
        display: grid;
        gap: var(--space-2);
        max-height: 400px;
        overflow-y: auto;
      `;
      
      players.forEach((player, index) => {
        const playerRow = Utils.createElement('div', 'team-player-row');
        playerRow.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3);
          background: ${index % 2 === 0 ? 'white' : 'var(--color-gray-50)'};
          border-radius: var(--border-radius-md);
        `;
        
        const playerInfo = Utils.createElement('div', 'player-info');
        playerInfo.innerHTML = `
          <div style="font-weight: var(--font-weight-semibold);">${player.nome}</div>
          <div style="font-size: var(--font-size-sm); color: var(--color-gray-600);">
            ${player.ruoli?.join('/') || ''} - ${player.squadra} - FVM: ${player.fvm}
          </div>
        `;
        
        const costDiv = Utils.createElement('div', 'player-cost');
        costDiv.style.cssText = `
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-600);
        `;
        costDiv.textContent = Utils.formatCurrency(player.otherCost || 0);
        
        playerRow.appendChild(playerInfo);
        playerRow.appendChild(costDiv);
        playersDiv.appendChild(playerRow);
      });
      
      container.appendChild(playersDiv);
    }
    
    return container;
  }

  editParticipant(participant) {
    const content = this.createEditParticipantModal(participant);
    this.services.modals.show(`edit-${participant.id}`, `✏️ Modifica ${participant.name}`, content);
  }

  createEditParticipantModal(participant) {
    const container = Utils.createElement('div', 'edit-participant');
    
    const form = Utils.createElement('div', 'edit-form');
    form.style.cssText = `
      display: grid;
      gap: var(--space-4);
    `;
    
    // Name input
    const nameGroup = Utils.createElement('div', 'form-group');
    const nameLabel = Utils.createElement('label', 'form-label', 'Nome:');
    const nameInput = Utils.createElement('input', 'form-control');
    nameInput.type = 'text';
    nameInput.value = participant.name;
    nameInput.id = `editName-${participant.id}`;
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    
    // Actions
    const actions = Utils.createElement('div', 'modal-actions');
    actions.style.cssText = `
      display: flex;
      gap: var(--space-3);
      justify-content: flex-end;
      margin-top: var(--space-4);
    `;
    
    const saveBtn = Utils.createElement('button', 'btn btn--success');
    saveBtn.textContent = '💾 Salva';
    saveBtn.addEventListener('click', () => this.saveParticipantEdit(participant.id));
    
    const cancelBtn = Utils.createElement('button', 'btn btn--secondary');
    cancelBtn.textContent = '❌ Annulla';
    cancelBtn.addEventListener('click', () => this.services.modals.hideAll());
    
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    
    form.appendChild(nameGroup);
    container.appendChild(form);
    container.appendChild(actions);
    
    return container;
  }

  saveParticipantEdit(participantId) {
    const nameInput = document.getElementById(`editName-${participantId}`);
    
    const name = nameInput.value.trim();
    
    if (!name) {
      this.services.notifications.show('warning', 'Campo obbligatorio', 'Il nome è obbligatorio');
      return;
    }
    
    const success = this.services.participants.updateParticipant(participantId, {
      name: name,
      email: ''
    });
    
    if (success) {
      this.services.notifications.show('success', 'Modifiche salvate', 'Partecipante aggiornato con successo');
      this.refreshParticipantsModal();
    } else {
      this.services.notifications.show('error', 'Errore', 'Impossibile aggiornare il partecipante');
    }
  }

  async deleteParticipant(participant) {
    const confirmed = await this.services.modals.confirm(
      '🗑️ Elimina Partecipante',
      `Sei sicuro di voler eliminare ${participant.name}? Tutti i suoi giocatori verranno liberati.`,
      {
        confirmText: 'Sì, elimina',
        cancelText: 'Annulla'
      }
    );
    
    if (confirmed) {
      const success = this.services.participants.removeParticipant(participant.id);
      if (success) {
        this.services.notifications.show('success', 'Partecipante eliminato', `${participant.name} è stato rimosso`);
        this.refreshParticipantsModal();
      } else {
        this.services.notifications.show('error', 'Errore', 'Impossibile eliminare il partecipante');
      }
    }
  }

  async exportToExcel() {
    try {
      await this.services.excel.exportPlayers(this.appData.players, `fantaaiuto_export_${Utils.formatDate(new Date())}.xlsx`);
    } catch (error) {
      this.services.notifications.show('error', 'Errore esportazione', error.message);
    }
  }

  async resetAll() {
    const confirmed = await this.services.modals.confirm(
      '🔄 Reset Completo',
      'Sei sicuro di voler cancellare tutti i dati? Questa operazione non può essere annullata.',
      {
        confirmText: 'Sì, cancella tutto',
        cancelText: 'Annulla'
      }
    );

    if (confirmed) {
      // Clear all data
      this.appData.players = [];
      this.appData.formations = [];
      this.appData.stats = {
        budgetUsed: 0,
        budgetRemaining: 500,
        playersOwned: 0,
        playersRemaining: 30,
        roleDistribution: { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 }
      };

      // Clear storage
      await this.services.storage.clear();

      // Update UI
      Utils.dispatchCustomEvent('fantaaiuto:dataReset');
      
      this.services.notifications.show('success', 'Reset completato', 'Tutti i dati sono stati cancellati');
    }
  }

  refreshParticipantsModal() {
    // Check if participants modal is currently open
    if (this.services.modals.isVisible('participants-modal')) {
      const participants = this.services.participants.getAllParticipants();
      const content = this.createParticipantsModal(participants);
      
      // Update modal content without closing/reopening
      const modalBody = document.querySelector('#participants-modal .modal-body');
      if (modalBody) {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
      }
    }
  }

  refreshOwnedPlayersModal() {
    // Check if owned players modal is currently open
    if (this.services.modals.isVisible('owned-players-modal')) {
      const ownedPlayers = this.services.players.getOwnedPlayers();
      if (ownedPlayers.length === 0) {
        this.services.modals.hide('owned-players-modal');
        this.services.notifications.show('info', 'Nessun giocatore', 'Non hai più giocatori acquistati');
        return;
      }
      
      const content = this.createOwnedPlayersModal(ownedPlayers);
      const modalBody = document.querySelector('#owned-players-modal .modal-body');
      if (modalBody) {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
      }
    }
  }

  update() {
    // Update button states if needed
  }
}