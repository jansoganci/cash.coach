import React, { createContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  preferredCurrency: string;
  preferredLanguage: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<Preferences>) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

interface Preferences {
  preferredCurrency: string;
  preferredLanguage: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updatePreferences: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  // Fetch current user
  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        
        return await res.json();
      } catch (error) {
        return null;
      }
    }
  });

  // Login mutation with improved session handling
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Use direct fetch with credentials included instead of apiRequest
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include" // Important for cookies to be sent/received
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Login failed");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Update cached user data
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Force refetch to ensure we have the latest session data
      refetch();
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logged out successfully",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<Preferences>) => {
      const res = await apiRequest("PUT", "/api/user/preferences", preferences);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating your preferences. Please try again.",
        variant: "destructive",
      });
    }
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updatePreferences = async (preferences: Partial<Preferences>) => {
    await updatePreferencesMutation.mutateAsync(preferences);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
