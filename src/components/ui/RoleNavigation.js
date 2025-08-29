import { Utils } from '../../utils/Utils.js';

export class RoleNavigationComponent {
  constructor(appData, services) {
    this.appData = appData;
    this.services = services;
    this.roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc']; // Detailed roles from original Excel
    this.tiers = [
      { key: 'Top', label: '🏆 Top', color: 'var(--color-danger-500)' },
      { key: 'Titolari', label: '⭐ Titolari', color: 'var(--color-success-500)' },
      { key: 'Low cost', label: '💰 Low Cost', color: 'var(--color-warning-500)' },
      { key: 'Jolly', label: '🃏 Jolly', color: 'var(--color-info-500)' },
      { key: 'Riserve', label: '🔄 Riserve', color: 'var(--color-gray-500)' },
      { key: 'Non inseriti', label: '📝 Non Inseriti', color: 'var(--color-gray-400)' }
    ];
    this.currentSelection = { role: null, tier: null };
  }

  async init() {
    this.container = document.getElementById('roleNavigation');
    if (!this.container) {
      console.warn('Role navigation container not found');
      return;
    }

    this.render();
    this.setupEventListeners();
    return Promise.resolve();
  }

  render() {
    if (!this.container) return;

    Utils.emptyElement(this.container);

    // Add "All Players" option
    const allItem = this.createRoleNavItem('all', '👥 Tutti i Giocatori', this.getAllPlayersCount());
    this.container.appendChild(allItem);

    // Add role navigation
    this.roles.forEach(role => {
      const roleItem = this.createRoleNavItem(role, this.getRoleLabel(role), this.getRoleCount(role));
      this.container.appendChild(roleItem);

      // Add tier sub-navigation for this role
      const tierContainer = this.createTierContainer(role);
      this.container.appendChild(tierContainer);
    });
  }

  createRoleNavItem(role, label, count) {
    const item = Utils.createElement('div', 'role-nav-item');
    const button = Utils.createElement('button', 'role-nav-button');
    button.dataset.role = role;
    
    // Apply role colors
    this.applyRoleColors(button, role);
    
    if (this.currentSelection.role === role) {
      button.classList.add('active');
    }

    const labelSpan = Utils.createElement('span', '', label);
    const countSpan = Utils.createElement('span', 'role-nav-count', count.toString());

    button.appendChild(labelSpan);
    button.appendChild(countSpan);
    item.appendChild(button);

    return item;
  }

