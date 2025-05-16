import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Transaction, Category } from '@shared/schema';
import { useCurrency } from '@/hooks/useCurrency';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  // Fetch categories to display category names
  const { data: categories } = useQuery({
    queryKey: ['/api/categories']
  });

  const getCategoryName = (categoryId?: number): string => {
    if (!categoryId || !categories) return t('categories.uncategorized');
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : t('categories.uncategorized');
  };

  const getCategoryColor = (categoryId?: number): string => {
    if (!categoryId || !categories) return 'blue';
    const category = categories.find(cat => cat.id === categoryId);
    
    // Convert hex color to tailwind class name approximation
    const color = category?.color || '#3B82F6';
    const colorMap: Record<string, string> = {
      '#3B82F6': 'blue',
      '#F59E0B': 'amber',
      '#10B981': 'green',
      '#EF4444': 'red',
      '#8B5CF6': 'purple',
      '#6366F1': 'indigo',
      '#EC4899': 'pink',
      '#F97316': 'orange',
      '#14B8A6': 'teal',
      '#9CA3AF': 'gray'
    };
    
    return colorMap[color] || 'blue';
  };

  const getIconForTransaction = (transaction: Transaction): string => {
    if (transaction.isIncome) return 'bank-line';
    
    // Get category-specific icon if we have categories
    if (transaction.categoryId && categories) {
      const category = categories.find(cat => cat.id === transaction.categoryId);
      if (category?.icon) return `${category.icon}-line`;
    }
    
    // Default icons based on transaction description
    const description = transaction.description.toLowerCase();
    if (description.includes('grocery') || description.includes('food')) return 'shopping-basket-line';
    if (description.includes('restaurant') || description.includes('cafe')) return 'restaurant-line';
    if (description.includes('transport') || description.includes('uber')) return 'car-line';
    if (description.includes('netflix') || description.includes('spotify')) return 'film-line';
    
    return 'shopping-bag-line';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">{t('dashboard.recentTransactions')}</h3>
          <Link href="/expenses">
            <Button variant="link" className="text-sm text-primary-600 hover:text-primary-700 px-0">
              {t('dashboard.viewAll')}
            </Button>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('transactions.description')}</TableHead>
              <TableHead>{t('transactions.category')}</TableHead>
              <TableHead>{t('transactions.date')}</TableHead>
              <TableHead>{t('transactions.amount')}</TableHead>
              <TableHead className="text-right">{t('transactions.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-${getCategoryColor(transaction.categoryId)}-100 text-${getCategoryColor(transaction.categoryId)}-600`}>
                        <i className={`ri-${getIconForTransaction(transaction)}`}></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        {transaction.notes && <p className="text-xs text-gray-500">{transaction.notes}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`px-2.5 py-1 text-xs font-medium rounded-full bg-${getCategoryColor(transaction.categoryId)}-50 text-${getCategoryColor(transaction.categoryId)}-700`}>
                      {getCategoryName(transaction.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className={`text-sm font-medium ${transaction.isIncome ? 'text-success-500' : 'text-danger-500'}`}>
                    {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <button type="button" className="text-gray-400 hover:text-gray-500">
                      <i className="ri-more-fill"></i>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  {t('dashboard.noTransactions')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecentTransactions;
