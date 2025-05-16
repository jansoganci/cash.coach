import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionProps {
  categoryName?: string;
}

const RecurringTransactions: React.FC<RecurringTransactionProps> = ({ categoryName }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Define the recurring transaction type
  interface RecurringTransaction {
    id: number;
    userId: number;
    description: string;
    amount: number;
    isIncome: number;
    currency: string;
    categoryId?: number;
    notes?: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    startDate: string;
    endDate?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    customDays?: number;
    isActive: boolean;
    lastGeneratedDate?: string;
  }

  const { data: recurringTransactions = [] as RecurringTransaction[], isLoading, error } = useQuery<RecurringTransaction[]>({
    queryKey: ['/api/recurring-transactions'],
    enabled: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/recurring-transactions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });
      toast({
        title: t('recurring.transactionDeleted'),
        description: t('recurring.transactionDeletedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('recurring.errorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/recurring-transactions/process');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: t('recurring.processedSuccess'),
        description: t('recurring.processedSuccessDesc', { count: data.transactionsGenerated }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('recurring.errorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const getFrequencyLabel = (transaction: any) => {
    if (!transaction.frequency) return '';
    
    switch (transaction.frequency) {
      case 'daily':
        return t('transactions.daily');
      case 'weekly':
        return `${t('transactions.weekly')} (${getDayName(transaction.dayOfWeek)})`;
      case 'monthly':
        return `${t('transactions.monthly')} (${t('recurring.dayOfMonth')}: ${transaction.dayOfMonth})`;
      case 'custom':
        return `${t('recurring.every')} ${transaction.customDays} ${t('recurring.days')}`;
      default:
        return transaction.frequency;
    }
  };

  const getDayName = (dayOfWeek: number | null) => {
    if (dayOfWeek === null || dayOfWeek === undefined) return '';
    
    const days = [
      t('transactions.sunday'),
      t('transactions.monday'),
      t('transactions.tuesday'),
      t('transactions.wednesday'),
      t('transactions.thursday'),
      t('transactions.friday'),
      t('transactions.saturday')
    ];
    
    return days[dayOfWeek];
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutateAsync(id);
  };

  const handleProcess = () => {
    processMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('recurring.title')}</CardTitle>
          <CardDescription>{t('recurring.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('recurring.title')}</CardTitle>
          <CardDescription>{t('recurring.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-red-50 text-red-800">
            <p>{t('recurring.error')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{t('recurring.title')}</CardTitle>
          <CardDescription>{t('recurring.description')}</CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={handleProcess}
          disabled={processMutation.isPending}
        >
          {processMutation.isPending ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              {t('recurring.processing')}
            </>
          ) : (
            <>
              <i className="ri-refresh-line mr-2"></i>
              {t('recurring.processNow')}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {recurringTransactions.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-md bg-muted/50">
            <p className="text-muted-foreground">{t('recurring.noRecurringTransactions')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('recurring.addFromTransactions')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="space-y-4">
              {recurringTransactions.map((transaction: any) => (
                <div 
                  key={transaction.id} 
                  className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className={`w-2 h-2 rounded-full ${transaction.isIncome ? 'bg-green-500' : 'bg-blue-500'} mr-2`}></span>
                      <h3 className="font-semibold">{transaction.description}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center">
                        <i className="ri-repeat-line mr-1.5"></i>
                        {getFrequencyLabel(transaction)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <i className={transaction.isIncome ? 'ri-arrow-up-circle-line mr-1.5 text-green-500' : 'ri-arrow-down-circle-line mr-1.5 text-blue-500'}></i>
                        {transaction.isIncome ? t('transactions.income') : t('transactions.expense')}
                      </Badge>
                      <Badge variant="outline" className="flex items-center">
                        <i className="ri-money-dollar-circle-line mr-1.5"></i>
                        {new Intl.NumberFormat(undefined, { 
                          style: 'currency', 
                          currency: transaction.currency || 'USD'
                        }).format(transaction.amount)}
                      </Badge>
                      {transaction.endDate && (
                        <Badge variant="outline" className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1.5" />
                          {t('recurring.endsOn')} {format(new Date(transaction.endDate), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                    {transaction.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('common.edit')}</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('recurring.deleteTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('recurring.deleteDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(transaction.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringTransactions;