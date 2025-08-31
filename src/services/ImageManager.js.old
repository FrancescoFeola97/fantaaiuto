import { Utils } from '../utils/Utils.js';

export class ImageManager {
  constructor(modalManager = null, notificationManager = null) {
    this.modalManager = modalManager;
    this.notificationManager = notificationManager;
    this.formationImages = [];
  }

  async init() {
    return true;
  }

  async showFormationImageModal() {
    if (!this.modalManager) {
      console.warn('Modal manager not available for formation image modal');
      return;
    }

    const content = this.createFormationImageContent();
    await this.modalManager.show('formation-image-modal', '📸 Gestione Immagini Formazioni', content);
  }

  createFormationImageContent() {
    const container = Utils.createElement('div', 'formation-image-content');
    
    const uploadSection = Utils.createElement('div', 'upload-section');
    uploadSection.style.cssText = `
      text-align: center;
      padding: var(--space-6);
      border: 2px dashed var(--color-gray-300);
      border-radius: var(--border-radius-lg);
      margin-bottom: var(--space-6);
    `;

    const instructions = Utils.createElement('p', '', 'Carica un\'immagine della formazione (JPG, PNG, JPEG)');
    instructions.style.cssText = `
      color: var(--color-gray-600);
      margin-bottom: var(--space-4);
    `;

    const fileInput = Utils.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'formation-image-input';
    fileInput.style.cssText = `
      margin-bottom: var(--space-4);
    `;

    const uploadBtn = Utils.createElement('button', 'btn btn-primary', 'Carica Immagine');
    uploadBtn.addEventListener('click', () => this.handleImageUpload());

    uploadSection.appendChild(instructions);
    uploadSection.appendChild(fileInput);
    uploadSection.appendChild(uploadBtn);

    const imagesContainer = Utils.createElement('div', 'formation-images-container');
    imagesContainer.id = 'formation-images-list';
    
    const imagesTitle = Utils.createElement('h3', '', 'Immagini Caricate');
    imagesTitle.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-800);
    `;

    container.appendChild(uploadSection);
    container.appendChild(imagesTitle);
    container.appendChild(imagesContainer);

    this.renderFormationImages(imagesContainer);

    return container;
  }

  async handleImageUpload() {
    const fileInput = document.getElementById('formation-image-input');
    const file = fileInput?.files?.[0];

    if (!file) {
      this.notificationManager?.show('error', 'Errore', 'Seleziona un file immagine prima di procedere');
      return;
    }

    if (!this.isValidImageFile(file)) {
      this.notificationManager?.show('error', 'Errore', 'Il file selezionato non è un\'immagine valida');
      return;
    }

    try {
      const imageData = await this.processImageFile(file);
      
      const imageRecord = {
        id: Utils.generateId(),
        nome: file.name,
        tipo: file.type,
        dimensione: file.size,
        dataCaricamento: new Date().toISOString(),
        dataUrl: imageData
      };

      this.formationImages.push(imageRecord);
      
      this.renderFormationImages(document.getElementById('formation-images-list'));
      
      fileInput.value = '';
      
      this.notificationManager?.show('success', 'Successo', 'Immagine caricata con successo!');
      
      Utils.dispatchCustomEvent('fantaaiuto:imageUploaded', { image: imageRecord });

    } catch (error) {
      console.error('Error processing image:', error);
      this.notificationManager?.show('error', 'Errore', 'Errore durante il caricamento dell\'immagine');
    }
  }

  isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      this.notificationManager?.show('error', 'Errore', 'L\'immagine è troppo grande (max 5MB)');
      return false;
    }

    return true;
  }

  async processImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  renderFormationImages(container) {
    Utils.emptyElement(container);

    if (this.formationImages.length === 0) {
      const emptyState = Utils.createElement('div', 'empty-state');
      emptyState.style.cssText = `
        text-align: center;
        padding: var(--space-8);
        color: var(--color-gray-500);
      `;
      emptyState.textContent = 'Nessuna immagine caricata';
      container.appendChild(emptyState);
      return;
    }

    const grid = Utils.createElement('div', 'images-grid');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--space-4);
    `;

    this.formationImages.forEach(image => {
      const imageCard = this.createImageCard(image);
      grid.appendChild(imageCard);
    });

