import { getToken } from '@/utils/auth';

// Create a custom fetch function that automatically adds the auth token
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Get the stored token
  const token = getToken();
  
  // Clone the headers to avoid modifying the original object
  const headers = new Headers(options.headers);
  
  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Return fetch with the modified options
  return fetch(url, {
    ...options,
    headers
  });
};

// Create a function for multipart form uploads with authentication
export const uploadFormData = async (
  url: string, 
  formData: FormData, 
  onProgress?: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', url);
    
    // Add authorization header with JWT token
    const token = getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    } else {
      reject(new Error('Authentication required'));
      return;
    }
    
    // Track upload progress if a callback is provided
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (err) {
          resolve(xhr.responseText);
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
        } catch (err) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    
    xhr.send(formData);
  });
};