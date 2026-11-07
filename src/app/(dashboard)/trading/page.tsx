// ============================================
// TRADING FLOOR PAGE
// Main trading view with live charts, portfolio, and order forms
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { TradingView } from '@/components/trading/TradingView';
import { PortfolioOverview } from '@/components/trading/PortfolioOverview';
import { StockChart } from '@/components/trading/StockChart';
import { OrderForm } from '@/components/trading/OrderForm';
import { MarketOverview } from '@/components/trading/MarketOverview';
import { RecentTransactions } from '@/components/trading/RecentTransactions';
import { RealtimeRefresh } from '@/components/common/RealtimeRefresh';

// ============================================
// TRADING FLOOR PAGE COMPONENT
// ============================================

export default async function TradingFloorPage() {
  const supabase = createServerSupabaseClient();
  const profile = await getUserProfile();

  if (!profile) {
    return null;
  }

  // ============================================
  // FETCH INITIAL DATA
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

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, user_profiles!inner(username, avatar)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get market events
  const { data: marketEvents } = await supabase
    .from('market_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get leaderboard
  const { data: leaderboard } = await supabase
    .from('user_profiles')
    .select('username, net_worth, avatar')
    .order('net_worth', { ascending: false })
    .limit(5);

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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        subscriptions={[
          { table: 'stocks' },
          { table: 'market_events' },
          { table: 'user_profiles' },
          { table: 'portfolios', filter: `user_id=eq.${profile.id}` },
          { table: 'transactions', filter: `user_id=eq.${profile.id}` },
        ]}
      />
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Trading Floor
        </h1>
        <p className="text-text-secondary">
          Buy, sell, and monitor stocks in real-time
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Portfolio & Market Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Portfolio Overview Card */}
          <PortfolioOverview
            profile={profile}
            portfolio={portfolio || []}
            stocks={stocks || []}
            portfolioValue={portfolioValue}
            totalInvested={totalInvested}
            profitLoss={profitLoss}
            profitLossPercent={profitLossPercent}
            netWorth={netWorth}
          />

          {/* Market Overview Card */}
          <MarketOverview
            stocks={stocks || []}
            marketEvents={marketEvents || []}
          />
        </div>

        {/* Center Column - Trading View & Chart */}
        <div className="lg:col-span-1 space-y-6">
          {/* Trading View */}
          <TradingView
            stocks={stocks || []}
            profile={profile}
          />

          {/* Stock Chart (for selected stock) */}
          <StockChart
            stocks={stocks || []}
            marketEvents={marketEvents || []}
          />
        </div>

        {/* Right Column - Order Form & Transactions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Form */}
          <OrderForm
            profile={profile}
            stocks={stocks || []}
            portfolio={portfolio || []}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            transactions={transactions || []}
          />
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="mt-8">
        <MarketOverview
          stocks={stocks || []}
          marketEvents={marketEvents || []}
          showLeaderboard
          leaderboard={leaderboard || []}
        />
      </div>
    </div>
  );
}
