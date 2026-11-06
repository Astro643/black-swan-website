// ============================================
// ORDER FORM COMPONENT
// Form for buying and selling stocks
// ============================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency, isValidTicker, isValidShares, isPositiveNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserProfileRow, PortfolioRow, StockRow } from '@/types/database';

// ============================================
// ORDER FORM PROPS
// ============================================

interface OrderFormProps {
  profile: UserProfileRow;
  stocks: StockRow[];
  portfolio: PortfolioRow[];
}

// ============================================
// ORDER TYPE
// ============================================

type OrderType = 'buy' | 'sell';

// ============================================
// ORDER FORM COMPONENT
// ============================================

export function OrderForm({ profile, stocks, portfolio }: OrderFormProps) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [shares, setShares] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ============================================
  // SELECTED STOCK
  // ============================================

  const selectedStock = useMemo(() => {
    return stocks.find(s => s.ticker === selectedTicker.toUpperCase());
  }, [selectedTicker, stocks]);

  // ============================================
  // USER'S POSITION IN SELECTED STOCK
  // ============================================

  const userPosition = useMemo(() => {
    return portfolio.find(p => p.ticker === selectedTicker.toUpperCase());
  }, [selectedTicker, portfolio]);

  // ============================================
  // CALCULATE ORDER DETAILS
  // ============================================

  const orderTotal = useMemo(() => {
    if (!selectedStock) return 0;
    return selectedStock.current_price * shares;
  }, [selectedStock, shares]);

  const maxBuyShares = useMemo(() => {
    if (!selectedStock || profile.cash <= 0) return 0;
    return Math.floor(profile.cash / selectedStock.current_price);
  }, [selectedStock, profile.cash]);

  const canSubmit = useMemo(() => {
    if (!selectedStock || !isValidTicker(selectedTicker)) return false;
    if (shares <= 0 || !Number.isInteger(shares)) return false;
    
    if (orderType === 'buy') {
      return orderTotal <= profile.cash && shares <= maxBuyShares;
    } else {
      return userPosition && shares <= userPosition.shares;
    }
  }, [selectedStock, selectedTicker, shares, orderTotal, profile.cash, maxBuyShares, orderType, userPosition]);

  // ============================================
  // HANDLE TICKER SELECT
  // ============================================

  const handleTickerSelect = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
    setError(null);
    setSuccess(null);
  }, []);

  // ============================================
  // HANDLE ORDER SUBMIT
  // ============================================

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit || !selectedStock) {
      setError('Please fill in all fields correctly');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = orderType === 'buy' ? '/api/portfolio' : '/api/portfolio?action=sell';
      const method = orderType === 'buy' ? 'POST' : 'DELETE';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: selectedTicker.toUpperCase(),
          shares,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Order failed');
      }

      setSuccess(`Order successful! ${orderType === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${selectedTicker}`);
      
      // Reset form
      setShares(1);
      
      // Refresh page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, selectedStock, selectedTicker, shares, orderType, router]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Form</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Order Type Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={orderType === 'buy' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              orderType === 'buy' ? 'bg-primary' : 'border-primary/30'
            )}
            onClick={() => {
              setOrderType('buy');
              setError(null);
              setSuccess(null);
            }}
          >
            Buy
          </Button>
          <Button
            variant={orderType === 'sell' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              orderType === 'sell' ? 'bg-danger' : 'border-danger/30 text-danger'
            )}
            onClick={() => {
              setOrderType('sell');
              setError(null);
              setSuccess(null);
            }}
          >
            Sell
          </Button>
        </div>

        {/* Stock Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Stock Ticker
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker (e.g., AAPL)"
              className="w-full p-3 border border-border-light rounded-lg bg-surface-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            
            {/* Suggestions dropdown */}
            {selectedTicker.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-white border border-border-light rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                {stocks
                  .filter(s => 
                    s.ticker.toLowerCase().includes(selectedTicker.toLowerCase()) &&
                    s.ticker !== selectedTicker.toUpperCase()
                  )
                  .slice(0, 5)
                  .map((stock) => (
                    <button
                      key={stock.ticker}
                      onClick={() => handleTickerSelect(stock.ticker)}
                      className="w-full p-3 text-left hover:bg-surface-50 flex items-center gap-3"
                    >
                      <span className="font-bold text-primary">{stock.ticker}</span>
                      <span className="text-sm text-text-secondary">{stock.name}</span>
                      <span className="ml-auto text-sm text-text-muted">
                        {formatCurrency(stock.current_price)}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Stock Info */}
        {selectedStock && (
          <div className="p-4 bg-surface-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-primary">{selectedStock.ticker}</p>
                <p className="text-sm text-text-secondary">{selectedStock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-text-primary">
                  {formatCurrency(selectedStock.current_price)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {selectedStock.category}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Shares Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Shares
          </label>
          <div className="relative">
            <input
              type="number"
              value={shares}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setShares(Math.max(1, value));
              }}
              min="1"
              className="w-full p-3 border border-border-light rounded-lg bg-surface-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            
            {/* Max button */}
            {orderType === 'buy' && selectedStock && (
              <button
                type="button"
                onClick={() => setShares(maxBuyShares)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-dark"
              >
                Max: {maxBuyShares}
              </button>
            )}
            
            {orderType === 'sell' && userPosition && (
              <button
                type="button"
                onClick={() => setShares(userPosition.shares)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-dark"
              >
                Max: {userPosition.shares}
              </button>
            )}
          </div>
          
          {/* Available shares info for sell */}
          {orderType === 'sell' && userPosition && (
            <p className="text-xs text-text-muted mt-1">
              Available: {userPosition.shares} shares
            </p>
          )}
        </div>

        {/* Order Summary */}
        {selectedStock && shares > 0 && (
          <div className="p-4 bg-surface-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Order Total</span>
              <span className="font-bold text-primary">
                {formatCurrency(orderTotal)}
              </span>
            </div>
            
            {orderType === 'buy' && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-text-muted">Available Cash</span>
                <span className={cn(
                  'font-bold',
                  profile.cash >= orderTotal ? 'text-success' : 'text-danger'
                )}>
                  {formatCurrency(profile.cash)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-danger/10 text-danger rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-success/10 text-success rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Processing...
            </span>
          ) : (
            `${orderType === 'buy' ? 'Buy' : 'Sell'} ${selectedTicker || 'Stock'}`
          )}
        </Button>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[1, 10, 100].map((value) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setShares(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
