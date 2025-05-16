import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Fetch transactions
  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: !!user
  });

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const getCategoryColor = (categoryId?: number) => {
    if (!categoryId || !categories) return 'gray';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'gray';
  };

  const handleExpenseAdded = () => {
    setIsAddExpenseOpen(false);
    refetch();
  };

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{t('expenses.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page header */}
      <PageHeader
        title={t('expenses.title')}
        description={t('expenses.description')}
        action={
          <Button onClick={() => setIsAddExpenseOpen(true)}>
            <i className="ri-add-line mr-1.5"></i>
            {t('expenses.addExpense')}
          </Button>
        }
      />

      {/* Add expense dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('expenses.newExpense')}</DialogTitle>
          </DialogHeader>
          <ExpenseForm onSuccess={handleExpenseAdded} categories={categories || []} />
        </DialogContent>
      </Dialog>

      {/* Expenses table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{t('expenses.allTransactions')}</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('expenses.description')}</TableHead>
                <TableHead>{t('expenses.category')}</TableHead>
                <TableHead>{t('expenses.date')}</TableHead>
                <TableHead>{t('expenses.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-blue-100 text-primary-600">
                          <i className={`ri-${transaction.isIncome ? 'bank-line' : 'shopping-basket-line'}`}></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.notes}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {getCategoryName(transaction.categoryId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className={`text-sm font-medium ${transaction.isIncome ? 'text-success-500' : 'text-danger-500'}`}>
                      {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    {t('expenses.noTransactions')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
