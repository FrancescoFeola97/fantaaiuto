import { FantaAiutoApp } from '../src/components/App.js';
import '../css/style.css';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM loaded, initializing FantaAiuto...');
  
  try {
    const app = new FantaAiutoApp();
    await app.init();
  } catch (error) {
    console.error('💥 Failed to initialize FantaAiuto:', error);
    
    // Emergency fallback - hide loading screen and show error
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    // Show error message to user
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <h2>❌ Errore di Inizializzazione</h2>
          <p>Si è verificato un errore durante il caricamento dell'applicazione.</p>
          <p>Ricarica la pagina per riprovare.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🔄 Ricarica Pagina
          </button>
        </div>
      `;
    }
  }
});