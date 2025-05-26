import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: values.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: t('auth.passwordResetSuccess'),
        description: t('auth.passwordResetSuccessDesc'),
      });
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: t('auth.error'),
        description: error.message || t('auth.resetPasswordError'),
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast({
        title: t('auth.error'),
        description: t('auth.invalidResetToken'),
        variant: 'destructive',
      });
      return;
    }
    await mutation.mutateAsync(values);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <i className="ri-check-line text-green-600 text-xl"></i>
              </div>
              <CardTitle className="mt-4">{t('auth.passwordResetSuccess')}</CardTitle>
              <CardDescription>
                {t('auth.passwordResetSuccessDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                {t('auth.redirectingToLogin')}
              </p>
              <Link href="/login">
                <Button className="w-full">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t('auth.invalidResetLink')}</CardTitle>
              <CardDescription>
                {t('auth.invalidResetLinkDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full mb-2">
                  {t('auth.requestNewReset')}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="link">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
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
            <CardTitle>{t('auth.resetPassword')}</CardTitle>
            <CardDescription>
              {t('auth.resetPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.newPassword')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={t('auth.newPasswordPlaceholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.confirmNewPassword')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={t('auth.confirmNewPasswordPlaceholder')} 
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
                      {t('auth.resettingPassword')}
                    </>
                  ) : (
                    t('auth.resetPassword')
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

export default ResetPassword;