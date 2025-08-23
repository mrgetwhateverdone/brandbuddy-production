/**
 * This part of the code sets up MSW server for testing
 * Intercepts API calls during tests
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This part of the code creates the mock server with default handlers
export const server = setupServer(...handlers);

// This part of the code provides helper functions for test setup
export const setupMockServer = () => {
  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  
  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
  
  // Clean up after all tests
  afterAll(() => server.close());
};

export * from './handlers';
