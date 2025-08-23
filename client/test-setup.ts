/**
 * This part of the code provides global test setup configuration
 * Configures testing environment and global utilities
 */

import '@testing-library/jest-dom';
import { setupMockServer } from './mocks/server';

// This part of the code sets up MSW server for all tests
setupMockServer();

// This part of the code provides global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// This part of the code mocks window.matchMedia for responsive testing
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

// This part of the code mocks IntersectionObserver for component visibility testing
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// This part of the code provides console error suppression for expected test errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress React error boundary errors in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Error: Uncaught [TypeError: Cannot read properties of null')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
