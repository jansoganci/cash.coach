import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/hooks/useCurrency';

interface FinancialSummaryProps {
  monthlySpending: number;
  monthlyIncome: number;
  savingsRate: number;
  upcomingBills: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  monthlySpending,
  monthlyIncome,
  savingsRate,
  upcomingBills
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Monthly spending card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.monthlySpending')}</p>
            <h3 className="text-2xl font-semibold font-mono">{formatCurrency(monthlySpending)}</h3>
          </div>
          <div className="p-2 bg-primary-50 rounded-lg">
            <i className="ri-shopping-cart-2-line text-primary-600 text-xl"></i>
          </div>
        </div>
        <div className="flex items-center">
          <span className="flex items-center text-sm text-danger-500">
            <i className="ri-arrow-up-s-line"></i>
            <span>12.5%</span>
          </span>
          <span className="ml-2 text-xs text-gray-500">{t('dashboard.vsLastMonth')}</span>
        </div>
      </div>

      {/* Monthly income card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.monthlyIncome')}</p>
            <h3 className="text-2xl font-semibold font-mono">{formatCurrency(monthlyIncome)}</h3>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <i className="ri-wallet-3-line text-success-500 text-xl"></i>
          </div>
        </div>
        <div className="flex items-center">
          <span className="flex items-center text-sm text-success-500">
            <i className="ri-arrow-up-s-line"></i>
            <span>4.3%</span>
          </span>
          <span className="ml-2 text-xs text-gray-500">{t('dashboard.vsLastMonth')}</span>
        </div>
      </div>

      {/* Savings rate card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.savingsRate')}</p>
            <h3 className="text-2xl font-semibold font-mono">{savingsRate}%</h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <i className="ri-bank-line text-primary-600 text-xl"></i>
          </div>
        </div>
        <div className="flex items-center">
          <span className="flex items-center text-sm text-success-500">
            <i className="ri-arrow-up-s-line"></i>
            <span>8.1%</span>
          </span>
          <span className="ml-2 text-xs text-gray-500">{t('dashboard.vsLastMonth')}</span>
        </div>
      </div>

      {/* Upcoming bills card */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.upcomingBills')}</p>
            <h3 className="text-2xl font-semibold font-mono">{formatCurrency(upcomingBills)}</h3>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <i className="ri-calendar-check-line text-warning-500 text-xl"></i>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span>{t('dashboard.dueInDays', { days: 7 })}</span>
          <i className="ri-arrow-right-s-line ml-1"></i>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
