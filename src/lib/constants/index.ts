// ============================================
// APPLICATION CONSTANTS
// ============================================

// ============================================
// MARKET CONFIGURATION
// ============================================

export const MARKET_CONFIG = {
  TICK_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  BASE_VOLATILITY_RANGE: { min: 0.01, max: 0.15 },
  RANDOM_SWING_RANGE: { min: -1.0, max: 1.0 },
  BLACK_SWAN_CHANCE: 0.02, // 2% chance per hour
  BLACK_SWAN_CRASH_RANGE: { min: 0.60, max: 0.80 }, // 60-80% crash
  BLACK_SWAN_GOLD_BOOST: 2.00, // 200% increase (3x)
  MANIPULATED_PRICE_CHANGE: 0.15, // 15% for Pump/Dump cards
  PRICE_UPDATE_THROTTLE: 1000, // 1 second throttle for realtime updates
} as const;

// ============================================
// FINANCIAL CONFIGURATION
// ============================================

export const FINANCIAL_CONFIG = {
  STARTER_CASH: 1000,
  LOAN_MAX_PERCENTAGE: 0.50, // 50% of net worth
  LOAN_INTEREST_RATE: 0.05, // 5% per hour
  LOAN_LIQUIDATION_HOURS: 24, // Liquidate after 24 hours unpaid
  HYPER_WEALTH_TAX_THRESHOLD: 1000000, // $1,000,000
  HYPER_WEALTH_TAX_RATE: 0.15, // 15%
  TAX_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24 hours
  STOP_LOSS_THRESHOLD: 0.20, // 20% drop
  BAILOUT_BOND_REIMBURSEMENT: 0.50, // 50% reimbursement
  WHALE_TRACKER_THRESHOLD: 500000, // $500,000
  TRANSACTION_FEE: 0, // No fees for now
} as const;

// ============================================
// STOCK CATEGORIES
// ============================================

export const STOCK_CATEGORIES = {
  TECH: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'],
  MEME: ['GME', 'AMC', 'BB', 'WSB', 'DOGE', 'SHIB'],
  SAFE_HAVEN: ['GOLD', 'SILVER', 'BTC'],
  ALL: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'GME', 'AMC', 'BB', 'WSB', 'DOGE', 'SHIB', 'GOLD', 'SILVER', 'BTC'],
} as const;

// ============================================
// SHOP ITEM TYPES
// ============================================

export const SHOP_ITEM_TYPES = {
  // Protection
  STOP_LOSS_CONTRACT: 'stop_loss_contract',
  BAILOUT_BOND: 'bailout_bond',
  GOLD_BULLION: 'gold_bullion',
  
  // Intelligence
  CORPORATE_ESPIONAGE_KEY: 'corporate_espionage_key',
  ANALYST_TERMINAL_PASS: 'analyst_terminal_pass',
  WHALE_TRACKER_SUBSCRIPTION: 'whale_tracker_subscription',
  
  // Chaos Cards
  PUMP_CARD: 'pump_card',
  DUMP_CARD: 'dump_card',
  TAX_HAVEN_REGISTRATION: 'tax_haven_registration',
  
  // Cosmetics
  ANIMATED_SKIN: 'animated_skin',
  MAJORITY_SHAREHOLDER_BADGE: 'majority_shareholder_badge',
  CUSTOM_LEADERBOARD_TITLE: 'custom_leaderboard_title',
} as const;

export type ShopItemType = typeof SHOP_ITEM_TYPES[keyof typeof SHOP_ITEM_TYPES];

// ============================================
// SHOP ITEM DEFINITIONS
// ============================================

export interface ShopItemDefinition {
  id: ShopItemType;
  name: string;
  description: string;
  price: number;
  category: 'PROTECTION' | 'INTELLIGENCE' | 'COSMETIC' | 'CHAOS';
  isConsumable: boolean;
  isActivePass: boolean;
  isPermanent: boolean;
  icon: string;
  color: string;
  maxUses?: number;
  cooldownHours?: number;
}

