export class Utils {
  static sanitizeText(str) {
    if (!str || typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static validatePlayerName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.length < 1 || name.length > 100) return false;
    return /^[a-zA-ZÀ-ÿ\s'.-]+$/.test(name.trim());
  }

  static validateCredits(credits) {
    const num = parseInt(credits);
    return !isNaN(num) && num >= 0 && num <= 1000;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  static generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatDate(date) {
    return new Intl.DateTimeFormat('it-IT').format(date);
  }

  static formatDateTime(date) {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static normalizePlayerName(name) {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => this.capitalizeFirst(word))
      .join(' ');
  }

  static parseRole(roleStr) {
    if (!roleStr) return [];
    return roleStr
      .toString()
      .split(/[,;\/]/)
      .map(r => r.trim())
      .filter(r => ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'].includes(r));
  }

  static deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer ? reader.readAsArrayBuffer(file) : reader.readAsBinaryString(file);
    });
  }

  static getColorByRole(role) {
    const colors = {
      Por: 'var(--color-warning-500)',
      Ds: 'var(--color-success-500)',
      Dd: 'var(--color-success-500)',
      Dc: 'var(--color-success-500)',
      B: 'var(--color-success-500)',
      E: 'var(--color-info-500)',
      M: 'var(--color-info-500)',
      C: 'var(--color-info-500)',
      W: 'var(--color-info-500)',
      T: 'var(--color-danger-500)',
      A: 'var(--color-danger-500)',
      Pc: 'var(--color-danger-500)'
    };
    return colors[role] || 'var(--color-gray-500)';
  }

  // Enhanced role color system
  static getRoleColors() {
    return {
      // Portieri - Giallo/Oro
      'Por': {
        primary: '#f59e0b',
        light: '#fef3c7',
        dark: '#d97706',
        text: '#000000',
        background: 'rgba(245, 158, 11, 0.1)'
      },
      // Difensori - Verde
      'Ds': {
        primary: '#10b981',
        light: '#d1fae5', 
        dark: '#047857',
        text: '#ffffff',
        background: 'rgba(16, 185, 129, 0.1)'
      },
      'Dd': {
        primary: '#10b981',
        light: '#d1fae5',
        dark: '#047857', 
        text: '#ffffff',
        background: 'rgba(16, 185, 129, 0.1)'
      },
      'Dc': {
        primary: '#059669',
        light: '#a7f3d0',
        dark: '#065f46',
        text: '#ffffff',
        background: 'rgba(5, 150, 105, 0.1)'
      },
      'B': {
        primary: '#047857',
        light: '#6ee7b7',
        dark: '#064e3b',
        text: '#ffffff', 
        background: 'rgba(4, 120, 87, 0.1)'
      },
      // Centrocampisti - Blu
      'E': {
        primary: '#3b82f6',
        light: '#dbeafe',
        dark: '#1d4ed8',
        text: '#ffffff',
        background: 'rgba(59, 130, 246, 0.1)'
      },
      'M': {
        primary: '#2563eb',
        light: '#bfdbfe',
        dark: '#1e40af', 
        text: '#ffffff',
        background: 'rgba(37, 99, 235, 0.1)'
      },
      'C': {
        primary: '#1d4ed8',
        light: '#a5b4fc',
        dark: '#1e3a8a',
        text: '#ffffff',
        background: 'rgba(29, 78, 216, 0.1)'
      },
      'W': {
        primary: '#8b5cf6',
        light: '#ede9fe',
        dark: '#7c3aed',
        text: '#ffffff',
        background: 'rgba(139, 92, 246, 0.1)'
      },
      // Trequartisti - Violetto
      'T': {
        primary: '#a855f7',
        light: '#f3e8ff',
        dark: '#9333ea',
        text: '#ffffff',
        background: 'rgba(168, 85, 247, 0.1)'
      },
      'A': {
        primary: '#dc2626',
        light: '#fca5a5',
        dark: '#b91c1c',
        text: '#ffffff',
        background: 'rgba(220, 38, 38, 0.1)'
      },
      'Pc': {
        primary: '#b91c1c',
        light: '#f87171',
        dark: '#991b1b',
        text: '#ffffff',
        background: 'rgba(185, 28, 28, 0.1)'
      }
    };
  }

  static getRoleColor(role) {
    const colors = this.getRoleColors();
    return colors[role] || {
      primary: '#6b7280',
      light: '#f3f4f6',
      dark: '#4b5563', 
      text: '#ffffff',
      background: 'rgba(107, 114, 128, 0.1)'
    };
  }

  static getPrimaryRoleColor(roles) {
    if (!roles || !roles.length) return this.getRoleColor('');
    
    // Priority order for mixed roles (most specific first)
    const priority = ['Por', 'Pc', 'A', 'T', 'Dc', 'C', 'M', 'W', 'E', 'B', 'Ds', 'Dd'];
    
    for (const priorityRole of priority) {
      if (roles.includes(priorityRole)) {
        return this.getRoleColor(priorityRole);
      }
    }
    
    return this.getRoleColor(roles[0]);
  }

  static getRoleDisplayName(role) {
    const names = {
      'Por': 'Portieri',
      'Ds': 'Difensori Sinistri',
      'Dd': 'Difensori Destri',
      'Dc': 'Difensori Centrali', 
      'B': 'Braccetti',
      'E': 'Esterni',
      'M': 'Mediani',
      'C': 'Centrocampisti',
      'W': 'Ali',
      'T': 'Trequartisti',
      'A': 'Attaccanti',
      'Pc': 'Punte Centrali'
    };
    return names[role] || role;
  }

