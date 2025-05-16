import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend } from 'recharts';

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState('month');

  // Fetch transactions for analytics
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: !!user
  });

  // Prepare data for spending by category chart
  const spendingByCategory = React.useMemo(() => {
    if (!transactions || !categories) return [];
    
    const categoryTotals = new Map<number, number>();
    
    // Sum transactions by category
    transactions
      .filter(t => !t.isIncome)
      .forEach(transaction => {
        const categoryId = transaction.categoryId || 0;
        const currentTotal = categoryTotals.get(categoryId) || 0;
        categoryTotals.set(categoryId, currentTotal + transaction.amount);
      });
    
    // Convert to chart data format
    return Array.from(categoryTotals.entries()).map(([categoryId, total]) => {
      const category = categories.find(c => c.id === categoryId) || { name: 'Uncategorized', color: '#9CA3AF' };
      return {
        name: category.name,
        value: total,
        color: category.color
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Prepare data for monthly spending chart
  const monthlySpending = React.useMemo(() => {
    if (!transactions) return [];
    
    const months: Record<string, number> = {};
    const currentYear = new Date().getFullYear();
    
    // Create empty months
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' });
      months[monthName] = 0;
    }
    
    // Sum transactions by month
    transactions
      .filter(t => !t.isIncome && new Date(t.date).getFullYear() === currentYear)
      .forEach(transaction => {
        const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
        months[month] = (months[month] || 0) + transaction.amount;
      });
    
    // Convert to chart data format
    return Object.entries(months).map(([month, amount]) => ({
      month,
      amount
    }));
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page header */}
      <PageHeader
        title={t('analytics.title')}
        description={t('analytics.description')}
      />

      {/* Analytics tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t('analytics.overview')}</TabsTrigger>
          <TabsTrigger value="spending">{t('analytics.spending')}</TabsTrigger>
          <TabsTrigger value="income">{t('analytics.income')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by category */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.spendingByCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {spendingByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(value as number, user?.preferredCurrency || 'USD'),
                          'Amount'
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly spending */}
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.monthlySpending')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySpending}>
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => 
                          formatCurrency(value, user?.preferredCurrency || 'USD', true)}
                      />
                      <Tooltip 
                        formatter={(value) => [
                          formatCurrency(value as number, user?.preferredCurrency || 'USD'),
                          'Amount'
                        ]}
                      />
                      <Bar dataKey="amount" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-semibold">
                  {formatCurrency(
                    transactions?.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0) || 0,
                    user?.preferredCurrency || 'USD'
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('analytics.totalSpending')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-semibold">
                  {formatCurrency(
                    transactions?.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0) || 0,
                    user?.preferredCurrency || 'USD'
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('analytics.totalIncome')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-semibold">
                  {transactions ? transactions.length : 0}
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('analytics.totalTransactions')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="spending">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.spendingAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">{t('analytics.spendingAnalysisDescription')}</p>
              <div className="h-96 mt-6">
                {/* Detailed spending analysis chart would go here */}
                <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400">{t('analytics.detailedAnalysisComingSoon')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.incomeAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">{t('analytics.incomeAnalysisDescription')}</p>
              <div className="h-96 mt-6">
                {/* Detailed income analysis chart would go here */}
                <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-400">{t('analytics.detailedAnalysisComingSoon')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