export const SHOP_ITEMS: ShopItemDefinition[] = [
  // Protection Items
  {
    id: SHOP_ITEM_TYPES.STOP_LOSS_CONTRACT,
    name: 'Stop-Loss Contract',
    description: 'Attaches to a stock. Automatically sells all shares if price drops more than 20%.',
    price: 500,
    category: 'PROTECTION',
    isConsumable: true,
    isActivePass: false,
    isPermanent: false,
    icon: 'shield-check',
    color: '#10B981',
    maxUses: 1,
  },
  {
    id: SHOP_ITEM_TYPES.BAILOUT_BOND,
    name: 'Bailout Bond',
    description: 'Receive 50% cash reimbursement on net-worth losses during Black Swan events.',
    price: 10000,
    category: 'PROTECTION',
    isConsumable: false,
    isActivePass: true,
    isPermanent: false,
    icon: 'lifebuoy',
    color: '#F59E0B',
  },
  {
    id: SHOP_ITEM_TYPES.GOLD_BULLION,
    name: 'Gold Bullion',
    description: 'Stable commodity asset. Price remains fixed and is immune to market crashes.',
    price: 2000,
    category: 'PROTECTION',
    isConsumable: false,
    isActivePass: true,
    isPermanent: false,
    icon: 'package',
    color: '#FBBF24',
  },
  
  // Intelligence Items
  {
    id: SHOP_ITEM_TYPES.CORPORATE_ESPIONAGE_KEY,
    name: 'Corporate Espionage Key',
    description: 'Single-use item. Reveals a stock\'s hidden base volatility value.',
    price: 1000,
    category: 'INTELLIGENCE',
    isConsumable: true,
    isActivePass: false,
    isPermanent: false,
    icon: 'eye',
    color: '#8B5CF6',
    maxUses: 1,
  },
  {
    id: SHOP_ITEM_TYPES.ANALYST_TERMINAL_PASS,
    name: 'Analyst Terminal Pass',
    description: 'Permanent access to advanced database queries and premium UI data tabs.',
    price: 5000,
    category: 'INTELLIGENCE',
    isConsumable: false,
    isActivePass: true,
    isPermanent: true,
    icon: 'terminal',
    color: '#06B6D4',
  },
  {
    id: SHOP_ITEM_TYPES.WHALE_TRACKER_SUBSCRIPTION,
    name: 'Whale Tracker Subscription',
    description: 'Receive Discord DM notifications when any user executes a transaction over $500,000.',
    price: 2000,
    category: 'INTELLIGENCE',
    isConsumable: false,
    isActivePass: true,
    isPermanent: false,
    icon: 'bell',
    color: '#EF4444',
  },
  
  // Chaos Cards
  {
    id: SHOP_ITEM_TYPES.PUMP_CARD,
    name: 'Pump Card',
    description: 'Instantly force a chosen ticker to rise by 15% on the next market tick.',
    price: 5000,
    category: 'CHAOS',
    isConsumable: true,
    isActivePass: false,
    isPermanent: false,
    icon: 'trending-up',
    color: '#10B981',
    maxUses: 1,
  },
  {
    id: SHOP_ITEM_TYPES.DUMP_CARD,
    name: 'Dump Card',
    description: 'Instantly force a chosen ticker to drop by 15% on the next market tick.',
    price: 5000,
    category: 'CHAOS',
    isConsumable: true,
    isActivePass: false,
    isPermanent: false,
    icon: 'trending-down',
    color: '#EF4444',
    maxUses: 1,
  },
  {
    id: SHOP_ITEM_TYPES.TAX_HAVEN_REGISTRATION,
    name: 'Tax Haven Registration',
    description: 'Completely skip the 24-hour progressive 15% hyper-wealth tax execution.',
    price: 25000,
    category: 'CHAOS',
    isConsumable: false,
    isActivePass: true,
    isPermanent: false,
    icon: 'building',
    color: '#8B5CF6',
  },
  
  // Cosmetics
  {
    id: SHOP_ITEM_TYPES.ANIMATED_SKIN,
    name: 'Animated Profile Skin',
    description: 'Custom animated border for your profile.',
    price: 1000,
    category: 'COSMETIC',
    isConsumable: false,
    isActivePass: false,
    isPermanent: true,
    icon: 'sparkles',
    color: '#F59E0B',
  },
  {
    id: SHOP_ITEM_TYPES.MAJORITY_SHAREHOLDER_BADGE,
    name: 'Majority Shareholder Badge',
    description: 'Special badge shown when you own >50% of any stock.',
    price: 2000,
    category: 'COSMETIC',
    isConsumable: false,
    isActivePass: false,
    isPermanent: true,
    icon: 'award',
    color: '#FBBF24',
  },
  {
    id: SHOP_ITEM_TYPES.CUSTOM_LEADERBOARD_TITLE,
    name: 'Custom Leaderboard Title',
    description: 'Set a custom title that appears next to your name on the leaderboard.',
    price: 1500,
    category: 'COSMETIC',
    isConsumable: false,
    isActivePass: false,
    isPermanent: true,
    icon: 'crown',
    color: '#8B5CF6',
  },
];

