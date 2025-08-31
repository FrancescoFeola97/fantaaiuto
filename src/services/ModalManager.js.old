import { Utils } from '../utils/Utils.js';

export class ModalManager {
  constructor() {
    this.container = null;
    this.activeModals = new Map();
  }

  init() {
    this.container = document.getElementById('modals-container');
    if (!this.container) {
      this.container = this.createContainer();
      document.body.appendChild(this.container);
    }
    return Promise.resolve();
  }

  createContainer() {
    const container = Utils.createElement('div');
    container.id = 'modals-container';
    container.className = 'modals-container';
    return container;
  }

  show(id, title, content, options = {}) {
    if (!this.container) {
      this.init();
    }

    // Hide existing modal with same ID to prevent duplicates
    if (this.activeModals.has(id)) {
      this.hide(id);
    }

    const modal = this.createModal(id, title, content, options);
    this.container.appendChild(modal);
    this.activeModals.set(id, modal);

    // Show with animation
    requestAnimationFrame(() => {
      this.container.classList.add('active');
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
      
      // Focus first interactive element
      const firstInput = modal.querySelector('input, button, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    });

    // Handle escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide(id);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return modal;
  }

  createModal(id, title, content, options = {}) {
    const modal = Utils.createElement('div', 'modal');
    modal.id = id;
    modal.style.cssText = `
      opacity: 0;
      transform: scale(0.9);
      transition: all 0.3s ease-out;
    `;

    const header = Utils.createElement('div', 'modal-header');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-gray-200);
    `;

    const titleEl = Utils.createElement('h2', 'modal-title', title);
    titleEl.style.cssText = `
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    `;

    const closeBtn = Utils.createElement('button', 'modal-close', '×');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: var(--font-size-2xl);
      cursor: pointer;
      color: var(--color-gray-400);
      line-height: 1;
      padding: 0;
      width: var(--space-8);
      height: var(--space-8);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-md);
    `;

    closeBtn.addEventListener('click', () => this.hide(id));

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = Utils.createElement('div', 'modal-body');
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }

    modal.appendChild(header);
    modal.appendChild(body);

    // Handle backdrop click - attach to modal instead of container to avoid multiple listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide(id);
      }
    });

    return modal;
  }

  hide(id) {
    const modal = this.activeModals.get(id);
    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';

    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      this.activeModals.delete(id);

      // Hide container if no active modals
      if (this.activeModals.size === 0) {
        this.container.classList.remove('active');
      }
      
      // Emit modal closed event
      Utils.dispatchCustomEvent('fantaaiuto:modalClosed', { modalId: id });
    }, 300);
  }

  hideAll() {
    this.activeModals.forEach((modal, id) => {
      this.hide(id);
    });
  }

  isVisible(id) {
    return this.activeModals.has(id);
  }

  confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      const content = Utils.createElement('div');
      
      if (message) {
        const messageEl = Utils.createElement('p', '', message);
        messageEl.style.cssText = `
          margin-bottom: var(--space-6);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        `;
        content.appendChild(messageEl);
      }

      const actions = Utils.createElement('div', 'modal-actions');
      actions.style.cssText = `
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      `;

      const cancelBtn = Utils.createElement('button', 'btn btn-secondary', options.cancelText || 'Annulla');
      const confirmBtn = Utils.createElement('button', 'btn btn-primary', options.confirmText || 'Conferma');

      const cleanup = () => {
        this.hide('confirm-modal');
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      content.appendChild(actions);

      this.show('confirm-modal', title, content);
    });
  }

  prompt(title, message, options = {}) {
    return new Promise((resolve) => {
      const content = Utils.createElement('div');
      
      if (message) {
        const messageEl = Utils.createElement('p', '', message);
        messageEl.style.cssText = `
          margin-bottom: var(--space-4);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        `;
        content.appendChild(messageEl);
      }

      const input = Utils.createElement('input', 'form-input');
      input.type = 'text';
      input.value = options.defaultValue || '';
      input.placeholder = options.placeholder || '';
      input.style.cssText = `
        width: 100%;
        margin-bottom: var(--space-6);
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--color-gray-300);
        border-radius: var(--border-radius-lg);
        font-size: var(--font-size-base);
      `;

      const actions = Utils.createElement('div', 'modal-actions');
      actions.style.cssText = `
        display: flex;
        gap: var(--space-3);
        justify-content: flex-end;
      `;

      const cancelBtn = Utils.createElement('button', 'btn btn-secondary', options.cancelText || 'Annulla');
      const confirmBtn = Utils.createElement('button', 'btn btn-primary', options.confirmText || 'OK');

      const cleanup = () => {
        this.hide('prompt-modal');
      };

      const handleConfirm = () => {
        cleanup();
        resolve(input.value);
      };

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      confirmBtn.addEventListener('click', handleConfirm);
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirm();
        }
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      
      content.appendChild(input);
      content.appendChild(actions);

      this.show('prompt-modal', title, content);
      
      // Focus input after modal is shown
      setTimeout(() => input.focus(), 100);
    });
  }

  select(title, message, choices = []) {
    return new Promise((resolve) => {
      const content = Utils.createElement('div');
      
      if (message) {
        const messageEl = Utils.createElement('p', '', message);
        messageEl.style.cssText = `
          margin-bottom: var(--space-6);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        `;
        content.appendChild(messageEl);
      }

      const choicesContainer = Utils.createElement('div', 'choices-container');
      choicesContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-6);
      `;

      choices.forEach((choice, index) => {
        const choiceBtn = Utils.createElement('button', 'btn btn-secondary choice-btn');
        choiceBtn.textContent = choice.text || choice;
        choiceBtn.style.cssText = `
          text-align: left;
          padding: var(--space-4);
          border-radius: var(--border-radius-lg);
        `;
        
        choiceBtn.addEventListener('click', () => {
          this.hide('select-modal');
          resolve(choice.value !== undefined ? choice.value : choice);
        });

        choiceBtn.addEventListener('mouseenter', () => {
          choiceBtn.style.backgroundColor = 'var(--color-primary-50)';
        });

        choiceBtn.addEventListener('mouseleave', () => {
          choiceBtn.style.backgroundColor = 'var(--color-gray-100)';
        });

        choicesContainer.appendChild(choiceBtn);
      });

      const cancelBtn = Utils.createElement('button', 'btn btn-secondary', 'Annulla');
      cancelBtn.addEventListener('click', () => {
        this.hide('select-modal');
        resolve(null);
      });

      content.appendChild(choicesContainer);
      content.appendChild(cancelBtn);

      this.show('select-modal', title, content);
    });
  }
}