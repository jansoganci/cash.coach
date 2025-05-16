import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';

interface ExpenseCategoriesProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#9CA3AF'];

const ExpenseCategories: React.FC<ExpenseCategoriesProps> = ({ className }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState('month');

  // Fetch transactions and categories
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: !!user
  });

  const isLoading = isLoadingTransactions || isLoadingCategories;

  // Prepare data for pie chart
  const chartData = React.useMemo(() => {
    if (!transactions || !categories) return [];
    
    const categoryTotals = new Map<number, number>();
    const now = new Date();
    let startDate = new Date();
    
    // Determine date range based on selection
    if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return calculateCategoryTotals(startDate, endDate);
    }
    
    return calculateCategoryTotals(startDate);
    
    function calculateCategoryTotals(start: Date, end: Date = now) {
      // Initialize all categories with zero
      categories.forEach(category => {
        categoryTotals.set(category.id, 0);
      });
      
      // Sum transactions by category
      transactions
        .filter(t => !t.isIncome && new Date(t.date) >= start && new Date(t.date) <= end)
        .forEach(transaction => {
          const categoryId = transaction.categoryId || 0;
          const currentTotal = categoryTotals.get(categoryId) || 0;
          categoryTotals.set(categoryId, currentTotal + transaction.amount);
        });
      
      // Filter out categories with zero spending
      const filteredCategories = Array.from(categoryTotals.entries())
        .filter(([_, total]) => total > 0)
        .map(([categoryId, total]) => {
          const category = categories.find(c => c.id === categoryId) || { 
            name: t('categories.uncategorized'), 
            color: '#9CA3AF',
            icon: 'question-mark'
          };
          return {
            name: category.name,
            value: total,
            color: category.color
          };
        })
        .sort((a, b) => b.value - a.value);
      
      return filteredCategories;
    }
  }, [transactions, categories, timeRange, t]);

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">{t('dashboard.expenseCategories')}</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('dashboard.selectTimeRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t('dashboard.thisMonth')}</SelectItem>
            <SelectItem value="lastMonth">{t('dashboard.lastMonth')}</SelectItem>
            <SelectItem value="year">{t('dashboard.thisYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="chart-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  formatCurrency(value as number), 
                  t('dashboard.amount')
                ]}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => (
                  <span className="text-sm">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{t('dashboard.noExpensesFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategories;
