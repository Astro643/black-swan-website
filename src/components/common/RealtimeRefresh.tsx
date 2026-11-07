'use client';

import { useEffect, useId, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeSubscription {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
}

interface RealtimeRefreshProps {
  subscriptions: RealtimeSubscription[];
}

/**
 * Refreshes the current Server Component route when subscribed database
 * tables change. The browser Supabase client uses the signed-in user's
 * session and anon key; RLS remains responsible for data access.
 */
export function RealtimeRefresh({ subscriptions }: RealtimeRefreshProps) {
  const router = useRouter();
  const instanceId = useId();
  const subscriptionConfig = useMemo(
    () => JSON.stringify(subscriptions),
    [subscriptions]
  );

  useEffect(() => {
    const channelName = `route-refresh-${instanceId.replace(/:/g, '')}`;
    const channel = supabase.channel(channelName);
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const handleChange = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 150);
    };

    const configuredSubscriptions = JSON.parse(subscriptionConfig) as RealtimeSubscription[];

    configuredSubscriptions.forEach(({ table, event = '*', filter }) => {
      channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        handleChange
      );
    });

    channel.subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [instanceId, router, subscriptionConfig]);

  return null;
}
