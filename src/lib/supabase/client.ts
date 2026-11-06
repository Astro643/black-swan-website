import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is required');
}

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Enable realtime
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Enable global fetch for server components
  global: {
    fetch: async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, options);
      return response;
    },
  },
});

// ============================================
// REUSABLE CLIENT FACTORY
// ============================================

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

// ============================================
// REUSABLE SERVER CLIENT (for Server Components)
// ============================================

export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    // Server-side: no realtime by default
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
    // Use server-side fetch
    global: {
      fetch: async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
          ...options,
          next: {
            revalidate: 0, // No cache for Supabase
          },
        });
        return response;
      },
    },
  });
};
