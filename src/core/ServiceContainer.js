/**
 * Dependency Injection Container
 * Manages service dependencies and resolves tight coupling issues
 */
export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service factory function
   */
  register(name, factory, options = {}) {
    if (typeof factory !== 'function') {
      throw new Error(`Service factory for '${name}' must be a function`);
    }

    this.factories.set(name, {
      factory,
      singleton: options.singleton !== false, // Default to singleton
      dependencies: options.dependencies || []
    });
  }

  /**
   * Register a service instance directly
   */
  registerInstance(name, instance) {
    this.services.set(name, instance);
  }

  /**
   * Get a service instance
   */
  get(name) {
    // Return cached singleton if available
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Return registered instance if available
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Create from factory
    if (this.factories.has(name)) {
      const { factory, singleton, dependencies } = this.factories.get(name);
      
      // Resolve dependencies
      const resolvedDependencies = dependencies.map(dep => this.get(dep));
      
      // Create instance
      const instance = factory(...resolvedDependencies);
      
      // Cache if singleton
      if (singleton) {
        this.singletons.set(name, instance);
      }
      
      return instance;
    }

    throw new Error(`Service '${name}' not found`);
  }

  /**
   * Check if a service is registered
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name) || this.singletons.has(name);
  }

  /**
   * Get multiple services at once
   */
  getMany(...names) {
    return names.map(name => this.get(name));
  }

  /**
   * Create a scoped container for specific component needs
   */
  createScope(serviceNames) {
    const scopedContainer = new ServiceContainer();
    
    serviceNames.forEach(name => {
      if (this.has(name)) {
        scopedContainer.registerInstance(name, this.get(name));
      }
    });
    
    return scopedContainer;
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices() {
    return [
      ...this.services.keys(),
      ...this.factories.keys(),
      ...this.singletons.keys()
    ];
  }
}