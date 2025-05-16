import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/layout/PageHeader';
import TransactionForm from '@/components/transactions/TransactionForm';
import TransactionList from '@/components/transactions/TransactionList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Transaction } from '@shared/schema';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');

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

  const handleTransactionAdded = () => {
    setIsAddTransactionOpen(false);
    setSelectedTransaction(null);
    refetch();
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsAddTransactionOpen(true);
  };

  // Calculate total income
  const calculateTotalIncome = () => {
    if (!transactions) return 0;
    return transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    if (!transactions) return 0;
    return transactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalIncome = calculateTotalIncome();
  const totalExpenses = calculateTotalExpenses();
  const netBalance = totalIncome - totalExpenses;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{t('transactions.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page header */}
      <PageHeader
        title={t('transactions.title')}
        description={t('transactions.description')}
        action={
          <Button 
            onClick={() => {
              setSelectedTransaction(null);
              setIsAddTransactionOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <i className="ri-add-line mr-1.5"></i>
            {t('transactions.addTransaction')}
          </Button>
        }
      />

      {/* Net balance card */}
      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-800">{t('transactions.netBalance')}</h3>
              <p className="text-sm text-primary-600">{t('transactions.balanceDescription')}</p>
            </div>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}{user?.preferredCurrency || '$'}{netBalance.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <TransactionList
          title={t('transactions.incomeTitle')}
          description={t('transactions.incomeDescription')}
          transactions={transactions || []}
          type="income"
          totalAmount={totalIncome}
          currency={user?.preferredCurrency || 'USD'}
          onTransactionClick={handleTransactionClick}
        />
        
        <TransactionList
          title={t('transactions.expenseTitle')}
          description={t('transactions.expenseDescription')}
          transactions={transactions || []}
          type="expense"
          totalAmount={totalExpenses}
          currency={user?.preferredCurrency || 'USD'}
          onTransactionClick={handleTransactionClick}
        />
      </div>

      {/* Add/Edit Transaction Dialog */}
      <Dialog 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction 
                ? t('transactions.editTransaction') 
                : t('transactions.newTransaction')
              }
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction 
                ? t('transactions.editTransactionDescription') 
                : t('transactions.newTransactionDescription')
              }
            </DialogDescription>
          </DialogHeader>
          <TransactionForm 
            onSuccess={handleTransactionAdded} 
            categories={categories || []}
            initialData={selectedTransaction}
            defaultType="expense"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;