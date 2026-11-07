// ============================================
// PORTFOLIO PAGE
// Detailed portfolio view with all holdings
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercentage, formatNumber, calculateProfitLossPercent } from '@/lib/utils';
import type { UserProfileRow, PortfolioRow, StockRow } from '@/types/database';
import { RealtimeRefresh } from '@/components/common/RealtimeRefresh';

// ============================================
// PORTFOLIO PAGE COMPONENT
// ============================================

export default async function PortfolioPage() {
  const supabase = createServerSupabaseClient();
  const profile = await getUserProfile();

  if (!profile) {
    return null;
  }

  // ============================================
  // FETCH DATA
  // ============================================

  // Get all active stocks
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .eq('is_active', true)
    .order('ticker', { ascending: true });

  // Get user portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', profile.id)
    .order('ticker', { ascending: true });

  // Get user transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, stocks!inner(ticker, name)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // ============================================
  // CALCULATE DERIVED DATA
  // ============================================

  // Calculate portfolio value
  const portfolioValue = portfolio?.reduce((total, position) => {
    const stock = stocks?.find(s => s.ticker === position.ticker);
    if (stock) {
      return total + (position.shares * stock.current_price);
    }
    return total;
  }, 0) || 0;

  // Calculate total invested
  const totalInvested = portfolio?.reduce((total, position) => total + position.total_invested, 0) || 0;

  // Calculate profit/loss
  const profitLoss = portfolioValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  // Calculate net worth
  const netWorth = profile.cash + portfolioValue - profile.loan_amount;

  // Calculate per-stock P/L
  const portfolioWithPnL = portfolio?.map(position => {
    const stock = stocks?.find(s => s.ticker === position.ticker);
    if (!stock) return position;
    
    const currentValue = position.shares * stock.current_price;
    const pl = currentValue - position.total_invested;
    const plPercent = position.total_invested > 0 ? (pl / position.total_invested) * 100 : 0;
    
    return { ...position, currentValue, pl, plPercent, stock };
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        subscriptions={[
          { table: 'stocks' },
          { table: 'user_profiles', filter: `id=eq.${profile.id}` },
          { table: 'portfolios', filter: `user_id=eq.${profile.id}` },
          { table: 'transactions', filter: `user_id=eq.${profile.id}` },
        ]}
      />
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Portfolio
            </h1>
            <p className="text-text-secondary">
              Detailed view of all your holdings
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(netWorth)}
            </p>
            <p className="text-sm text-text-muted">Net Worth</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(portfolioValue)}</p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(profitLoss)}
            </p>
            <p className={`text-sm ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPercentage(profitLossPercent)}
            </p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Cash Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(profile.cash)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card variant="bordered" className="mb-8">
        <CardHeader>
          <CardTitle className="text-primary">Your Holdings</CardTitle>
          <CardDescription>
            {formatNumber(portfolio?.length || 0)} positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioWithPnL && portfolioWithPnL.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left py-2 px-4 font-semibold text-text-primary">Stock</th>
                    <th className="text-left py-2 px-4 font-semibold text-text-primary">Category</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Shares</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Avg Price</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Current Price</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Value</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Invested</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">P/L</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">P/L %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioWithPnL.map((position) => {
                    const plColor = position.pl !== undefined && position.pl >= 0 ? 'text-success' : 'text-danger';
                    const plPercentColor = position.plPercent !== undefined && position.plPercent >= 0 ? 'text-success' : 'text-danger';
                    
                    return (
                      <tr key={position.id} className="border-b border-border-light/50">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{position.ticker}</span>
                            <span className="text-text-muted text-xs">{position.stock?.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <Badge variant="default">{position.stock?.category || 'N/A'}</Badge>
                        </td>
                        <td className="py-2 px-4 text-right">{formatNumber(position.shares)}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(position.average_price)}</td>
                        <td className="py-2 px-4 text-right">{position.stock ? formatCurrency(position.stock.current_price) : 'N/A'}</td>
                        <td className="py-2 px-4 text-right">{position.currentValue ? formatCurrency(position.currentValue) : 'N/A'}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(position.total_invested)}</td>
                        <td className={`py-2 px-4 text-right ${plColor}`}>
                          {position.pl !== undefined ? formatCurrency(position.pl) : 'N/A'}
                        </td>
                        <td className={`py-2 px-4 text-right ${plPercentColor}`}>
                          {position.plPercent !== undefined ? formatPercentage(position.plPercent) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">You don&apos;t have any holdings yet.</p>
              <p className="text-text-muted mt-2">
                Visit the <span className="text-primary font-medium">Trading Floor</span> to buy stocks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Transaction History</CardTitle>
          <CardDescription>
            Last {formatNumber(transactions?.length || 0)} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="text-left py-2 px-4 font-semibold text-text-primary">Date</th>
                    <th className="text-left py-2 px-4 font-semibold text-text-primary">Type</th>
                    <th className="text-left py-2 px-4 font-semibold text-text-primary">Stock</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Shares</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Price</th>
                    <th className="text-right py-2 px-4 font-semibold text-text-primary">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border-light/50">
                      <td className="py-2 px-4 text-text-muted">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant={tx.transaction_type === 'BUY' ? 'success' : 'default'}>
                          {tx.transaction_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 font-medium">
                        {tx.stocks?.ticker || tx.ticker}
                      </td>
                      <td className="py-2 px-4 text-right">{formatNumber(tx.shares)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(tx.price_per_share)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">No transactions yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
