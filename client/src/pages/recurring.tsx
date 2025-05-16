import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import RecurringTransactions from '@/components/recurring/RecurringTransactions';

const RecurringPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('recurring.pageTitle')} | Finance Tracker</title>
        <meta name="description" content={t('recurring.pageDescription')} />
      </Helmet>
      
      <div className="container py-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('recurring.title')}</h1>
        <p className="text-gray-500 mb-8">{t('recurring.pageSubtitle')}</p>
        
        <div className="grid gap-6 mb-8">
          <RecurringTransactions />
          
          {/* Information card about recurring transactions */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">{t('recurring.howItWorks')}</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                    <i className="ri-calendar-check-line text-xl"></i>
                  </div>
                  <h3 className="font-medium mb-2">{t('recurring.step1Title')}</h3>
                  <p className="text-sm text-gray-600">{t('recurring.step1Desc')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                    <i className="ri-repeat-line text-xl"></i>
                  </div>
                  <h3 className="font-medium mb-2">{t('recurring.step2Title')}</h3>
                  <p className="text-sm text-gray-600">{t('recurring.step2Desc')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                    <i className="ri-funds-line text-xl"></i>
                  </div>
                  <h3 className="font-medium mb-2">{t('recurring.step3Title')}</h3>
                  <p className="text-sm text-gray-600">{t('recurring.step3Desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RecurringPage;