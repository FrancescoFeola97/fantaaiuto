        'use strict';

        /**
         * FantacalcioTracker - Versione 4.0
         * Architettura modulare con focus su sicurezza, performance e accessibilità
         */

        // ===== UTILITY FUNCTIONS =====
        class Utils {
            /**
             * Sanitizza stringa per prevenire XSS
             */
            static sanitizeText(str) {
                if (!str || typeof str !== 'string') return '';
                
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            }

            /**
             * Valida nome giocatore
             */
            static validatePlayerName(name) {
                if (!name || typeof name !== 'string') return false;
                if (name.length < 1 || name.length > 100) return false;
                return /^[a-zA-ZÀ-ÿ\s'.-]+$/.test(name.trim());
            }

            /**
             * Valida numero crediti
             */
            static validateCredits(credits) {
                const num = parseInt(credits);
                return !isNaN(num) && num >= 0 && num <= 1000;
            }

            /**
             * Debounce function per performance
             */
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

            /**
             * Genera ID unico
             */
            static generateId() {
                return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            }

            /**
             * Throttle function per scroll
             */
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
        }

        // ===== NOTIFICATION MANAGER =====
        class NotificationManager {
            constructor() {
                this.activeToasts = new Map();
            }

            show(type = 'success', title, message, duration = 3000) {
                const id = Utils.generateId();
                const toast = this.createToast(id, type, title, message);
                
                document.body.appendChild(toast);
                this.activeToasts.set(id, toast);

                // Accessibilità: annuncia alle screen readers
                if (type === 'error') {
                    toast.setAttribute('role', 'alert');
                } else {
                    toast.setAttribute('role', 'status');
                }
                toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

                if (duration > 0) {
                    setTimeout(() => this.hide(id), duration);
                }

                return id;
            }

            createToast(id, type, title, message) {
                const toast = document.createElement('div');
                toast.className = `toast toast--${type}`;
                toast.id = `toast-${id}`;
                
                const content = document.createElement('div');
                
                if (title) {
                    const titleEl = document.createElement('div');
                    titleEl.style.fontWeight = 'var(--font-weight-bold)';
                    titleEl.style.marginBottom = 'var(--space-1)';
                    titleEl.textContent = title;
                    content.appendChild(titleEl);
                }

                if (message) {
                    const messageEl = document.createElement('div');
                    messageEl.textContent = message;
                    content.appendChild(messageEl);
                }

                toast.appendChild(content);
                return toast;
            }

            hide(id) {
                const toast = this.activeToasts.get(id);
                if (toast) {
                    toast.style.animation = 'toastSlideUp 0.3s ease-out reverse';
                    setTimeout(() => {
                        if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                        this.activeToasts.delete(id);
                    }, 300);
                }
            }

            hideAll() {
                this.activeToasts.forEach((toast, id) => {
                    this.hide(id);
                });
            }
        }

        // ===== ERROR HANDLER =====
        class ErrorHandler {
            constructor(notificationManager) {
                this.notifications = notificationManager;
                this.errors = [];
                
                // Gestisci errori globali
                window.addEventListener('error', (e) => {
                    this.handleError(e.error, 'Global Error');
                });
                
                window.addEventListener('unhandledrejection', (e) => {
                    this.handleError(e.reason, 'Unhandled Promise Rejection');
                });
            }

            handleError(error, context = 'Unknown') {
                const errorInfo = {
                    message: error.message || String(error),
                    stack: error.stack || 'No stack trace',
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                };

                // Log per sviluppo
                console.error(`[${context}]`, error);
                
                // Salva errore per debugging
                this.errors.push(errorInfo);
                
                // Mantieni solo ultimi 50 errori
                if (this.errors.length > 50) {
                    this.errors = this.errors.slice(-50);
                }

                // Mostra notifica user-friendly
                this.showUserFriendlyError(error, context);
            }

            showUserFriendlyError(error, context) {
                let message = 'Si è verificato un errore imprevisto.';
                
                if (error.message) {
                    if (error.message.includes('network') || error.message.includes('fetch')) {
                        message = 'Problema di connessione. Verifica la tua connessione internet.';
                    } else if (error.message.includes('storage') || error.message.includes('quota')) {
                        message = 'Spazio di archiviazione insufficiente. Prova a liberare spazio.';
                    } else if (error.message.includes('permission')) {
                        message = 'Permessi insufficienti per questa operazione.';
                    }
                }

                this.notifications.show('error', 'Errore', message, 5000);
            }

            async executeWithRetry(operation, maxRetries = 3, delayMs = 1000) {
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        return await operation();
                    } catch (error) {
                        if (attempt === maxRetries) {
                            this.handleError(error, 'Max Retries Exceeded');
                            throw error;
                        }
                        
                        // Exponential backoff
                        await new Promise(resolve => 
                            setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
                        );
                    }
                }
            }
        }

        // ===== STORAGE MANAGER =====
        class StorageManager {
            constructor(errorHandler) {
                this.errorHandler = errorHandler;
                this.storageKey = 'fantacalcioMantraData_v4';
            }

            save(data) {
                try {
                    const serialized = JSON.stringify({
                        data,
                        version: '4.0',
                        timestamp: Date.now()
                    });
                    
                    localStorage.setItem(this.storageKey, serialized);
                    return true;
                } catch (error) {
                    this.errorHandler.handleError(error, 'Storage Save');
                    return false;
                }
            }

            load() {
                try {
                    const stored = localStorage.getItem(this.storageKey);
                    if (!stored) return null;
                    
                    const parsed = JSON.parse(stored);
                    return parsed.data || null;
                } catch (error) {
                    this.errorHandler.handleError(error, 'Storage Load');
                    return null;
                }
            }

            clear() {
                try {
                    localStorage.removeItem(this.storageKey);
                    return true;
                } catch (error) {
                    this.errorHandler.handleError(error, 'Storage Clear');
                    return false;
                }
            }

            getStorageSize() {
                try {
                    const stored = localStorage.getItem(this.storageKey);
                    return stored ? new Blob([stored]).size : 0;
                } catch (error) {
                    return 0;
                }
            }
        }

        // ===== ACCESSIBILITY MANAGER =====
        class AccessibilityManager {
            constructor() {
                this.trapStack = [];
                this.setupGlobalAccessibility();
            }

            setupGlobalAccessibility() {
                // Focus visible management
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        document.body.classList.add('keyboard-navigation');
                    }
                });

                document.addEventListener('mousedown', () => {
                    document.body.classList.remove('keyboard-navigation');
                });

                // ESC key handler
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.handleEscape();
                    }
                });
            }

            setupModal(modal) {
                modal.setAttribute('role', 'dialog');
                modal.setAttribute('aria-modal', 'true');
                
                const title = modal.querySelector('.modal__title, h1, h2, h3');
                if (title) {
                    title.id = title.id || Utils.generateId();
                    modal.setAttribute('aria-labelledby', title.id);
                }

                const firstFocusable = this.getFirstFocusableElement(modal);
                if (firstFocusable) {
                    firstFocusable.focus();
                }

                this.trapFocus(modal);
            }

            trapFocus(element) {
                const focusableElements = this.getFocusableElements(element);
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                const trapHandler = (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                };

                element.addEventListener('keydown', trapHandler);
                this.trapStack.push({ element, handler: trapHandler });
            }

            releaseFocus(element) {
                const index = this.trapStack.findIndex(trap => trap.element === element);
                if (index !== -1) {
                    const trap = this.trapStack[index];
                    element.removeEventListener('keydown', trap.handler);
                    this.trapStack.splice(index, 1);
                }
            }

            getFocusableElements(element) {
                return element.querySelectorAll(
                    'button:not([disabled]), ' +
                    '[href], ' +
                    'input:not([disabled]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled]), ' +
                    '[tabindex]:not([tabindex="-1"]):not([disabled])'
                );
            }

            getFirstFocusableElement(element) {
                const focusable = this.getFocusableElements(element);
                return focusable.length > 0 ? focusable[0] : null;
            }

            handleEscape() {
                // Chiudi modal aperte
                const openModals = document.querySelectorAll('.modal[style*="block"]');
                if (openModals.length > 0) {
                    const lastModal = openModals[openModals.length - 1];
                    const closeBtn = lastModal.querySelector('.modal__close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }

            announceToScreenReader(message, priority = 'polite') {
                const announcer = document.createElement('div');
                announcer.setAttribute('aria-live', priority);
                announcer.setAttribute('aria-atomic', 'true');
                announcer.className = 'visually-hidden';
                announcer.textContent = message;
                
                document.body.appendChild(announcer);
                
                setTimeout(() => {
                    if (document.body.contains(announcer)) {
                        document.body.removeChild(announcer);
                    }
                }, 1000);
            }
        }

        // ===== LOADING MANAGER =====
        class LoadingManager {
            constructor() {
                this.loadingStates = new Map();
            }

            show(element, message = 'Caricamento...') {
                if (!element) return;
                
                const loadingId = Utils.generateId();
                element.setAttribute('aria-busy', 'true');
                element.style.position = 'relative';

                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.setAttribute('data-loading-id', loadingId);
                
                const spinner = document.createElement('div');
                spinner.className = 'loading-spinner';
                
                const text = document.createElement('div');
                text.textContent = message;
                text.style.marginLeft = 'var(--space-3)';
                
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.appendChild(spinner);
                container.appendChild(text);
                
                overlay.appendChild(container);
                element.appendChild(overlay);

                this.loadingStates.set(element, loadingId);
                return loadingId;
            }

            hide(element) {
                if (!element) return;
                
                const loadingId = this.loadingStates.get(element);
                if (loadingId) {
                    const overlay = element.querySelector(`[data-loading-id="${loadingId}"]`);
                    if (overlay) {
                        element.removeChild(overlay);
                    }
                    element.removeAttribute('aria-busy');
                    this.loadingStates.delete(element);
                }
            }
        }

        // ===== MAIN APPLICATION CLASS =====
        class FantacalcioTracker {
            constructor() {
                // Inizializza managers
                this.notifications = new NotificationManager();
                this.errorHandler = new ErrorHandler(this.notifications);
                this.storage = new StorageManager(this.errorHandler);
                this.accessibility = new AccessibilityManager();
                this.loading = new LoadingManager();

                // State
                this.state = {
                    players: {},
                    credits: { total: 500, remaining: 500 },
                    playerCounts: {},
                    removedPlayers: [],
                    totalPlayers: 0,
                    participants: [],
                    formationImageData: null,
                    filters: {
                        search: '',
                        showInteresting: false
                    },
                    selectedLineup: {},
                    multiPlayerFormationMode: false
                };

                // Constants
                this.roles = ['Por', 'Ds', 'Dd', 'Dc', 'B', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
                this.tiers = ['Top', 'Titolari', 'Low cost', 'Jolly', 'Riserve', 'Non inseriti'];
                
                // Event listeners cleanup
                this.eventListeners = new Map();

                // Debounced search
                this.debouncedSearch = Utils.debounce((query) => {
                    this.state.filters.search = query.toLowerCase().trim();
                    this.renderTracker();
                }, 300);

                // Throttled scroll
                this.throttledScroll = Utils.throttle(() => {
                    this.handleScroll();
                }, 100);

                this.init();
            }

            async init() {
                try {
                    this.setupEventListeners();
                    this.createRoleNavigation();
                    this.loadFromStorage();
                    this.renderTracker();
                    this.updateUI();
                    this.notifications.show('success', null, '🚀 Tracker Fantacalcio caricato con successo!');
                } catch (error) {
                    this.errorHandler.handleError(error, 'Initialization');
                }
            }

            setupEventListeners() {
                // Search input
                const searchInput = document.getElementById('mainSearchInput');
                if (searchInput) {
                    const searchHandler = (e) => {
                        this.debouncedSearch(e.target.value);
                    };
                    searchInput.addEventListener('input', searchHandler);
                    this.eventListeners.set('mainSearch', { element: searchInput, event: 'input', handler: searchHandler });
                }

                // Scroll handler
                window.addEventListener('scroll', this.throttledScroll);
                this.eventListeners.set('scroll', { element: window, event: 'scroll', handler: this.throttledScroll });

                // Window resize
                const resizeHandler = Utils.throttle(() => {
                    this.handleResize();
                }, 250);
                window.addEventListener('resize', resizeHandler);
                this.eventListeners.set('resize', { element: window, event: 'resize', handler: resizeHandler });

                // Modal click outside
                const modalClickHandler = (e) => {
                    if (e.target.classList.contains('modal')) {
                        this.closeModal(e.target.id);
                    }
                };
                document.addEventListener('click', modalClickHandler);
                this.eventListeners.set('modalClick', { element: document, event: 'click', handler: modalClickHandler });
            }

            removeEventListeners() {
                this.eventListeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
                this.eventListeners.clear();
            }

            // ===== ROLE NAVIGATION =====
            createRoleNavigation() {
                const nav = document.getElementById('roleNavigation');
                if (!nav) return;

                nav.innerHTML = '';
                
                this.roles.forEach(role => {
                    const button = document.createElement('button');
                    button.className = 'role-nav-btn';
                    button.textContent = role;
                    button.title = `Vai al ruolo ${role}`;
                    button.setAttribute('aria-label', `Scorri alla sezione ${role}`);
                    
                    const clickHandler = () => this.scrollToRole(role);
                    button.addEventListener('click', clickHandler);
                    
                    nav.appendChild(button);
                });
            }

            scrollToRole(role) {
                const roleSection = document.getElementById(`role-${role}`);
                if (roleSection) {
                    roleSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    
                    // Visual feedback
                    roleSection.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        roleSection.style.transform = 'scale(1)';
                    }, 200);

                    this.accessibility.announceToScreenReader(`Navigato alla sezione ${role}`);
                }
            }

            // ===== FILTERS AND SEARCH =====
            toggleInterestFilter() {
                this.state.filters.showInteresting = !this.state.filters.showInteresting;
                
                const filterBtn = document.getElementById('interestFilter');
                if (filterBtn) {
                    if (this.state.filters.showInteresting) {
                        filterBtn.classList.add('btn--success');
                        filterBtn.classList.remove('btn--secondary');
                        filterBtn.textContent = '⭐ Solo Interessanti (ON)';
                        filterBtn.setAttribute('aria-pressed', 'true');
                    } else {
                        filterBtn.classList.add('btn--secondary');
                        filterBtn.classList.remove('btn--success');
                        filterBtn.textContent = '⭐ Solo Interessanti';
                        filterBtn.setAttribute('aria-pressed', 'false');
                    }
                }
                
                this.renderTracker();
                this.saveToStorage();
                
                const message = this.state.filters.showInteresting ? 
                    'Filtro interessanti attivato! ⭐' : 
                    'Filtro interessanti disattivato';
                this.notifications.show('success', null, message);
            }

            clearMainSearch() {
                const input = document.getElementById('mainSearchInput');
                if (input) {
                    input.value = '';
                    this.state.filters.search = '';
                }
                
                // Disattiva anche filtro interessanti se attivo
                if (this.state.filters.showInteresting) {
                    this.toggleInterestFilter();
                }
                
                this.renderTracker();
                this.notifications.show('success', null, 'Ricerca pulita');
            }

            // ===== RENDERING =====
            renderTracker() {
                const tracker = document.getElementById('tracker');
                if (!tracker) return;

                // Clear existing content
                tracker.innerHTML = '';
                
                let hasAnyVisibleRole = false;
                
                this.roles.forEach(role => {
                    const roleSection = this.createRoleSection(role);
                    if (roleSection) {
                        tracker.appendChild(roleSection);
                        hasAnyVisibleRole = true;
                    }
                });
                
                if (!hasAnyVisibleRole) {
                    const emptyState = this.createEmptyState();
                    tracker.appendChild(emptyState);
                }
            }

            createRoleSection(role) {
                let hasPlayers = false;
                let hasVisiblePlayers = false;
                
                const roleSection = document.createElement('section');
                roleSection.className = 'role-section';
                roleSection.id = `role-${role}`;
                roleSection.setAttribute('aria-labelledby', `role-title-${role}`);
                
                const roleTitle = document.createElement('h2');
                roleTitle.className = 'role-section__title';
                roleTitle.id = `role-title-${role}`;
                roleTitle.textContent = role;
                roleSection.appendChild(roleTitle);
                
                this.tiers.forEach(tier => {
                    if (this.state.players[role] && 
                        this.state.players[role][tier] && 
                        Object.keys(this.state.players[role][tier]).length > 0) {
                        
                        hasPlayers = true;
                        
                        const tierDiv = this.createTierSection(role, tier);
                        if (tierDiv) {
                            roleSection.appendChild(tierDiv);
                            hasVisiblePlayers = true;
                        }
                    }
                });
                
                if (!hasPlayers) {
                    const emptyDiv = this.createEmptyRoleState();
                    roleSection.appendChild(emptyDiv);
                    hasVisiblePlayers = true;
                } else if (!hasVisiblePlayers && (this.state.filters.search || this.state.filters.showInteresting)) {
                    const noResultsDiv = this.createNoResultsState();
                    roleSection.appendChild(noResultsDiv);
                    hasVisiblePlayers = true;
                }
                
                return hasVisiblePlayers ? roleSection : null;
            }

            createTierSection(role, tier) {
                const tierDiv = document.createElement('div');
                tierDiv.className = 'tier';
                
                const tierTitle = document.createElement('h3');
                tierTitle.className = 'tier__title';
                tierTitle.textContent = tier;
                tierDiv.appendChild(tierTitle);
                
                let tierHasVisiblePlayers = false;
                
                Object.values(this.state.players[role][tier]).forEach(playerData => {
                    if (this.matchesFilters(playerData)) {
                        const playerEntry = this.createPlayerEntry(role, tier, playerData);
                        tierDiv.appendChild(playerEntry);
                        tierHasVisiblePlayers = true;
                    }
                });
                
                return tierHasVisiblePlayers ? tierDiv : null;
            }

            createPlayerEntry(role, tier, playerData) {
                const playerEntry = document.createElement('div');
                playerEntry.className = 'player-entry';
                playerEntry.setAttribute('role', 'button');
                playerEntry.setAttribute('tabindex', '0');
                playerEntry.setAttribute('aria-label', `Modifica ${playerData.name}`);
                
                // Status classes
                if (playerData.status === 'Preso da altri') {
                    playerEntry.classList.add('player-entry--taken');
                } else if (playerData.status === 'Preso da me') {
                    playerEntry.classList.add('player-entry--mine');
                }
                
                // Nome giocatore
                const nameSpan = document.createElement('span');
                let displayName = `${playerData.name} (${playerData.squad}) (${playerData.roles.join('/')})`;
                
                if (playerData.expectedValue && playerData.expectedValue.trim() !== '') {
                    displayName += ` (VA: ${Utils.sanitizeText(playerData.expectedValue)})`;
                }
                
                if (playerData.status === 'Preso da me' && playerData.cost > 0) {
                    displayName += ` - ${playerData.cost} crediti`;
                }
                
                if (playerData.status === 'Preso da altri' && playerData.ownedBy) {
                    displayName += ` - ${Utils.sanitizeText(playerData.ownedBy)}`;
                    if (playerData.otherCost > 0) {
                        displayName += ` (${playerData.otherCost} crediti)`;
                    }
                }
                
                nameSpan.textContent = displayName;
                playerEntry.appendChild(nameSpan);
                
                // Interest badge
                if (playerData.interest) {
                    const interestBadge = document.createElement('div');
                    interestBadge.className = 'player-entry__interest';
                    interestBadge.textContent = '⭐ Interesse';
                    playerEntry.appendChild(interestBadge);
                }
                
                // Event listeners
                const clickHandler = (e) => {
                    e.stopPropagation();
                    this.openPlayerEditModal(playerData, role, tier);
                };
                
                const keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        clickHandler(e);
                    }
                };
                
                playerEntry.addEventListener('click', clickHandler);
                playerEntry.addEventListener('keydown', keyHandler);
                
                return playerEntry;
            }

            createEmptyRoleState() {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-state';
                
                const emoji = document.createElement('span');
                emoji.className = 'empty-state__emoji';
                emoji.textContent = '⚽';
                emptyDiv.appendChild(emoji);
                
                const text = document.createTextNode('Nessun giocatore caricato per questo ruolo');
                emptyDiv.appendChild(text);
                
                return emptyDiv;
            }

            createNoResultsState() {
                const noResultsDiv = document.createElement('div');
                noResultsDiv.className = 'no-results';
                
                let message = 'Nessun risultato trovato';
                if (this.state.filters.search && this.state.filters.showInteresting) {
                    message = 'Nessun giocatore interessante trovato per la ricerca';
                } else if (this.state.filters.search) {
                    message = 'Nessun risultato per la ricerca';
                } else if (this.state.filters.showInteresting) {
                    message = 'Nessun giocatore marcato come interessante';
                }
                
                noResultsDiv.textContent = message;
                return noResultsDiv;
            }

            createEmptyState() {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.style.padding = 'var(--space-20) var(--space-5)';
                
                const emoji = document.createElement('span');
                emoji.className = 'empty-state__emoji';
                emoji.textContent = '📋';
                emptyState.appendChild(emoji);
                
                const mainText = document.createTextNode('Nessun dato disponibile');
                emptyState.appendChild(mainText);
                
                const br = document.createElement('br');
                emptyState.appendChild(br);
                
                const subText = document.createElement('small');
                subText.textContent = 'Carica un file Excel per iniziare';
                emptyState.appendChild(subText);
                
                return emptyState;
            }

            matchesFilters(playerData) {
                // Search filter
                if (this.state.filters.search && 
                    !playerData.name.toLowerCase().includes(this.state.filters.search)) {
                    return false;
                }
                
                // Interest filter
                if (this.state.filters.showInteresting && !playerData.interest) {
                    return false;
                }
                
                return true;
            }

            // ===== UI UPDATES =====
            updateUI() {
                this.updateCreditInfo();
                this.updatePlayerCounts();
                this.updateAvailablePlayersDisplay();
            }

            updateCreditInfo() {
                const totalEl = document.getElementById('totalCredits');
                const remainingEl = document.getElementById('remainingCredits');
                
                if (totalEl) totalEl.textContent = this.state.credits.total;
                if (remainingEl) {
                    remainingEl.textContent = this.state.credits.remaining;
                    
                    // Color coding
                    remainingEl.classList.remove('stat-card__value--success', 'stat-card__value--warning', 'stat-card__value--danger');
                    if (this.state.credits.remaining < 50) {
                        remainingEl.classList.add('stat-card__value--danger');
                    } else if (this.state.credits.remaining < 100) {
                        remainingEl.classList.add('stat-card__value--warning');
                    } else {
                        remainingEl.classList.add('stat-card__value--success');
                    }
                }
                
                this.updatePlayerCountDisplay();
            }

            updatePlayerCounts() {
                this.state.playerCounts = {};
                const processedPlayers = new Set();
                this.state.totalPlayers = 0;
                
                Object.keys(this.state.players).forEach(role => {
                    Object.values(this.state.players[role]).forEach(tier => {
                        Object.values(tier).forEach(player => {
                            if (player.status === 'Preso da me' && !processedPlayers.has(player.name)) {
                                const roleKey = player.roles.sort().join('/');
                                if (!this.state.playerCounts[roleKey]) {
                                    this.state.playerCounts[roleKey] = { count: 0, players: [] };
                                }
                                this.state.playerCounts[roleKey].count++;
                                this.state.playerCounts[roleKey].players.push(player);
                                processedPlayers.add(player.name);
                                this.state.totalPlayers++;
                            }
                        });
                    });
                });
                
                const countsDiv = document.getElementById('playerCounts');
                if (countsDiv) {
                    countsDiv.innerHTML = '';
                    
                    Object.keys(this.state.playerCounts).forEach(role => {
                        const item = document.createElement('div');
                        item.className = 'player-counts__item';
                        item.textContent = `${role}: ${this.state.playerCounts[role].count}`;
                        item.title = `Clicca per vedere i dettagli dei ${role}`;
                        item.setAttribute('role', 'button');
                        item.setAttribute('tabindex', '0');
                        
                        const clickHandler = () => this.showPlayerDetails(role);
                        item.addEventListener('click', clickHandler);
                        item.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                clickHandler();
                            }
                        });
                        
                        countsDiv.appendChild(item);
                    });
                }
                
                this.updatePlayerCountDisplay();
            }

            updatePlayerCountDisplay() {
                const playerCountElement = document.getElementById('playerCount');
                if (playerCountElement) {
                    playerCountElement.textContent = `${this.state.totalPlayers}/30`;
                    
                    playerCountElement.classList.remove('stat-card__value--success', 'stat-card__value--warning', 'stat-card__value--danger');
                    if (this.state.totalPlayers >= 30) {
                        playerCountElement.classList.add('stat-card__value--success');
                    } else if (this.state.totalPlayers >= 25) {
                        playerCountElement.classList.add('stat-card__value--warning');
                    }
                }
            }

            updateAvailablePlayersDisplay() {
                const availableCount = this.calculateAvailablePlayers();
                const element = document.getElementById('availablePlayersCount');
                
                if (element) {
                    element.textContent = availableCount;
                    
                    element.classList.remove('stat-card__value--success', 'stat-card__value--warning', 'stat-card__value--danger');
                    if (availableCount < 100) {
                        element.classList.add('stat-card__value--danger');
                    } else if (availableCount < 300) {
                        element.classList.add('stat-card__value--warning');
                    } else {
                        element.classList.add('stat-card__value--success');
                    }
                }
            }

            calculateAvailablePlayers() {
                let availableCount = 0;
                
                Object.values(this.state.players).forEach(roleData => {
                    Object.values(roleData).forEach(tierData => {
                        Object.values(tierData).forEach(player => {
                            if (player.status === 'Disponibile') {
                                availableCount++;
                            }
                        });
                    });
                });
                
                return availableCount;
            }

            // ===== MODAL MANAGEMENT =====
            createModal(id, title, content) {
                // Remove existing modal if any
                const existing = document.getElementById(id);
                if (existing) {
                    document.body.removeChild(existing);
                }

                const modal = document.createElement('div');
                modal.id = id;
                modal.className = 'modal';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal__content';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal__close';
                closeBtn.innerHTML = '&times;';
                closeBtn.setAttribute('aria-label', 'Chiudi modal');
                closeBtn.addEventListener('click', () => this.closeModal(id));
                
                if (title) {
                    const titleEl = document.createElement('h2');
                    titleEl.className = 'modal__title';
                    titleEl.textContent = title;
                    modalContent.appendChild(titleEl);
                }
                
                modalContent.appendChild(closeBtn);
                modalContent.appendChild(content);
                modal.appendChild(modalContent);
                
                document.body.appendChild(modal);
                return modal;
            }

            showModal(id) {
                const modal = document.getElementById(id);
                if (modal) {
                    modal.style.display = 'block';
                    this.accessibility.setupModal(modal);
                }
            }

            closeModal(id) {
                const modal = document.getElementById(id);
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('modal--overlay');
                    this.accessibility.releaseFocus(modal);
                }
            }

            // ===== EXCEL LOADING =====
            showLoadExcelModal() {
                const content = this.createExcelUploadContent();
                this.createModal('loadExcelModal', '📋 Carica Listone Excel', content);
                this.showModal('loadExcelModal');
            }

            createExcelUploadContent() {
                const container = document.createElement('div');
                container.className = 'excel-upload-content';
                container.style.textAlign = 'center';
                container.style.padding = 'var(--space-5)';
                
                const description = document.createElement('p');
                description.textContent = 'Seleziona il file Excel contenente il listone dei giocatori per iniziare l\'analisi';
                description.style.color = 'var(--color-gray-600)';
                description.style.marginBottom = 'var(--space-8)';
                description.style.fontSize = 'var(--font-size-lg)';
                container.appendChild(description);
                
                const fileInputGroup = document.createElement('div');
                fileInputGroup.style.display = 'flex';
                fileInputGroup.style.justifyContent = 'center';
                fileInputGroup.style.alignItems = 'center';
                fileInputGroup.style.gap = 'var(--space-4)';
                fileInputGroup.style.flexWrap = 'wrap';
                fileInputGroup.style.margin = 'var(--space-8) 0';
                
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.id = 'excelFile';
                fileInput.accept = '.xlsx, .xls';
                fileInput.className = 'form-control';
                fileInput.style.minWidth = '300px';
                fileInput.setAttribute('aria-describedby', 'file-help');
                
                const fileHelp = document.createElement('div');
                fileHelp.id = 'file-help';
                fileHelp.className = 'visually-hidden';
                fileHelp.textContent = 'Seleziona un file Excel in formato .xlsx o .xls';
                
                const uploadButton = document.createElement('button');
                uploadButton.className = 'btn btn--primary btn--lg';
                uploadButton.innerHTML = '<span id="loadBtnText">Carica File Excel</span>';
                uploadButton.addEventListener('click', () => this.loadExcelFile());
                
                fileInputGroup.appendChild(fileInput);
                fileInputGroup.appendChild(uploadButton);
                
                container.appendChild(fileInputGroup);
                container.appendChild(fileHelp);
                
                const tips = document.createElement('div');
                tips.style.marginTop = 'var(--space-8)';
                tips.style.padding = 'var(--space-5)';
                tips.style.background = 'var(--color-gray-50)';
                tips.style.borderRadius = 'var(--border-radius-lg)';
                tips.style.color = 'var(--color-gray-600)';
                tips.style.fontSize = 'var(--font-size-sm)';
                
                const tipsTitle = document.createElement('h4');
                tipsTitle.style.color = 'var(--color-primary-500)';
                tipsTitle.style.marginTop = '0';
                tipsTitle.textContent = '💡 Suggerimenti:';
                tips.appendChild(tipsTitle);
                
                const tipsList = document.createElement('ul');
                tipsList.style.textAlign = 'left';
                tipsList.style.margin = '0';
                tipsList.style.paddingLeft = 'var(--space-5)';
                
                const tips1 = document.createElement('li');
                tips1.textContent = 'Assicurati che il file Excel contenga le colonne corrette';
                const tips2 = document.createElement('li');
                tips2.textContent = 'Il file deve essere in formato .xlsx o .xls';
                const tips3 = document.createElement('li');
                tips3.textContent = 'Potrai scegliere diverse modalità di caricamento dopo aver selezionato il file';
                
                tipsList.appendChild(tips1);
                tipsList.appendChild(tips2);
                tipsList.appendChild(tips3);
                tips.appendChild(tipsList);
                
                container.appendChild(tips);
                
                return container;
            }

            async loadExcelFile() {
                const fileInput = document.getElementById('excelFile');
                const file = fileInput?.files?.[0];
                
                if (!file) {
                    this.notifications.show('error', 'Errore', 'Seleziona un file Excel prima di procedere');
                    return;
                }

                const uploadButton = document.querySelector('#loadExcelModal .btn--primary');
                const loadingId = this.loading.show(uploadButton, 'Caricamento...');
                
                try {
                    const data = await this.readExcelFile(file);
                    await this.processExcelData(data);
                    
                    this.saveToStorage();
                    this.renderTracker();
                    this.updateUI();
                    this.closeModal('loadExcelModal');
                    
                } catch (error) {
                    this.errorHandler.handleError(error, 'Excel Loading');
                } finally {
                    this.loading.hide(uploadButton);
                }
            }

            async readExcelFile(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                            
                            // Rimuovi prime due righe (header)
                            jsonData.shift();
                            jsonData.shift();
                            
                            resolve(jsonData);
                        } catch (error) {
                            reject(new Error('Errore nella lettura del file Excel: ' + error.message));
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error('Errore nella lettura del file'));
                    };
                    
                    reader.readAsArrayBuffer(file);
                });
            }

            async processExcelData(jsonData) {
                const choice = await this.showLoadingModeDialog();
                
                switch(choice) {
                    case "1":
                        this.distributePlayersByFVMM(jsonData);
                        this.notifications.show('success', null, 'File caricato con distribuzione automatica! 🎯');
                        break;
                    case "2":
                        this.distributePlayersByFVMMWithRemoval(jsonData);
                        this.notifications.show('success', null, 'File caricato con distribuzione automatica e FVM=1 rimossi! 🎯🗑️');
                        break;
                    case "3":
                        this.loadPlayersToNonInseriti(jsonData);
                        this.notifications.show('success', null, 'File caricato! Tutti i giocatori in "Non inseriti" 📝');
                        break;
                    case "4":
                        this.loadPlayersToNonInseritiWithRemoval(jsonData);
                        this.notifications.show('success', null, 'File caricato in "Non inseriti" e FVM=1 rimossi! 📝🗑️');
                        break;
                    default:
                        throw new Error('Operazione annullata');
                }
            }

            showLoadingModeDialog() {
                return new Promise((resolve) => {
                    const choice = prompt(
                        "🎯 Scegli la modalità di caricamento:\n\n" +
                        "1️⃣ Compilazione automatica basata su FVM M\n" +
                        "2️⃣ Compilazione automatica + rimuovi giocatori FVM=1\n" +
                        "3️⃣ Tutti i giocatori in 'Non inseriti'\n" +
                        "4️⃣ Tutti in 'Non inseriti' + rimuovi giocatori FVM=1\n" +
                        "5️⃣ Annulla caricamento\n\n" +
                        "Inserisci il numero della tua scelta:"
                    );
                    resolve(choice === "5" ? null : choice);
                });
            }

            loadPlayersToNonInseriti(jsonData) {
                this.state.players = {};
                let loadedCount = 0;
                
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [id, r, rm, nome, squadra, , , , , , , , fvmm] = row;
                        if (!nome || !rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        playerRoles.forEach(role => {
                            if (this.roles.includes(role)) {
                                if (!this.state.players[role]) this.state.players[role] = {};
                                if (!this.state.players[role]['Non inseriti']) this.state.players[role]['Non inseriti'] = {};
                                
                                this.state.players[role]['Non inseriti'][nome] = { 
                                    name: nome, 
                                    roles: playerRoles, 
                                    squad: squadra, 
                                    status: 'Disponibile', 
                                    interest: false,
                                    fvmm: parseFloat(fvmm) || 0,
                                    expectedValue: '',
                                    cost: 0,
                                    ownedBy: '',
                                    otherCost: 0
                                };
                                loadedCount++;
                            }
                        });
                    }
                });
                
                console.log(`Caricati ${loadedCount} giocatori in "Non inseriti"`);
            }

            loadPlayersToNonInseritiWithRemoval(jsonData) {
                this.state.players = {};
                this.state.removedPlayers = [];
                let loadedCount = 0;
                let removedCount = 0;
                
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [id, r, rm, nome, squadra, , , , , , , , fvmm] = row;
                        if (!nome || !rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        const fvmmValue = parseFloat(fvmm) || 0;
                        
                        if (fvmmValue === 1) {
                            // Aggiungi direttamente ai rimossi
                            this.state.removedPlayers.push({
                                name: nome,
                                roles: playerRoles,
                                squad: squadra,
                                status: 'Disponibile',
                                interest: false,
                                fvmm: fvmmValue,
                                expectedValue: '',
                                cost: 0,
                                ownedBy: '',
                                otherCost: 0,
                                role: playerRoles[0]
                            });
                            removedCount++;
                        } else {
                            playerRoles.forEach(role => {
                                if (this.roles.includes(role)) {
                                    if (!this.state.players[role]) this.state.players[role] = {};
                                    if (!this.state.players[role]['Non inseriti']) this.state.players[role]['Non inseriti'] = {};
                                    this.state.players[role]['Non inseriti'][nome] = { 
                                        name: nome, 
                                        roles: playerRoles, 
                                        squad: squadra, 
                                        status: 'Disponibile', 
                                        interest: false,
                                        fvmm: fvmmValue,
                                        expectedValue: '',
                                        cost: 0,
                                        ownedBy: '',
                                        otherCost: 0
                                    };
                                    loadedCount++;
                                }
                            });
                        }
                    }
                });
                
                console.log(`Caricati ${loadedCount} giocatori, rimossi ${removedCount} giocatori con FVM=1`);
            }

            distributePlayersByFVMM(jsonData) {
                this.state.players = {};
                const roleStats = {};
                
                // Inizializza statistiche per ruolo
                this.roles.forEach(role => { roleStats[role] = []; });
                
                // Raccogli tutti i valori FVMM per ruolo
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [, , rm, , , , , , , , , , fvmm] = row;
                        if (!rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        const fvmmValue = parseFloat(fvmm) || 0;
                        
                        if (fvmmValue > 1) {
                            playerRoles.forEach(role => {
                                if (roleStats[role]) { 
                                    roleStats[role].push(fvmmValue); 
                                }
                            });
                        }
                    }
                });
                
                // Calcola percentili per ogni ruolo
                Object.keys(roleStats).forEach(role => {
                    roleStats[role].sort((a, b) => a - b);
                    const length = roleStats[role].length;
                    if (length > 0) {
                        roleStats[role] = {
                            p20: roleStats[role][Math.floor(length * 0.20)],
                            p40: roleStats[role][Math.floor(length * 0.40)],
                            p70: roleStats[role][Math.floor(length * 0.70)],
                            p90: roleStats[role][Math.floor(length * 0.90)],
                            values: roleStats[role]
                        };
                    }
                });
                
                // Distribuisci giocatori nei tier
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [id, r, rm, nome, squadra, , , , , , , , fvmm] = row;
                        if (!nome || !rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        const fvmmValue = parseFloat(fvmm) || 0;
                        
                        playerRoles.forEach(role => {
                            if (this.roles.includes(role)) {
                                if (!this.state.players[role]) this.state.players[role] = {};
                                
                                const tier = fvmmValue === 1 ? 'Non inseriti' : this.determinePlayerTierAdvanced(role, fvmmValue, roleStats[role]);
                                
                                if (!this.state.players[role][tier]) this.state.players[role][tier] = {};
                                this.state.players[role][tier][nome] = { 
                                    name: nome, 
                                    roles: playerRoles, 
                                    squad: squadra, 
                                    status: 'Disponibile', 
                                    interest: false,
                                    fvmm: fvmmValue,
                                    expectedValue: '',
                                    cost: 0,
                                    ownedBy: '',
                                    otherCost: 0
                                };
                            }
                        });
                    }
                });
            }

            distributePlayersByFVMMWithRemoval(jsonData) {
                this.state.players = {};
                this.state.removedPlayers = [];
                const roleStats = {};
                
                // Inizializza statistiche per ruolo
                this.roles.forEach(role => { roleStats[role] = []; });
                
                // Raccogli tutti i valori FVMM per ruolo (esclusi FVM=1)
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [, , rm, , , , , , , , , , fvmm] = row;
                        if (!rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        const fvmmValue = parseFloat(fvmm) || 0;
                        
                        if (fvmmValue > 1) {
                            playerRoles.forEach(role => {
                                if (roleStats[role]) { 
                                    roleStats[role].push(fvmmValue); 
                                }
                            });
                        }
                    }
                });
                
                // Calcola percentili per ogni ruolo
                Object.keys(roleStats).forEach(role => {
                    roleStats[role].sort((a, b) => a - b);
                    const length = roleStats[role].length;
                    if (length > 0) {
                        roleStats[role] = {
                            p20: roleStats[role][Math.floor(length * 0.20)],
                            p40: roleStats[role][Math.floor(length * 0.40)],
                            p70: roleStats[role][Math.floor(length * 0.70)],
                            p90: roleStats[role][Math.floor(length * 0.90)],
                            values: roleStats[role]
                        };
                    }
                });
                
                // Distribuisci giocatori nei tier o rimuovi se FVM=1
                jsonData.forEach(row => {
                    if (row.length >= 13) {
                        const [id, r, rm, nome, squadra, , , , , , , , fvmm] = row;
                        if (!nome || !rm) return;
                        
                        const playerRoles = rm.split(';').map(role => role.trim());
                        const fvmmValue = parseFloat(fvmm) || 0;
                        
                        if (fvmmValue === 1) {
                            this.state.removedPlayers.push({
                                name: nome,
                                roles: playerRoles,
                                squad: squadra,
                                status: 'Disponibile',
                                interest: false,
                                fvmm: fvmmValue,
                                expectedValue: '',
                                cost: 0,
                                ownedBy: '',
                                otherCost: 0,
                                role: playerRoles[0]
                            });
                        } else {
                            playerRoles.forEach(role => {
                                if (this.roles.includes(role)) {
                                    if (!this.state.players[role]) this.state.players[role] = {};
                                    
                                    const tier = this.determinePlayerTierAdvanced(role, fvmmValue, roleStats[role]);
                                    
                                    if (!this.state.players[role][tier]) this.state.players[role][tier] = {};
                                    this.state.players[role][tier][nome] = { 
                                        name: nome, 
                                        roles: playerRoles, 
                                        squad: squadra, 
                                        status: 'Disponibile', 
                                        interest: false,
                                        fvmm: fvmmValue,
                                        expectedValue: '',
                                        cost: 0,
                                        ownedBy: '',
                                        otherCost: 0
                                    };
                                }
                            });
                        }
                    }
                });
            }

            determinePlayerTierAdvanced(role, fvmm, thresholds) {
                if (!thresholds || !thresholds.p20) {
                    return 'Jolly';
                }
                
                if (fvmm >= thresholds.p90) return 'Top';
                if (fvmm >= thresholds.p70) return 'Titolari';
                if (fvmm >= thresholds.p40) return 'Low cost';
                if (fvmm >= thresholds.p20) return 'Jolly';
                return 'Riserve';
            }

            // ===== PLAYER MANAGEMENT =====
            openPlayerEditModal(playerData, role, tier) {
                this.currentEditingPlayer = playerData;
                this.currentEditingRole = role;
                this.currentEditingTier = tier;
                
                const content = this.createPlayerEditContent(playerData, role, tier);
                this.createModal('playerEditModal', `Modifica ${playerData.name}`, content);
                this.showModal('playerEditModal');
            }

            createPlayerEditContent(playerData, role, tier) {
                const container = document.createElement('div');
                container.className = 'player-edit-form';
                
                // Player info header
                const header = document.createElement('div');
                header.style.textAlign = 'center';
                header.style.marginBottom = 'var(--space-6)';
                header.style.paddingBottom = 'var(--space-5)';
                header.style.borderBottom = '2px solid var(--color-gray-200)';
                
                const playerInfo = document.createElement('p');
                playerInfo.textContent = `${playerData.squad} - ${playerData.roles.join('/')}`;
                playerInfo.style.color = 'var(--color-gray-600)';
                playerInfo.style.margin = '0';
                playerInfo.style.fontSize = 'var(--font-size-lg)';
                header.appendChild(playerInfo);
                container.appendChild(header);
                
                // Form fields
                const form = document.createElement('div');
                form.style.display = 'grid';
                form.style.gap = 'var(--space-5)';
                
                // Expected Value
                const expectedValueRow = this.createFormRow('Valore atteso:', 'text', 'editExpectedValue', playerData.expectedValue || '');
                form.appendChild(expectedValueRow);
                
                // Status
                const statusOptions = [
                    { value: 'Disponibile', label: 'Disponibile' },
                    { value: 'Preso da me', label: 'Preso da me' },
                    { value: 'Preso da altri', label: 'Preso da altri' }
                ];
                const statusRow = this.createFormRow('Status:', 'select', 'editStatus', playerData.status || 'Disponibile', statusOptions);
                form.appendChild(statusRow);
                
                // My Cost (hidden by default)
                const myCostRow = this.createFormRow('Costo pagato:', 'number', 'editMyCost', playerData.cost || '');
                myCostRow.style.display = playerData.status === 'Preso da me' ? 'flex' : 'none';
                myCostRow.id = 'editMyCostRow';
                form.appendChild(myCostRow);
                
                // Participant (hidden by default)
                const participantOptions = [{ value: '', label: '-- Seleziona --' }];
                this.state.participants.forEach(p => {
                    participantOptions.push({ value: p.name, label: p.name });
                });
                const participantRow = this.createFormRow('Preso da:', 'select', 'editParticipant', playerData.ownedBy || '', participantOptions);
                participantRow.style.display = playerData.status === 'Preso da altri' ? 'flex' : 'none';
                participantRow.id = 'editParticipantRow';
                form.appendChild(participantRow);
                
                // Other Cost (hidden by default)
                const costRow = this.createFormRow('Costo:', 'number', 'editCost', playerData.otherCost || '');
                costRow.style.display = playerData.status === 'Preso da altri' ? 'flex' : 'none';
                costRow.id = 'editCostRow';
                form.appendChild(costRow);
                
                // Tier
                const tierOptions = this.tiers.map(t => ({ value: t, label: t }));
                const tierRow = this.createFormRow('Categoria:', 'select', 'editTier', tier, tierOptions);
                form.appendChild(tierRow);
                
                // Interest
                const interestRow = this.createFormRow('Interesse:', 'checkbox', 'editInterest', playerData.interest);
                interestRow.id = 'editInterestRow';
                interestRow.style.display = playerData.status !== 'Preso da altri' ? 'flex' : 'none';
                form.appendChild(interestRow);
                
                container.appendChild(form);
                
                // Actions
                const actionsDiv = document.createElement('div');
                actionsDiv.style.display = 'flex';
                actionsDiv.style.gap = 'var(--space-4)';
                actionsDiv.style.justifyContent = 'center';
                actionsDiv.style.marginTop = 'var(--space-8)';
                actionsDiv.style.paddingTop = 'var(--space-5)';
                actionsDiv.style.borderTop = '2px solid var(--color-gray-200)';
                
                const resetBtn = document.createElement('button');
                resetBtn.className = 'btn btn--warning';
                resetBtn.textContent = '🔄 Reset Valori';
                resetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.resetPlayerValues();
                });
                
                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn btn--success';
                saveBtn.textContent = '💾 Salva';
                saveBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.savePlayerChanges();
                });
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn btn--secondary';
                cancelBtn.textContent = '❌ Annulla';
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal('playerEditModal');
                });
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn--danger';
                removeBtn.textContent = '🗑️ Rimuovi dalla lista';
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removePlayerFromModal();
                });
                
                actionsDiv.appendChild(resetBtn);
                actionsDiv.appendChild(saveBtn);
                actionsDiv.appendChild(cancelBtn);
                actionsDiv.appendChild(removeBtn);
                container.appendChild(actionsDiv);
                
                // Setup status change handler
                const statusSelect = container.querySelector('#editStatus');
                if (statusSelect) {
                    statusSelect.addEventListener('change', () => {
                        this.updateEditModalFields();
                    });
                }
                
                return container;
            }

            createFormRow(labelText, type, id, value, options = null) {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = 'var(--space-4)';
                row.style.flexWrap = 'wrap';
                
                const label = document.createElement('label');
                label.htmlFor = id;
                label.textContent = labelText;
                label.style.fontWeight = 'var(--font-weight-semibold)';
                label.style.color = 'var(--color-gray-700)';
                label.style.minWidth = '140px';
                
                let input;
                if (type === 'select') {
                    input = document.createElement('select');
                    if (options) {
                        options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.value;
                            opt.textContent = option.label;
                            input.appendChild(opt);
                        });
                    }
                    input.value = value;
                } else if (type === 'checkbox') {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = value;
                    input.style.width = 'auto';
                    input.style.minWidth = 'auto';
                } else {
                    input = document.createElement('input');
                    input.type = type;
                    input.value = value;
                    if (type === 'number') {
                        input.min = '0';
                    }
                }
                
                input.id = id;
                input.className = 'form-control';
                if (type !== 'checkbox') {
                    input.style.flex = '1';
                    input.style.minWidth = '200px';
                }
                
                row.appendChild(label);
                row.appendChild(input);
                
                return row;
            }

            updateEditModalFields() {
                const status = document.getElementById('editStatus')?.value;
                const myCostRow = document.getElementById('editMyCostRow');
                const participantRow = document.getElementById('editParticipantRow');
                const costRow = document.getElementById('editCostRow');
                const interestRow = document.getElementById('editInterestRow');
                
                // Reset all fields
                if (myCostRow) myCostRow.style.display = 'none';
                if (participantRow) participantRow.style.display = 'none';
                if (costRow) costRow.style.display = 'none';
                if (interestRow) interestRow.style.display = 'flex';
                
                // Clear non-relevant fields
                const myCostInput = document.getElementById('editMyCost');
                const participantInput = document.getElementById('editParticipant');
                const costInput = document.getElementById('editCost');
                const interestInput = document.getElementById('editInterest');
                
                if (myCostInput) myCostInput.value = '';
                if (participantInput) participantInput.value = '';
                if (costInput) costInput.value = '';
                
                if (status === 'Preso da me') {
                    if (myCostRow) myCostRow.style.display = 'flex';
                } else if (status === 'Preso da altri') {
                    if (participantRow) participantRow.style.display = 'flex';
                    if (costRow) costRow.style.display = 'flex';
                    if (interestRow) interestRow.style.display = 'none';
                    if (interestInput) interestInput.checked = false;
                }
            }

            resetPlayerValues() {
                if (!confirm('⚠️ Sei sicuro di voler resettare tutti i valori del giocatore ai valori di default?')) {
                    return;
                }
                
                try {
                    const player = this.currentEditingPlayer;
                    const oldStatus = player.status;
                    const oldCost = player.cost;
                    const oldOwner = player.ownedBy;
                    const oldOtherCost = player.otherCost;
                    
                    // Reset player values
                    player.expectedValue = '';
                    player.status = 'Disponibile';
                    player.interest = false;
                    player.ownedBy = '';
                    player.otherCost = 0;
                    
                    // Handle status changes
                    if (oldStatus === 'Preso da me') {
                        this.state.credits.remaining += oldCost;
                        player.cost = 0;
                        this.state.totalPlayers--;
                    } else if (oldStatus === 'Preso da altri' && oldOwner) {
                        this.updateParticipantStats(oldOwner, {...player, ownedBy: oldOwner, otherCost: oldOtherCost}, 'remove');
                    }
                    
                    // Move to Non inseriti if needed
                    if (this.currentEditingTier !== 'Non inseriti') {
                        this.movePlayerToTier(player, this.currentEditingRole, this.currentEditingTier, 'Non inseriti');
                        this.currentEditingTier = 'Non inseriti';
                    }
                    
                    this.updatePlayer(player, this.currentEditingRole, this.currentEditingTier);
                    this.updateUI();
                    this.renderTracker();
                    this.saveToStorage();
                    
                    // Update form fields
                    const form = document.getElementById('playerEditModal');
                    if (form) {
                        const expectedValueInput = form.querySelector('#editExpectedValue');
                        const statusSelect = form.querySelector('#editStatus');
                        const tierSelect = form.querySelector('#editTier');
                        const interestCheckbox = form.querySelector('#editInterest');
                        
                        if (expectedValueInput) expectedValueInput.value = '';
                        if (statusSelect) statusSelect.value = 'Disponibile';
                        if (tierSelect) tierSelect.value = 'Non inseriti';
                        if (interestCheckbox) interestCheckbox.checked = false;
                        
                        this.updateEditModalFields();
                    }
                    
                    this.notifications.show('success', null, 'Giocatore resettato ai valori default! 🔄');
                    
                } catch (error) {
                    this.errorHandler.handleError(error, 'Reset Player Values');
                }
            }

            savePlayerChanges() {
                try {
                    const playerData = this.currentEditingPlayer;
                    const oldStatus = playerData.status;
                    const oldOwner = playerData.ownedBy;
                    const oldCost = playerData.cost;
                    const oldOtherCost = playerData.otherCost;
                    
                    // Read values from form
                    const expectedValueInput = document.getElementById('editExpectedValue');
                    const statusSelect = document.getElementById('editStatus');
                    const tierSelect = document.getElementById('editTier');
                    const interestCheckbox = document.getElementById('editInterest');
                    const participantSelect = document.getElementById('editParticipant');
                    const costInput = document.getElementById('editCost');
                    const myCostInput = document.getElementById('editMyCost');
                    
                    const newExpectedValue = expectedValueInput?.value || '';
                    const newStatus = statusSelect?.value || 'Disponibile';
                    const newTier = tierSelect?.value || 'Non inseriti';
                    const newInterest = interestCheckbox?.checked || false;
                    const newOwner = participantSelect?.value || '';
                    const newOtherCost = parseInt(costInput?.value) || 0;
                    const newMyCost = parseInt(myCostInput?.value) || 0;
                    
                    // Validate inputs
                    if (newStatus === 'Preso da me' && newMyCost <= 0) {
                        this.notifications.show('error', 'Errore', 'Inserisci un costo valido per il giocatore acquistato');
                        return;
                    }
                    
                    if (newStatus === 'Preso da altri' && !newOwner) {
                        this.notifications.show('error', 'Errore', 'Seleziona il proprietario del giocatore');
                        return;
                    }
                    
                    // Update player data
                    playerData.expectedValue = newExpectedValue;
                    playerData.status = newStatus;
                    playerData.interest = newInterest;
                    playerData.ownedBy = newOwner;
                    playerData.otherCost = newOtherCost;
                    
                    // Handle status changes
                    if (oldStatus !== newStatus) {
                        if (oldStatus === 'Preso da me' && newStatus !== 'Preso da me') {
                            // Sell player
                            this.state.credits.remaining += oldCost;
                            playerData.cost = 0;
                            this.state.totalPlayers--;
                            this.notifications.show('success', null, `${playerData.name} venduto! Restituiti ${oldCost} crediti`);
                        } else if (oldStatus !== 'Preso da me' && newStatus === 'Preso da me') {
                            // Buy player
                            if (Utils.validateCredits(newMyCost)) {
                                playerData.cost = newMyCost;
                                this.state.credits.remaining = Math.max(0, this.state.credits.remaining - newMyCost);
                                this.state.totalPlayers++;
                                this.notifications.show('success', null, `${playerData.name} acquistato per ${newMyCost} crediti! 🎉`);
                            } else {
                                this.notifications.show('error', 'Errore', 'Costo non valido');
                                return;
                            }
                        } else if (oldStatus === 'Preso da altri' && newStatus !== 'Preso da altri') {
                            // Remove from participant stats
                            if (oldOwner) {
                                this.updateParticipantStats(oldOwner, {...playerData, ownedBy: oldOwner, otherCost: oldOtherCost}, 'remove');
                            }
                        }
                    } else if (newStatus === 'Preso da me' && oldCost !== newMyCost) {
                        // Only cost changed for owned player
                        const costDifference = newMyCost - oldCost;
                        this.state.credits.remaining -= costDifference;
                        playerData.cost = newMyCost;
                        this.notifications.show('success', null, `Costo di ${playerData.name} aggiornato a ${newMyCost} crediti`);
                    }
                    
                    // Handle participant changes for "Preso da altri"
                    if (newStatus === 'Preso da altri') {
                        if (oldOwner !== newOwner) {
                            if (oldOwner) {
                                this.updateParticipantStats(oldOwner, {...playerData, ownedBy: oldOwner, otherCost: oldOtherCost}, 'remove');
                            }
                            if (newOwner) {
                                this.updateParticipantStats(newOwner, playerData, 'add');
                            }
                        } else if (oldOtherCost !== newOtherCost && newOwner) {
                            this.updateParticipantStats(newOwner, {...playerData, otherCost: oldOtherCost}, 'remove');
                            this.updateParticipantStats(newOwner, playerData, 'add');
                        }
                    }
                    
                    // Handle tier change
                    if (this.currentEditingTier !== newTier) {
                        this.movePlayerToTier(playerData, this.currentEditingRole, this.currentEditingTier, newTier);
                        this.currentEditingTier = newTier;
                    }
                    
                    // Update all roles of the player
                    this.updatePlayer(playerData, this.currentEditingRole, this.currentEditingTier);
                    this.updateUI();
                    this.renderTracker();
                    this.saveToStorage();
                    
                    this.closeModal('playerEditModal');
                    this.notifications.show('success', null, 'Modifiche salvate! 💾');
                    
                } catch (error) {
                    this.errorHandler.handleError(error, 'Save Player Changes');
                }
            }

            removePlayerFromModal() {
                if (confirm(`⚠️ Sei sicuro di voler rimuovere ${this.currentEditingPlayer.name} dalla lista?`)) {
                    this.removePlayer(this.currentEditingPlayer, this.currentEditingRole);
                    this.closeModal('playerEditModal');
                }
            }

            updatePlayer(playerData, role, tier) {
                playerData.roles.forEach(r => {
                    if (this.state.players[r] && this.state.players[r][tier] && this.state.players[r][tier][playerData.name]) {
                        Object.assign(this.state.players[r][tier][playerData.name], playerData);
                    }
                });
                
                this.saveToStorage();
            }

            movePlayerToTier(playerData, role, currentTier, newTier) {
                if (currentTier !== newTier) {
                    playerData.roles.forEach(r => {
                        if (this.state.players[r] && this.state.players[r][currentTier] && this.state.players[r][currentTier][playerData.name]) {
                            if (!this.state.players[r][newTier]) this.state.players[r][newTier] = {};
                            this.state.players[r][newTier][playerData.name] = {...playerData};
                            delete this.state.players[r][currentTier][playerData.name];
                        }
                    });
                    
                    this.saveToStorage();
                    this.notifications.show('success', null, `${playerData.name} spostato in ${newTier}`);
                }
            }

            removePlayer(playerData, role) {
                // Remove from all roles
                playerData.roles.forEach(r => {
                    Object.keys(this.state.players[r] || {}).forEach(tier => {
                        if (this.state.players[r][tier] && this.state.players[r][tier][playerData.name]) {
                            delete this.state.players[r][tier][playerData.name];
                        }
                    });
                });
                
                // Add to removed players
                this.state.removedPlayers.push({...playerData, role});
                
                this.saveToStorage();
                this.renderTracker();
                this.updateUI();
                this.notifications.show('success', null, `${playerData.name} rimosso dalla lista`);
            }

            // ===== PARTICIPANT MANAGEMENT =====
            updateParticipantStats(participantName, playerData, action) {
                const participant = this.state.participants.find(p => p.name === participantName);
                if (!participant) return;
                
                if (action === 'add') {
                    participant.allPlayers = participant.allPlayers || [];
                    participant.allPlayers.push(playerData);
                    participant.playersOwned = (participant.playersOwned || 0) + 1;
                    participant.totalSpent = (participant.totalSpent || 0) + (playerData.otherCost || 0);
                    participant.remainingCredits = (participant.credits || 500) - participant.totalSpent;
                    
                    // Add to roles
                    playerData.roles.forEach(role => {
                        if (!participant.playersByRole) participant.playersByRole = {};
                        if (!participant.playersByRole[role]) participant.playersByRole[role] = [];
                        participant.playersByRole[role].push({
                            name: playerData.name,
                            squad: playerData.squad,
                            cost: playerData.otherCost || 0,
                            roles: playerData.roles
                        });
                    });
                } else if (action === 'remove') {
                    participant.allPlayers = participant.allPlayers || [];
                    const index = participant.allPlayers.findIndex(p => p.name === playerData.name);
                    if (index !== -1) {
                        participant.allPlayers.splice(index, 1);
                        participant.playersOwned = Math.max(0, (participant.playersOwned || 0) - 1);
                        participant.totalSpent = Math.max(0, (participant.totalSpent || 0) - (playerData.otherCost || 0));
                        participant.remainingCredits = (participant.credits || 500) - participant.totalSpent;
                        
                        // Remove from roles
                        playerData.roles.forEach(role => {
                            if (participant.playersByRole && participant.playersByRole[role]) {
                                const roleIndex = participant.playersByRole[role].findIndex(p => p.name === playerData.name);
                                if (roleIndex !== -1) {
                                    participant.playersByRole[role].splice(roleIndex, 1);
                                }
                            }
                        });
                    }
                }
                
                this.saveToStorage();
            }

            // ===== OTHER MODAL METHODS =====
            showOwnedPlayers() {
                const content = this.createOwnedPlayersContent();
                this.createModal('ownedPlayersModal', '📊 Giocatori presi per ruolo', content);
                this.showModal('ownedPlayersModal');
            }

            createOwnedPlayersContent() {
                const container = document.createElement('div');
                
                // Search bar
                const searchDiv = document.createElement('div');
                searchDiv.style.background = 'rgba(255, 255, 255, 0.95)';
                searchDiv.style.backdropFilter = 'blur(20px)';
                searchDiv.style.padding = 'var(--space-5)';
                searchDiv.style.marginBottom = 'var(--space-5)';
                searchDiv.style.borderRadius = 'var(--border-radius-2xl)';
                searchDiv.style.boxShadow = 'var(--shadow-sm)';
                searchDiv.style.border = '2px solid var(--color-success-500)';
                
                const searchContainer = document.createElement('div');
                searchContainer.style.display = 'flex';
                searchContainer.style.alignItems = 'center';
                searchContainer.style.gap = 'var(--space-3)';
                
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.id = 'ownedSearchInput';
                searchInput.className = 'form-control';
                searchInput.placeholder = '🔍 Cerca nei giocatori presi...';
                
                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn btn--danger btn--sm';
                clearBtn.textContent = '✖';
                clearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.renderOwnedPlayersList();
                });
                
                searchContainer.appendChild(searchInput);
                searchContainer.appendChild(clearBtn);
                searchDiv.appendChild(searchContainer);
                container.appendChild(searchDiv);
                
                // Players list
                const listDiv = document.createElement('div');
                listDiv.id = 'ownedPlayersList';
                container.appendChild(listDiv);
                
                // Setup search
                const debouncedOwnedSearch = Utils.debounce((query) => {
                    this.renderOwnedPlayersList(query.toLowerCase().trim());
                }, 300);
                
                searchInput.addEventListener('input', (e) => {
                    debouncedOwnedSearch(e.target.value);
                });
                
                // Initial render
                this.renderOwnedPlayersList();
                
                return container;
            }

            renderOwnedPlayersList(searchQuery = '') {
                const container = document.getElementById('ownedPlayersList');
                if (!container) return;
                
                container.innerHTML = '';
                
                const byRole = {};
                this.roles.forEach(role => { byRole[role] = []; });
                const processedPlayers = new Set();
                let totalCost = 0;

                Object.values(this.state.players).forEach(tiers => {
                    Object.values(tiers).forEach(tier => {
                        Object.values(tier).forEach(player => {
                            if (player.status === 'Preso da me' && !processedPlayers.has(player.name)) {
                                // Apply search filter
                                if (!searchQuery || player.name.toLowerCase().includes(searchQuery)) {
                                    player.roles.forEach(r => {
                                        if (byRole[r]) {
                                            byRole[r].push(player);
                                        }
                                    });
                                }
                                processedPlayers.add(player.name);
                                totalCost += player.cost;
                            }
                        });
                    });
                });

                // Total spent
                const totalDiv = document.createElement('div');
                totalDiv.style.background = 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))';
                totalDiv.style.color = 'white';
                totalDiv.style.padding = 'var(--space-5)';
                totalDiv.style.borderRadius = 'var(--border-radius-2xl)';
                totalDiv.style.textAlign = 'center';
                totalDiv.style.marginBottom = 'var(--space-6)';
                totalDiv.style.fontSize = 'var(--font-size-xl)';
                totalDiv.style.fontWeight = 'var(--font-weight-bold)';
                
                const costDiv = document.createElement('div');
                costDiv.textContent = `💰 Totale speso: ${totalCost} crediti`;
                totalDiv.appendChild(costDiv);
                
                const playersDiv = document.createElement('div');
                playersDiv.textContent = `👥 Giocatori acquistati: ${this.state.totalPlayers}/30`;
                totalDiv.appendChild(playersDiv);
                
                container.appendChild(totalDiv);

                let hasVisiblePlayers = false;
                this.roles.forEach(role => {
                    if (byRole[role].length > 0) {
                        hasVisiblePlayers = true;
                        
                        const roleSection = document.createElement('div');
                        roleSection.style.marginBottom = 'var(--space-5)';
                        roleSection.style.background = 'linear-gradient(135deg, white, var(--color-gray-50))';
                        roleSection.style.borderRadius = 'var(--border-radius-lg)';
                        roleSection.style.padding = 'var(--space-5)';
                        roleSection.style.boxShadow = 'var(--shadow-sm)';
                        roleSection.style.borderLeft = '4px solid var(--color-primary-500)';
                        
                        const roleTitle = document.createElement('h3');
                        roleTitle.textContent = `${role} (${byRole[role].length})`;
                        roleTitle.style.color = 'var(--color-primary-500)';
                        roleTitle.style.margin = '0 0 var(--space-4) 0';
                        roleTitle.style.fontSize = 'var(--font-size-xl)';
                        roleSection.appendChild(roleTitle);
                        
                        byRole[role].forEach(player => {
                            const playerDiv = document.createElement('div');
                            playerDiv.style.margin = 'var(--space-2) 0';
                            playerDiv.style.padding = 'var(--space-3)';
                            playerDiv.style.background = 'white';
                            playerDiv.style.borderRadius = 'var(--border-radius-lg)';
                            playerDiv.style.boxShadow = 'var(--shadow-sm)';
                            playerDiv.style.display = 'flex';
                            playerDiv.style.justifyContent = 'space-between';
                            playerDiv.style.alignItems = 'center';
                            playerDiv.style.flexWrap = 'wrap';
                            playerDiv.style.gap = 'var(--space-3)';
                            
                            const infoDiv = document.createElement('div');
                            
                            const nameDiv = document.createElement('div');
                            nameDiv.innerHTML = `<strong>${Utils.sanitizeText(player.name)}</strong> (${Utils.sanitizeText(player.squad)})`;
                            infoDiv.appendChild(nameDiv);
                            
                            const rolesDiv = document.createElement('small');
                            rolesDiv.style.color = 'var(--color-info-500)';
                            rolesDiv.style.fontWeight = 'var(--font-weight-semibold)';
                            rolesDiv.textContent = `Ruoli: ${player.roles.join(', ')}`;
                            infoDiv.appendChild(rolesDiv);
                            
                            const costDiv = document.createElement('span');
                            costDiv.style.color = 'var(--color-success-500)';
                            costDiv.style.fontWeight = 'var(--font-weight-semibold)';
                            costDiv.style.fontSize = 'var(--font-size-lg)';
                            costDiv.textContent = `${player.cost} crediti`;
                            
                            playerDiv.appendChild(infoDiv);
                            playerDiv.appendChild(costDiv);
                            roleSection.appendChild(playerDiv);
                        });
                        
                        container.appendChild(roleSection);
                    }
                });
                
                if (!hasVisiblePlayers) {
                    if (searchQuery) {
                        container.innerHTML += '<div class="no-results">Nessun risultato per la ricerca</div>';
                    } else {
                        container.innerHTML += '<div class="empty-state"><span class="empty-state__emoji">🛒</span>Nessun giocatore acquistato ancora</div>';
                    }
                }
            }

            showRemovedPlayers() {
                const content = this.createRemovedPlayersContent();
                this.createModal('removedPlayersModal', '👻 Giocatori Rimossi', content);
                this.showModal('removedPlayersModal');
            }

            createRemovedPlayersContent() {
                const container = document.createElement('div');
                
                // Count header
                const countDiv = document.createElement('div');
                countDiv.style.display = 'flex';
                countDiv.style.justifyContent = 'space-between';
                countDiv.style.alignItems = 'center';
                countDiv.style.marginBottom = 'var(--space-5)';
                
                const countBadge = document.createElement('div');
                countBadge.id = 'removedPlayersCount';
                countBadge.style.background = 'var(--color-danger-500)';
                countBadge.style.color = 'white';
                countBadge.style.padding = 'var(--space-2) var(--space-4)';
                countBadge.style.borderRadius = 'var(--border-radius-lg)';
                countBadge.style.fontWeight = 'var(--font-weight-semibold)';
                countBadge.textContent = `${this.state.removedPlayers.length} rimossi`;
                
                countDiv.appendChild(countBadge);
                container.appendChild(countDiv);
                
                // Search bar
                const searchDiv = document.createElement('div');
                searchDiv.style.background = 'rgba(255, 255, 255, 0.95)';
                searchDiv.style.backdropFilter = 'blur(20px)';
                searchDiv.style.padding = 'var(--space-5)';
                searchDiv.style.marginBottom = 'var(--space-5)';
                searchDiv.style.borderRadius = 'var(--border-radius-2xl)';
                searchDiv.style.boxShadow = 'var(--shadow-sm)';
                searchDiv.style.border = '2px solid var(--color-danger-500)';
                
                const searchContainer = document.createElement('div');
                searchContainer.style.display = 'flex';
                searchContainer.style.alignItems = 'center';
                searchContainer.style.gap = 'var(--space-3)';
                
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.id = 'removedSearchInput';
                searchInput.className = 'form-control';
                searchInput.placeholder = '🔍 Cerca nei giocatori rimossi...';
                
                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn btn--danger btn--sm';
                clearBtn.textContent = '✖';
                clearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.renderRemovedPlayersList();
                });
                
                searchContainer.appendChild(searchInput);
                searchContainer.appendChild(clearBtn);
                searchDiv.appendChild(searchContainer);
                container.appendChild(searchDiv);
                
                // Players list
                const listDiv = document.createElement('div');
                listDiv.id = 'removedPlayersList';
                container.appendChild(listDiv);
                
                // Setup search
                const debouncedRemovedSearch = Utils.debounce((query) => {
                    this.renderRemovedPlayersList(query.toLowerCase().trim());
                }, 300);
                
                searchInput.addEventListener('input', (e) => {
                    debouncedRemovedSearch(e.target.value);
                });
                
                // Initial render
                this.renderRemovedPlayersList();
                
                return container;
            }

            renderRemovedPlayersList(searchQuery = '') {
                const container = document.getElementById('removedPlayersList');
                if (!container) return;

                container.innerHTML = '';
                
                const filteredPlayers = this.state.removedPlayers.filter(player => 
                    !searchQuery || player.name.toLowerCase().includes(searchQuery)
                );
                
                if (filteredPlayers.length === 0) {
                    if (searchQuery) {
                        container.innerHTML = '<div class="no-results">Nessun risultato per la ricerca</div>';
                    } else {
                        container.innerHTML = '<div class="empty-state"><span class="empty-state__emoji">👻</span>Nessun giocatore rimosso</div>';
                    }
                    return;
                }
                
                // Group by role
                const byRole = {};
                this.roles.forEach(role => { byRole[role] = []; });
                
                filteredPlayers.forEach(player => {
                    player.roles.forEach(role => {
                        if (byRole[role]) {
                            byRole[role].push(player);
                        }
                    });
                });
                
                // Render by role
                this.roles.forEach(role => {
                    if (byRole[role].length > 0) {
                        const roleSection = document.createElement('div');
                        roleSection.style.marginBottom = 'var(--space-5)';
                        roleSection.style.background = 'linear-gradient(135deg, white, var(--color-gray-50))';
                        roleSection.style.borderRadius = 'var(--border-radius-lg)';
                        roleSection.style.padding = 'var(--space-5)';
                        roleSection.style.boxShadow = 'var(--shadow-sm)';
                        roleSection.style.borderLeft = '4px solid var(--color-danger-500)';
                        
                        const roleTitle = document.createElement('h4');
                        roleTitle.textContent = `${role} (${byRole[role].length})`;
                        roleTitle.style.color = 'var(--color-danger-500)';
                        roleTitle.style.margin = '0 0 var(--space-4) 0';
                        roleTitle.style.fontSize = 'var(--font-size-xl)';
                        roleSection.appendChild(roleTitle);
                        
                        byRole[role].forEach(player => {
                            const originalIndex = this.state.removedPlayers.findIndex(p => 
                                p.name === player.name && p.squad === player.squad
                            );
                            
                            const playerDiv = document.createElement('div');
                            playerDiv.style.display = 'flex';
                            playerDiv.style.justifyContent = 'space-between';
                            playerDiv.style.alignItems = 'center';
                            playerDiv.style.padding = 'var(--space-4)';
                            playerDiv.style.margin = 'var(--space-3) 0';
                            playerDiv.style.background = 'white';
                            playerDiv.style.borderRadius = 'var(--border-radius-lg)';
                            playerDiv.style.boxShadow = 'var(--shadow-sm)';
                            
                            const playerInfo = document.createElement('div');
                            playerInfo.style.flex = '1';
                            playerInfo.style.minWidth = '200px';
                            
                            const nameDiv = document.createElement('div');
                            nameDiv.innerHTML = `<strong style="color: var(--color-gray-800);">${Utils.sanitizeText(player.name)}</strong> <span style="color: var(--color-gray-600);">(${Utils.sanitizeText(player.squad)})</span>`;
                            playerInfo.appendChild(nameDiv);
                            
                            const rolesDiv = document.createElement('small');
                            rolesDiv.style.color = 'var(--color-info-500)';
                            rolesDiv.style.fontWeight = 'var(--font-weight-semibold)';
                            rolesDiv.textContent = `Ruoli: ${player.roles.join(', ')}`;
                            playerInfo.appendChild(rolesDiv);
                            
                            const restoreButton = document.createElement('button');
                            restoreButton.className = 'btn btn--success';
                            restoreButton.textContent = '↩️ Ripristina';
                            restoreButton.addEventListener('click', () => this.restorePlayer(originalIndex));
                            
                            playerDiv.appendChild(playerInfo);
                            playerDiv.appendChild(restoreButton);
                            roleSection.appendChild(playerDiv);
                        });
                        
                        container.appendChild(roleSection);
                    }
                });
            }

            restorePlayer(index) {
                const player = this.state.removedPlayers[index];
                
                player.roles.forEach(role => {
                    if (!this.state.players[role]) this.state.players[role] = {};
                    if (!this.state.players[role]['Non inseriti']) this.state.players[role]['Non inseriti'] = {};
                    this.state.players[role]['Non inseriti'][player.name] = player;
                });
                
                this.state.removedPlayers.splice(index, 1);
                this.saveToStorage();
                this.renderTracker();
                this.updateUI();
                this.renderRemovedPlayersList(); // Refresh modal
                this.notifications.show('success', null, `${player.name} ripristinato con successo! ↩️`);
            }

            showPlayerDetails(role) {
                const players = this.state.playerCounts[role]?.players || [];
                
                const content = document.createElement('div');
                
                const title = document.createElement('h3');
                title.textContent = `Giocatori ${role} (${players.length})`;
                title.style.color = 'var(--color-primary-500)';
                title.style.marginBottom = 'var(--space-5)';
                content.appendChild(title);
                
                players.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.style.padding = 'var(--space-4)';
                    playerDiv.style.margin = 'var(--space-3) 0';
                    playerDiv.style.background = 'linear-gradient(135deg, white, var(--color-gray-50))';
                    playerDiv.style.borderRadius = 'var(--border-radius-lg)';
                    playerDiv.style.boxShadow = 'var(--shadow-sm)';
                    playerDiv.style.borderLeft = '4px solid var(--color-primary-500)';
                    
                    playerDiv.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
                            <div>
                                <strong>${Utils.sanitizeText(player.name)}</strong> (${Utils.sanitizeText(player.squad)})<br>
                                <small style="color: var(--color-info-500); font-weight: var(--font-weight-semibold);">
                                    Ruoli: ${player.roles.join(', ')}
                                </small>
                            </div>
                            <span style="color: var(--color-success-500); font-weight: var(--font-weight-semibold); font-size: var(--font-size-lg);">
                                ${player.cost} crediti
                            </span>
                        </div>
                    `;
                    content.appendChild(playerDiv);
                });
                
                this.createModal('playerDetailsModal', `Giocatori ${role}`, content);
                this.showModal('playerDetailsModal');
            }

            showFormationModal() {
                // This is a placeholder - full formation system would be implemented similarly
                this.notifications.show('info', 'Info', 'Sistema formazioni in sviluppo');
            }

            showFormationImageModal() {
                // This is a placeholder - image management would be implemented similarly
                this.notifications.show('info', 'Info', 'Gestione immagini in sviluppo');
            }

            showParticipantsModal() {
                // This is a placeholder - participants system would be implemented similarly
                this.notifications.show('info', 'Info', 'Gestione partecipanti in sviluppo');
            }

            // ===== SCROLL AND RESIZE HANDLERS =====
            handleScroll() {
                const scrollBtn = document.getElementById("scrollTopBtn");
                if (scrollBtn) {
                    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
                        scrollBtn.style.display = "flex";
                    } else {
                        scrollBtn.style.display = "none";
                    }
                }
            }

            handleResize() {
                // Handle responsive changes if needed
                this.renderTracker();
            }

            scrollToTop() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                this.accessibility.announceToScreenReader('Tornato all\'inizio della pagina');
            }

            // ===== STORAGE METHODS =====
            saveToStorage() {
                const success = this.storage.save(this.state);
                if (!success) {
                    this.notifications.show('warning', 'Attenzione', 'Problemi nel salvataggio dei dati');
                }
            }

            loadFromStorage() {
                const data = this.storage.load();
                if (data) {
                    try {
                        // Merge saved state with current state
                        Object.assign(this.state, {
                            players: data.players || {},
                            credits: data.credits || { total: 500, remaining: 500 },
                            playerCounts: data.playerCounts || {},
                            removedPlayers: data.removedPlayers || [],
                            totalPlayers: data.totalPlayers || 0,
                            participants: data.participants || [],
                            formationImageData: data.formationImageData || null,
                            filters: {
                                search: data.filters?.search || '',
                                showInteresting: data.filters?.showInteresting || false
                            },
                            selectedLineup: data.selectedLineup || {},
                            multiPlayerFormationMode: data.multiPlayerFormationMode || false
                        });
                        
                        // Update UI to reflect loaded filters
                        const filterBtn = document.getElementById('interestFilter');
                        if (filterBtn && this.state.filters.showInteresting) {
                            filterBtn.classList.add('btn--success');
                            filterBtn.classList.remove('btn--secondary');
                            filterBtn.textContent = '⭐ Solo Interessanti (ON)';
                            filterBtn.setAttribute('aria-pressed', 'true');
                        }
                        
                        this.notifications.show('success', null, 'Dati caricati dal salvataggio locale! 📂');
                    } catch (error) {
                        this.errorHandler.handleError(error, 'Load From Storage');
                    }
                } else {
                    this.notifications.show('info', null, 'Nessun salvataggio trovato - iniziando da zero');
                }
            }

            // ===== RESET DATA =====
            resetData() {
                if (confirm("⚠️ Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.")) {
                    // Reset all state
                    this.state = {
                        players: {},
                        credits: { total: 500, remaining: 500 },
                        playerCounts: {},
                        removedPlayers: [],
                        totalPlayers: 0,
                        participants: [],
                        formationImageData: null,
                        filters: {
                            search: '',
                            showInteresting: false
                        },
                        selectedLineup: {},
                        multiPlayerFormationMode: false
                    };
                    
                    // Reset UI
                    const filterBtn = document.getElementById('interestFilter');
                    if (filterBtn) {
                        filterBtn.classList.add('btn--secondary');
                        filterBtn.classList.remove('btn--success');
                        filterBtn.textContent = '⭐ Solo Interessanti';
                        filterBtn.setAttribute('aria-pressed', 'false');
                    }
                    
                    const searchInput = document.getElementById('mainSearchInput');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    this.storage.clear();
                    this.renderTracker();
                    this.updateUI();
                    this.notifications.show('success', null, 'Dati resettati con successo! 🔄');
                }
            }

            // ===== CLEANUP =====
            destroy() {
                this.removeEventListeners();
                this.notifications.hideAll();
                
                // Clear any pending timeouts/intervals
                this.accessibility.trapStack.forEach(trap => {
                    this.accessibility.releaseFocus(trap.element);
                });
                
                console.log('FantacalcioTracker destroyed');
            }
        }

        // ===== GLOBAL ERROR HANDLING =====
        window.addEventListener('beforeunload', () => {
            if (window.app) {
                window.app.destroy();
            }
        });

        // ===== INITIALIZE APPLICATION =====
        document.addEventListener('DOMContentLoaded', () => {
            try {
                window.app = new FantacalcioTracker();
                console.log('🎉 Fantacalcio Tracker v4.0 inizializzato con successo!');
            } catch (error) {
                console.error('❌ Errore durante l\'inizializzazione:', error);
                
                // Fallback error display
                document.body.innerHTML = `
                    <div style="
                        position: fixed; 
                        top: 50%; 
                        left: 50%; 
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                        text-align: center;
                        max-width: 90vw;
                    ">
                        <h2 style="color: #dc2626; margin-bottom: 1rem;">❌ Errore di Inizializzazione</h2>
                        <p style="color: #6b7280; margin-bottom: 1.5rem;">
                            Si è verificato un errore durante il caricamento dell'applicazione.
                        </p>
                        <button onclick="location.reload()" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 0.5rem;
                            cursor: pointer;
                            font-weight: 600;
                        ">
                            🔄 Ricarica Pagina
                        </button>
                    </div>
                `;
            }
        });

        // Add some CSS for keyboard navigation
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-navigation *:focus {
                outline: 2px solid var(--color-primary-500) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);

        // Performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    console.log(`⚡ Tempo di caricamento: ${loadTime.toFixed(2)}ms`);
                }, 0);
            });
        }
