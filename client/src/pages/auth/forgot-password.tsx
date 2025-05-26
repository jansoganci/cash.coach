import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', values);
      return res.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      setResetToken(data.resetToken);
      toast({
        title: t('auth.passwordResetSent'),
        description: t('auth.passwordResetSentDesc'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('auth.error'),
        description: error.message || t('auth.forgotPasswordError'),
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await mutation.mutateAsync(values);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <i className="ri-mail-check-line text-green-600 text-xl"></i>
              </div>
              <CardTitle className="mt-4">{t('auth.checkYourEmail')}</CardTitle>
              <CardDescription>
                {t('auth.passwordResetInstructions')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* In a real app, this would be sent via email */}
              <Alert>
                <i className="ri-information-line h-4 w-4"></i>
                <AlertDescription>
                  <strong>Development Mode:</strong> Your reset token is: <code className="bg-gray-100 px-1 rounded">{resetToken}</code>
                  <br />
                  <Link href={`/reset-password?token=${resetToken}`}>
                    <Button variant="link" className="p-0 h-auto">
                      Click here to reset your password
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    {t('auth.backToLogin')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t('auth.forgotPassword')}</CardTitle>
            <CardDescription>
              {t('auth.forgotPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder={t('auth.emailPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      {t('auth.sendingInstructions')}
                    </>
                  ) : (
                    t('auth.sendResetInstructions')
                  )}
                </Button>
                
                <div className="text-center">
                  <Link href="/login">
                    <Button variant="link">
                      {t('auth.backToLogin')}
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;