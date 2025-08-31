import { Utils } from '../../utils/Utils.js';
import { authManager } from '../../services/AuthManager.js';

export class LoginForm {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = {
      showRegister: true,
      redirectOnLogin: true,
      ...options
    };
    
    this.isLoading = false;
    this.currentMode = 'login'; // 'login' or 'register'
    
    if (!this.container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }
  }

  render() {
    this.container.innerHTML = this.createLoginFormHTML();
    this.setupEventListeners();
  }

  createLoginFormHTML() {
    return `
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <h1>⚽ FantaAiuto</h1>
            <p>Fantasy Football Manager</p>
          </div>
        </div>
        
        <div class="auth-form-container">
          <div class="auth-tabs">
            <button 
              class="auth-tab ${this.currentMode === 'login' ? 'active' : ''}" 
              data-mode="login"
            >
              Accedi
            </button>
            <button 
              class="auth-tab ${this.currentMode === 'register' ? 'active' : ''}" 
              data-mode="register"
              ${!this.options.showRegister ? 'style="display: none;"' : ''}
            >
              Registrati
            </button>
          </div>
          
          <!-- Login Form -->
          <form class="auth-form ${this.currentMode === 'login' ? 'active' : ''}" id="loginForm">
            <div class="form-group">
              <label for="loginUsername">Nome utente o Email</label>
              <input 
                type="text" 
                id="loginUsername" 
                name="username"
                required 
                autocomplete="username"
                placeholder="Inserisci nome utente o email"
              />
            </div>
            
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input 
                type="password" 
                id="loginPassword" 
                name="password"
                required 
                autocomplete="current-password"
                placeholder="Inserisci password"
              />
            </div>
            
            <button type="submit" class="btn btn-primary auth-submit" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '⏳ Accesso in corso...' : '🔐 Accedi'}
            </button>
          </form>
          
          <!-- Register Form -->
          <form class="auth-form ${this.currentMode === 'register' ? 'active' : ''}" id="registerForm">
            <div class="form-group">
              <label for="registerUsername">Nome utente</label>
              <input 
                type="text" 
                id="registerUsername" 
                name="username"
                required 
                autocomplete="username"
                placeholder="Scegli un nome utente"
                pattern="[a-zA-Z0-9_-]+"
                title="Solo lettere, numeri, underscore e trattini"
              />
            </div>
            
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input 
                type="email" 
                id="registerEmail" 
                name="email"
                required 
                autocomplete="email"
                placeholder="Inserisci la tua email"
              />
            </div>
            
            <div class="form-group">
              <label for="registerDisplayName">Nome visualizzato (opzionale)</label>
              <input 
                type="text" 
                id="registerDisplayName" 
                name="displayName"
                autocomplete="name"
                placeholder="Come vuoi essere chiamato"
              />
            </div>
            
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input 
                type="password" 
                id="registerPassword" 
                name="password"
                required 
                autocomplete="new-password"
                placeholder="Crea una password"
                minlength="6"
              />
            </div>
            
            <div class="form-group">
              <label for="registerPasswordConfirm">Conferma Password</label>
              <input 
                type="password" 
                id="registerPasswordConfirm" 
                name="passwordConfirm"
                required 
                autocomplete="new-password"
                placeholder="Ripeti la password"
                minlength="6"
              />
            </div>
            
            <button type="submit" class="btn btn-primary auth-submit" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '⏳ Registrazione...' : '📝 Registrati'}
            </button>
          </form>
          
          <div class="auth-error" id="authError" style="display: none;"></div>
          
          <div class="auth-demo-info">
            <h3>🎮 Demo Account</h3>
            <p>Per testare l'applicazione:</p>
            <p><strong>Username:</strong> admin</p>
            <p><strong>Password:</strong> password</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Tab switching
    const tabs = this.container.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode(e.target.dataset.mode);
      });
    });

    // Form submissions
    const loginForm = this.container.querySelector('#loginForm');
    const registerForm = this.container.querySelector('#registerForm');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(e);
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister(e);
    });

    // Password confirmation validation
    const passwordInput = this.container.querySelector('#registerPassword');
    const confirmInput = this.container.querySelector('#registerPasswordConfirm');
    
    if (passwordInput && confirmInput) {
      const validatePasswords = () => {
        if (confirmInput.value && passwordInput.value !== confirmInput.value) {
          confirmInput.setCustomValidity('Le password non corrispondono');
        } else {
          confirmInput.setCustomValidity('');
        }
      };

      passwordInput.addEventListener('input', validatePasswords);
      confirmInput.addEventListener('input', validatePasswords);
    }
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;

    this.currentMode = mode;
    this.clearError();

    // Update tabs
    const tabs = this.container.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update forms
    const forms = this.container.querySelectorAll('.auth-form');
    forms.forEach(form => {
      form.classList.toggle('active', form.id === `${mode}Form`);
    });
  }

  async handleLogin(event) {
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const password = formData.get('password');

    if (!username || !password) {
      this.showError('Nome utente e password sono obbligatori');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const result = await authManager.login(username, password);

      if (result.success) {
        this.showSuccess(`Benvenuto, ${result.user.displayName}!`);
        
        if (this.options.redirectOnLogin) {
          // Small delay to show success message
          setTimeout(() => {
            this.onLoginSuccess(result.user);
          }, 1000);
        } else {
          this.onLoginSuccess(result.user);
        }
      } else {
        this.showError(result.error || 'Errore durante il login');
      }
    } catch (error) {
      this.showError('Errore di connessione. Riprova.');
      console.error('Login error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async handleRegister(event) {
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const email = formData.get('email').trim();
    const displayName = formData.get('displayName').trim();
    const password = formData.get('password');
    const passwordConfirm = formData.get('passwordConfirm');

    // Validation
    if (!username || !email || !password) {
      this.showError('Nome utente, email e password sono obbligatori');
      return;
    }

    if (password !== passwordConfirm) {
      this.showError('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      this.showError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      this.showError('Il nome utente può contenere solo lettere, numeri, underscore e trattini');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const result = await authManager.register(username, email, password, displayName);

      if (result.success) {
        this.showSuccess(`Registrazione completata! Benvenuto, ${result.user.displayName}!`);
        
        if (this.options.redirectOnLogin) {
          setTimeout(() => {
            this.onLoginSuccess(result.user);
          }, 1000);
        } else {
          this.onLoginSuccess(result.user);
        }
      } else {
        this.showError(result.error || 'Errore durante la registrazione');
      }
    } catch (error) {
      this.showError('Errore di connessione. Riprova.');
      console.error('Registration error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    const submitButtons = this.container.querySelectorAll('.auth-submit');
    submitButtons.forEach(button => {
      button.disabled = loading;
      
      if (button.closest('#loginForm')) {
        button.textContent = loading ? '⏳ Accesso in corso...' : '🔐 Accedi';
      } else if (button.closest('#registerForm')) {
        button.textContent = loading ? '⏳ Registrazione...' : '📝 Registrati';
      }
    });

    // Disable form inputs during loading
    const inputs = this.container.querySelectorAll('input');
    inputs.forEach(input => {
      input.disabled = loading;
    });
  }

  showError(message) {
    const errorDiv = this.container.querySelector('#authError');
    if (errorDiv) {
      errorDiv.textContent = `❌ ${message}`;
      errorDiv.style.display = 'block';
      errorDiv.className = 'auth-error error';
    }
  }

  showSuccess(message) {
    const errorDiv = this.container.querySelector('#authError');
    if (errorDiv) {
      errorDiv.textContent = `✅ ${message}`;
      errorDiv.style.display = 'block';
      errorDiv.className = 'auth-error success';
    }
  }

  clearError() {
    const errorDiv = this.container.querySelector('#authError');
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
  }

  onLoginSuccess(user) {
    // Override this method or pass a callback
    console.log('Login successful:', user);
    Utils.dispatchCustomEvent('fantaaiuto:authFormLoginSuccess', { user });
  }

  // Public methods
  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}