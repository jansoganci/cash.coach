import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';

interface SpendingTrendsProps {
  className?: string;
}

const SpendingTrends: React.FC<SpendingTrendsProps> = ({ className }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState('30');

  // Fetch transactions for spending trends
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  // Prepare data for spending trends chart
  const chartData = React.useMemo(() => {
    if (!transactions) return [];
    
    const days = parseInt(timeRange, 10);
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    // Create date buckets
    const dateBuckets: Record<string, number> = {};
    const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const formatted = dateFormat.format(date);
      dateBuckets[formatted] = 0;
    }
    
    // Fill with transaction data
    transactions
      .filter(t => !t.isIncome && new Date(t.date) >= startDate)
      .forEach(transaction => {
        const date = new Date(transaction.date);
        const formatted = dateFormat.format(date);
        if (dateBuckets[formatted] !== undefined) {
          dateBuckets[formatted] += transaction.amount;
        }
      });
    
    // Convert to chart data format
    return Object.entries(dateBuckets).map(([date, amount]) => ({
      date,
      amount
    }));
  }, [transactions, timeRange]);

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">{t('dashboard.spendingTrends')}</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('dashboard.selectTimeRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">{t('dashboard.last30Days')}</SelectItem>
            <SelectItem value="90">{t('dashboard.last90Days')}</SelectItem>
            <SelectItem value="365">{t('dashboard.thisYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="chart-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, undefined, true)}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip 
                formatter={(value) => [
                  formatCurrency(value as number), 
                  t('dashboard.amount')
                ]}
                labelFormatter={(label) => t('dashboard.date', { date: label })}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ fill: '#3B82F6', r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SpendingTrends;