    container.appendChild(grid);
  }

  createImageCard(image) {
    const card = Utils.createElement('div', 'image-card');
    card.style.cssText = `
      border: 1px solid var(--color-gray-300);
      border-radius: var(--border-radius-lg);
      padding: var(--space-3);
      background: var(--color-white);
    `;

    const imageEl = Utils.createElement('img');
    imageEl.src = image.dataUrl;
    imageEl.alt = image.nome;
    imageEl.style.cssText = `
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: var(--border-radius);
      margin-bottom: var(--space-3);
    `;

    const info = Utils.createElement('div', 'image-info');
    
    const name = Utils.createElement('div', '', image.nome);
    name.style.cssText = `
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-2);
      word-break: break-all;
    `;

    const meta = Utils.createElement('div');
    meta.style.cssText = `
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      margin-bottom: var(--space-3);
    `;
    meta.textContent = `${this.formatFileSize(image.dimensione)} • ${Utils.formatDate(new Date(image.dataCaricamento))}`;

    const actions = Utils.createElement('div', 'image-actions');
    actions.style.cssText = `
      display: flex;
      gap: var(--space-2);
    `;

    const viewBtn = Utils.createElement('button', 'btn btn-sm btn-secondary', '👁️ Visualizza');
    viewBtn.addEventListener('click', () => this.viewImage(image));

    const deleteBtn = Utils.createElement('button', 'btn btn-sm btn-danger', '🗑️');
    deleteBtn.addEventListener('click', () => this.deleteImage(image.id));

    actions.appendChild(viewBtn);
    actions.appendChild(deleteBtn);

    info.appendChild(name);
    info.appendChild(meta);
    info.appendChild(actions);

    card.appendChild(imageEl);
    card.appendChild(info);

    return card;
  }

  viewImage(image) {
    if (!this.modalManager) return;

    const content = Utils.createElement('div');
    content.style.cssText = `
      text-align: center;
      max-width: 90vw;
      max-height: 80vh;
    `;

    const img = Utils.createElement('img');
    img.src = image.dataUrl;
    img.alt = image.nome;
    img.style.cssText = `
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: var(--border-radius);
    `;

    const title = Utils.createElement('h3', '', image.nome);
    title.style.cssText = `
      margin-bottom: var(--space-4);
      color: var(--color-gray-800);
    `;

    content.appendChild(title);
    content.appendChild(img);

    this.modalManager.show('image-viewer-modal', '', content);
  }

  deleteImage(imageId) {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) {
      return;
    }

    this.formationImages = this.formationImages.filter(img => img.id !== imageId);
    
    const container = document.getElementById('formation-images-list');
    if (container) {
      this.renderFormationImages(container);
    }

    this.notificationManager?.show('success', 'Successo', 'Immagine eliminata');
    
    Utils.dispatchCustomEvent('fantaaiuto:imageDeleted', { imageId });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getImages() {
    return [...this.formationImages];
  }

  getImageById(id) {
    return this.formationImages.find(img => img.id === id);
  }

  importImages(images) {
    if (!Array.isArray(images)) return;
    
    this.formationImages = images.filter(img => 
      img.id && img.nome && img.dataUrl
    );
    
    Utils.dispatchCustomEvent('fantaaiuto:imagesImported', { 
      count: this.formationImages.length 
    });
  }

  exportImages() {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      images: this.formationImages.map(img => ({
        id: img.id,
        nome: img.nome,
        tipo: img.tipo,
        dimensione: img.dimensione,
        dataCaricamento: img.dataCaricamento,
        dataUrl: img.dataUrl
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    Utils.downloadFile(blob, `formazioni_immagini_${Utils.formatDate(new Date())}.json`);
    
    this.notificationManager?.show('success', 'Esportazione', 'Immagini esportate con successo');
  }

  clearAllImages() {
    if (!confirm('Sei sicuro di voler eliminare tutte le immagini?')) {
      return false;
    }

    this.formationImages = [];
    
    const container = document.getElementById('formation-images-list');
    if (container) {
      this.renderFormationImages(container);
    }

    this.notificationManager?.show('info', 'Reset', 'Tutte le immagini sono state eliminate');
    
    Utils.dispatchCustomEvent('fantaaiuto:allImagesCleared');
    
    return true;
  }
}