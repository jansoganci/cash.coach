import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';
import { format } from 'date-fns';
import { Transaction } from '@shared/schema';

interface TransactionListProps {
  title: string;
  description: string;
  transactions: Transaction[];
  type: 'income' | 'expense';
  totalAmount: number;
  currency: string;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  title,
  description,
  transactions,
  type,
  totalAmount,
  currency,
  onTransactionClick
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  // Filter transactions by type
  const filteredTransactions = transactions.filter(
    transaction => (type === 'income' ? transaction.isIncome : !transaction.isIncome)
  );

  // Get card style based on transaction type
  const getCardStyle = () => {
    return type === 'income' 
      ? { 
          borderColor: 'border-green-200', 
          headerBg: 'bg-green-50', 
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          amountColor: 'text-green-600'
        }
      : {
          borderColor: 'border-blue-200',
          headerBg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          amountColor: 'text-blue-600'
        };
  };

  const cardStyle = getCardStyle();

  return (
    <Card className={`border ${cardStyle.borderColor} h-full`}>
      <CardHeader className={`pb-2 ${cardStyle.headerBg} border-b ${cardStyle.borderColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${cardStyle.iconBg}`}>
            <i className={`ri-${type === 'income' ? 'bank-line' : 'shopping-basket-line'} ${cardStyle.iconColor} text-lg`}></i>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('transactions.total')}</span>
            <span className={`text-xl font-bold ${cardStyle.amountColor}`}>
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${cardStyle.amountColor}`}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <i className={`ri-inbox-line text-3xl mb-2 ${cardStyle.iconColor} opacity-50`}></i>
              <p>{t('transactions.noTransactionsOf', { type: type === 'income' ? t('transactions.income') : t('transactions.expenses') })}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;