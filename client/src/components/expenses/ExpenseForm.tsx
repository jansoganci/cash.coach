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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Category } from '@shared/schema';
import { CURRENCIES } from '@shared/schema';

interface ExpenseFormProps {
  onSuccess?: () => void;
  categories: Category[];
  initialData?: any;
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
  isIncome: z.string().default('0'),
});

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, categories, initialData }) => {
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
      isIncome: initialData.isIncome?.toString() || '0',
    } : {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      notes: '',
      currency: user?.preferredCurrency || 'USD',
      isIncome: '0',
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
        isIncome: parseInt(values.isIncome),
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
      
      toast({
        title: initialData 
          ? t('expenses.transactionUpdated') 
          : t('expenses.transactionAdded'),
        description: initialData 
          ? t('expenses.transactionUpdatedDesc') 
          : t('expenses.transactionAddedDesc'),
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('expenses.errorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await mutation.mutateAsync(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.description')}</FormLabel>
              <FormControl>
                <Input placeholder={t('expenses.descriptionPlaceholder')} {...field} />
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
                <FormLabel>{t('expenses.amount')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">{
                        CURRENCIES.find(c => c.code === form.watch('currency'))?.symbol || '$'
                      }</span>
                    </div>
                    <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
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
                <FormLabel>{t('expenses.date')}</FormLabel>
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
                <FormLabel>{t('expenses.category')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectCategory')} />
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
                <FormLabel>{t('expenses.currency')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('expenses.selectCurrency')} />
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
          name="isIncome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.transactionType')}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('expenses.selectTransactionType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">{t('expenses.expense')}</SelectItem>
                  <SelectItem value="1">{t('expenses.income')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('expenses.notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('expenses.notesPlaceholder')} 
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
          >
            {mutation.isPending ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                {t('common.saving')}
              </>
            ) : (
              initialData ? t('common.update') : t('common.save')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExpenseForm;
