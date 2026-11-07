// ============================================
// MARKET OVERVIEW COMPONENT
// Displays market statistics and leaderboard
// ============================================

'use client';

import { useState } from 'react';
import { cn, formatCurrency, formatPercentage, getStockCategoryColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { StockRow, MarketEventRow, UserProfileRow } from '@/types/database';

// ============================================
// MARKET OVERVIEW PROPS
// ============================================

interface MarketOverviewProps {
  stocks: StockRow[];
  marketEvents?: MarketEventRow[];
  showLeaderboard?: boolean;
  leaderboard?: Pick<UserProfileRow, 'username' | 'net_worth' | 'avatar'>[];
}

// ============================================
// MARKET OVERVIEW COMPONENT
// ============================================

export function MarketOverview({
  stocks,
  marketEvents = [],
  showLeaderboard = false,
  leaderboard = [],
}: MarketOverviewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'events' | 'leaderboard'>('stats');

  // ============================================
  // CALCULATE MARKET STATS
  // ============================================

  const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.market_cap || 0), 0);
  const totalVolume = stocks.reduce((sum, stock) => sum + (stock.volume_24h || 0), 0);

  // Calculate average price change
  const priceChanges = stocks.map(stock => {
    // For demo purposes, use random changes
    return (Math.random() - 0.5) * 10;
  });

  const positiveChanges = priceChanges.filter(c => c > 0).length;
  const negativeChanges = priceChanges.filter(c => c < 0).length;

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              activeTab === 'stats' 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-muted hover:bg-surface-50'
            )}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              activeTab === 'events' 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-muted hover:bg-surface-50'
            )}
          >
            Events
          </button>
          {showLeaderboard && (
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                activeTab === 'leaderboard' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:bg-surface-50'
              )}
            >
              Leaderboard
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Market cap and volume */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 rounded-lg">
                <p className="text-xs text-text-muted mb-1">Market Cap</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(totalMarketCap)}
                </p>
              </div>
              <div className="p-4 bg-surface-50 rounded-lg">
                <p className="text-xs text-text-muted mb-1">24h Volume</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(totalVolume)}
                </p>
              </div>
            </div>

            {/* Price movement */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-success/5 rounded-lg">
                <p className="text-xs text-text-muted mb-1">Advancing</p>
                <p className="text-xl font-bold text-success">
                  {positiveChanges}
                </p>
              </div>
              <div className="p-4 bg-danger/5 rounded-lg">
                <p className="text-xs text-text-muted mb-1">Declining</p>
                <p className="text-xl font-bold text-danger">
                  {negativeChanges}
                </p>
              </div>
            </div>

            {/* Stock list */}
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wider">
                Top Stocks
              </p>
              <div className="space-y-2">
                {stocks.slice(0, 5).map((stock) => (
                  <div
                    key={stock.ticker}
                    className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStockCategoryColor(stock.category) }}
                      />
                      <div>
                        <p className="font-medium text-text-primary">{stock.ticker}</p>
                        <p className="text-xs text-text-muted">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(stock.current_price)}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {stock.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {marketEvents.length > 0 ? (
              marketEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-surface-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventVariant(event.event_type)}>
                        {event.event_type.replace('_', ' ')}
                      </Badge>
                      <span className="font-medium text-text-primary">
                        {event.ticker || 'Market'}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.change_percent && (
                    <p className={cn(
                      'text-sm mt-1',
                      event.change_percent > 0 ? 'text-success' : 'text-danger'
                    )}>
                      {formatPercentage(event.change_percent)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                No recent market events
              </p>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && showLeaderboard && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-text-muted">
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-text-primary">
                      {user.username}
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(user.net_worth)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                No leaderboard data
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEventVariant(eventType: string): 'default' | 'primary' | 'success' | 'destructive' | 'warning' | 'info' {
  switch (eventType) {
    case 'BLACK_SWAN':
      return 'destructive';
    case 'MANIPULATION':
    case 'PUMP':
      return 'success';
    case 'CRASH':
    case 'DUMP':
      return 'destructive';
    case 'PRICE_UPDATE':
      return 'info';
    default:
      return 'default';
  }
}
