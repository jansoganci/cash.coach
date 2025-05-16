import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { CURRENCIES, LANGUAGES } from '@shared/schema';
import i18n from '@/lib/i18n';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  const { t } = useTranslation();
  const { user, updatePreferences } = useAuth();

  const handleCurrencyChange = (currency: string) => {
    if (user && currency !== user.preferredCurrency) {
      updatePreferences({ preferredCurrency: currency });
    }
  };

  const handleLanguageChange = (language: string) => {
    if (user && language !== user.preferredLanguage) {
      i18n.changeLanguage(language);
      updatePreferences({ preferredLanguage: language });
    }
  };

  return (
    <div className="lg:flex lg:items-center lg:justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-3">
        {user && (
          <>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{t('preferences.currency')}:</span>
              <Select value={user.preferredCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t('preferences.selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{t('preferences.language')}:</span>
              <Select value={user.preferredLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder={t('preferences.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {action && <div className="ml-auto lg:ml-0">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
