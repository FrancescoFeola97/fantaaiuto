import { Utils } from '../utils/Utils.js';

export class FormationManager {
  constructor(appData) {
    this.appData = appData;
    if (!this.appData.formations) {
      this.appData.formations = [];
    }
    if (!this.appData.formationImages) {
      this.appData.formationImages = [];
    }
  }

  async init() {
    return Promise.resolve();
  }

  createFormation(name, schema, players = {}) {
    const formation = {
      id: Utils.generateId(),
      name: Utils.sanitizeText(name),
      schema, // e.g. "3-5-2"
      players, // { P: [...], D: [...], C: [...], A: [...] }
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.appData.formations.push(formation);
    Utils.dispatchCustomEvent('fantaaiuto:formationCreated', { formation });
    return formation;
  }

  updateFormation(formationId, updates) {
    const formation = this.getFormation(formationId);
    if (!formation) return false;

    Object.assign(formation, updates);
    formation.lastModified = new Date().toISOString();
    
    Utils.dispatchCustomEvent('fantaaiuto:formationUpdated', { formation });
    return true;
  }

  deleteFormation(formationId) {
    const index = this.appData.formations.findIndex(f => f.id === formationId);
    if (index === -1) return false;

    const formation = this.appData.formations[index];
    this.appData.formations.splice(index, 1);

    Utils.dispatchCustomEvent('fantaaiuto:formationDeleted', { formation });
    return true;
  }

  getFormation(formationId) {
    return this.appData.formations.find(f => f.id === formationId);
  }

  getAllFormations() {
    return [...this.appData.formations];
  }

  saveFormationImage(imageData, name = '') {
    const image = {
      id: Utils.generateId(),
      name: Utils.sanitizeText(name) || `Formazione ${this.appData.formationImages.length + 1}`,
      imageData,
      uploadedAt: new Date().toISOString()
    };

    this.appData.formationImages.push(image);
    Utils.dispatchCustomEvent('fantaaiuto:formationImageSaved', { image });
    return image;
  }

  deleteFormationImage(imageId) {
    const index = this.appData.formationImages.findIndex(i => i.id === imageId);
    if (index === -1) return false;

    const image = this.appData.formationImages[index];
    this.appData.formationImages.splice(index, 1);

    Utils.dispatchCustomEvent('fantaaiuto:formationImageDeleted', { image });
    return true;
  }

  getFormationImage(imageId) {
    return this.appData.formationImages.find(i => i.id === imageId);
  }

  getAllFormationImages() {
    return [...this.appData.formationImages];
  }

  validateFormation(formation, ownedPlayers) {
    const errors = [];
    
    if (!formation.name || formation.name.trim().length === 0) {
      errors.push('Nome formazione obbligatorio');
    }

    if (!formation.schema || !formation.schema.match(/^\d+-\d+-\d+$/)) {
      errors.push('Schema non valido (formato: X-X-X)');
    }

    // Validate players assignment
    const totalPlayers = Object.values(formation.players || {}).flat().length;
    if (totalPlayers !== 11) {
      errors.push('La formazione deve avere esattamente 11 giocatori');
    }

    // Check if players are owned
    const requiredPlayers = Object.values(formation.players || {}).flat();
    const unavailablePlayers = requiredPlayers.filter(playerId => 
      !ownedPlayers.some(p => p.id === playerId)
    );

    if (unavailablePlayers.length > 0) {
      errors.push(`Giocatori non disponibili: ${unavailablePlayers.length}`);
    }

    return errors;
  }

  getFormationsBySchema(schema) {
    return this.appData.formations.filter(f => f.schema === schema);
  }

  exportFormationsData() {
    return {
      formations: this.appData.formations,
      formationImages: this.appData.formationImages,
      exportDate: new Date().toISOString()
    };
  }

  importFormationsData(data) {
    if (data.formations) {
      this.appData.formations = data.formations;
    }
    if (data.formationImages) {
      this.appData.formationImages = data.formationImages;
    }

    Utils.dispatchCustomEvent('fantaaiuto:formationsImported', { 
      formations: data.formations?.length || 0,
      images: data.formationImages?.length || 0
    });
    return true;
  }
}