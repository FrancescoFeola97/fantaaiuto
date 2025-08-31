import { Utils } from '../utils/Utils.js';
import { apiClient } from './ApiClient.js';
import { authManager } from './AuthManager.js';

export class PlayerManager {
  constructor(appData) {
    this.appData = appData;
    this.isOnline = true; // Will be set based on backend availability
  }

  async init() {
    // Check if backend is available
    try {
      await apiClient.healthCheck();
      this.isOnline = true;
      console.log('🌐 Backend is available - using online mode');
      
      // Load players from backend if authenticated
      if (authManager.isUserAuthenticated()) {
        await this.syncFromBackend();
      }
    } catch (error) {
      this.isOnline = false;
      console.warn('⚠️ Backend unavailable - using offline mode');
    }
    
    return Promise.resolve();
  }

  // Sync players from backend
  async syncFromBackend() {
    if (!this.isOnline || !authManager.isUserAuthenticated()) {
      return;
    }

    try {
      const response = await apiClient.getPlayers();
      this.appData.players = response.players;
      
      console.log(`📊 Synced ${response.players.length} players from backend`);
      
      Utils.dispatchCustomEvent('fantaaiuto:playersSynced', {
        players: response.players.length
      });
      
      return response.players;
    } catch (error) {
      console.error('❌ Failed to sync players from backend:', error);
      throw error;
    }
  }

  // Sync stats from backend
  async syncStatsFromBackend() {
    if (!this.isOnline || !authManager.isUserAuthenticated()) {
      this.updateStats(); // Fall back to local calculation
      return;
    }

    try {
      const stats = await apiClient.getPlayersStats();
      this.appData.stats = stats;
      
      Utils.dispatchCustomEvent('fantaaiuto:statsUpdated', { stats });
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to sync stats from backend:', error);
      this.updateStats(); // Fall back to local calculation
    }
  }

  async importPlayers(newPlayers) {
    // If online and authenticated, use backend
    if (this.isOnline && authManager.isUserAuthenticated()) {
      return this.importPlayersOnline(newPlayers, '1');
    }
    
    // Otherwise fall back to offline mode
    return this.importPlayersOffline(newPlayers);
  }

  async importPlayersOnline(newPlayers, mode = '1') {
    try {
      const response = await apiClient.importPlayers(newPlayers, mode);
      
      // Refresh local data from backend
      await this.syncFromBackend();
      await this.syncStatsFromBackend();
      
      Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
        total: response.total,
        added: response.imported,
        updated: response.updated,
        mode: response.mode
      });
      
