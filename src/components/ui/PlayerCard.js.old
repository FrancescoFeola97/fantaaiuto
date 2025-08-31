import { Utils } from '../../utils/Utils.js';

export class PlayerCardComponent {
  constructor(player, services, updateCallback) {
    this.player = player;
    this.services = services;
    this.updateCallback = updateCallback;
    this.isExpanded = false;
  }

  render() {
    const card = this.createCard();
    return card;
  }

  createCard() {
    const card = Utils.createElement('div', 'player-card auction-card compact');
    card.setAttribute('data-player-id', this.player.id);
    
    // Apply role-based styling
    this.applyRoleColors(card);
    
    // Compact header with essential info
    const header = this.createCompactHeader();
    card.appendChild(header);

    // Expandable details (hidden by default)
    const details = this.createExpandableDetails();
    card.appendChild(details);

    // Action buttons (always visible)
    const actions = this.createQuickActions();
    card.appendChild(actions);

    // Add click to expand/collapse
    header.addEventListener('click', () => this.toggleExpand(card, details));

    return card;
  }

  applyRoleColors(card) {
    if (!this.player.ruoli || !this.player.ruoli.length) return;
    
    const roleColor = Utils.getPrimaryRoleColor(this.player.ruoli);
    
    // Apply background gradient
    card.style.background = `linear-gradient(135deg, ${roleColor.background}, rgba(255, 255, 255, 0.95))`;
    
    // Apply border color
    card.style.borderLeft = `4px solid ${roleColor.primary}`;
    card.style.borderRadius = 'var(--border-radius-lg)';
    
    // Add subtle box shadow with role color
    card.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px ${roleColor.primary}20`;
    
    // Store role color for child elements
    card.setAttribute('data-role-color', roleColor.primary);
    card.setAttribute('data-role-text', roleColor.text);
  }

  createCompactHeader() {
    const header = Utils.createElement('div', 'player-card__compact-header');
    header.style.cursor = 'pointer';
    
    // Left side: Name and roles
    const leftSide = Utils.createElement('div', 'compact-header__left');
    
    const nameDiv = Utils.createElement('div', 'player-name--compact');
    nameDiv.textContent = this.player.nome;
    
    const rolesDiv = Utils.createElement('div', 'player-roles--compact');
    rolesDiv.textContent = this.player.ruoli?.join('/') || '';
    
    leftSide.appendChild(nameDiv);
    leftSide.appendChild(rolesDiv);
    
    // Center: Key stats
    const centerSide = Utils.createElement('div', 'compact-header__center');
    
    const fvmDiv = Utils.createElement('div', 'stat-compact');
    fvmDiv.innerHTML = `<span class="stat-label">FVM</span><span class="stat-value">${this.player.fvm || 0}</span>`;
    
    const expectedValueDiv = Utils.createElement('div', 'stat-compact');
    expectedValueDiv.innerHTML = `<span class="stat-label">V.A.</span><span class="stat-value editable" data-field="valoreAtteso">${this.player.valoreAtteso || '-'}</span>`;
    
    // Make expected value editable
    const editableValue = expectedValueDiv.querySelector('.editable');
    editableValue.addEventListener('click', (e) => {
      e.stopPropagation();
      this.makeValueEditable(editableValue, 'valoreAtteso');
    });
    
    centerSide.appendChild(fvmDiv);
    centerSide.appendChild(expectedValueDiv);
    
    // Right side: Status and expand icon
    const rightSide = Utils.createElement('div', 'compact-header__right');
    
    const statusDiv = Utils.createElement('div', `player-status--compact status-${this.getStatusClass()}`);
    statusDiv.textContent = this.getStatusLabel();
    
    const expandIcon = Utils.createElement('div', 'expand-icon');
    expandIcon.textContent = '▼';
    
    rightSide.appendChild(statusDiv);
    rightSide.appendChild(expandIcon);
    
    header.appendChild(leftSide);
    header.appendChild(centerSide);
    header.appendChild(rightSide);
    
    return header;
  }

  createExpandableDetails() {
    const details = Utils.createElement('div', 'player-card__expandable-details hidden');
    
    // Additional info grid
    const infoGrid = Utils.createElement('div', 'expandable-info-grid');
    
    // Squad
    const squadInfo = this.createInfoItem('🏟️', 'Squadra', this.player.squadra || '');
    infoGrid.appendChild(squadInfo);
    
    // Tier/Category
    const tierLabel = 'Categoria';
    const tierValue = this.player.tier || 'Non inserito';
    const tierInfo = this.createInfoItem('🏷️', tierLabel, tierValue);
    infoGrid.appendChild(tierInfo);
    
    // Price/Cost (only if owned)
    if (this.player.status === 'owned' && this.player.costoReale) {
      const priceInfo = this.createInfoItem('💰', 'Pagato', Utils.formatCurrency(this.player.costoReale));
      infoGrid.appendChild(priceInfo);
    }
    
    details.appendChild(infoGrid);
    
    // Interest badge
    if (this.player.interessante) {
      const interestBadge = Utils.createElement('div', 'player-card__interest-badge');
      interestBadge.textContent = '⭐ Interessante';
      details.appendChild(interestBadge);
    }
    
    // Owned by others info
    if (this.player.status === 'taken' && this.player.proprietario) {
      const ownerInfo = Utils.createElement('div', 'player-card__owner');
      let ownerText = `🔒 ${this.player.proprietario}`;
      if (this.player.costoAltri) {
        ownerText += ` (${Utils.formatCurrency(this.player.costoAltri)})`;
      }
      ownerInfo.textContent = ownerText;
      details.appendChild(ownerInfo);
    }
    
    return details;
  }

  toggleExpand(card, details) {
    this.isExpanded = !this.isExpanded;
    
    const expandIcon = card.querySelector('.expand-icon');
    
    if (this.isExpanded) {
      card.classList.add('expanded');
      details.classList.remove('hidden');
      expandIcon.textContent = '▲';
    } else {
      card.classList.remove('expanded');
      details.classList.add('hidden');
      expandIcon.textContent = '▼';
    }
  }

  makeValueEditable(element, field) {
    const currentValue = element.textContent === '-' ? '' : element.textContent;
    
    const input = Utils.createElement('input', 'inline-edit');
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = 'Valore atteso';
    
    element.replaceWith(input);
    input.focus();
    input.select();
    
    const saveValue = () => {
      const newValue = input.value.trim();
      element.textContent = newValue || '-';
      input.replaceWith(element);
      
      // Update player data
      const updateData = { ...this.player, [field]: newValue };
      this.services.players.updatePlayer(updateData);
      this.triggerUpdate();
    };
    
    input.addEventListener('blur', saveValue);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveValue();
      } else if (e.key === 'Escape') {
        element.textContent = currentValue || '-';
        input.replaceWith(element);
      }
    });
  }

  createHeader() {
    const header = Utils.createElement('div', 'player-card__header');
    
    // Name and roles
    const nameDiv = Utils.createElement('div', 'player-card__name');
    nameDiv.textContent = this.player.nome;
    
    const rolesDiv = Utils.createElement('div', 'player-card__roles');
    rolesDiv.textContent = this.player.ruoli?.join('/') || '';
    
    // Status indicator
    const statusDiv = Utils.createElement('div', `player-card__status status-${this.getStatusClass()}`);
    statusDiv.textContent = this.getStatusLabel();
    
    header.appendChild(nameDiv);
    header.appendChild(rolesDiv);
    header.appendChild(statusDiv);
    
    return header;
  }

  createDetails() {
    const details = Utils.createElement('div', 'player-card__details');
    
    // Main info grid
    const infoGrid = Utils.createElement('div', 'player-card__info-grid');
    
    // Squad
    const squadInfo = this.createInfoItem('🏟️', 'Squadra', this.player.squadra || '');
    infoGrid.appendChild(squadInfo);
    
    // FVM
    const fvmInfo = this.createInfoItem('⚽', 'FVM', this.player.fvm || 0);
    infoGrid.appendChild(fvmInfo);
    
    // Tier/Category
    const tierInfo = this.createInfoItem('🏷️', 'Categoria', this.player.tier || 'Non inserito');
    infoGrid.appendChild(tierInfo);
    
    // Price/Value (only if owned)
    if (this.player.status === 'owned' && this.player.costoReale) {
      const priceInfo = this.createInfoItem('💰', 'Pagato', Utils.formatCurrency(this.player.costoReale));
      infoGrid.appendChild(priceInfo);
    }
    
    // Expected Value (if set)
    if (this.player.valoreAtteso) {
      const expectedInfo = this.createInfoItem('📊', 'V.A.', this.player.valoreAtteso);
      infoGrid.appendChild(expectedInfo);
    }
    
    details.appendChild(infoGrid);
    
    // Interest badge
    if (this.player.interessante) {
      const interestBadge = Utils.createElement('div', 'player-card__interest-badge');
      interestBadge.textContent = '⭐ Interessante';
      details.appendChild(interestBadge);
    }
    
    // Owned by others info
    if (this.player.status === 'taken' && this.player.proprietario) {
      const ownerInfo = Utils.createElement('div', 'player-card__owner');
      let ownerText = `🔒 ${this.player.proprietario}`;
      if (this.player.costoAltri) {
        ownerText += ` (${Utils.formatCurrency(this.player.costoAltri)})`;
      }
      ownerInfo.textContent = ownerText;
      details.appendChild(ownerInfo);
    }
    
    return details;
  }

  createInfoItem(icon, label, value) {
    const item = Utils.createElement('div', 'player-card__info-item');
    
    const iconSpan = Utils.createElement('span', 'info-icon');
    iconSpan.textContent = icon;
    
    const labelSpan = Utils.createElement('span', 'info-label');
    labelSpan.textContent = label;
    
    const valueSpan = Utils.createElement('span', 'info-value');
    valueSpan.textContent = value;
    
    item.appendChild(iconSpan);
    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    
    return item;
  }

  createQuickActions() {
    const actions = Utils.createElement('div', 'player-card__actions');
    
    // Create action buttons based on player status
    const buttons = this.getActionButtons();
    
    buttons.forEach(buttonConfig => {
      const button = this.createActionButton(buttonConfig);
      actions.appendChild(button);
    });
    
    return actions;
  }

  createActionButton(config) {
    const button = Utils.createElement('button', `btn btn--${config.variant} btn--sm player-action-btn`);
    button.innerHTML = `${config.icon} ${config.label}`;
    button.setAttribute('aria-label', config.ariaLabel);
    button.addEventListener('click', () => config.handler());
    return button;
  }

  getActionButtons() {
    const buttons = [];
    
    // Status quick toggles
    if (this.player.status !== 'owned') {
      buttons.push({
        icon: '💰',
        label: 'Compra',
        variant: 'success',
        ariaLabel: 'Segna come acquistato',
        handler: () => this.showBuyModal()
      });
    } else {
      buttons.push({
        icon: '🔄',
        label: 'Libera',
        variant: 'warning',
        ariaLabel: 'Rimetti disponibile',
        handler: () => this.setStatus('available')
      });
    }

    if (this.player.status !== 'taken') {
      buttons.push({
        icon: '🔒',
        label: 'Preso',
        variant: 'secondary',
        ariaLabel: 'Segna come preso da altri',
        handler: () => this.showTakenModal()
      });
    }

    // Interest toggle
    buttons.push({
      icon: this.player.interessante ? '⭐' : '☆',
      label: this.player.interessante ? 'Interesse' : 'Interesse',
      variant: this.player.interessante ? 'info' : 'outline',
      ariaLabel: this.player.interessante ? 'Rimuovi interesse' : 'Aggiungi interesse',
      handler: () => this.toggleInterest()
    });

    // Edit/More actions
    buttons.push({
      icon: '✏️',
      label: 'Edit',
      variant: 'outline',
      ariaLabel: 'Modifica giocatore',
      handler: () => this.showEditModal()
    });

    return buttons;
  }

  // Quick action handlers
  setStatus(status, additionalData = {}) {
    const updateData = { ...this.player, status, ...additionalData };
    this.services.players.updatePlayer(updateData);
    this.triggerUpdate();
  }

  toggleInterest() {
    const updateData = { ...this.player, interessante: !this.player.interessante };
    this.services.players.updatePlayer(updateData);
    this.triggerUpdate();
  }

  showBuyModal() {
    const modalId = `buy-player-${this.player.id}`;
    const content = this.createBuyModalContent();
    this.services.modals.show(modalId, `💰 Acquista ${this.player.nome}`, content);
  }

  createBuyModalContent() {
    const container = Utils.createElement('div', 'buy-modal');
    
    const priceInput = Utils.createElement('input', 'form-control');
    priceInput.type = 'number';
    priceInput.placeholder = 'Prezzo pagato';
    priceInput.min = '0';
    priceInput.value = this.player.prezzo || '';
    
    const label = Utils.createElement('label', 'form-label');
    label.textContent = 'Prezzo pagato:';
    
    const actions = Utils.createElement('div', 'modal-actions');
    
    const confirmBtn = Utils.createElement('button', 'btn btn--success');
    confirmBtn.textContent = '✅ Conferma acquisto';
    confirmBtn.addEventListener('click', () => {
      const price = parseInt(priceInput.value) || 0;
      this.setStatus('owned', { costoReale: price });
      this.services.modals.hideAll();
    });
    
    const cancelBtn = Utils.createElement('button', 'btn btn--secondary');
    cancelBtn.textContent = '❌ Annulla';
    cancelBtn.addEventListener('click', () => this.services.modals.hideAll());
    
    container.appendChild(label);
    container.appendChild(priceInput);
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    container.appendChild(actions);
    
    return container;
  }

  showTakenModal() {
    const modalId = `taken-player-${this.player.id}`;
    const content = this.createTakenModalContent();
    this.services.modals.show(modalId, `🔒 Segna ${this.player.nome} come preso`, content);
  }

  createTakenModalContent() {
    const container = Utils.createElement('div', 'taken-modal');
    
    // Participant selector
    const participantLabel = Utils.createElement('label', 'form-label');
    participantLabel.textContent = 'Preso da:';
    
    const participantSelect = Utils.createElement('select', 'form-control');
    const defaultOption = Utils.createElement('option', '');
    defaultOption.value = '';
    defaultOption.textContent = '-- Seleziona partecipante --';
    participantSelect.appendChild(defaultOption);
    
    // Load participants from app data  
    if (this.services.participants && this.services.participants.getAllParticipants) {
      const participants = this.services.participants.getAllParticipants();
      participants.forEach(p => {
        const option = Utils.createElement('option', '');
        option.value = p.id;  // Use ID instead of name
        option.textContent = p.name;
        participantSelect.appendChild(option);
      });
    }
    
    // Price input
    const priceLabel = Utils.createElement('label', 'form-label');
    priceLabel.textContent = 'Prezzo:';
    
    const priceInput = Utils.createElement('input', 'form-control');
    priceInput.type = 'number';
    priceInput.placeholder = 'Prezzo pagato';
    priceInput.min = '0';
    
    const actions = Utils.createElement('div', 'modal-actions');
    
    const confirmBtn = Utils.createElement('button', 'btn btn--secondary');
    confirmBtn.textContent = '✅ Conferma';
    confirmBtn.addEventListener('click', () => {
      const participantId = participantSelect.value;
      const price = parseInt(priceInput.value) || 0;
      
      if (!participantId) {
        this.services.notifications?.show('warning', 'Attenzione', 'Seleziona un partecipante');
        return;
      }
      
      // Get participant name for display
      const participant = this.services.participants.getParticipant(participantId);
      const participantName = participant ? participant.name : 'Sconosciuto';
      
      // Use participants manager to assign player
      const success = this.services.participants.assignPlayerToParticipant(this.player.id, participantId, price);
      
      if (success) {
        this.services.notifications?.show('success', 'Giocatore assegnato', `${this.player.nome} assegnato a ${participantName}`);
        this.services.modals.hideAll();
        this.triggerUpdate();
      } else {
        this.services.notifications?.show('error', 'Errore', 'Impossibile assegnare il giocatore');
      }
    });
    
    const cancelBtn = Utils.createElement('button', 'btn btn--secondary');
    cancelBtn.textContent = '❌ Annulla';
    cancelBtn.addEventListener('click', () => this.services.modals.hideAll());
    
    container.appendChild(participantLabel);
    container.appendChild(participantSelect);
    container.appendChild(priceLabel);
    container.appendChild(priceInput);
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    container.appendChild(actions);
    
    return container;
  }

  showEditModal() {
    const modalId = `edit-player-${this.player.id}`;
    const content = this.createEditModalContent();
    this.services.modals.show(modalId, `✏️ Modifica ${this.player.nome}`, content);
  }

  createEditModalContent() {
    const container = Utils.createElement('div', 'edit-modal');
    
    // Player info
    const infoDiv = Utils.createElement('div', 'player-info');
    infoDiv.innerHTML = `
      <h4>${this.player.nome}</h4>
      <p>${this.player.squadra} - ${this.player.ruoli?.join('/') || ''}</p>
    `;
    container.appendChild(infoDiv);
    
    // Form fields
    const form = this.createEditForm();
    container.appendChild(form);
    
    // Actions
    const actions = this.createEditActions();
    container.appendChild(actions);
    
    return container;
  }

  createEditForm() {
    const form = Utils.createElement('div', 'edit-form');
    
    // Expected value
    const expectedLabel = Utils.createElement('label', 'form-label');
    expectedLabel.textContent = 'Valore atteso:';
    const expectedInput = Utils.createElement('input', 'form-control');
    expectedInput.type = 'text';
    expectedInput.id = 'editExpectedValue';
    expectedInput.value = this.player.valoreAtteso || '';
    
    // Tier selector
    const tierLabel = Utils.createElement('label', 'form-label');
    tierLabel.textContent = 'Categoria:';
    const tierSelect = Utils.createElement('select', 'form-control');
    tierSelect.id = 'editTier';
    
    const tiers = ['Top', 'Titolari', 'Low cost', 'Jolly', 'Riserve', 'Non inseriti'];
    
    tiers.forEach(tier => {
      const option = Utils.createElement('option', '');
      option.value = tier;
      option.textContent = tier;
      if (this.player.tier === tier) option.selected = true;
      tierSelect.appendChild(option);
    });
    
    form.appendChild(expectedLabel);
    form.appendChild(expectedInput);
    form.appendChild(tierLabel);
    form.appendChild(tierSelect);
    
    return form;
  }

  createEditActions() {
    const actions = Utils.createElement('div', 'modal-actions');
    
    const saveBtn = Utils.createElement('button', 'btn btn--success');
    saveBtn.textContent = '💾 Salva modifiche';
    saveBtn.addEventListener('click', () => this.saveEdit());
    
    const resetBtn = Utils.createElement('button', 'btn btn--warning');
    resetBtn.textContent = '🔄 Reset';
    resetBtn.addEventListener('click', () => this.resetPlayer());
    
    const removeBtn = Utils.createElement('button', 'btn btn--danger');
    removeBtn.textContent = '🗑️ Rimuovi';
    removeBtn.addEventListener('click', () => this.removePlayer());
    
    const cancelBtn = Utils.createElement('button', 'btn btn--secondary');
    cancelBtn.textContent = '❌ Annulla';
    cancelBtn.addEventListener('click', () => this.services.modals.hideAll());
    
    actions.appendChild(saveBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(removeBtn);
    actions.appendChild(cancelBtn);
    
    return actions;
  }

  saveEdit() {
    const expectedValue = document.getElementById('editExpectedValue')?.value;
    const tier = document.getElementById('editTier')?.value;
    
    const updateData = { 
      ...this.player,
      valoreAtteso: expectedValue,
      tier: tier
    };
    
    this.services.players.updatePlayer(updateData);
    this.services.modals.hideAll();
    this.triggerUpdate();
  }

  resetPlayer() {
    if (confirm('Resettare tutti i valori del giocatore?')) {
      const resetData = {
        ...this.player,
        status: 'available',
        interessante: false,
        costoReale: 0,
        costoAltri: 0,
        proprietario: null,
        valoreAtteso: null
      };
      
      this.services.players.updatePlayer(resetData);
      this.services.modals.hideAll();
      this.triggerUpdate();
    }
  }

  removePlayer() {
    if (confirm('Rimuovere il giocatore dalla lista? Potrà essere ripristinato dalla sezione "Giocatori Rimossi".')) {
      this.services.players.removePlayer(this.player.id);
      this.services.modals.hideAll();
      this.triggerUpdate();
    }
  }

  // Utility methods
  getStatusClass() {
    switch (this.player.status) {
      case 'owned': return 'owned';
      case 'taken': return 'taken';
      case 'available': 
      default: return 'available';
    }
  }

  getStatusLabel() {
    switch (this.player.status) {
      case 'owned': return '🏠 Mio';
      case 'taken': return '🔒 Preso';
      case 'available':
      default: return '🟢 Libero';
    }
  }

  triggerUpdate() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }
}