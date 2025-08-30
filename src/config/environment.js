// Environment configuration for FantaAiuto

// Detect production by checking hostname (since Netlify doesn't have process.env.NODE_ENV)
const isProductionEnvironment = () => {
  return window.location.hostname === 'fantaiuto.netlify.app' || 
         window.location.hostname.includes('.netlify.app') ||
         window.location.hostname.includes('fantaiuto');
};

export const config = {
  // Production backend URL - Render deployment
  BACKEND_URL: isProductionEnvironment()
    ? 'https://fantaaiuto-backend.onrender.com'
    : 'http://localhost:3001',
    
  API_TIMEOUT: 10000, // 10 seconds
  
  // Feature flags
  FEATURES: {
    AUTHENTICATION: true,
    OFFLINE_MODE: true,
    DEBUG_LOGGING: !isProductionEnvironment()
  }
};

// Environment detection
export const isProduction = () => isProductionEnvironment();
export const isDevelopment = () => window.location.hostname === 'localhost';
export const getBackendUrl = () => config.BACKEND_URL;