import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { setToken } from '@/utils/auth';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Direct fetch to login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      // Get user data and token
      const userData = await response.json();
      
      // Store token in localStorage using our utility
      if (userData.token) {
        setToken(userData.token);
        console.log('Token saved successfully:', userData.token.substring(0, 10) + '...');
        
        // Refresh query cache with user data
        queryClient.setQueryData(['/api/auth/me'], userData);
        
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard..."
        });
        
        // Redirect to dashboard
        setLocation('/');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your username and password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <i className="ri-line-chart-line text-primary-600 text-3xl"></i>
          </div>
          <CardTitle className="text-2xl font-bold text-center">{t('auth.loginTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.loginDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('auth.usernamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><i className="ri-loader-4-line animate-spin mr-2"></i> {t('auth.loggingIn')}</>
                ) : (
                  t('auth.login')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            {t('auth.noAccount')}{' '}
            <Button variant="link" className="p-0" onClick={() => setLocation('/register')}>
              {t('auth.register')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
