/**
 * API Client for FantaAiuto Backend
 * Handles all HTTP requests to the backend API with authentication
 */
export class ApiClient {
  constructor() {
    this.baseURL = process.env.BACKEND_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('fantaaiuto_token');
    
    // Set up default headers
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('fantaaiuto_token', token);
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('fantaaiuto_token');
      delete this.headers['Authorization'];
    }
  }

  getToken() {
    return this.token;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method: method.toUpperCase(),
      headers: { ...this.headers },
    };

    if (data) {
      if (data instanceof FormData) {
        // Don't set Content-Type for FormData, let browser set it
        delete options.headers['Content-Type'];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    try {
      console.log(`🌐 ${method.toUpperCase()} ${url}`);
      const response = await fetch(url, options);
      
      // Handle different response types
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const error = new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.code = responseData.code;
        error.details = responseData.details;
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          this.setToken(null);
          // Dispatch event for auth failure
          document.dispatchEvent(new CustomEvent('fantaaiuto:authError', {
            detail: { error: responseData.error, code: responseData.code }
          }));
        }
        
        throw error;
      }

      console.log(`✅ ${method.toUpperCase()} ${url} - Success`);
      return responseData;
      
    } catch (error) {
      console.error(`❌ ${method.toUpperCase()} ${url} - Error:`, error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Unable to connect to server. Please check your internet connection.';
        error.code = 'NETWORK_ERROR';
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // Authentication endpoints
  async login(username, password) {
    const response = await this.post('/auth/login', { username, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(username, email, password, displayName) {
    const response = await this.post('/auth/register', { 
      username, 
      email, 
      password, 
      displayName 
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
    // Dispatch logout event
    document.dispatchEvent(new CustomEvent('fantaaiuto:logout'));
  }

  async verifyToken() {
    if (!this.token) return false;
    
    try {
      await this.post('/auth/verify', { token: this.token });
      return true;
    } catch (error) {
      this.setToken(null);
      return false;
    }
  }

  // User endpoints
  async getUserProfile() {
    return this.get('/users/profile');
  }

  async updateUserProfile(data) {
    return this.put('/users/profile', data);
  }

  async getUserSettings() {
    return this.get('/users/settings');
  }

  async updateUserSettings(settings) {
    return this.put('/users/settings', settings);
  }

  async getUserAnalytics() {
    return this.get('/users/analytics');
  }

  // Players endpoints
  async getPlayers() {
    return this.get('/players');
  }

  async importPlayers(players, mode = '1') {
    return this.post('/players/import', { players, mode });
  }

  async updatePlayerStatus(playerId, status, costoReale = 0, note = null) {
    return this.patch(`/players/${playerId}/status`, { 
      status, 
      costoReale, 
      note 
    });
  }

  async getPlayersStats() {
    return this.get('/players/stats');
  }

  // Participants endpoints
  async getParticipants() {
    return this.get('/participants');
  }

  async createParticipant(name) {
    return this.post('/participants', { name });
  }

  async updateParticipant(participantId, name) {
    return this.put(`/participants/${participantId}`, { name });
  }

  async deleteParticipant(participantId) {
    return this.delete(`/participants/${participantId}`);
  }

  async getParticipantPlayers(participantId) {
    return this.get(`/participants/${participantId}/players`);
  }

  async assignPlayerToParticipant(participantId, playerId, costoAltri = 0) {
    return this.post(`/participants/${participantId}/players/${playerId}`, { 
      costoAltri 
    });
  }

  async removePlayerFromParticipant(participantId, playerId) {
    return this.delete(`/participants/${participantId}/players/${playerId}`);
  }

  // Formations endpoints
  async getFormations() {
    return this.get('/formations');
  }

  async createFormation(name, schema, players = []) {
    return this.post('/formations', { name, schema, players });
  }

  async updateFormation(formationId, data) {
    return this.put(`/formations/${formationId}`, data);
  }

  async deleteFormation(formationId) {
    return this.delete(`/formations/${formationId}`);
  }

  async getFormationImages() {
    return this.get('/formations/images');
  }

  async uploadFormationImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return this.post('/formations/images', formData);
  }

  async deleteFormationImage(imageId) {
    return this.delete(`/formations/images/${imageId}`);
  }

  // Health check
  async healthCheck() {
    const url = this.baseURL.replace('/api', '/health');
    const response = await fetch(url);
    return response.json();
  }
}

// Singleton instance
export const apiClient = new ApiClient();