      return response.imported + response.updated;
    } catch (error) {
      console.error('❌ Failed to import players online:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  async importPlayersOffline(newPlayers) {
    const existingNames = new Set(this.appData.players.map(p => p.nome.toLowerCase()));
    const uniquePlayers = newPlayers.filter(player => 
      !existingNames.has(player.nome.toLowerCase())
    );

    this.appData.players.push(...uniquePlayers);
    this.updateStats();
    
    Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
      total: newPlayers.length,
      added: uniquePlayers.length,
      duplicates: newPlayers.length - uniquePlayers.length
    });

    return uniquePlayers.length;
  }

  async importPlayersWithFVMDistribution(newPlayers) {
    // Clear existing players and load with FVM-based tier distribution
    this.appData.players = [];
    
    let loadedCount = 0;
    newPlayers.forEach(player => {
      if (player.fvm >= 1) {
        // Assign tier based on FVM
        if (player.fvm >= 20) {
          player.tier = 'Top';
        } else if (player.fvm >= 10) {
          player.tier = 'Titolari';
        } else if (player.fvm >= 5) {
          player.tier = 'Low cost';
        } else if (player.fvm >= 2) {
          player.tier = 'Jolly';
        } else {
          player.tier = 'Riserve';
        }
        
        this.appData.players.push(player);
        loadedCount++;
      }
    });

    this.updateStats();
    
    Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
      total: newPlayers.length,
      added: loadedCount,
      mode: 'fvm_distribution'
    });

    return loadedCount;
  }

  async importPlayersWithFVMDistributionAndRemoval(newPlayers) {
    // Clear existing players and load with FVM-based distribution, removing FVM=1
    this.appData.players = [];
    
    let loadedCount = 0;
    let removedCount = 0;

    newPlayers.forEach(player => {
      if (player.fvm === 1) {
        // Mark as removed
        player.rimosso = true;
        player.status = 'removed';
        removedCount++;
      } else if (player.fvm > 1) {
        // Assign tier based on FVM
        if (player.fvm >= 20) {
          player.tier = 'Top';
        } else if (player.fvm >= 10) {
          player.tier = 'Titolari';
        } else if (player.fvm >= 5) {
          player.tier = 'Low cost';
        } else {
          player.tier = 'Jolly';
        }
        
        this.appData.players.push(player);
        loadedCount++;
      }
    });

    this.updateStats();
    
    Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
      total: newPlayers.length,
      added: loadedCount,
      removed: removedCount,
      mode: 'fvm_distribution_with_removal'
    });

    return loadedCount;
  }

  async importPlayersToNonInseriti(newPlayers) {
    // Clear existing players and load all to "Non inseriti" tier
    this.appData.players = [];
    
    let loadedCount = 0;
    newPlayers.forEach(player => {
      player.tier = 'Non inseriti';
      this.appData.players.push(player);
      loadedCount++;
    });

    this.updateStats();
    
    Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
      total: newPlayers.length,
      added: loadedCount,
      mode: 'all_to_non_inseriti'
    });

    return loadedCount;
  }

  async importPlayersToNonInseritiWithRemoval(newPlayers) {
    // Clear existing players, load all to "Non inseriti", remove FVM=1
    this.appData.players = [];
    
    let loadedCount = 0;
    let removedCount = 0;

    newPlayers.forEach(player => {
      if (player.fvm === 1) {
        // Mark as removed
        player.rimosso = true;
        player.status = 'removed';
        removedCount++;
      } else {
        player.tier = 'Non inseriti';
        this.appData.players.push(player);
        loadedCount++;
      }
    });

    this.updateStats();
    
    Utils.dispatchCustomEvent('fantaaiuto:playersImported', {
      total: newPlayers.length,
      added: loadedCount,
      removed: removedCount,
      mode: 'non_inseriti_with_removal'
    });

    return loadedCount;
  }

  updatePlayer(playerData) {
    const index = this.appData.players.findIndex(p => p.id === playerData.id);
    if (index !== -1) {
      this.appData.players[index] = { ...this.appData.players[index], ...playerData };
      this.updateStats();
      
      Utils.dispatchCustomEvent('fantaaiuto:playerUpdated', {
        player: this.appData.players[index]
      });
    }
  }

  getPlayer(id) {
    return this.appData.players.find(p => p.id === id);
  }

  getPlayersByRole(role) {
    return this.appData.players.filter(p => p.ruoli.includes(role) && !p.rimosso);
  }

  getPlayersByStatus(status) {
    return this.appData.players.filter(p => p.status === status && !p.rimosso);
  }

  getOwnedPlayers() {
    return this.getPlayersByStatus('owned');
  }

  getInterestingPlayers() {
    return this.appData.players.filter(p => p.interessante && !p.rimosso);
  }

  // Method to get all active (non-removed) players
  getActivePlayers() {
    return this.appData.players.filter(p => !p.rimosso);
  }

  getRemovedPlayers() {
    return this.appData.players.filter(p => p.rimosso === true);
  }

  async setPlayerStatus(playerId, status, additionalData = {}) {
    // If online and authenticated, update via backend
    if (this.isOnline && authManager.isUserAuthenticated()) {
      return this.setPlayerStatusOnline(playerId, status, additionalData);
    }
    
    // Otherwise update locally
    return this.setPlayerStatusOffline(playerId, status, additionalData);
  }

  async setPlayerStatusOnline(playerId, status, additionalData = {}) {
    try {
      const response = await apiClient.updatePlayerStatus(
        playerId, 
        status, 
        additionalData.costoReale || 0, 
        additionalData.note || null
      );
      
      // Update local player data
      const player = this.getPlayer(playerId);
      if (player) {
        const oldStatus = player.status;
        player.status = status;
        
        if (status === 'owned') {
          player.interessante = false;
          player.rimosso = false;
          player.dataAcquisto = new Date().toISOString();
          player.costoReale = additionalData.costoReale || player.prezzo || 0;
        } else if (status === 'removed') {
          player.rimosso = true;
          player.dataRimozione = new Date().toISOString();
        } else if (status === 'interesting') {
          player.interessante = true;
        }
        
        Object.assign(player, additionalData);
        
        Utils.dispatchCustomEvent('fantaaiuto:playerStatusChanged', {
          player,
          oldStatus,
          newStatus: status
        });
      }
      
      // Refresh stats from backend
      await this.syncStatsFromBackend();
      
      return response;
    } catch (error) {
      console.error('❌ Failed to update player status online:', error);
      throw new Error(`Status update failed: ${error.message}`);
    }
  }

  setPlayerStatusOffline(playerId, status, additionalData = {}) {
    const player = this.getPlayer(playerId);
    if (player) {
      const oldStatus = player.status;
      player.status = status;
      
      if (status === 'owned') {
        player.interessante = false;
        player.rimosso = false;
        player.dataAcquisto = new Date().toISOString();
        player.costoReale = additionalData.costoReale || player.prezzo || 0;
        player.proprietario = null;
        player.costoAltri = 0;
      } else if (status === 'taken') {
        player.proprietario = additionalData.proprietario || null;
        player.costoAltri = additionalData.costoAltri || 0;
        player.costoReale = 0;
        player.interessante = false;
        player.rimosso = false;
        player.dataAcquisto = null;
      } else if (status === 'available') {
        player.dataAcquisto = null;
        player.costoReale = 0;
        player.costoAltri = 0;
        player.proprietario = null;
      } else if (status === 'removed') {
        player.rimosso = true;
        player.dataRimozione = new Date().toISOString();
      } else if (status === 'interesting') {
        player.interessante = true;
      }
      
      // Apply any additional data
      Object.assign(player, additionalData);

      this.updateStats();
      
      Utils.dispatchCustomEvent('fantaaiuto:playerStatusChanged', {
        player,
        oldStatus,
        newStatus: status
      });
    }
  }

  toggleInteresting(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.interessante = !player.interessante;
      
      Utils.dispatchCustomEvent('fantaaiuto:playerInterestChanged', {
        player,
        interesting: player.interessante
      });
    }
  }

  removePlayer(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.rimosso = true;
      player.status = 'removed';
      player.dataRimozione = new Date().toISOString();
      
      this.updateStats();
      
      Utils.dispatchCustomEvent('fantaaiuto:playerRemoved', {
        player
      });
    }
  }

  restorePlayer(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.rimosso = false;
      player.status = 'available';
      player.dataRimozione = null;
      
      this.updateStats();
      
      Utils.dispatchCustomEvent('fantaaiuto:playerRestored', {
        player
      });
    }
  }

  updateStats() {
    const ownedPlayers = this.getOwnedPlayers();
    
    this.appData.stats = {
      budgetUsed: ownedPlayers.reduce((sum, p) => sum + (p.prezzo || 0), 0),
      budgetRemaining: this.appData.settings.totalBudget - ownedPlayers.reduce((sum, p) => sum + (p.prezzo || 0), 0),
      playersOwned: ownedPlayers.length,
      playersRemaining: this.appData.settings.maxPlayers - ownedPlayers.length,
      roleDistribution: this.calculateRoleDistribution(ownedPlayers),
      averageValue: ownedPlayers.length > 0 ? 
        ownedPlayers.reduce((sum, p) => sum + (p.fvm || 0), 0) / ownedPlayers.length : 0,
      totalValue: ownedPlayers.reduce((sum, p) => sum + (p.fvm || 0), 0)
    };
  }

  calculateRoleDistribution(players) {
    const distribution = { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 };
    
    players.forEach(player => {
      if (player.ruoli && player.ruoli.length > 0) {
        // Count all roles the player can play
        player.ruoli.forEach(role => {
          if (distribution.hasOwnProperty(role)) {
            distribution[role]++;
          }
        });
      }
    });

    return distribution;
  }

  getStats() {
    return this.appData.stats;
  }

  searchPlayers(query, filters = {}) {
    // Start with active players only (exclude removed players)
    let results = this.getActivePlayers();

    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(player => 
        player.nome.toLowerCase().includes(searchTerm) ||
        player.squadra.toLowerCase().includes(searchTerm)
      );
    }

    return Utils.filterPlayers(results, filters);
  }

  getPlayersByTier() {
    const tiers = {
      top: [],
      titolare: [],
      lowcost: [],
      jolly: [],
      riserva: []
    };

    this.getActivePlayers().forEach(player => {
      const tier = Utils.getPlayerTier(player.fvm);
      if (tiers[tier]) {
        tiers[tier].push(player);
      }
    });

    return tiers;
  }

  validateSquad() {
    const ownedPlayers = this.getOwnedPlayers();
    const errors = [];
    const stats = this.getStats();

    if (stats.budgetUsed > this.appData.settings.totalBudget) {
      errors.push(`Budget superato: ${stats.budgetUsed}/${this.appData.settings.totalBudget}`);
    }

    if (stats.playersOwned > this.appData.settings.maxPlayers) {
      errors.push(`Troppi giocatori: ${stats.playersOwned}/${this.appData.settings.maxPlayers}`);
    }

    const roleRequirements = this.appData.settings.roles;
    Object.entries(roleRequirements).forEach(([role, required]) => {
      const owned = stats.roleDistribution[role] || 0;
      if (owned > required) {
        errors.push(`Troppi ${role}: ${owned}/${required}`);
      }
    });

    return errors;
  }

  getRecommendations() {
    const ownedPlayers = this.getOwnedPlayers();
    const stats = this.getStats();
    const recommendations = [];

    const roleNeeds = {};
    Object.entries(this.appData.settings.roles).forEach(([role, required]) => {
      const owned = stats.roleDistribution[role] || 0;
      if (owned < required) {
        roleNeeds[role] = required - owned;
      }
    });

    if (Object.keys(roleNeeds).length > 0) {
      const availableBudget = stats.budgetRemaining;
      const remainingSlots = stats.playersRemaining;

      Object.entries(roleNeeds).forEach(([role, needed]) => {
        const availablePlayers = this.getPlayersByRole(role)
          .filter(p => p.status === 'available' && !p.rimosso)
          .filter(p => p.prezzo <= availableBudget / remainingSlots)
          .sort((a, b) => (b.fvm || 0) - (a.fvm || 0))
          .slice(0, needed);

        if (availablePlayers.length > 0) {
          recommendations.push({
            type: 'role_need',
            role,
            needed,
            players: availablePlayers.slice(0, 3)
          });
        }
      });
    }

    const interestingDeals = this.appData.players
      .filter(p => p.status === 'available' && !p.rimosso)
      .filter(p => p.fvm > 15 && p.prezzo < 10)
      .sort((a, b) => (b.fvm || 0) - (a.fvm || 0))
      .slice(0, 5);

    if (interestingDeals.length > 0) {
      recommendations.push({
        type: 'good_deals',
        players: interestingDeals
      });
    }

    return recommendations;
  }

  exportPlayerData() {
    return {
      players: this.appData.players.map(player => ({...player})),
      stats: {...this.appData.stats},
      exportDate: new Date().toISOString()
    };
  }

  // Player removal and restoration methods
  removePlayer(playerId) {
    const player = this.appData.players.find(p => p.id === playerId);
    if (player) {
      player.rimosso = true;
      player.removedDate = new Date().toISOString();
      // Reset status quando rimosso
      player.status = 'available';
      player.interessante = false;
      player.costoReale = 0;
      player.costoAltri = 0;
      player.proprietario = null;
      
      this.saveData();
      this.emitUpdate();
      return true;
    }
    return false;
  }

  restorePlayer(playerId) {
    const player = this.appData.players.find(p => p.id === playerId);
    if (player && player.rimosso) {
      player.rimosso = false;
      delete player.removedDate;
      
      this.saveData();
      this.emitUpdate();
      return true;
    }
    return false;
  }

  getRemovedPlayers() {
    return this.appData.players.filter(p => p.rimosso === true);
  }

  getRemovedPlayersByTeam() {
    const removedPlayers = this.getRemovedPlayers();
    const grouped = {};
    
    removedPlayers.forEach(player => {
      const team = player.squadra || 'Sconosciuta';
      if (!grouped[team]) {
        grouped[team] = [];
      }
      grouped[team].push(player);
    });

    // Ordina per squadra e poi per nome
    Object.keys(grouped).forEach(team => {
      grouped[team].sort((a, b) => a.nome.localeCompare(b.nome));
    });

    return grouped;
  }

  searchRemovedPlayers(query) {
    if (!query.trim()) {
      return this.getRemovedPlayers();
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return this.getRemovedPlayers().filter(player => 
      player.nome.toLowerCase().includes(normalizedQuery) ||
      (player.squadra && player.squadra.toLowerCase().includes(normalizedQuery))
    );
  }

  filterRemovedPlayers(filters = {}) {
    let players = this.getRemovedPlayers();
    
    if (filters.team) {
      players = players.filter(p => p.squadra === filters.team);
    }
    
    if (filters.role) {
      players = players.filter(p => p.ruoli && p.ruoli.includes(filters.role));
    }
    
    return players;
  }
}