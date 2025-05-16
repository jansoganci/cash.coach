import React, { createContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Token storage key
const TOKEN_KEY = "fintrack_auth_token";

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  preferredCurrency: string;
  preferredLanguage: string;
  token?: string;
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
  const [error, setError] = useState<Error | null>(null);
  const [userState, setUserState] = useState<User | null>(null);
  
  // Check if there's a token in localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Force refetch user data if token exists
      refetch();
    }
  }, []);
  
  // Fetch current user using JWT token in the header
  const { 
    data: user, 
    isLoading, 
    refetch 
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async ({ queryKey }) => {
      try {
        // Manually add token to this request
        const token = localStorage.getItem(TOKEN_KEY);
        const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};
        
        const res = await fetch(queryKey[0] as string, {
          headers
        });
        
        if (res.status === 401) {
          // If unauthorized, clear token
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials)
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("An error occurred during login");
      }
      
      return await res.json();
    },
    onSuccess: (userData) => {
      // Store JWT token in localStorage for persistent login
      if (userData.token) {
        localStorage.setItem(TOKEN_KEY, userData.token);
        console.log("JWT token stored successfully");
        
        // Set the user data directly instead of using refetch
        // This avoids the race condition where refetch runs before
        // the token is properly stored/used
        queryClient.setQueryData(["/api/auth/me"], userData);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: (userData) => {
      // Store JWT token
      if (userData.token) {
        localStorage.setItem(TOKEN_KEY, userData.token);
      }
      
      // Refresh user data
      refetch();
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    },
    onError: (error: any) => {
      setError(error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // With JWT we just need to call the logout endpoint to record the logout
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      // Clear token from localStorage
      localStorage.removeItem(TOKEN_KEY);
      
      // Clear cached data
      queryClient.clear();
    },
    onSuccess: () => {
      // Force refetch to clear user state
      refetch();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<Preferences>) => {
      const res = await apiRequest("PUT", "/api/user/preferences", preferences);
      return res.json();
    },
    onSuccess: () => {
      // Refresh user data
      refetch();
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
        error,
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