  applyRoleColors(button, role) {
    if (role === 'all') return; // Skip coloring for "All Players" button
    
    const roleColor = Utils.getRoleColor(role);
    
    // Apply background gradient and border
    button.style.background = `linear-gradient(135deg, ${roleColor.background}, rgba(255, 255, 255, 0.9))`;
    button.style.borderLeft = `3px solid ${roleColor.primary}`;
    button.style.color = '#374151'; // Dark gray for better readability
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = `linear-gradient(135deg, ${roleColor.light}, rgba(255, 255, 255, 0.95))`;
      button.style.transform = 'translateX(2px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = `linear-gradient(135deg, ${roleColor.background}, rgba(255, 255, 255, 0.9))`;
      button.style.transform = 'translateX(0)';
    });
    
    // Active state enhancement
    if (button.classList.contains('active')) {
      button.style.background = `linear-gradient(135deg, ${roleColor.light}, ${roleColor.primary}20)`;
      button.style.borderLeft = `4px solid ${roleColor.primary}`;
      button.style.fontWeight = '600';
    }
  }

  createTierContainer(role) {
    const container = Utils.createElement('div', 'tier-container');
    container.dataset.role = role;
    container.style.display = this.currentSelection.role === role ? 'block' : 'none';

    this.tiers.forEach(tier => {
      const tierItem = this.createTierNavItem(role, tier.key, tier.label, this.getTierCount(role, tier.key));
      container.appendChild(tierItem);
    });

    return container;
  }

  createTierNavItem(role, tier, label, count) {
    const item = Utils.createElement('div', 'tier-nav-item');
    const button = Utils.createElement('button', 'tier-nav-button');
    button.dataset.role = role;
    button.dataset.tier = tier;
    
    if (this.currentSelection.role === role && this.currentSelection.tier === tier) {
      button.classList.add('active');
    }

    const labelSpan = Utils.createElement('span', '', label);
    const countSpan = Utils.createElement('span', 'role-nav-count', count.toString());

    button.appendChild(labelSpan);
    button.appendChild(countSpan);
    item.appendChild(button);

    return item;
  }

  setupEventListeners() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      const roleButton = e.target.closest('.role-nav-button');
      const tierButton = e.target.closest('.tier-nav-button');

      if (roleButton) {
        this.handleRoleClick(roleButton);
      } else if (tierButton) {
        this.handleTierClick(tierButton);
      }
    });

    // Listen for data changes to update counts
    document.addEventListener('fantaaiuto:playersImported', () => this.update());
    document.addEventListener('fantaaiuto:playerUpdated', () => this.update());
    document.addEventListener('fantaaiuto:playerStatusChanged', () => this.update());
  }

  handleRoleClick(button) {
    const role = button.dataset.role;
    console.log('RoleNavigation: Role clicked:', role);
    
    // Update selection
    if (this.currentSelection.role === role) {
      // Collapse if clicking same role
      this.currentSelection.role = null;
      this.currentSelection.tier = null;
    } else {
      this.currentSelection.role = role;
      this.currentSelection.tier = null;
    }

    console.log('RoleNavigation: New selection:', this.currentSelection);

    // Update UI
    this.updateActiveStates();
    this.toggleTierContainers();

    // Dispatch filter event
    const filterEvent = {
      role: this.currentSelection.role,
      tier: this.currentSelection.tier
    };
    console.log('RoleNavigation: Dispatching filter event:', filterEvent);
    
    Utils.dispatchCustomEvent('fantaaiuto:navigationFilter', filterEvent);
  }

  handleTierClick(button) {
    const role = button.dataset.role;
    const tier = button.dataset.tier;

    this.currentSelection.role = role;
    this.currentSelection.tier = tier;

    this.updateActiveStates();

    // Dispatch filter event
    Utils.dispatchCustomEvent('fantaaiuto:navigationFilter', {
      role: this.currentSelection.role,
      tier: this.currentSelection.tier
    });
  }

  updateActiveStates() {
    // Update role buttons
    this.container.querySelectorAll('.role-nav-button').forEach(button => {
      const isActive = button.dataset.role === this.currentSelection.role;
      button.classList.toggle('active', isActive);
      
      // Re-apply active styles with colors
      const role = button.dataset.role;
      if (role !== 'all' && isActive) {
        const roleColor = Utils.getRoleColor(role);
        button.style.background = `linear-gradient(135deg, ${roleColor.light}, ${roleColor.primary}20)`;
        button.style.borderLeft = `4px solid ${roleColor.primary}`;
        button.style.fontWeight = '600';
      } else if (role !== 'all') {
        const roleColor = Utils.getRoleColor(role);
        button.style.background = `linear-gradient(135deg, ${roleColor.background}, rgba(255, 255, 255, 0.9))`;
        button.style.borderLeft = `3px solid ${roleColor.primary}`;
        button.style.fontWeight = '400';
      }
    });

    // Update tier buttons
    this.container.querySelectorAll('.tier-nav-button').forEach(button => {
      button.classList.toggle('active', 
        button.dataset.role === this.currentSelection.role && 
        button.dataset.tier === this.currentSelection.tier
      );
    });
  }

  toggleTierContainers() {
    this.container.querySelectorAll('.tier-container').forEach(container => {
      container.style.display = container.dataset.role === this.currentSelection.role ? 'block' : 'none';
    });
  }

  getRoleLabel(role) {
    const labels = {
      'Por': '🥅 Portieri (Por)',
      'Ds': '🛡️ Difensori Sx (Ds)',
      'Dd': '🛡️ Difensori Dx (Dd)', 
      'Dc': '🛡️ Difensori Centrali (Dc)',
      'B': '🛡️ Braccetto (B)',
      'E': '⚽ Esterni (E)',
      'M': '⚽ Mediani (M)',
      'C': '⚽ Centrocampisti (C)',
      'W': '⚽ Ali (W)',
      'T': '🚀 Trequartisti (T)',
      'A': '🚀 Attaccanti (A)',
      'Pc': '🚀 Punte Centrali (Pc)'
    };
    return labels[role] || role;
  }

  getAllPlayersCount() {
    return this.appData.players.length;
  }

  getRoleCount(role) {
    if (role === 'all') return this.getAllPlayersCount();
    return this.appData.players.filter(p => p.ruoli.includes(role)).length;
  }

  getTierCount(role, tier) {
    return this.appData.players.filter(p => 
      p.ruoli.includes(role) && p.tier === tier
    ).length;
  }

  update() {
    this.render();
  }

  getSelectedFilter() {
    return {
      role: this.currentSelection.role,
      tier: this.currentSelection.tier
    };
  }

  clearSelection() {
    this.currentSelection.role = null;
    this.currentSelection.tier = null;
    this.updateActiveStates();
    this.toggleTierContainers();
  }
}