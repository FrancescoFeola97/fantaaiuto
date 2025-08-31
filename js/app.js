import '../src/styles/main.css';
import { FantaAiutoApp } from '../src/components/App.js';

// Make FantaAiutoApp globally available for static login form
window.FantaAiutoApp = FantaAiutoApp;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM loaded, initializing FantaAiuto...');
  
  // Check if user is already authenticated
  const token = localStorage.getItem('fantaaiuto_token');
  if (token) {
    console.log('🔐 Found authentication token, verifying...');
    
    try {
      const response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        console.log('✅ Token valid, loading authenticated app...');
        await loadAuthenticatedApp();
        return;
      } else {
        console.log('❌ Token invalid, clearing...');
        localStorage.removeItem('fantaaiuto_token');
      }
    } catch (error) {
      console.error('⚠️ Token verification failed - backend may be unavailable:', error);
      console.log('🔄 Attempting offline mode fallback...');
      
      // Try offline mode if backend is unavailable
      if (token) {
        try {
          console.log('🏠 Loading app in offline mode...');
          await loadAuthenticatedApp();
          return;
        } catch (offlineError) {
          console.error('❌ Offline mode failed:', offlineError);
          localStorage.removeItem('fantaaiuto_token');
        }
      }
    }
  }
  
  // If no valid token, keep login form visible
  console.log('👤 No valid authentication, showing login form');
});

async function loadAuthenticatedApp() {
  try {
    // Hide static login form
    const staticLoginContainer = document.getElementById('static-login-container');
    if (staticLoginContainer) {
      staticLoginContainer.style.display = 'none';
    }
    
    // Show main app container
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.style.display = 'block';
    }
    
    // Initialize the full app
    console.log('📱 Creating FantaAiutoApp instance...');
    const app = new FantaAiutoApp();
    
    console.log('🚀 Starting app initialization...');
    await app.init();
    
    console.log('✅ Authenticated app loaded successfully');
    
  } catch (error) {
    console.error('💥 Failed to load authenticated app:', error);
    
    // Show error and fallback to login
    alert('Errore durante il caricamento dell\'applicazione. Riprova ad effettuare il login.');
    
    // Clear token and show login
    localStorage.removeItem('fantaaiuto_token');
    location.reload();
  }
}

function showEmergencyLoginForm() {
  console.log('🚨 Showing emergency login form');
  
  // Hide main app if visible
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.style.display = 'none';
  }
  
  // Create emergency login container
  let loginContainer = document.getElementById('emergency-login-container');
  if (!loginContainer) {
    loginContainer = document.createElement('div');
    loginContainer.id = 'emergency-login-container';
    loginContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    
    loginContainer.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; width: 90%;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin: 0 0 10px 0;">⚽ FantaAiuto</h1>
          <p style="color: #666; margin: 0;">Fantasy Football Manager</p>
        </div>
        
        <form id="emergency-login-form" style="margin-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nome utente o Email</label>
            <input type="text" id="emergency-username" required autocomplete="username" 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
                   placeholder="Inserisci nome utente o email" />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Password</label>
            <input type="password" id="emergency-password" required autocomplete="current-password" 
                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;"
                   placeholder="Inserisci password" />
          </div>
          
          <button type="submit" style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer;">
            🔐 Accedi
          </button>
        </form>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; font-size: 14px;">
          <p style="margin: 0 0 10px 0; font-weight: 500;">🎮 Account Demo</p>
          <p style="margin: 0 0 5px 0;"><strong>Username:</strong> admin</p>
          <p style="margin: 0;"><strong>Password:</strong> password</p>
        </div>
        
        <div id="emergency-error" style="margin-top: 15px; padding: 10px; background: #fee; border: 1px solid #fcc; border-radius: 6px; color: #c33; display: none;"></div>
      </div>
    `;
    
    document.body.appendChild(loginContainer);
  }
  
  // Setup emergency login form handler
  const emergencyForm = document.getElementById('emergency-login-form');
  if (emergencyForm) {
    emergencyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('emergency-username').value.trim();
      const password = document.getElementById('emergency-password').value;
      const errorDiv = document.getElementById('emergency-error');
      
      if (!username || !password) {
        errorDiv.textContent = 'Nome utente e password sono obbligatori';
        errorDiv.style.display = 'block';
        return;
      }
      
      try {
        errorDiv.style.display = 'none';
        
        const response = await fetch('https://fantaaiuto-backend.onrender.com/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok && result.token) {
          // Store token and reload page
          localStorage.setItem('fantaaiuto_token', result.token);
          console.log('✅ Emergency login successful, reloading...');
          location.reload();
        } else {
          errorDiv.textContent = result.error || 'Credenziali non valide';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Emergency login error:', error);
        errorDiv.textContent = 'Errore di connessione. Verifica la connessione internet.';
        errorDiv.style.display = 'block';
      }
    });
  }
}