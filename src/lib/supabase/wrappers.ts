import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  UserProfileRow,
  UserProfileInsert,
  UserProfileUpdate,
  StockRow,
  StockInsert,
  StockUpdate,
  PortfolioRow,
  PortfolioInsert,
  PortfolioUpdate,
  TransactionRow,
  TransactionInsert,
  ShopItemRow,
  ShopItemInsert,
  InventoryRow,
  InventoryInsert,
  InventoryUpdate,
  MarketEventRow,
  MarketEventInsert,
  LoanRow,
  LoanInsert,
  LoanUpdate,
  NotificationRow,
  NotificationInsert,
  ManipulationQueueRow,
  ManipulationQueueInsert,
  SupabaseResponse,
} from '@/types/database';

// ============================================
// DATABASE CLIENT WRAPPER
// Provides typed database operations
// ============================================

class DatabaseClient {
  private client: ReturnType<typeof createClient>;
  private isServer: boolean;

  constructor(client?: ReturnType<typeof createClient>, isServer: boolean = false) {
    this.client = client || this.createClient();
    this.isServer = isServer;
  }

  private createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // ============================================
  // USER PROFILE OPERATIONS
  // ============================================

  async getUserProfile(discordId: string): Promise<SupabaseResponse<UserProfileRow>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('discord_id', discordId)
      .single();
    
