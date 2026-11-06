// ============================================
// DATABASE TYPES - Generated from Supabase
// These match the tables used by the Discord bot
// ============================================

// ============================================
// USER & PROFILE TYPES
// ============================================

export interface UserProfileRow {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  cash: number;
  net_worth: number;
  loan_amount: number;
  loan_taken_at: string | null;
  last_interest_at: string | null;
  loan_payments_missed: number;
  total_earnings: number;
  total_spent: number;
  is_active: boolean;
  cosmetic_ids: string[];
  has_analyst_pass: boolean;
  is_liquidated: boolean;
  last_tax_at: string | null;
}

export interface UserProfileInsert {
  discord_id: string;
  username: string;
  discriminator: string;
  avatar?: string | null;
  cash?: number;
  net_worth?: number;
  loan_amount?: number;
  loan_taken_at?: string | null;
  last_interest_at?: string | null;
  loan_payments_missed?: number;
  total_earnings?: number;
  total_spent?: number;
  cosmetic_ids?: string[];
  has_analyst_pass?: boolean;
  is_liquidated?: boolean;
  last_tax_at?: string | null;
}

export interface UserProfileUpdate {
  cash?: number;
  net_worth?: number;
  loan_amount?: number;
  loan_taken_at?: string | null;
  last_interest_at?: string | null;
  loan_payments_missed?: number;
  total_earnings?: number;
  total_spent?: number;
  username?: string;
  discriminator?: string;
  avatar?: string | null;
  cosmetic_ids?: string[];
  has_analyst_pass?: boolean;
  is_liquidated?: boolean;
  last_tax_at?: string | null;
  updated_at?: string;
}

// ============================================
// STOCK TYPES
// ============================================

export type StockCategory = 'TECH' | 'MEME' | 'SAFE_HAVEN';
export type ManipulationType = 'PUMP' | 'DUMP' | null;

export interface StockRow {
  id: string;
  ticker: string;
  name: string;
  current_price: number;
  base_volatility: number;
  category: StockCategory;
  is_manipulated: boolean;
  manipulated_by: string | null;
  manipulated_type: ManipulationType;
  manipulated_at: string | null;
  last_price_update: string;
  volume_24h: number;
  market_cap: number;
  is_active: boolean;
  created_at: string;
}

export interface StockInsert {
  ticker: string;
  name: string;
  current_price: number;
  base_volatility: number;
  category: StockCategory;
  is_manipulated?: boolean;
  manipulated_by?: string | null;
  manipulated_type?: ManipulationType;
  manipulated_at?: string | null;
  volume_24h?: number;
  market_cap?: number;
  is_active?: boolean;
}

export interface StockUpdate {
  current_price?: number;
  base_volatility?: number;
  category?: StockCategory;
  is_manipulated?: boolean;
  manipulated_by?: string | null;
  manipulated_type?: ManipulationType;
  manipulated_at?: string | null;
  last_price_update?: string;
  volume_24h?: number;
  market_cap?: number;
  is_active?: boolean;
}

// ============================================
// PORTFOLIO TYPES
// ============================================