// ============================================
// API CONFIGURATION
// ============================================

export const API_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  // Cache
  CACHE: {
    STOCKS_TTL: 5, // 5 seconds
    PORTFOLIO_TTL: 10, // 10 seconds
    LEADERBOARD_TTL: 30, // 30 seconds
  },
} as const;

// ============================================
// UI CONFIGURATION
// ============================================

export const UI_CONFIG = {
  // Colors
  COLORS: {
    PRIMARY: '#4B0082',
    PRIMARY_LIGHT: '#7a44b8',
    PRIMARY_DARK: '#3a0068',
    SURFACE_WHITE: '#FFFFFF',
    SURFACE_50: '#F9FAFB',
    SURFACE_100: '#F3F4F6',
    SURFACE_200: '#E5E7EB',
    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#4B5563',
    TEXT_MUTED: '#9CA3AF',
    BORDER_LIGHT: '#E5E7EB',
    SUCCESS: '#10B981',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#3B82F6',
  },
  
  // Breakpoints
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },
  
  // Sidebar
  SIDEBAR: {
    WIDTH: 250,
    COLLAPSED_WIDTH: 80,
  },
  
  // Header
  HEADER: {
    HEIGHT: 64,
  },
} as const;

// ============================================
// STORAGE CONFIGURATION
// ============================================

export const STORAGE_CONFIG = {
  BUCKETS: {
    SHOP_ASSETS: 'shop-assets',
    PROFILE_PICTURES: 'profile-pictures',
    COSMETICS: 'cosmetics',
  },
  
  // File size limits
  FILE_SIZES: {
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_ASSET_SIZE: 10 * 1024 * 1024, // 10MB
  },
  
  // Allowed file types
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    ANIMATIONS: ['image/gif', 'image/apng'],
  },
} as const;

// ============================================
// REALTIME CONFIGURATION
// ============================================

export const REALTIME_CONFIG = {
  // Channels
  CHANNELS: {
    STOCKS: 'stocks',
    LEADERBOARD: 'leaderboard',
    PORTFOLIO: (userId: string) => `portfolio:${userId}`,
    NOTIFICATIONS: (userId: string) => `notifications:${userId}`,
  },
  
  // Event types
  EVENTS: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ALL: '*',
  },
  
  // Throttling
  THROTTLE: {
    STOCKS: 1000, // 1 second
    LEADERBOARD: 5000, // 5 seconds
    PORTFOLIO: 100, // 100ms
  },
} as const;

// ============================================
// EDGE FUNCTION CONFIGURATION
// ============================================

export const EDGE_FUNCTION_CONFIG = {
  // Loan interest
  LOAN_INTEREST: {
    SCHEDULE: '0 * * * *', // Every hour
    FUNCTION_NAME: 'loan-interest',
  },
  
  // Wealth tax
  WEALTH_TAX: {
    SCHEDULE: '0 0 * * *', // Every day at midnight UTC
    FUNCTION_NAME: 'wealth-tax',
  },
  
  // Market sync
  MARKET_SYNC: {
    SCHEDULE: '*/5 * * * *', // Every 5 minutes
    FUNCTION_NAME: 'market-sync',
  },
} as const;

// ============================================
// EXPORT ALL
// ============================================

export {
  MARKET_CONFIG,
  FINANCIAL_CONFIG,
  STOCK_CATEGORIES,
  SHOP_ITEM_TYPES,
  SHOP_ITEMS,
  API_CONFIG,
  UI_CONFIG,
  STORAGE_CONFIG,
  REALTIME_CONFIG,
  EDGE_FUNCTION_CONFIG,
};
