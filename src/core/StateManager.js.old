/**
 * Centralized State Manager
 * Replaces manual event system with proper state management
 */
export class StateManager {
  constructor() {
    this.state = {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false
      },
      players: {
        list: [],
        filters: { role: 'all', search: '', showInteresting: false },
        selected: null
      },
      budget: {
        total: 500,
        remaining: 500,
        spent: 0
      },
      formations: {
        current: null,
        saved: []
      },
      participants: {
        list: [],
        current: null
      },
      ui: {
        activeView: 'dashboard',
        loading: false,
        errors: []
      }
    };
    
    this.subscribers = new Map();
    this.middleware = [];
    this.devTools = this.setupDevTools();
  }

  /**
   * Get current state or specific slice
   */
  getState(path = null) {
    if (!path) return { ...this.state };
    
    return path.split('.').reduce((state, key) => state?.[key], this.state);
  }

  /**
   * Update state with immutable approach
   */
  setState(updates, context = 'unknown') {
    const prevState = { ...this.state };
    
    // Apply middleware (logging, validation, etc.)
    const processedUpdates = this.applyMiddleware(updates, prevState, context);
    
    // Deep merge updates
    this.state = this.deepMerge(this.state, processedUpdates);
    
    // Notify subscribers
    this.notifySubscribers(prevState, this.state, context);
    
    // Dev tools integration
    this.devTools?.update(prevState, this.state, updates, context);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(selector, callback) {
    const subscriberId = Date.now() + Math.random();
    
    this.subscribers.set(subscriberId, {
      selector: typeof selector === 'function' ? selector : () => this.getState(selector),
      callback,
      lastValue: null
    });

    // Return unsubscribe function
    return () => this.subscribers.delete(subscriberId);
  }

  /**
   * Subscribe to specific state slice changes
   */
  subscribeToSlice(path, callback) {
    return this.subscribe(
      (state) => this.getStateSlice(state, path),
      callback
    );
  }

  /**
   * Dispatch actions (similar to Redux pattern)
   */
  dispatch(action) {
    const { type, payload, context = type } = action;
    
    console.log(`🔄 State Action: ${type}`, payload);
    
    switch (type) {
      case 'AUTH_LOGIN':
        this.setState({
          auth: {
            user: payload.user,
            isAuthenticated: true,
            isLoading: false
          }
        }, context);
        break;
        
      case 'AUTH_LOGOUT':
        this.setState({
          auth: {
            user: null,
            isAuthenticated: false,
            isLoading: false
          }
        }, context);
        break;
        
      case 'PLAYERS_SET':
        this.setState({
          players: { ...this.state.players, list: payload.players }
        }, context);
        break;
        
      case 'PLAYERS_UPDATE':
        this.setState({
          players: {
            ...this.state.players,
            list: this.state.players.list.map(p => 
              p.id === payload.playerId ? { ...p, ...payload.updates } : p
            )
          }
        }, context);
        break;
        
      case 'FILTERS_UPDATE':
        this.setState({
          players: { ...this.state.players, filters: { ...this.state.players.filters, ...payload } }
        }, context);
        break;
        
      case 'UI_SET_VIEW':
        this.setState({
          ui: { ...this.state.ui, activeView: payload.view }
        }, context);
        break;
        
      case 'UI_SET_LOADING':
        this.setState({
          ui: { ...this.state.ui, loading: payload.loading }
        }, context);
        break;
        
      case 'UI_ADD_ERROR':
        this.setState({
          ui: { 
            ...this.state.ui, 
            errors: [...this.state.ui.errors, payload.error] 
          }
        }, context);
        break;
        
      case 'UI_CLEAR_ERRORS':
        this.setState({
          ui: { ...this.state.ui, errors: [] }
        }, context);
        break;
        
      default:
        console.warn(`Unknown action type: ${type}`);
    }
  }

  /**
   * Add middleware for state updates
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Apply middleware to state updates
   */
  applyMiddleware(updates, prevState, context) {
    return this.middleware.reduce(
      (processedUpdates, middleware) => middleware(processedUpdates, prevState, context),
      updates
    );
  }

  /**
   * Notify all subscribers of state changes
   */
  notifySubscribers(prevState, newState, context) {
    this.subscribers.forEach((subscription, id) => {
      try {
        const newValue = subscription.selector(newState);
        const prevValue = subscription.lastValue;
        
        // Only notify if value actually changed
        if (this.hasChanged(prevValue, newValue)) {
          subscription.lastValue = newValue;
          subscription.callback(newValue, prevValue, context);
        }
      } catch (error) {
        console.error(`Subscriber ${id} error:`, error);
      }
    });
  }

  /**
   * Deep merge utility
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Get state slice by path
   */
  getStateSlice(state, path) {
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  }

  /**
   * Check if values have changed (shallow comparison)
   */
  hasChanged(prev, next) {
    if (prev === next) return false;
    if (typeof prev !== typeof next) return true;
    if (Array.isArray(prev) !== Array.isArray(next)) return true;
    
    if (Array.isArray(prev)) {
      return prev.length !== next.length || prev.some((item, idx) => item !== next[idx]);
    }
    
    if (typeof prev === 'object' && prev !== null && next !== null) {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      
      return prevKeys.length !== nextKeys.length || 
             prevKeys.some(key => prev[key] !== next[key]);
    }
    
    return true;
  }

  /**
   * Setup development tools integration
   */
  setupDevTools() {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return {
        update: (prevState, newState, action, context) => {
          console.group(`🔄 State Update: ${context}`);
          console.log('Previous:', prevState);
          console.log('Action:', action);
          console.log('New State:', newState);
          console.groupEnd();
        }
      };
    }
    return null;
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const initialState = {
      auth: { user: null, isAuthenticated: false, isLoading: false },
      players: { list: [], filters: { role: 'all', search: '', showInteresting: false }, selected: null },
      budget: { total: 500, remaining: 500, spent: 0 },
      formations: { current: null, saved: [] },
      participants: { list: [], current: null },
      ui: { activeView: 'dashboard', loading: false, errors: [] }
    };
    
    this.setState(initialState, 'RESET');
  }
}

// Singleton instance
export const stateManager = new StateManager();

// Action creators for common operations
export const actions = {
  auth: {
    login: (user) => ({ type: 'AUTH_LOGIN', payload: { user }, context: 'auth.login' }),
    logout: () => ({ type: 'AUTH_LOGOUT', context: 'auth.logout' })
  },
  
  players: {
    set: (players) => ({ type: 'PLAYERS_SET', payload: { players }, context: 'players.set' }),
    update: (playerId, updates) => ({ type: 'PLAYERS_UPDATE', payload: { playerId, updates }, context: 'players.update' })
  },
  
  filters: {
    update: (filters) => ({ type: 'FILTERS_UPDATE', payload: filters, context: 'filters.update' })
  },
  
  ui: {
    setView: (view) => ({ type: 'UI_SET_VIEW', payload: { view }, context: 'ui.setView' }),
    setLoading: (loading) => ({ type: 'UI_SET_LOADING', payload: { loading }, context: 'ui.setLoading' }),
    addError: (error) => ({ type: 'UI_ADD_ERROR', payload: { error }, context: 'ui.addError' }),
    clearErrors: () => ({ type: 'UI_CLEAR_ERRORS', context: 'ui.clearErrors' })
  }
};