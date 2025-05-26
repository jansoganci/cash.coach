import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import Upload from "@/pages/upload";
import Expenses from "@/pages/expenses";
import Transactions from "@/pages/transactions";
import Analytics from "@/pages/analytics";
import SpinnerDemo from "@/pages/spinner-demo";
import RecurringPage from "@/pages/recurring";
import { useAuth } from "./hooks/useAuth";
import { Suspense, lazy } from "react";
import MobileNav from "./components/layout/MobileNav";
import Sidebar from "./components/layout/Sidebar";
import { DollarSpinner } from "@/components/ui/spinners";

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use React.useEffect to handle navigation after render
  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-gray-500">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Don't show layout for auth pages
  const isAuthPage = location === "/login" || location === "/register" || location === "/forgot-password" || location.startsWith("/reset-password");

  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="flex min-h-screen pt-[56px] lg:pt-0">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-y-auto">
        <Switch>
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/upload">
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          </Route>
          <Route path="/expenses">
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          </Route>
          <Route path="/transactions">
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          </Route>
          <Route path="/analytics">
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          </Route>
          <Route path="/recurring">
            <ProtectedRoute>
              <RecurringPage />
            </ProtectedRoute>
          </Route>
          <Route path="/spinner-demo">
            <SpinnerDemo />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {/* Mobile navigation */}
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
