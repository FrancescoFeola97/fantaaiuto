import { Utils } from '../utils/Utils.js';

export class ParticipantsManager {
  constructor(appData) {
    this.appData = appData;
    if (!this.appData.participants) {
      this.appData.participants = [];
    }
  }

  async init() {
    return Promise.resolve();
  }

  addParticipant(name, email = '') {
    if (!name || this.participantExists(name)) {
      throw new Error('Partecipante già esistente o nome vuoto');
    }

    const participant = {
      id: Utils.generateId(),
      name: Utils.sanitizeText(name.trim()),
      email: Utils.sanitizeText(email.trim()),
      players: [],
      totalSpent: 0,
      dateAdded: new Date().toISOString()
    };

    this.appData.participants.push(participant);

    Utils.dispatchCustomEvent('fantaaiuto:participantAdded', { participant });
    return participant;
  }

  removeParticipant(participantId) {
    const index = this.appData.participants.findIndex(p => p.id === participantId);
    if (index === -1) return false;

    // Remove participant's ownership from players
    this.appData.players.forEach(player => {
      if (player.ownedBy === participantId) {
        player.ownedBy = '';
        player.otherCost = 0;
      }
    });

    const participant = this.appData.participants[index];
    this.appData.participants.splice(index, 1);

    Utils.dispatchCustomEvent('fantaaiuto:participantRemoved', { participant });
    return true;
  }

  updateParticipant(participantId, updates) {
    const participant = this.getParticipant(participantId);
    if (!participant) return false;

    Object.assign(participant, updates);
    Utils.dispatchCustomEvent('fantaaiuto:participantUpdated', { participant });
    return true;
  }

  getParticipant(participantId) {
    return this.appData.participants.find(p => p.id === participantId);
  }

  getAllParticipants() {
    return [...this.appData.participants];
  }

  participantExists(name) {
    return this.appData.participants.some(p => 
      p.name.toLowerCase() === name.toLowerCase()
    );
  }

  assignPlayerToParticipant(playerId, participantId, cost = 0) {
    const player = this.appData.players.find(p => p.id === playerId);
    const participant = this.getParticipant(participantId);
    
    if (!player || !participant) return false;

    // Remove from previous owner if any
    if (player.ownedBy) {
      this.removePlayerFromParticipant(playerId, player.ownedBy);
    }

    player.ownedBy = participantId;
    player.otherCost = cost;
    player.status = 'owned_by_other';

    // Update participant's data
    if (!participant.players.includes(playerId)) {
      participant.players.push(playerId);
    }
    this.updateParticipantStats(participantId);

    Utils.dispatchCustomEvent('fantaaiuto:playerAssignedToParticipant', { 
      player, participant 
    });

    return true;
  }

  removePlayerFromParticipant(playerId, participantId) {
    const player = this.appData.players.find(p => p.id === playerId);
    const participant = this.getParticipant(participantId);
    
    if (!player || !participant) return false;

    player.ownedBy = '';
    player.otherCost = 0;
    player.status = 'available';

    const playerIndex = participant.players.indexOf(playerId);
    if (playerIndex > -1) {
      participant.players.splice(playerIndex, 1);
    }

    this.updateParticipantStats(participantId);

    Utils.dispatchCustomEvent('fantaaiuto:playerRemovedFromParticipant', { 
      player, participant 
    });

    return true;
  }

  updateParticipantStats(participantId) {
    const participant = this.getParticipant(participantId);
    if (!participant) return;

    participant.totalSpent = participant.players.reduce((total, playerId) => {
      const player = this.appData.players.find(p => p.id === playerId);
      return total + (player?.otherCost || 0);
    }, 0);

    participant.roleDistribution = { Por: 0, Ds: 0, Dd: 0, Dc: 0, B: 0, E: 0, M: 0, C: 0, W: 0, T: 0, A: 0, Pc: 0 };
    participant.players.forEach(playerId => {
      const player = this.appData.players.find(p => p.id === playerId);
      if (player && player.ruoli.length > 0) {
        player.ruoli.forEach(role => {
          if (participant.roleDistribution.hasOwnProperty(role)) {
            participant.roleDistribution[role]++;
          }
        });
      }
    });
  }

  getParticipantPlayers(participantId) {
    const participant = this.getParticipant(participantId);
    if (!participant) return [];

    return participant.players.map(playerId => 
      this.appData.players.find(p => p.id === playerId)
    ).filter(Boolean);
  }

  getAvailablePlayersForParticipants() {
    return this.appData.players.filter(p => 
      p.status === 'available' && !p.rimosso
    );
  }

  exportParticipantsData() {
    return {
      participants: this.appData.participants.map(participant => ({
        ...participant,
        players: this.getParticipantPlayers(participant.id)
      })),
      exportDate: new Date().toISOString()
    };
  }

  importParticipantsData(data) {
    if (!data.participants) return false;

    this.appData.participants = data.participants.map(p => ({
      id: p.id || Utils.generateId(),
      name: p.name,
      email: p.email || '',
      players: [],
      totalSpent: 0,
      dateAdded: p.dateAdded || new Date().toISOString()
    }));

    // Reassign players
    data.participants.forEach(participantData => {
      if (participantData.players) {
        participantData.players.forEach(playerData => {
          const player = this.appData.players.find(p => 
            p.nome === playerData.nome || p.id === playerData.id
          );
          if (player) {
            this.assignPlayerToParticipant(
              player.id, 
              participantData.id, 
              playerData.otherCost || 0
            );
          }
        });
      }
    });

    Utils.dispatchCustomEvent('fantaaiuto:participantsImported', { 
      count: this.appData.participants.length 
    });

    return true;
  }
}