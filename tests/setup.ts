import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock fetch for tests
global.fetch = vi.fn();

// Mock window.localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

if (typeof window !== 'undefined') {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.location
  delete (window as any).location;
  window.location = {
    ...window.location,
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  };

  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Add custom matchers
expect.extend({
  toBeValidConfiguration(received, expected) {
    const pass = received &&
                  typeof received === 'object' &&
                  received.id &&
                  received.agentId &&
                  received.corporationId;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid configuration`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid configuration with id, agentId, and corporationId`,
        pass: false,
      };
    }
  },

  toBeValidPersonality(received) {
    const pass = received &&
                  typeof received === 'object' &&
                  received.id &&
                  received.name &&
                  received.traits &&
                  received.communicationStyle &&
                  received.specialization;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid personality`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid personality with required fields`,
        pass: false,
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeValidConfiguration(expected?: any): T;
      toBeValidPersonality(): T;
    }
  }
}