    return { data, error, count };
  }

  async getUserProfileById(id: string): Promise<SupabaseResponse<UserProfileRow>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error, count };
  }

  async createUserProfile(profile: UserProfileInsert): Promise<SupabaseResponse<UserProfileRow>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    return { data, error, count };
  }

  async updateUserProfile(id: string, updates: UserProfileUpdate): Promise<SupabaseResponse<UserProfileRow>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async updateUserCash(id: string, amount: number): Promise<SupabaseResponse<UserProfileRow>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .update({
        cash: this.client.rpc('increment', { amount, column: 'cash' }),
        net_worth: this.client.rpc('increment', { amount, column: 'net_worth' }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    // Fallback for raw SQL
    if (error) {
      const { data: profile } = await this.getUserProfileById(id);
      if (profile) {
        const newCash = profile.cash + amount;
        const newNetWorth = profile.net_worth + amount;
        const result = await this.updateUserProfile(id, {
          cash: newCash,
          net_worth: newNetWorth,
          updated_at: new Date().toISOString(),
        });
        return result;
      }
    }
    
    return { data, error, count };
  }

  async getLeaderboard(limit: number = 10): Promise<SupabaseResponse<UserProfileRow[]>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .select('*')
      .order('net_worth', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  async searchUsers(query: string, limit: number = 10): Promise<SupabaseResponse<UserProfileRow[]>> {
    const { data, error, count } = await this.client
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${query}%,discord_id.eq.${query}`)
      .order('net_worth', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  // ============================================
  // STOCK OPERATIONS
  // ============================================

  async getAllStocks(): Promise<SupabaseResponse<StockRow[]>> {
    const { data, error, count } = await this.client
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .order('ticker', { ascending: true });
    
    return { data, error, count };
  }

  async getStockByTicker(ticker: string): Promise<SupabaseResponse<StockRow>> {
    const { data, error, count } = await this.client
      .from('stocks')
      .select('*')
      .eq('ticker', ticker)
      .single();
    
    return { data, error, count };
  }

  async getStocksByCategory(category: string): Promise<SupabaseResponse<StockRow[]>> {
    const { data, error, count } = await this.client
      .from('stocks')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('ticker', { ascending: true });
    
    return { data, error, count };
  }

  async updateStockPrice(id: string, newPrice: number): Promise<SupabaseResponse<StockRow>> {
    const { data, error, count } = await this.client
      .from('stocks')
      .update({
        current_price: newPrice,
        last_price_update: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async batchUpdateStockPrices(updates: { id: string; newPrice: number }[]): Promise<SupabaseResponse<StockRow[]>> {
    const { data, error, count } = await this.client
      .from('stocks')
      .upsert(
        updates.map(update => ({
          id: update.id,
          current_price: update.newPrice,
          last_price_update: new Date().toISOString(),
        }))
      )
      .select();
    
    return { data, error, count };
  }

  async getStockHistory(ticker: string, limit: number = 100): Promise<SupabaseResponse<MarketEventRow[]>> {
    const { data, error, count } = await this.client
      .from('market_events')
      .select('*')
      .eq('ticker', ticker)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  // ============================================
  // PORTFOLIO OPERATIONS
  // ============================================

  async getPortfolio(userId: string): Promise<SupabaseResponse<PortfolioRow[]>> {
    const { data, error, count } = await this.client
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('ticker', { ascending: true });
    
    return { data, error, count };
  }

  async getPortfolioPosition(userId: string, ticker: string): Promise<SupabaseResponse<PortfolioRow>> {
    const { data, error, count } = await this.client
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('ticker', ticker)
      .single();
    
    return { data, error, count };
  }

  async createPortfolioPosition(position: PortfolioInsert): Promise<SupabaseResponse<PortfolioRow>> {
    const { data, error, count } = await this.client
      .from('portfolios')
      .insert(position)
      .select()
      .single();
    
    return { data, error, count };
  }

  async updatePortfolioPosition(id: string, updates: PortfolioUpdate): Promise<SupabaseResponse<PortfolioRow>> {
    const { data, error, count } = await this.client
      .from('portfolios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async deletePortfolioPosition(id: string): Promise<SupabaseResponse<PortfolioRow>> {
    const { data, error, count } = await this.client
      .from('portfolios')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async getPortfolioValue(userId: string): Promise<number> {
    const { data: portfolio, error } = await this.getPortfolio(userId);
    
    if (error || !portfolio) {
      return 0;
    }
    
    const { data: stocks } = await this.getAllStocks();
    
    if (!stocks) {
      return 0;
    }
    
    let totalValue = 0;
    for (const position of portfolio) {
      const stock = stocks.find(s => s.ticker === position.ticker);
      if (stock) {
        totalValue += position.shares * stock.current_price;
      }
    }
    
    return totalValue;
  }

  // ============================================
  // TRANSACTION OPERATIONS
  // ============================================

  async createTransaction(transaction: TransactionInsert): Promise<SupabaseResponse<TransactionRow>> {
    const { data, error, count } = await this.client
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    return { data, error, count };
  }

  async getUserTransactions(userId: string, limit: number = 50): Promise<SupabaseResponse<TransactionRow[]>> {
    const { data, error, count } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  async getRecentTransactions(limit: number = 100): Promise<SupabaseResponse<TransactionRow[]>> {
    const { data, error, count } = await this.client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  async getWhaleTransactions(threshold: number = 500000): Promise<SupabaseResponse<TransactionRow[]>> {
    const { data, error, count } = await this.client
      .from('transactions')
      .select('*, user_profiles!inner(username, discord_id, avatar)')
      .gte('amount', threshold)
      .order('created_at', { ascending: false })
      .limit(100);
    
    return { data, error, count };
  }

  // ============================================
  // SHOP OPERATIONS
  // ============================================

  async getAllShopItems(): Promise<SupabaseResponse<ShopItemRow[]>> {
    const { data, error, count } = await this.client
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    return { data, error, count };
  }

  async getShopItemById(id: string): Promise<SupabaseResponse<ShopItemRow>> {
    const { data, error, count } = await this.client
      .from('shop_items')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error, count };
  }

  async getShopItemsByCategory(category: string): Promise<SupabaseResponse<ShopItemRow[]>> {
    const { data, error, count } = await this.client
      .from('shop_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    return { data, error, count };
  }

  // ============================================
  // INVENTORY OPERATIONS
  // ============================================

  async getUserInventory(userId: string): Promise<SupabaseResponse<InventoryRow[]>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .select('*, shop_items!inner(*)')
      .eq('user_id', userId)
      .order('item_id', { ascending: true });
    
    return { data, error, count };
  }

  async getInventoryItem(userId: string, itemId: string): Promise<SupabaseResponse<InventoryRow>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .select('*, shop_items!inner(*)')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();
    
    return { data, error, count };
  }

  async addToInventory(item: InventoryInsert): Promise<SupabaseResponse<InventoryRow>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .insert(item)
      .select()
      .single();
    
    return { data, error, count };
  }

  async updateInventoryItem(id: string, updates: InventoryUpdate): Promise<SupabaseResponse<InventoryRow>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async removeFromInventory(id: string): Promise<SupabaseResponse<InventoryRow>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async consumeInventoryItem(id: string): Promise<SupabaseResponse<InventoryRow>> {
    const { data, error, count } = await this.client
      .from('inventories')
      .update({
        quantity: this.client.rpc('decrement', { amount: 1, column: 'quantity' }),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  async hasItem(userId: string, itemId: string): Promise<boolean> {
    const { data, error } = await this.getInventoryItem(userId, itemId);
    return !!data && data.quantity > 0;
  }

  async hasActivePass(userId: string, itemId: string): Promise<boolean> {
    const { data, error } = await this.getInventoryItem(userId, itemId);
    return !!data && data.quantity > 0 && data.is_active === true;
  }

  // ============================================
  // LOAN OPERATIONS
  // ============================================

  async getUserLoan(userId: string): Promise<SupabaseResponse<LoanRow>> {
    const { data, error, count } = await this.client
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .single();
    
    return { data, error, count };
  }

  async getAllLoans(userId: string): Promise<SupabaseResponse<LoanRow[]>> {
    const { data, error, count } = await this.client
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error, count };
  }

  async createLoan(loan: LoanInsert): Promise<SupabaseResponse<LoanRow>> {
    const { data, error, count } = await this.client
      .from('loans')
      .insert(loan)
      .select()
      .single();
    
    return { data, error, count };
  }

  async updateLoan(id: string, updates: LoanUpdate): Promise<SupabaseResponse<LoanRow>> {
    const { data, error, count } = await this.client
      .from('loans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  // ============================================
  // MARKET EVENT OPERATIONS
  // ============================================

  async createMarketEvent(event: MarketEventInsert): Promise<SupabaseResponse<MarketEventRow>> {
    const { data, error, count } = await this.client
      .from('market_events')
      .insert(event)
      .select()
      .single();
    
    return { data, error, count };
  }

  async getRecentMarketEvents(limit: number = 100): Promise<SupabaseResponse<MarketEventRow[]>> {
    const { data, error, count } = await this.client
      .from('market_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  // ============================================
  // NOTIFICATION OPERATIONS
  // ============================================

  async createNotification(notification: NotificationInsert): Promise<SupabaseResponse<NotificationRow>> {
    const { data, error, count } = await this.client
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    return { data, error, count };
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<SupabaseResponse<NotificationRow[]>> {
    const { data, error, count } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error, count };
  }

  async markNotificationAsRead(id: string): Promise<SupabaseResponse<NotificationRow>> {
    const { data, error, count } = await this.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  // ============================================
  // MANIPULATION QUEUE OPERATIONS
  // ============================================

  async createManipulation(manipulation: ManipulationQueueInsert): Promise<SupabaseResponse<ManipulationQueueRow>> {
    const { data, error, count } = await this.client
      .from('manipulation_queue')
      .insert(manipulation)
      .select()
      .single();
    
    return { data, error, count };
  }

  async getPendingManipulations(): Promise<SupabaseResponse<ManipulationQueueRow[]>> {
    const { data, error, count } = await this.client
      .from('manipulation_queue')
      .select('*')
      .eq('is_executed', false)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });
    
    return { data, error, count };
  }

  async markManipulationAsExecuted(id: string): Promise<SupabaseResponse<ManipulationQueueRow>> {
    const { data, error, count } = await this.client
      .from('manipulation_queue')
      .update({
        is_executed: true,
        executed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error, count };
  }

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  subscribeToStocks(callback: (payload: any) => void) {
    return this.client
      .channel('stocks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks',
        },
        callback
      )
      .subscribe();
  }

  subscribeToLeaderboard(callback: (payload: any) => void) {
    return this.client
      .channel('leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        callback
      )
      .subscribe();
  }

  subscribeToPortfolio(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`portfolio:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  unsubscribeAll() {
    this.client.removeAllChannels();
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create a client-side database client
 */
export const createDatabaseClient = () => {
  return new DatabaseClient();
};

/**
 * Create a server-side database client
 */
export const createServerDatabaseClient = () => {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({
    cookies: () => cookieStore,
  });
  return new DatabaseClient(supabase, true);
};

/**
 * Singleton client for server components
 */
export const db = new DatabaseClient();

// ============================================
// EXPORT
// ============================================

export { DatabaseClient };
