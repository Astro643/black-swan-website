// ============================================
// UTILITY FUNCTIONS
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MARKET_CONFIG, FINANCIAL_CONFIG, STOCK_CATEGORIES } from '../constants';
import type { StockRow, PortfolioRow, UserProfileRow, TransactionRow } from '@/types/database';

// ============================================
// TAILWIND MERGE
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(d);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  return formatDate(d, { month: 'short', day: 'numeric' });
}

/**
 * Format stock ticker
 */
export function formatTicker(ticker: string): string {
  return ticker.toUpperCase();
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

// ============================================
// CALCULATION UTILITIES
// ============================================

/**
 * Calculate price change percentage
 */
export function calculateChangePercent(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Calculate profit/loss
 */
export function calculateProfitLoss(position: PortfolioRow, currentPrice: number): number {
  return position.shares * (currentPrice - position.average_price);
}

/**
 * Calculate profit/loss percentage
 */
export function calculateProfitLossPercent(position: PortfolioRow, currentPrice: number): number {
  const pnl = calculateProfitLoss(position, currentPrice);
  if (position.total_invested === 0) return 0;
  return (pnl / position.total_invested) * 100;
}

/**
 * Calculate portfolio total value
 */
export function calculatePortfolioValue(portfolio: PortfolioRow[], stocks: StockRow[]): number {
  return portfolio.reduce((total, position) => {
    const stock = stocks.find(s => s.ticker === position.ticker);
    if (stock) {
      return total + (position.shares * stock.current_price);
    }
    return total;
  }, 0);
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(user: UserProfileRow, portfolio: PortfolioRow[], stocks: StockRow[]): number {
  const portfolioValue = calculatePortfolioValue(portfolio, stocks);
  return user.cash + portfolioValue - user.loan_amount;
}

/**
 * Calculate total invested
 */
export function calculateTotalInvested(portfolio: PortfolioRow[]): number {
  return portfolio.reduce((total, position) => total + position.total_invested, 0);
}

/**
 * Calculate total profit/loss
 */
export function calculateTotalProfitLoss(portfolio: PortfolioRow[], stocks: StockRow[]): number {
  const portfolioValue = calculatePortfolioValue(portfolio, stocks);
  const totalInvested = calculateTotalInvested(portfolio);
  return portfolioValue - totalInvested;
}

/**
 * Calculate loan interest
 */
export function calculateLoanInterest(loanAmount: number, hours: number = 1): number {
  return loanAmount * FINANCIAL_CONFIG.LOAN_INTEREST_RATE * hours;
}

/**
 * Calculate tax amount
 */
export function calculateTaxAmount(cash: number): number {
  if (cash <= FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD) {
    return 0;
  }
  const taxableAmount = cash - FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD;
  return taxableAmount * FINANCIAL_CONFIG.HYPER_WEALTH_TAX_RATE;
}

/**
 * Calculate max loan amount
 */
export function calculateMaxLoanAmount(netWorth: number): number {
  return netWorth * FINANCIAL_CONFIG.LOAN_MAX_PERCENTAGE;
}

// ============================================
// STOCK UTILITIES
// ============================================

/**
 * Get stock category color
 */
export function getStockCategoryColor(category: string): string {
  switch (category) {
    case 'TECH':
      return '#06B6D4';
    case 'MEME':
      return '#F59E0B';
    case 'SAFE_HAVEN':
      return '#FBBF24';
    default:
      return '#4B0082';
  }
}

/**
 * Get stock category label
 */
export function getStockCategoryLabel(category: string): string {
  switch (category) {
    case 'TECH':
      return 'Tech';
    case 'MEME':
      return 'Meme';
    case 'SAFE_HAVEN':
      return 'Safe Haven';
    default:
      return category;
  }
}

/**
 * Get change color based on value
 */
export function getChangeColor(change: number): string {
  if (change > 0) return '#10B981';
  if (change < 0) return '#EF4444';
  return '#9CA3AF';
}

/**
 * Get change icon based on value
 */
export function getChangeIcon(change: number): string {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

/**
 * Get trend color based on percentage
 */
export function getTrendColor(percent: number): string {
  if (percent > 5) return '#10B981';
  if (percent > 0) return '#34D399';
  if (percent < -5) return '#EF4444';
  if (percent < 0) return '#F87171';
  return '#9CA3AF';
}

// ============================================
// TRANSACTION UTILITIES
// ============================================

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case 'BUY':
      return 'Buy';
    case 'SELL':
      return 'Sell';
    case 'LOAN_TAKE':
      return 'Loan Taken';
    case 'LOAN_REPAY':
      return 'Loan Repaid';
    case 'INTEREST':
      return 'Interest';
    case 'TAX':
      return 'Tax';
    case 'LIQUIDATION':
      return 'Liquidation';
    case 'BAILOUT':
      return 'Bailout';
    case 'STOP_LOSS':
      return 'Stop Loss';
    default:
      return type;
  }
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'BUY':
      return '#10B981';
    case 'SELL':
      return '#EF4444';
    case 'LOAN_TAKE':
      return '#F59E0B';
    case 'LOAN_REPAY':
      return '#3B82F6';
    case 'INTEREST':
      return '#8B5CF6';
    case 'TAX':
      return '#6B7280';
    case 'LIQUIDATION':
      return '#EF4444';
    case 'BAILOUT':
      return '#10B981';
    case 'STOP_LOSS':
      return '#F59E0B';
    default:
      return '#9CA3AF';
  }
}

/**
 * Get transaction icon
 */
export function getTransactionIcon(type: string): string {
  switch (type) {
    case 'BUY':
      return 'trending-up';
    case 'SELL':
      return 'trending-down';
    case 'LOAN_TAKE':
      return 'plus-circle';
    case 'LOAN_REPAY':
      return 'minus-circle';
    case 'INTEREST':
      return 'clock';
    case 'TAX':
      return 'receipt-tax';
    case 'LIQUIDATION':
      return 'exclamation-triangle';
    case 'BAILOUT':
      return 'lifebuoy';
    case 'STOP_LOSS':
      return 'shield-exclamation';
    default:
      return 'arrow-path';
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate ticker
 */
export function isValidTicker(ticker: string): boolean {
  const clean = ticker.toUpperCase().trim();
  return /^[A-Z]{1,10}$/.test(clean) && STOCK_CATEGORIES.ALL.includes(clean);
}

/**
 * Validate shares amount
 */
export function isValidShares(shares: number): boolean {
  return Number.isInteger(shares) && shares > 0 && shares <= 1000000;
}

/**
 * Validate amount
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000000000;
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Format error message
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'An unknown error occurred';
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, code: number = 400) {
  return {
    success: false,
    error: message,
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

/**
 * Get from local storage
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set to local storage
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore errors
  }
}

/**
 * Remove from local storage
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Chunk array
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Group by key
 */
export function groupBy<T, K extends keyof any>(array: T[], key: (item: T) => K): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = key(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Sum by key
 */
export function sumBy<T>(array: T[], key: (item: T) => number): number {
  return array.reduce((sum, item) => sum + key(item), 0);
}

// ============================================
// EXPORT
// ============================================

export {
  MARKET_CONFIG,
  FINANCIAL_CONFIG,
  STOCK_CATEGORIES,
};
