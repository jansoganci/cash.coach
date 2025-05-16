import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Category } from '@shared/schema';
import { CURRENCIES } from '@shared/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TransactionFormProps {
  onSuccess?: () => void;
  categories: Category[];
  initialData?: any;
  defaultType?: 'income' | 'expense';
}

const formSchema = z.object({
  description: z.string().min(2, { message: 'Description is required' }),
  amount: z.string().min(1, { message: 'Amount is required' })
    .refine(val => !isNaN(parseFloat(val)), { message: 'Amount must be a valid number' })
    .refine(val => parseFloat(val) > 0, { message: 'Amount must be greater than 0' }),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Please select a valid date' }),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default('USD'),
  transactionType: z.enum(['income', 'expense']),
  // Recurring transaction fields
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  endDate: z.string().optional(),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  customDays: z.string().optional(),
});

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSuccess, 
  categories, 
  initialData,
  defaultType = 'expense' 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      description: initialData.description,
      amount: initialData.amount.toString(),
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      categoryId: initialData.categoryId?.toString(),
      notes: initialData.notes || '',
      currency: initialData.currency || user?.preferredCurrency || 'USD',
      transactionType: initialData.isIncome ? 'income' : 'expense',
    } : {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      notes: '',
      currency: user?.preferredCurrency || 'USD',
      transactionType: defaultType,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Convert form values to appropriate types
      const payload = {
        description: values.description,
        amount: parseFloat(values.amount),
        date: new Date(values.date),
        categoryId: values.categoryId ? parseInt(values.categoryId) : undefined,
        notes: values.notes,
        currency: values.currency,
        isIncome: values.transactionType === 'income' ? 1 : 0,
      };
      
      const url = initialData 
        ? `/api/transactions/${initialData.id}` 
        : '/api/transactions';
      
      const method = initialData ? 'PUT' : 'POST';
      
      const res = await apiRequest(method, url, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-health'] });
      
      toast({
        title: initialData 
          ? t('transactions.transactionUpdated') 
          : t('transactions.transactionAdded'),
        description: initialData 
          ? t('transactions.transactionUpdatedDesc') 
          : t('transactions.transactionAddedDesc'),
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('transactions.errorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await mutation.mutateAsync(values);
  };

  // Get the currently selected currency symbol
  const getCurrencySymbol = () => {
    const currencyCode = form.watch('currency');
    return CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
  };

  // Get the appropriate color based on transaction type
  const getTypeColor = () => {
    return form.watch('transactionType') === 'income' ? 'bg-green-50' : 'bg-blue-50';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.transactionType')}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className={field.value === 'income' ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'}>
                    <SelectValue placeholder={t('transactions.selectTransactionType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="expense" className="flex items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      {t('transactions.expense')}
                    </div>
                  </SelectItem>
                  <SelectItem value="income" className="flex items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      {t('transactions.income')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.description')}</FormLabel>
              <FormControl>
                <Input placeholder={t('transactions.descriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('transactions.amount')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">{getCurrencySymbol()}</span>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="pl-7" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('transactions.date')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('transactions.category')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactions.selectCategory')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('transactions.currency')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactions.selectCurrency')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('transactions.notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('transactions.notesPlaceholder')} 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className={`transition-colors font-medium shadow-sm ${
              form.watch('transactionType') === 'income' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
            size="lg"
          >
            {mutation.isPending ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                {t('common.saving')}
              </>
            ) : (
              <>
                <i className={`mr-1.5 ${initialData ? 'ri-save-line' : 'ri-add-circle-line'}`}></i>
                {initialData ? t('common.update') : t('common.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;