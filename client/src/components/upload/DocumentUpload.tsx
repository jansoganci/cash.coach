import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const DocumentUpload: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/documents/upload');
        xhr.withCredentials = true;
        
        // Add authorization header with JWT token
        const token = localStorage.getItem('fintrack_auth_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        } else {
          console.error('No authentication token found');
          reject(new Error('Authentication required'));
          return;
        }
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Failed to parse server response'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Upload failed'));
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
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: t('upload.success'),
        description: t('upload.successDescription', { count: data.transactionsExtracted }),
      });
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      setUploadProgress(0);
      
      toast({
        title: t('upload.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      setUploadError(null);
      const file = acceptedFiles[0];
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(t('upload.fileTooLarge'));
        return;
      }
      
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setUploadError(t('upload.invalidFileType'));
        return;
      }
      
      // Start upload
      uploadMutation.mutate(file);
    },
    [uploadMutation, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
  });

  return (
    <div>
      {/* Sample receipt image */}
      <div className="w-full h-40 rounded-lg overflow-hidden mb-5 bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          <i className="ri-receipt-line text-6xl text-gray-300"></i>
        </div>
      </div>

      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed ${
          isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300'
        } rounded-lg p-6 text-center cursor-pointer transition-colors duration-200`}
      >
        <input {...getInputProps()} />
        <div className="mb-3">
          <i className="ri-upload-cloud-2-line text-4xl text-gray-400"></i>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          {isDragActive
            ? t('upload.dropFilesHere')
            : t('upload.dragAndDrop')}
        </p>
        <p className="text-xs text-gray-500">{t('upload.supportedFormats')}</p>
        
        <Button className="mt-4 w-full" disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              {t('upload.uploading')}
            </>
          ) : (
            <>
              <i className="ri-upload-line mr-1.5"></i>
              {t('upload.uploadFiles')}
            </>
          )}
        </Button>
      </div>

      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">{t('upload.uploadingProgress', { progress: uploadProgress })}</p>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>{t('upload.uploadFailed')}</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* OCR processing info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <i className="ri-information-line text-blue-500 text-xl mr-3 mt-0.5"></i>
          <div>
            <h4 className="font-medium text-blue-700">{t('upload.ocrProcessing')}</h4>
            <p className="mt-1 text-sm text-blue-600">{t('upload.ocrProcessingDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
