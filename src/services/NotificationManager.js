import { Utils } from '../utils/Utils.js';

export class NotificationManager {
  constructor() {
    this.container = null;
    this.activeToasts = new Map();
    this.defaultDuration = 3000;
  }

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = this.createContainer();
      document.body.appendChild(this.container);
    }
    return Promise.resolve();
  }

  createContainer() {
    const container = Utils.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    return container;
  }

  show(type = 'success', title, message, duration = null) {
    if (!this.container) {
      this.init();
    }

    const id = Utils.generateId();
    const toast = this.createToast(id, type, title, message);
    
    this.container.appendChild(toast);
    this.activeToasts.set(id, toast);

    if (type === 'error') {
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
    } else {
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
    }

    toast.setAttribute('aria-atomic', 'true');

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    const finalDuration = duration !== null ? duration : 
      (type === 'error' ? 5000 : this.defaultDuration);

    if (finalDuration > 0) {
      setTimeout(() => this.hide(id), finalDuration);
    }

    return id;
  }

  createToast(id, type, title, message) {
    const toast = Utils.createElement('div', `toast ${type}`);
    toast.setAttribute('data-toast-id', id);
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';

    const content = Utils.createElement('div', 'toast-content');

    if (title) {
      const titleEl = Utils.createElement('div', 'toast-title', title);
      titleEl.style.fontWeight = 'var(--font-weight-semibold)';
      titleEl.style.marginBottom = message ? 'var(--space-1)' : '0';
      content.appendChild(titleEl);
    }

    if (message) {
      const messageEl = Utils.createElement('div', 'toast-message', message);
      messageEl.style.fontSize = 'var(--font-size-sm)';
      messageEl.style.color = 'var(--color-gray-600)';
      content.appendChild(messageEl);
    }

    const closeBtn = Utils.createElement('button', 'toast-close', '×');
    closeBtn.style.cssText = `
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      background: none;
      border: none;
      font-size: var(--font-size-lg);
      cursor: pointer;
      color: var(--color-gray-400);
      line-height: 1;
      padding: 0;
      width: var(--space-5);
      height: var(--space-5);
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    closeBtn.addEventListener('click', () => this.hide(id));

    toast.appendChild(content);
    toast.appendChild(closeBtn);

    toast.addEventListener('mouseenter', () => this.pauseAutoHide(id));
    toast.addEventListener('mouseleave', () => this.resumeAutoHide(id));

    return toast;
  }

  hide(id) {
    const toast = this.activeToasts.get(id);
    if (!toast) return;

    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.activeToasts.delete(id);
    }, 300);
  }

  hideAll() {
    this.activeToasts.forEach((toast, id) => {
      this.hide(id);
    });
  }

  pauseAutoHide(id) {
    const toast = this.activeToasts.get(id);
    if (toast) {
      toast.dataset.paused = 'true';
    }
  }

  resumeAutoHide(id) {
    const toast = this.activeToasts.get(id);
    if (toast) {
      delete toast.dataset.paused;
    }
  }

  success(title, message, duration) {
    return this.show('success', title, message, duration);
  }

  error(title, message, duration = 5000) {
    return this.show('error', title, message, duration);
  }

  warning(title, message, duration) {
    return this.show('warning', title, message, duration);
  }

  info(title, message, duration) {
    return this.show('info', title, message, duration);
  }

  loading(title, message) {
    const id = this.show('info', title, message, 0);
    return {
      id,
      success: (newTitle, newMessage) => {
        this.hide(id);
        return this.success(newTitle || title, newMessage || message);
      },
      error: (newTitle, newMessage) => {
        this.hide(id);
        return this.error(newTitle || title, newMessage || message);
      },
      update: (newTitle, newMessage) => {
        const toast = this.activeToasts.get(id);
        if (toast) {
          const titleEl = toast.querySelector('.toast-title');
          const messageEl = toast.querySelector('.toast-message');
          if (titleEl && newTitle) titleEl.textContent = newTitle;
          if (messageEl && newMessage) messageEl.textContent = newMessage;
        }
      },
      hide: () => this.hide(id)
    };
  }

  confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      const modal = this.createConfirmModal(title, message, options, resolve);
      document.body.appendChild(modal);
      
      requestAnimationFrame(() => {
        modal.classList.add('active');
        const firstButton = modal.querySelector('button');
        if (firstButton) firstButton.focus();
      });
    });
  }

  createConfirmModal(title, message, options, resolve) {
    const overlay = Utils.createElement('div', 'modal-overlay');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-index-modal);
      opacity: 0;
      transition: opacity 0.3s ease-out;
    `;

    const modal = Utils.createElement('div', 'confirm-modal');
    modal.style.cssText = `
      background: white;
      border-radius: var(--border-radius-xl);
      padding: var(--space-6);
      max-width: 400px;
      width: 90%;
      transform: scale(0.9);
      transition: transform 0.3s ease-out;
    `;

    if (title) {
      const titleEl = Utils.createElement('h3', 'modal-title', title);
      titleEl.style.cssText = `
        margin-bottom: var(--space-4);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-gray-900);
      `;
      modal.appendChild(titleEl);
    }

    if (message) {
      const messageEl = Utils.createElement('p', 'modal-message', message);
      messageEl.style.cssText = `
        margin-bottom: var(--space-6);
        color: var(--color-gray-600);
        line-height: var(--line-height-relaxed);
      `;
      modal.appendChild(messageEl);
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
      overlay.style.opacity = '0';
      modal.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    };

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });

    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escListener);
        cleanup();
        resolve(false);
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);

    overlay.classList.add = function(className) {
      if (className === 'active') {
        requestAnimationFrame(() => {
          overlay.style.opacity = '1';
          modal.style.transform = 'scale(1)';
        });
      }
    };

    return overlay;
  }

  getActiveToasts() {
    return Array.from(this.activeToasts.keys());
  }

  clear() {
    this.hideAll();
  }
}