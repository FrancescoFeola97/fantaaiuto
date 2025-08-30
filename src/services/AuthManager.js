import { apiClient } from './ApiClient.js';
import { Utils } from '../utils/Utils.js';

/**
 * Authentication Manager
 * Handles user authentication, session management, and auth state
 */
export class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.loginCallbacks = [];
    this.logoutCallbacks = [];
    
    // Listen for auth events
    document.addEventListener('fantaaiuto:authError', (e) => {
      this.handleAuthError(e.detail);
    });
    
    document.addEventListener('fantaaiuto:logout', () => {
      this.handleLogout();
    });
  }

  async init() {
    console.log('🔐 Initializing AuthManager...');
    
    try {
      this.isLoading = true;
      
      // First check if backend is available
      try {
        await apiClient.healthCheck();
        console.log('🌐 Backend is available');
      } catch (backendError) {
        console.warn('🔌 Backend not available, skipping authentication');
        this.isLoading = false;
        return false; // Return false to indicate offline mode
      }
      
      // Check if we have a stored token
      const token = apiClient.getToken();
      if (token) {
        console.log('🔍 Found stored token, verifying...');
        
        try {
          const isValid = await apiClient.verifyToken();
          
          if (isValid) {
            // Get user profile
            const profileResponse = await apiClient.getUserProfile();
            this.user = profileResponse.user;
            this.isAuthenticated = true;
            
            console.log('✅ Authentication restored for user:', this.user.username);
            this.notifyLoginCallbacks();
          } else {
            console.log('❌ Stored token is invalid');
            this.clearAuth();
          }
        } catch (tokenError) {
          console.warn('⚠️ Token verification failed:', tokenError);
          this.clearAuth();
        }
      } else {
        console.log('ℹ️ No stored token found');
      }
      
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      this.clearAuth();
    } finally {
      this.isLoading = false;
    }
    
    return this.isAuthenticated;
  }

  async login(username, password) {
    try {
      this.isLoading = true;
      
      console.log(`🔐 Attempting login for user: ${username}`);
      
      const response = await apiClient.login(username, password);
      
      this.user = response.user;
      this.isAuthenticated = true;
      
      console.log('✅ Login successful:', this.user.username);
      
      // Notify callbacks
      this.notifyLoginCallbacks();
      
      // Dispatch custom event
      Utils.dispatchCustomEvent('fantaaiuto:userLoggedIn', {
        user: this.user
      });
      
      return {
        success: true,
        user: this.user,
        message: 'Login successful'
      };
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    } finally {
      this.isLoading = false;
    }
  }

  async register(username, email, password, displayName) {
    try {
      this.isLoading = true;
      
      console.log(`📝 Attempting registration for user: ${username}`);
      
      const response = await apiClient.register(username, email, password, displayName);
      
      this.user = response.user;
      this.isAuthenticated = true;
      
      console.log('✅ Registration successful:', this.user.username);
      
      // Notify callbacks
      this.notifyLoginCallbacks();
      
      // Dispatch custom event
      Utils.dispatchCustomEvent('fantaaiuto:userRegistered', {
        user: this.user
      });
      
      return {
        success: true,
        user: this.user,
        message: 'Registration successful'
      };
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    console.log('🚪 Logging out user:', this.user?.username);
    
    await apiClient.logout();
    this.handleLogout();
  }

  handleLogout() {
    this.clearAuth();
    this.notifyLogoutCallbacks();
    
    // Dispatch custom event
    Utils.dispatchCustomEvent('fantaaiuto:userLoggedOut');
    
    console.log('✅ User logged out successfully');
  }

  handleAuthError(detail) {
    console.error('🔒 Authentication error:', detail);
    
    if (this.isAuthenticated) {
      this.handleLogout();
      
      // Show notification about session expiry
      Utils.dispatchCustomEvent('fantaaiuto:sessionExpired', {
        error: detail.error,
        code: detail.code
      });
    }
  }

  clearAuth() {
    this.user = null;
    this.isAuthenticated = false;
    apiClient.setToken(null);
  }

  // Callback management
  onLogin(callback) {
    this.loginCallbacks.push(callback);
  }

  onLogout(callback) {
    this.logoutCallbacks.push(callback);
  }

  notifyLoginCallbacks() {
    this.loginCallbacks.forEach(callback => {
      try {
        callback(this.user);
      } catch (error) {
        console.error('Login callback error:', error);
      }
    });
  }

  notifyLogoutCallbacks() {
    this.logoutCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Logout callback error:', error);
      }
    });
  }

  // Auth state getters
  getUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  isAuthLoading() {
    return this.isLoading;
  }

  requireAuth() {
    if (!this.isAuthenticated) {
      throw new Error('Authentication required');
    }
    return true;
  }

  // User profile management
  async updateProfile(data) {
    try {
      this.requireAuth();
      
      const response = await apiClient.updateUserProfile(data);
      
      // Refresh user profile
      const profileResponse = await apiClient.getUserProfile();
      this.user = profileResponse.user;
      
      Utils.dispatchCustomEvent('fantaaiuto:userProfileUpdated', {
        user: this.user
      });
      
      return {
        success: true,
        message: 'Profile updated successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // Settings management
  async getSettings() {
    try {
      this.requireAuth();
      const response = await apiClient.getUserSettings();
      return response.settings;
    } catch (error) {
      throw new Error(`Failed to get settings: ${error.message}`);
    }
  }

  async updateSettings(settings) {
    try {
      this.requireAuth();
      
      await apiClient.updateUserSettings(settings);
      
      Utils.dispatchCustomEvent('fantaaiuto:userSettingsUpdated', {
        settings
      });
      
      return {
        success: true,
        message: 'Settings updated successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
}

// Singleton instance
export const authManager = new AuthManager();