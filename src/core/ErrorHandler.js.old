/**
 * Standardized Error Handler
 * Provides consistent error handling across all services and components
 */
export class ErrorHandler {
  constructor(stateManager = null, notificationManager = null) {
    this.stateManager = stateManager;
    this.notificationManager = notificationManager;
    this.errorHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Handle and standardize errors
   */
  handle(error, context = '', options = {}) {
    const standardError = this.standardizeError(error, context, options);
    
    // Log error
    this.logError(standardError);
    
    // Store in history
    this.addToHistory(standardError);
    
    // Update state if state manager available
    if (this.stateManager && options.updateState !== false) {
      this.stateManager.dispatch({
        type: 'UI_ADD_ERROR',
        payload: { error: standardError },
        context: 'error.handle'
      });
    }
    
    // Show notification if notification manager available
    if (this.notificationManager && options.showNotification !== false) {
      this.showErrorNotification(standardError, options);
    }
    
    return standardError;
  }

  /**
   * Standardize error format
   */
  standardizeError(error, context, options) {
    const baseError = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      severity: options.severity || this.determineSeverity(error),
      recoverable: options.recoverable !== false
    };

    if (error instanceof Error) {
      return {
        ...baseError,
        code: error.code || 'JAVASCRIPT_ERROR',
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    if (typeof error === 'string') {
      return {
        ...baseError,
        code: 'STRING_ERROR',
        message: error,
        name: 'StringError'
      };
    }

    if (error && typeof error === 'object') {
      return {
        ...baseError,
        code: error.code || 'OBJECT_ERROR',
        message: error.message || JSON.stringify(error),
        name: error.name || 'ObjectError',
        originalError: error
      };
    }

    return {
      ...baseError,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      name: 'UnknownError',
      originalError: error
    };
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    if (error?.code === 'NETWORK_ERROR') return 'warning';
    if (error?.code === 'AUTHENTICATION_ERROR') return 'error';
    if (error?.code === 'VALIDATION_ERROR') return 'warning';
    if (error?.message?.includes('offline')) return 'info';
    
    return 'error';
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error with consistent format
   */
  logError(standardError) {
    const { severity, context, code, message } = standardError;
    
    const logMessage = `[${context}] ${code}: ${message}`;
    
    switch (severity) {
      case 'error':
        console.error('❌', logMessage, standardError);
        break;
      case 'warning':
        console.warn('⚠️', logMessage, standardError);
        break;
      case 'info':
        console.info('ℹ️', logMessage, standardError);
        break;
      default:
        console.log('📝', logMessage, standardError);
    }
  }

  /**
   * Add error to history
   */
  addToHistory(error) {
    this.errorHistory.unshift(error);
    
    // Maintain maximum history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Show user-friendly error notification
   */
  showErrorNotification(error, options) {
    if (!this.notificationManager) return;
    
    const userMessage = this.getUserFriendlyMessage(error);
    const notificationType = error.severity === 'warning' ? 'warning' : 'error';
    
    this.notificationManager.show(
      notificationType,
      options.title || 'Errore',
      userMessage,
      options.duration
    );
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyMessage(error) {
    const messageMap = {
      'NETWORK_ERROR': 'Problemi di connessione. Verifica la tua connessione internet.',
      'AUTHENTICATION_ERROR': 'Errore di autenticazione. Effettua nuovamente il login.',
      'VALIDATION_ERROR': 'I dati inseriti non sono validi. Controlla e riprova.',
      'FILE_IMPORT_ERROR': 'Errore durante l\'importazione del file. Verifica il formato.',
      'SAVE_ERROR': 'Errore durante il salvataggio. Riprova.',
      'LOAD_ERROR': 'Errore durante il caricamento dei dati.',
      'PERMISSION_ERROR': 'Non hai i permessi necessari per questa azione.'
    };

    return messageMap[error.code] || error.message || 'Si è verificato un errore imprevisto.';
  }

  /**
   * Create error for specific scenarios
   */
  static createError(code, message, context, options = {}) {
    const error = new Error(message);
    error.code = code;
    error.context = context;
    Object.assign(error, options);
    return error;
  }

  /**
   * Async error handler wrapper
   */
  async handleAsync(asyncFn, context, options = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      return {
        success: false,
        error: this.handle(error, context, options)
      };
    }
  }

  /**
   * Promise wrapper with error handling
   */
  wrapPromise(promise, context, options = {}) {
    return promise.catch(error => {
      const handledError = this.handle(error, context, options);
      
      if (options.rethrow !== false) {
        throw handledError;
      }
      
      return { success: false, error: handledError };
    });
  }

  /**
   * Get error history
   */
  getErrorHistory(filter = null) {
    if (!filter) return [...this.errorHistory];
    
    return this.errorHistory.filter(error => {
      if (filter.severity && error.severity !== filter.severity) return false;
      if (filter.context && !error.context.includes(filter.context)) return false;
      if (filter.code && error.code !== filter.code) return false;
      return true;
    });
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = [];
  }
}

// Common error codes
export const ERROR_CODES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  FILE_IMPORT: 'FILE_IMPORT_ERROR',
  SAVE: 'SAVE_ERROR',
  LOAD: 'LOAD_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Pre-configured error creators
export const createError = {
  network: (message, context) => ErrorHandler.createError(ERROR_CODES.NETWORK, message, context),
  auth: (message, context) => ErrorHandler.createError(ERROR_CODES.AUTH, message, context),
  validation: (message, context) => ErrorHandler.createError(ERROR_CODES.VALIDATION, message, context),
  fileImport: (message, context) => ErrorHandler.createError(ERROR_CODES.FILE_IMPORT, message, context),
  save: (message, context) => ErrorHandler.createError(ERROR_CODES.SAVE, message, context),
  load: (message, context) => ErrorHandler.createError(ERROR_CODES.LOAD, message, context)
};