'use client';

// ============================================
// PROVIDERS COMPONENT
// Wraps the application with all necessary context providers
// ============================================

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { LoadingScreen } from '@/components/common/LoadingScreen';

// ============================================
// SUPABASE CLIENT SETUP
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing');
}

// ============================================
// PROVIDERS COMPONENT
// ============================================

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserClient(supabaseUrl, supabaseAnonKey));
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  // ============================================
  // RENDER
  // ============================================

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <QueryClientProvider client={queryClient}>
        {/* Toast Container */}
        <ToastContainer />
        
        {/* Children */}
        {children}
        
        {/* React Query Devtools (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </SessionContextProvider>
  );
}
