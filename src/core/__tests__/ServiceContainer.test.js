import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '../ServiceContainer.js';

describe('ServiceContainer', () => {
  let container;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  it('should register and resolve singleton services', () => {
    const mockService = { name: 'test' };
    container.register('test', () => mockService, { singleton: true });
    
    const instance1 = container.get('test');
    const instance2 = container.get('test');
    
    expect(instance1).toBe(mockService);
    expect(instance1).toBe(instance2);
  });

  it('should resolve dependencies correctly', () => {
    container.register('dependency', () => ({ value: 'dep' }));
    container.register('service', (dep) => ({ dependency: dep }), {
      dependencies: ['dependency']
    });
    
    const service = container.get('service');
    expect(service.dependency.value).toBe('dep');
  });

  it('should throw error for unregistered service', () => {
    expect(() => container.get('nonexistent')).toThrow('Service \'nonexistent\' not registered');
  });

  it('should detect circular dependencies', () => {
    container.register('a', () => ({}), { dependencies: ['b'] });
    container.register('b', () => ({}), { dependencies: ['a'] });
    
    expect(() => container.get('a')).toThrow('Circular dependency detected');
  });

  it('should create scoped containers', () => {
    container.register('shared', () => ({ shared: true }));
    
    const scope1 = container.createScope(['shared']);
    const scope2 = container.createScope(['shared']);
    scope1.register('scoped', () => ({ scope: 1 }));
    scope2.register('scoped', () => ({ scope: 2 }));
    
    expect(scope1.get('scoped').scope).toBe(1);
    expect(scope2.get('scoped').scope).toBe(2);
    expect(scope1.get('shared').shared).toBe(true);
  });
});