import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken, addAuthHeader } from "@/utils/auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Set basic headers for content type
  let headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization header if token exists
  headers = addAuthHeader(headers);
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use our auth utility to add auth headers
    const headers = addAuthHeader();
    
    console.log(`API Request to ${queryKey[0]} with token: ${getToken() ? 'present' : 'missing'}`);
    
    const res = await fetch(queryKey[0] as string, {
      headers
    });

    if (res.status === 401) {
      // Log auth failure
      console.log('Authentication failed for request:', queryKey[0]);
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
