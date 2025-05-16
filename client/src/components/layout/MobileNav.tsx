import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const MobileNav: React.FC = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <i className="ri-line-chart-line text-primary-600 text-2xl"></i>
            <h1 className="text-xl font-semibold text-gray-900">FinTrack</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <button type="button" className="p-1 text-gray-500 hover:text-gray-700">
                  <i className="ri-user-line text-xl"></i>
                </button>
              </SheetTrigger>
              <SheetContent side="right">
                {user && (
                  <div className="py-4">
                    <div className="flex items-center mb-6">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl">
                        {user.fullName 
                          ? user.fullName.charAt(0).toUpperCase() 
                          : user.username.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="ml-3">
                        <p className="text-base font-medium text-gray-800">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      <Link href="/">
                        <a className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
                          <i className="ri-dashboard-line mr-3 text-lg"></i>
                          <span>{t('sidebar.dashboard')}</span>
                        </a>
                      </Link>
                      <Link href="/upload">
                        <a className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
                          <i className="ri-upload-cloud-line mr-3 text-lg"></i>
                          <span>{t('sidebar.uploadDocuments')}</span>
                        </a>
                      </Link>
                      <Link href="/expenses">
                        <a className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
                          <i className="ri-bill-line mr-3 text-lg"></i>
                          <span>{t('sidebar.expenses')}</span>
                        </a>
                      </Link>
                      <Link href="/analytics">
                        <a className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
                          <i className="ri-pie-chart-line mr-3 text-lg"></i>
                          <span>{t('sidebar.analytics')}</span>
                        </a>
                      </Link>
                      
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <button 
                          className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const { logout } = useAuth();
                            logout();
                          }}
                        >
                          <i className="ri-logout-box-line mr-3 text-lg"></i>
                          <span>{t('sidebar.logout')}</span>
                        </button>
                      </div>
                    </nav>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
        <div className="grid grid-cols-5 h-16">
          <Link href="/">
            <a className={`flex flex-col items-center justify-center ${isActive('/') ? 'text-primary-600' : 'text-gray-500'}`}>
              <i className="ri-dashboard-line text-xl"></i>
              <span className="text-xs mt-1">{t('mobileNav.dashboard')}</span>
            </a>
          </Link>
          <Link href="/upload">
            <a className={`flex flex-col items-center justify-center ${isActive('/upload') ? 'text-primary-600' : 'text-gray-500'}`}>
              <i className="ri-upload-cloud-line text-xl"></i>
              <span className="text-xs mt-1">{t('mobileNav.upload')}</span>
            </a>
          </Link>
          <Link href="/expenses">
            <a className="flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-md">
                <i className="ri-add-line text-xl"></i>
              </div>
            </a>
          </Link>
          <Link href="/expenses">
            <a className={`flex flex-col items-center justify-center ${isActive('/expenses') ? 'text-primary-600' : 'text-gray-500'}`}>
              <i className="ri-bill-line text-xl"></i>
              <span className="text-xs mt-1">{t('mobileNav.expenses')}</span>
            </a>
          </Link>
          <Link href="/analytics">
            <a className={`flex flex-col items-center justify-center ${isActive('/analytics') ? 'text-primary-600' : 'text-gray-500'}`}>
              <i className="ri-pie-chart-line text-xl"></i>
              <span className="text-xs mt-1">{t('mobileNav.analytics')}</span>
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