export interface PortfolioRow {
  id: string;
  user_id: string;
  stock_id: string;
  ticker: string;
  shares: number;
  average_price: number;
  total_invested: number;
  stop_loss_price: number | null;
  stop_loss_contract_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioInsert {
  user_id: string;
  stock_id: string;
  ticker: string;
  shares: number;
  average_price: number;
  total_invested: number;
  stop_loss_price?: number | null;
  stop_loss_contract_id?: string | null;
}

export interface PortfolioUpdate {
  shares?: number;
  average_price?: number;
  total_invested?: number;
  stop_loss_price?: number | null;
  stop_loss_contract_id?: string | null;
  updated_at?: string;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionType = 
  | 'BUY'
  | 'SELL'
  | 'LOAN_TAKE'
  | 'LOAN_REPAY'
  | 'INTEREST'
  | 'TAX'
  | 'LIQUIDATION'
  | 'BAILOUT'
  | 'STOP_LOSS';

export interface TransactionRow {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  ticker: string | null;
  shares: number | null;
  price: number | null;
  amount: number;
  fee: number;
  balance_after: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TransactionInsert {
  user_id: string;
  transaction_type: TransactionType;
  ticker?: string | null;
  shares?: number | null;
  price?: number | null;
  amount: number;
  fee?: number;
  balance_after: number;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// SHOP ITEM TYPES
// ============================================

export type ShopItemType = 
  | 'stop_loss_contract'
  | 'bailout_bond'
  | 'gold_bullion'
  | 'corporate_espionage_key'
  | 'analyst_terminal_pass'
  | 'whale_tracker_subscription'
  | 'pump_card'
  | 'dump_card'
  | 'tax_haven_registration'
  | 'animated_skin'
  | 'majority_shareholder_badge'
  | 'custom_leaderboard_title';

export type ShopItemCategory = 'PROTECTION' | 'INTELLIGENCE' | 'COSMETIC' | 'CHAOS';

export interface ShopItemRow {
  id: string;
  item_id: ShopItemType;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  is_consumable: boolean;
  is_active_pass: boolean;
  is_permanent: boolean;
  cooldown_hours: number | null;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ShopItemInsert {
  item_id: ShopItemType;
  name: string;
  description: string;
  price: number;
  category: ShopItemCategory;
  is_consumable?: boolean;
  is_active_pass?: boolean;
  is_permanent?: boolean;
  cooldown_hours?: number | null;
  max_uses?: number | null;
  is_active?: boolean;
}

// ============================================
// INVENTORY TYPES
// ============================================

export interface InventoryRow {
  id: string;
  user_id: string;
  shop_item_id: string;
  item_id: ShopItemType;
  quantity: number;
  purchased_at: string;
  last_used_at: string | null;
  uses_remaining: number | null;
  is_active: boolean;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface InventoryInsert {
  user_id: string;
  shop_item_id: string;
  item_id: ShopItemType;
  quantity: number;
  purchased_at?: string;
  last_used_at?: string | null;
  uses_remaining?: number | null;
  is_active?: boolean;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface InventoryUpdate {
  quantity?: number;
  last_used_at?: string | null;
  uses_remaining?: number | null;
  is_active?: boolean;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// MARKET EVENT TYPES
// ============================================

export type MarketEventType = 'PRICE_UPDATE' | 'BLACK_SWAN' | 'MANIPULATION' | 'CRASH' | 'PUMP';

export interface MarketEventRow {
  id: string;
  event_type: MarketEventType;
  ticker: string | null;
  old_price: number | null;
  new_price: number | null;
  change_percent: number | null;
  category: string | null;
  triggered_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MarketEventInsert {
  event_type: MarketEventType;
  ticker?: string | null;
  old_price?: number | null;
  new_price?: number | null;
  change_percent?: number | null;
  category?: string | null;
  triggered_by?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================
// LOAN TYPES
// ============================================

export interface LoanRow {
  id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  taken_at: string;
  due_at: string | null;
  repaid_at: string | null;
  total_interest_paid: number;
  is_active: boolean;
  created_at: string;
}

export interface LoanInsert {
  user_id: string;
  amount: number;
  interest_rate?: number;
  taken_at?: string;
  due_at?: string | null;
  repaid_at?: string | null;
  total_interest_paid?: number;
  is_active?: boolean;
}

export interface LoanUpdate {
  amount?: number;
  interest_rate?: number;
  due_at?: string | null;
  repaid_at?: string | null;
  total_interest_paid?: number;
  is_active?: boolean;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'WHALE_TRANSACTION'
  | 'STOP_LOSS_TRIGGERED'
  | 'BAILOUT_ACTIVATED'
  | 'LOAN_DUE'
  | 'TAX_PAID'
  | 'MARKET_CRASH'
  | 'MARKET_PUMP';

export interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  is_sent: boolean;
  created_at: string;
  sent_at: string | null;
}

export interface NotificationInsert {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  is_read?: boolean;
  is_sent?: boolean;
  sent_at?: string | null;
}

// ============================================
// MANIPULATION QUEUE TYPES
// ============================================

export interface ManipulationQueueRow {
  id: string;
  user_id: string;
  discord_id: string;
  ticker: string;
  manipulation_type: 'PUMP' | 'DUMP';
  amount: number;
  scheduled_for: string;
  executed_at: string | null;
  is_executed: boolean;
  created_at: string;
}

export interface ManipulationQueueInsert {
  user_id: string;
  discord_id: string;
  ticker: string;
  manipulation_type: 'PUMP' | 'DUMP';
  amount?: number;
  scheduled_for: string;
  executed_at?: string | null;
  is_executed?: boolean;
}

// ============================================
// DATABASE RESPONSE TYPES
// ============================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
  count: number | null;
}

export interface SupabaseRealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// SESSION & AUTH TYPES
// ============================================

export interface UserSession {
  user: {
    id: string;
    email: string | null;
    discord_id: string;
    username: string;
    avatar: string | null;
  };
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  guilds?: DiscordGuild[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
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
};