  static getPlayerTier(fvm) {
    if (fvm >= 20) return 'Top';
    if (fvm >= 10) return 'Titolari';
    if (fvm >= 5) return 'Low cost';
    if (fvm >= 1) return 'Jolly';
    return 'Riserve';
  }

  static getTierLabel(tier) {
    const labels = {
      top: 'Top',
      titolare: 'Titolare',
      lowcost: 'Low Cost',
      jolly: 'Jolly',
      riserva: 'Riserva',
      removed: 'Rimosso'
    };
    return labels[tier] || tier;
  }

  static sortPlayers(players, sortBy = 'fvm', order = 'desc') {
    return [...players].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  static filterPlayers(players, filters = {}) {
    return players.filter(player => {
      // Search filter
      if (filters.search && filters.search.trim()) {
        const search = filters.search.toLowerCase();
        const nameMatch = player.nome?.toLowerCase().includes(search);
        const teamMatch = player.squadra?.toLowerCase().includes(search);
        if (!nameMatch && !teamMatch) return false;
      }

      // Role filter
      if (filters.role && filters.role !== 'all') {
        if (!player.ruoli || !player.ruoli.includes(filters.role)) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'owned':
            if (player.status !== 'owned') return false;
            break;
          case 'interesting':
            if (!player.interessante) return false;
            break;
          case 'removed':
            if (!player.rimosso) return false;
            break;
          default:
            if (player.status !== filters.status) return false;
        }
      }

      // Tier filter
      if (filters.tier) {
        if (player.tier !== filters.tier) return false;
      }

      // FVM filters
      if (filters.minFvm && player.fvm < filters.minFvm) return false;
      if (filters.maxFvm && player.fvm > filters.maxFvm) return false;

      return true;
    });
  }

  static calculateTeamValue(players) {
    return players
      .filter(p => p.status === 'owned')
      .reduce((sum, p) => sum + (p.prezzo || 0), 0);
  }

  static validateFormation(formation, players) {
    const errors = [];
    
    if (!formation.nome || formation.nome.trim().length === 0) {
      errors.push('Nome formazione obbligatorio');
    }

    if (!formation.schema || !formation.schema.match(/^\d+-\d+-\d+$/)) {
      errors.push('Schema non valido (formato: X-X-X)');
    }

    const ownedPlayers = players.filter(p => p.status === 'owned');
    const formationPlayers = formation.giocatori || [];

    const roleCount = { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 };
    
    formationPlayers.forEach(playerId => {
      const player = ownedPlayers.find(p => p.id === playerId);
      if (player && player.ruoli.length > 0) {
        roleCount[player.ruoli[0]]++;
      }
    });

    if (roleCount.Por !== 1) {
      errors.push('La formazione deve avere esattamente 1 portiere');
    }

    const [defenders, midfielders, forwards] = formation.schema.split('-').map(Number);
    const totalDefenders = roleCount.Ds + roleCount.Dd + roleCount.Dc + roleCount.B;
    const totalMidfielders = roleCount.E + roleCount.M + roleCount.C + roleCount.W;
    const totalForwards = roleCount.T + roleCount.A + roleCount.Pc;
    
    if (totalDefenders < defenders) {
      errors.push(`Servono almeno ${defenders} difensori`);
    }
    if (totalMidfielders < midfielders) {
      errors.push(`Servono almeno ${midfielders} centrocampisti`);
    }
    if (totalForwards < forwards) {
      errors.push(`Servono almeno ${forwards} attaccanti`);
    }

    return errors;
  }

  static createElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static emptyElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  static addEventListenerOnce(element, event, handler) {
    const wrapper = (e) => {
      handler(e);
      element.removeEventListener(event, wrapper);
    };
    element.addEventListener(event, wrapper);
  }

  static createPlayerCard(player, actions = []) {
    const card = this.createElement('div', 'player-card');
    
    const header = this.createElement('div', 'player-header');
    const name = this.createElement('div', 'player-name', player.nome);
    const roles = this.createElement('div', 'player-role', player.ruoli.join('/'));
    
    header.appendChild(name);
    header.appendChild(roles);
    
    const info = this.createElement('div', 'player-info');
    
    const stats = [
      { label: 'FVM', value: player.fvm || 0 },
      { label: 'Prezzo', value: this.formatCurrency(player.prezzo || 0) },
      { label: 'Squadra', value: player.squadra || '' },
      { label: 'Tier', value: this.getTierLabel(this.getPlayerTier(player.fvm)) }
    ];

    stats.forEach(stat => {
      const statEl = this.createElement('div', 'player-stat');
      const labelEl = this.createElement('div', 'player-stat-label', stat.label);
      const valueEl = this.createElement('div', 'player-stat-value', stat.value);
      statEl.appendChild(labelEl);
      statEl.appendChild(valueEl);
      info.appendChild(statEl);
    });

    const actionsEl = this.createElement('div', 'player-actions');
    actions.forEach(action => {
      const btn = this.createElement('button', `player-btn ${action.class}`, action.text);
      btn.addEventListener('click', () => action.handler(player));
      actionsEl.appendChild(btn);
    });

    card.appendChild(header);
    card.appendChild(info);
    if (actions.length > 0) {
      card.appendChild(actionsEl);
    }

    return card;
  }

  static dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}