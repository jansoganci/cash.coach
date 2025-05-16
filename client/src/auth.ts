// Simple token management functions
// The goal is to keep authentication logic separate and simple

// Token storage key
const TOKEN_KEY = "fintrack_auth_token";

// Save token to localStorage
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  console.log("Token saved to localStorage");
}

// Get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Remove token from localStorage
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  console.log("Token removed from localStorage");
}

// Add token to API request headers
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// Authenticated fetch wrapper
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  return response;
}