// ============================================
// PORTFOLIO OVERVIEW COMPONENT
// Displays user's portfolio summary
// ============================================

'use client';

import { useMemo } from 'react';
import { cn, formatCurrency, formatPercentage, calculateProfitLossPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserProfileRow, PortfolioRow, StockRow } from '@/types/database';

// ============================================
// PORTFOLIO OVERVIEW PROPS
// ============================================

interface PortfolioOverviewProps {
  profile: UserProfileRow;
  portfolio: PortfolioRow[];
  stocks: StockRow[];
  portfolioValue?: number;
  totalInvested?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  netWorth?: number;
}

// ============================================
// PORTFOLIO OVERVIEW COMPONENT
// ============================================

export function PortfolioOverview({
  profile,
  portfolio,
  stocks,
  portfolioValue: externalPortfolioValue,
  totalInvested: externalTotalInvested,
  profitLoss: externalProfitLoss,
  profitLossPercent: externalProfitLossPercent,
  netWorth: externalNetWorth,
}: PortfolioOverviewProps) {
  // ============================================
  // CALCULATE DERIVED DATA
  // ============================================

  const calculatedPortfolioValue = useMemo(() => {
    return portfolio.reduce((total, position) => {
      const stock = stocks.find(s => s.ticker === position.ticker);
      if (stock) {
        return total + (position.shares * stock.current_price);
      }
      return total;
    }, 0);
  }, [portfolio, stocks]);

  const calculatedTotalInvested = useMemo(() => {
    return portfolio.reduce((total, position) => total + position.total_invested, 0);
  }, [portfolio]);

  const portfolioValue = externalPortfolioValue ?? calculatedPortfolioValue;
  const totalInvested = externalTotalInvested ?? calculatedTotalInvested;

  const profitLoss = externalProfitLoss ?? (portfolioValue - totalInvested);
  const profitLossPercent = externalProfitLossPercent ?? (totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0);
  const netWorth = externalNetWorth ?? (profile.cash + portfolioValue - profile.loan_amount);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary">Portfolio Overview</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Net Worth */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div>
            <p className="text-sm text-text-muted">Net Worth</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(netWorth)}
            </p>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Portfolio Value</span>
            <span className="font-semibold text-text-primary">
              {formatCurrency(portfolioValue)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Total Invested</span>
            <span className="font-semibold text-text-primary">
              {formatCurrency(totalInvested)}
            </span>
          </div>

          {/* Profit/Loss */}
          <div className="flex items-center justify-between pt-2 border-t border-border-light">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Profit/Loss</span>
              <Badge variant={profitLoss >= 0 ? 'success' : 'destructive'}>
                {formatPercentage(profitLossPercent)}
              </Badge>
            </div>
            <span className={cn(
              'font-semibold',
              profitLoss >= 0 ? 'text-success' : 'text-danger'
            )}>
              {formatCurrency(profitLoss)}
            </span>
          </div>
        </div>

        {/* Cash & Loan */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-light">
          <div>
            <p className="text-xs text-text-muted mb-1">Cash</p>
            <p className="font-semibold text-text-primary">
              {formatCurrency(profile.cash)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Loan</p>
            <p className={cn(
              'font-semibold',
              profile.loan_amount > 0 ? 'text-danger' : 'text-text-primary'
            )}>
              {formatCurrency(profile.loan_amount)}
            </p>
          </div>
        </div>

        {/* Position count */}
        <div className="pt-2 border-t border-border-light">
          <p className="text-xs text-text-muted mb-1">Positions</p>
          <p className="font-semibold text-text-primary">
            {portfolio.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
