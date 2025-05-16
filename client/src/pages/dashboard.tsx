import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layout/PageHeader';
import FinancialSummary from '@/components/dashboard/FinancialSummary';
import SpendingTrends from '@/components/dashboard/SpendingTrends';
import ExpenseCategories from '@/components/dashboard/ExpenseCategories';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import FinancialInsights from '@/components/dashboard/FinancialInsights';
import FinancialHealthSnapshot from '@/components/dashboard/FinancialHealthSnapshot';
import { useAuth } from '@/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard'],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{t('dashboard.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page header */}
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />

      {/* Financial summary cards */}
      <FinancialSummary 
        monthlySpending={dashboardData?.monthlySpending || 0}
        monthlyIncome={dashboardData?.monthlyIncome || 0}
        savingsRate={dashboardData?.savingsRate || 0}
        upcomingBills={dashboardData?.upcomingBills || 0}
      />

      {/* Charts and health snapshot section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <SpendingTrends className="lg:col-span-2" />
        <div className="space-y-6">
          <FinancialHealthSnapshot />
          <ExpenseCategories />
        </div>
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={dashboardData?.recentTransactions || []} />

      {/* Financial insights */}
      <FinancialInsights />
    </div>
  );
};

export default Dashboard;
