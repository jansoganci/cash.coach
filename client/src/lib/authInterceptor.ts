/**
 * This module provides automatic JWT token handling for all API requests
 */

// Intercept and augment fetch with auth headers
const originalFetch = window.fetch;

// Override the global fetch method to automatically include auth headers
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  // Default options are marked with *
  const token = localStorage.getItem('fintrack_auth_token');
  
  // If not an API request or no token, proceed as normal
  if (!token || (typeof input === 'string' && !input.startsWith('/api/'))) {
    return originalFetch(input, init);
  }
  
  // Create new headers object to avoid mutating the original
  const headers = new Headers(init?.headers || {});
  
  // Only add Authorization header if it doesn't exist
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Create modified init parameter
  const modifiedInit = {
    ...init,
    headers
  };
  
  // Call original fetch with auth headers
  return originalFetch(input, modifiedInit);
};

// Export empty object as this is used as a side-effect module
export {};