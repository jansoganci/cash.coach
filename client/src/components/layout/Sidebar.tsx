import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white fixed h-full">
      <div className="p-4 flex items-center space-x-2">
        <i className="ri-line-chart-line text-primary-600 text-2xl"></i>
        <h1 className="text-xl font-semibold text-gray-900">FinTrack</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="space-y-1">
          <Link href="/">
            <div className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-dashboard-line mr-3 text-lg"></i>
              <span>{t('sidebar.dashboard')}</span>
            </div>
          </Link>
          <Link href="/upload">
            <div className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/upload') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-upload-cloud-line mr-3 text-lg"></i>
              <span>{t('sidebar.uploadDocuments')}</span>
            </div>
          </Link>
          <Link href="/expenses">
            <div className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/expenses') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-bill-line mr-3 text-lg"></i>
              <span>{t('sidebar.expenses')}</span>
            </div>
          </Link>
          <Link href="/analytics">
            <div className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/analytics') 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-pie-chart-line mr-3 text-lg"></i>
              <span>{t('sidebar.analytics')}</span>
            </div>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('sidebar.settings')}
            </h3>
            <div className="mt-2 space-y-1">
              <button 
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={() => logout()}
              >
                <i className="ri-logout-box-line mr-3 text-lg"></i>
                <span>{t('sidebar.logout')}</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              {user.fullName 
                ? user.fullName.charAt(0).toUpperCase() 
                : user.username.charAt(0).toUpperCase()
              }
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">
                {user.fullName || user.username}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
