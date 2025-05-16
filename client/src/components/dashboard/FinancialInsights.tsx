import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const FinancialInsights: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch transactions for insights
  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  const generateInsights = () => {
    if (!transactions || transactions.length === 0) {
      return {
        spending: [],
        recommendations: []
      };
    }

    const insights = {
      spending: [] as string[],
      recommendations: [] as string[]
    };

    // Get this month's and last month's transactions
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthExpenses = transactions.filter(t => 
      !t.isIncome && 
      new Date(t.date) >= thisMonthStart
    );
    
    const lastMonthExpenses = transactions.filter(t => 
      !t.isIncome && 
      new Date(t.date) >= lastMonthStart &&
      new Date(t.date) <= lastMonthEnd
    );

    // Group by category
    const thisMonthByCategory = groupByCategory(thisMonthExpenses);
    const lastMonthByCategory = groupByCategory(lastMonthExpenses);

    // Generate category-specific insights
    for (const [categoryId, amount] of Object.entries(thisMonthByCategory)) {
      const lastMonthAmount = lastMonthByCategory[categoryId] || 0;
      const difference = amount - lastMonthAmount;
      
      // Only add insights for significant changes (>10%)
      if (lastMonthAmount > 0 && Math.abs(difference) > 0.1 * lastMonthAmount) {
        const categoryName = getCategoryName(parseInt(categoryId));
        
        if (difference > 0) {
          insights.spending.push(t('insights.spentMoreOnCategory', { 
            amount: Math.abs(Math.round(difference)), 
            category: categoryName 
          }));
        } else {
          insights.spending.push(t('insights.spentLessOnCategory', { 
            percentage: Math.round((Math.abs(difference) / lastMonthAmount) * 100),
            category: categoryName 
          }));
        }
      }
    }

    // Add placeholder insights if we don't have real ones
    if (insights.spending.length === 0) {
      insights.spending.push(t('insights.notEnoughData'));
    }

    // Generate standard recommendations
    insights.recommendations.push(t('insights.reviewSubscriptions'));
    insights.recommendations.push(t('insights.increaseSavings'));

    return insights;
  };

  const groupByCategory = (transactions: any[]) => {
    return transactions.reduce((acc, transaction) => {
      const categoryId = transaction.categoryId || 0;
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const getCategoryName = (categoryId: number): string => {
    const categoriesData = {
      0: t('categories.uncategorized'),
      1: t('categories.groceries'),
      2: t('categories.dining'),
      3: t('categories.transportation'),
      4: t('categories.entertainment'),
      5: t('categories.housing'),
      6: t('categories.utilities'),
      7: t('categories.healthcare'),
      8: t('categories.shopping'),
      9: t('categories.travel'),
      10: t('categories.other')
    };
    
    return categoriesData[categoryId as keyof typeof categoriesData] || t('categories.uncategorized');
  };

  const insights = generateInsights();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="flex items-start mb-6">
        <div className="flex-shrink-0 p-2.5 bg-primary-50 rounded-lg">
          <i className="ri-line-chart-line text-xl text-primary-600"></i>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.financialInsights')}</h3>
          <p className="mt-1 text-sm text-gray-600">{t('dashboard.insightsDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">{t('dashboard.spendingInsights')}</h4>
            <ul className="mt-2 space-y-3">
              {insights.spending.map((insight, index) => (
                <li key={index} className="flex items-center text-sm">
                  <i className="ri-information-line text-primary-600 mr-2"></i>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700">{t('dashboard.recommendations')}</h4>
            <ul className="mt-2 space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-center text-sm">
                  <i className="ri-lightbulb-line text-warning-500 mr-2"></i>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="h-52 rounded-lg overflow-hidden">
          <div className="h-full w-full flex items-center justify-center bg-gray-100 bg-opacity-50">
            <i className="ri-bar-chart-line text-primary-300 text-6xl opacity-70"></i>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <Link href="/analytics">
          <Button variant="link" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 px-0">
            <span>{t('dashboard.viewDetailedAnalytics')}</span>
            <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FinancialInsights;
