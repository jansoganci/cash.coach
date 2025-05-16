import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layout/PageHeader';
import DocumentUpload from '@/components/upload/DocumentUpload';
import { useAuth } from '@/hooks/useAuth';

const Upload: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page header */}
      <PageHeader
        title={t('upload.title')}
        description={t('upload.description')}
      />

      {/* Document upload interface */}
      <div className="mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start mb-5">
            <div className="flex-shrink-0 p-2.5 bg-primary-50 rounded-lg">
              <i className="ri-file-upload-line text-xl text-primary-600"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('upload.documentTitle')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('upload.documentDescription')}</p>
            </div>
          </div>

          <DocumentUpload />
        </div>
      </div>

      {/* Additional info section */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('upload.supportedDocuments')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <i className="ri-file-pdf-line text-red-500 text-2xl mr-2"></i>
              <h4 className="font-medium">{t('upload.bankStatements')}</h4>
            </div>
            <p className="text-sm text-gray-600">{t('upload.bankStatementsDescription')}</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <i className="ri-receipt-line text-green-500 text-2xl mr-2"></i>
              <h4 className="font-medium">{t('upload.receipts')}</h4>
            </div>
            <p className="text-sm text-gray-600">{t('upload.receiptsDescription')}</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <i className="ri-file-list-3-line text-blue-500 text-2xl mr-2"></i>
              <h4 className="font-medium">{t('upload.invoices')}</h4>
            </div>
            <p className="text-sm text-gray-600">{t('upload.invoicesDescription')}</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <i className="ri-information-line text-blue-500 text-xl mr-3 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-blue-700">{t('upload.ocrInfo')}</h4>
              <p className="mt-1 text-sm text-blue-600">{t('upload.ocrDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
