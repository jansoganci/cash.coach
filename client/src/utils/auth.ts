// Simple token management for authentication

const TOKEN_KEY = 'fintrack_auth_token';

// Store token in localStorage
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  console.log('Token saved to localStorage');
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  console.log('Token removed from localStorage');
};

// Add authorization header if token exists
export const addAuthHeader = (headers: HeadersInit = {}): HeadersInit => {
  const token = getToken();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
};