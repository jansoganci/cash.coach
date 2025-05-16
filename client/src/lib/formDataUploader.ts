/**
 * Helper for uploading multipart/form-data with automatic auth token handling
 */

// Upload form data with progress tracking
export const uploadFormData = async (
  url: string, 
  formData: FormData, 
  onProgress?: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', url);
    
    // Add authorization header with JWT token (same token as used in auth interceptor)
    const token = localStorage.getItem('fintrack_auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
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