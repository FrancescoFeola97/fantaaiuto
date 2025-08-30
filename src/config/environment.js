// Environment configuration for FantaAiuto

export const config = {
  // Production backend URL - Render deployment
  BACKEND_URL: process.env.NODE_ENV === 'production' 
    ? 'https://fantaaiuto-backend.onrender.com'
    : 'http://localhost:3001',
    
  API_TIMEOUT: 10000, // 10 seconds
  
  // Feature flags
  FEATURES: {
    AUTHENTICATION: true,
    OFFLINE_MODE: true,
    DEBUG_LOGGING: process.env.NODE_ENV !== 'production'
  }
};

// Environment detection
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const getBackendUrl = () => config.BACKEND_URL;