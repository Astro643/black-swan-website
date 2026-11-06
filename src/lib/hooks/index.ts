// ============================================
// CUSTOM REACT HOOKS
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type {
  StockRow,
  PortfolioRow,
  UserProfileRow,
  TransactionRow,
  ShopItemRow,
  InventoryRow,
  MarketEventRow,
} from '@/types/database';
import {
  MARKET_CONFIG,
  FINANCIAL_CONFIG,
  STOCK_CATEGORIES,
  REALTIME_CONFIG,
} from '../constants';
import { createDatabaseClient } from '../supabase/wrappers';

// ============================================
// SUPABASE CLIENT HOOK
// ============================================

export function useSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const client = useMemo(() => {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  return client;
}

// ============================================
// DATABASE CLIENT HOOK
// ============================================

export function useDatabaseClient() {
  const db = useMemo(() => createDatabaseClient(), []);
  return db;
}

// ============================================
// SESSION HOOK
// ============================================

export function useSession() {
  const supabase = useSupabaseClient();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setSession(currentSession);
      } catch (error) {
        console.error('Error in useSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return { session, loading };
}

// ============================================
// USER HOOK
// ============================================

export function useUser() {
  const { session, loading } = useSession();
  const db = useDatabaseClient();
  const [user, setUser] = useState<UserProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await db.getUserProfile(session.user.id);
        if (error) {
          console.error('Error fetching user profile:', error);
        }
        setUser(data);
      } catch (error) {
        console.error('Error in useUser:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUser();
  }, [session, db]);

  return { user, loading: loading || profileLoading, session };
}

// ============================================
// STOCKS HOOK
// ============================================

export function useStocks() {
  const db = useDatabaseClient();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const { data, error: fetchError } = await db.getAllStocks();
        if (fetchError) {
          throw fetchError;
        }
        setStocks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();

    // Subscribe to realtime updates
    const subscription = db.subscribeToStocks((payload) => {
      setStocks((prev) => {
        const newStocks = [...prev];
        const index = newStocks.findIndex((s) => s.id === payload.new.id);
        if (index >= 0) {
          newStocks[index] = payload.new;
        } else if (payload.eventType === 'INSERT') {
          newStocks.push(payload.new);
        } else if (payload.eventType === 'DELETE') {
          newStocks.splice(index, 1);
        }
        return newStocks;
      });
    });

    return () => {
      db.unsubscribeAll();
    };
  }, [db]);

  // Get stock by ticker
  const getStockByTicker = useCallback(
    (ticker: string) => {
      return stocks.find((s) => s.ticker === ticker.toUpperCase()) || null;
    },
    [stocks]
  );

  // Get stocks by category
  const getStocksByCategory = useCallback(
    (category: string) => {
      return stocks.filter((s) => s.category === category);
    },
    [stocks]
  );

  // Get active stocks
  const getActiveStocks = useCallback(() => {
    return stocks.filter((s) => s.is_active);
  }, [stocks]);

  return {
    stocks,
    loading,
    error,
    getStockByTicker,
    getStocksByCategory,
    getActiveStocks,
    refresh: async () => {
      setLoading(true);
      try {
        const { data } = await db.getAllStocks();
        setStocks(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// PORTFOLIO HOOK
// ============================================

export function usePortfolio(userId?: string) {
  const db = useDatabaseClient();
  const { stocks } = useStocks();
  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setPortfolio([]);
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const { data, error: fetchError } = await db.getPortfolio(userId);
        if (fetchError) {
          throw fetchError;
        }
        setPortfolio(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();

    // Subscribe to realtime updates
    if (userId) {
      const subscription = db.subscribeToPortfolio(userId, (payload) => {
        setPortfolio((prev) => {
          const newPortfolio = [...prev];
          const index = newPortfolio.findIndex((p) => p.id === payload.new.id);
          if (index >= 0) {
            newPortfolio[index] = payload.new;
          } else if (payload.eventType === 'INSERT') {
            newPortfolio.push(payload.new);
          } else if (payload.eventType === 'DELETE') {
            newPortfolio.splice(index, 1);
          }
          return newPortfolio;
        });
      });
    }

    return () => {
      db.unsubscribeAll();
    };
  }, [userId, db, stocks]);

  // Get position by ticker
  const getPosition = useCallback(
    (ticker: string) => {
      return portfolio.find((p) => p.ticker === ticker.toUpperCase()) || null;
    },
    [portfolio]
  );

  // Calculate portfolio value
  const portfolioValue = useMemo(() => {
    return portfolio.reduce((total, position) => {
      const stock = stocks.find((s) => s.ticker === position.ticker);
      if (stock) {
        return total + position.shares * stock.current_price;
      }
      return total;
    }, 0);
  }, [portfolio, stocks]);

  // Calculate total invested
  const totalInvested = useMemo(() => {
    return portfolio.reduce((total, position) => total + position.total_invested, 0);
  }, [portfolio]);

  // Calculate total profit/loss
  const totalProfitLoss = useMemo(() => {
    return portfolioValue - totalInvested;
  }, [portfolioValue, totalInvested]);

  // Calculate profit/loss percentage
  const profitLossPercent = useMemo(() => {
    if (totalInvested === 0) return 0;
    return (totalProfitLoss / totalInvested) * 100;
  }, [totalProfitLoss, totalInvested]);

  return {
    portfolio,
    loading,
    error,
    getPosition,
    portfolioValue,
    totalInvested,
    totalProfitLoss,
    profitLossPercent,
    refresh: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await db.getPortfolio(userId);
        setPortfolio(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// LEADERBOARD HOOK
// ============================================

export function useLeaderboard(limit: number = 10) {
  const db = useDatabaseClient();
  const [leaderboard, setLeaderboard] = useState<UserProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error: fetchError } = await db.getLeaderboard(limit);
        if (fetchError) {
          throw fetchError;
        }
        setLeaderboard(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to realtime updates
    const subscription = db.subscribeToLeaderboard((payload) => {
      setLeaderboard((prev) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newLeaderboard = [...prev];
          const index = newLeaderboard.findIndex((u) => u.id === payload.new.id);
          if (index >= 0) {
            newLeaderboard[index] = payload.new;
          } else {
            newLeaderboard.push(payload.new);
          }
          return newLeaderboard
            .sort((a, b) => b.net_worth - a.net_worth)
            .slice(0, limit);
        }
        return prev;
      });
    });

    return () => {
      db.unsubscribeAll();
    };
  }, [db, limit]);

  return {
    leaderboard,
    loading,
    error,
    refresh: async () => {
      setLoading(true);
      try {
        const { data } = await db.getLeaderboard(limit);
        setLeaderboard(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// TRANSACTIONS HOOK
// ============================================

export function useTransactions(userId?: string, limit: number = 50) {
  const db = useDatabaseClient();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const { data, error: fetchError } = await db.getUserTransactions(userId, limit);
        if (fetchError) {
          throw fetchError;
        }
        setTransactions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId, db, limit]);

  return {
    transactions,
    loading,
    error,
    refresh: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await db.getUserTransactions(userId, limit);
        setTransactions(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// SHOP HOOK
// ============================================

export function useShop() {
  const db = useDatabaseClient();
  const [items, setItems] = useState<ShopItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopItems = async () => {
      try {
        const { data, error: fetchError } = await db.getAllShopItems();
        if (fetchError) {
          throw fetchError;
        }
        setItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shop items');
      } finally {
        setLoading(false);
      }
    };

    fetchShopItems();
  }, [db]);

  // Get items by category
  const getItemsByCategory = useCallback(
    (category: string) => {
      return items.filter((item) => item.category === category);
    },
    [items]
  );

  return {
    items,
    loading,
    error,
    getItemsByCategory,
    refresh: async () => {
      setLoading(true);
      try {
        const { data } = await db.getAllShopItems();
        setItems(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// INVENTORY HOOK
// ============================================

export function useInventory(userId?: string) {
  const db = useDatabaseClient();
  const [inventory, setInventory] = useState<(InventoryRow & { shop_items: ShopItemRow })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    const fetchInventory = async () => {
      try {
        const { data, error: fetchError } = await db.getUserInventory(userId);
        if (fetchError) {
          throw fetchError;
        }
        setInventory(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [userId, db]);

  // Check if user has item
  const hasItem = useCallback(
    (itemId: string) => {
      return inventory.some((item) => item.item_id === itemId && item.quantity > 0);
    },
    [inventory]
  );

  // Check if user has active pass
  const hasActivePass = useCallback(
    (itemId: string) => {
      return inventory.some(
        (item) => item.item_id === itemId && item.quantity > 0 && item.is_active === true
      );
    },
    [inventory]
  );

  return {
    inventory,
    loading,
    error,
    hasItem,
    hasActivePass,
    refresh: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await db.getUserInventory(userId);
        setInventory(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// LOAN HOOK
// ============================================

export function useLoan(userId?: string) {
  const db = useDatabaseClient();
  const [loan, setLoan] = useState<LoanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoan(null);
      setLoading(false);
      return;
    }

    const fetchLoan = async () => {
      try {
        const { data, error: fetchError } = await db.getUserLoan(userId);
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        setLoan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch loan');
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [userId, db]);

  // Calculate interest accrued
  const interestAccrued = useMemo(() => {
    if (!loan) return 0;
    const hoursPassed = Math.floor(
      (new Date().getTime() - new Date(loan.taken_at).getTime()) / (1000 * 60 * 60)
    );
    return loan.amount * FINANCIAL_CONFIG.LOAN_INTEREST_RATE * Math.max(hoursPassed, 0);
  }, [loan]);

  // Calculate total due
  const totalDue = useMemo(() => {
    if (!loan) return 0;
    return loan.amount + interestAccrued;
  }, [loan, interestAccrued]);

  return {
    loan,
    loading,
    error,
    interestAccrued,
    totalDue,
    refresh: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await db.getUserLoan(userId);
        setLoan(data);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// NOTIFICATIONS HOOK
// ============================================

export function useNotifications(userId?: string, limit: number = 50) {
  const db = useDatabaseClient();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error: fetchError } = await db.getUserNotifications(userId, limit);
        if (fetchError) {
          throw fetchError;
        }
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    if (userId) {
      const subscription = db.subscribeToNotifications(userId, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications((prev) => [payload.new, ...prev].slice(0, limit));
          setUnreadCount((prev) => prev + 1);
        }
      });
    }

    return () => {
      db.unsubscribeAll();
    };
  }, [userId, db, limit]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await db.markNotificationAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [db]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const notification of unread) {
      await db.markNotificationAsRead(notification.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [db, notifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await db.getUserNotifications(userId, limit);
        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// MARKET EVENTS HOOK
// ============================================

export function useMarketEvents(limit: number = 100) {
  const db = useDatabaseClient();
  const [events, setEvents] = useState<MarketEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error: fetchError } = await db.getRecentMarketEvents(limit);
        if (fetchError) {
          throw fetchError;
        }
        setEvents(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [db, limit]);

  return {
    events,
    loading,
    error,
    refresh: async () => {
      setLoading(true);
      try {
        const { data } = await db.getRecentMarketEvents(limit);
        setEvents(data || []);
      } finally {
        setLoading(false);
      }
    },
  };
}

// ============================================
// LOCAL STORAGE HOOK
// ============================================

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignore errors
    }
  };

  return [storedValue, setValue];
}

// ============================================
// MEDIA QUERY HOOK
// ============================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// ============================================
// TOAST HOOK
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration: number = 5000) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ============================================
// EXPORT ALL HOOKS
// ============================================

export {
  useSupabaseClient,
  useDatabaseClient,
  useSession,
  useUser,
  useStocks,
  usePortfolio,
  useLeaderboard,
  useTransactions,
  useShop,
  useInventory,
  useLoan,
  useNotifications,
  useMarketEvents,
  useLocalStorage,
  useMediaQuery,
  useToast,
};
