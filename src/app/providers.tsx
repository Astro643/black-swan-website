'use client';

// ============================================
// PROVIDERS COMPONENT
// Wraps the application with all necessary context providers
// ============================================

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { LoadingScreen } from '@/components/common/LoadingScreen';

// ============================================
// PROVIDERS COMPONENT
// ============================================

export function Providers({ children }: { children: React.ReactNode }) {
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
  );
}
