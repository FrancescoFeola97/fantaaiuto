import { Utils } from '../../utils/Utils.js';

export class DashboardComponent {
  constructor(appData, services) {
    this.appData = appData;
    this.services = services;
  }

  async init() {
    this.setupElements();
    this.update();
    return Promise.resolve();
  }

  setupElements() {
    this.budgetRemainingEl = document.getElementById('budget-remaining');
    this.budgetProgressEl = document.getElementById('budget-progress');
    this.playersCountEl = document.getElementById('players-count');
    this.playersProgressEl = document.getElementById('players-progress');
    this.roleCounts = {
      Por: document.getElementById('role-por'),
      Ds: document.getElementById('role-ds'),
      Dd: document.getElementById('role-dd'),
      Dc: document.getElementById('role-dc'),
      B: document.getElementById('role-b'),
      E: document.getElementById('role-e'),
      M: document.getElementById('role-m'),
      C: document.getElementById('role-c'),
      W: document.getElementById('role-w'),
      T: document.getElementById('role-t'),
      A: document.getElementById('role-a'),
      Pc: document.getElementById('role-pc')
    };
  }

  update() {
    this.updateBudgetCard();
    this.updatePlayersCard();
    this.updateRolesCard();
  }

  updateBudgetCard() {
    const stats = this.appData.stats;
    const remaining = stats.budgetRemaining || this.appData.settings.totalBudget;
    const used = stats.budgetUsed || 0;
    const total = this.appData.settings.totalBudget;
    const percentage = (used / total) * 100;

    if (this.budgetRemainingEl) {
      this.budgetRemainingEl.textContent = Utils.formatCurrency(remaining);
    }
    
    if (this.budgetProgressEl) {
      this.budgetProgressEl.style.width = `${percentage}%`;
    }
  }

  updatePlayersCard() {
    const stats = this.appData.stats;
    const owned = stats.playersOwned || 0;
    const max = this.appData.settings.maxPlayers;
    const percentage = (owned / max) * 100;

    if (this.playersCountEl) {
      this.playersCountEl.textContent = `${owned}/${max}`;
    }
    
    if (this.playersProgressEl) {
      this.playersProgressEl.style.width = `${percentage}%`;
    }
  }

  updateRolesCard() {
    const distribution = this.appData.stats.roleDistribution || { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 };
    
    Object.entries(this.roleCounts).forEach(([role, element]) => {
      if (element) {
        element.textContent = distribution[role] || 0;
      }
    });
  }


  onViewActive() {
    this.update();
  }
}