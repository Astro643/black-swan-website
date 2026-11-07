// ============================================
// LEADERBOARD PAGE
// Global rankings and player statistics
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';
import type { UserProfileRow, PortfolioRow, StockRow } from '@/types/database';
import { RealtimeRefresh } from '@/components/common/RealtimeRefresh';

// ============================================
// LEADERBOARD PAGE COMPONENT
// ============================================

export default async function LeaderboardPage() {
  const supabase = createServerSupabaseClient();
  const profile = await getUserProfile();

  // ============================================
  // FETCH DATA
  // ============================================

  // Get all user profiles with net worth
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, discord_id, username, avatar, cash, net_worth, loan_amount, total_earnings, total_spent, is_active, created_at, cosmetic_ids')
    .eq('is_active', true)
    .order('net_worth', { ascending: false });

  // Get all portfolios for calculating detailed stats
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*');

  // Get all stocks for calculating portfolio values
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .eq('is_active', true);

  // Get recent transactions for activity
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*, user_profiles!inner(username, avatar)')
    .order('created_at', { ascending: false })
    .limit(10);

  // ============================================
  // CALCULATE DERIVED DATA
  // ============================================

  // Calculate each user's portfolio value
  const usersWithStats = users?.map(user => {
    const userPortfolio = portfolios?.filter(p => p.user_id === user.id);
    
    // Calculate portfolio value
    const portfolioValue = userPortfolio?.reduce((total, position) => {
      const stock = stocks?.find(s => s.ticker === position.ticker);
      if (stock) {
        return total + (position.shares * stock.current_price);
      }
      return total;
    }, 0) || 0;

    // Calculate total shares owned
    const totalShares = userPortfolio?.reduce((total, position) => total + position.shares, 0) || 0;

    // Calculate profit/loss
    const totalInvested = userPortfolio?.reduce((total, position) => total + position.total_invested, 0) || 0;
    const profitLoss = portfolioValue - totalInvested;

    // Calculate net worth (cash + portfolio - loans)
    const netWorth = user.cash + portfolioValue - user.loan_amount;

    return {
      ...user,
      portfolioValue,
      totalShares,
      totalInvested,
      profitLoss,
      netWorth,
      portfolio: userPortfolio,
    };
  });

  // Sort by net worth descending
  const rankedUsers = usersWithStats?.sort((a, b) => b.netWorth - a.netWorth) || [];

  // Find current user's rank
  const currentUserRank = rankedUsers.findIndex(u => u.id === profile?.id) + 1;
  const currentUser = rankedUsers.find(u => u.id === profile?.id);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        subscriptions={[
          { table: 'user_profiles' },
          { table: 'portfolios' },
          { table: 'stocks' },
          { table: 'transactions' },
        ]}
      />
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Leaderboard
            </h1>
            <p className="text-text-secondary">
              Global rankings for all players
            </p>
          </div>
          {profile && currentUser && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                #{currentUserRank}
              </p>
              <p className="text-sm text-text-muted">Your Rank</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(currentUser.netWorth)}
              </p>
              <p className="text-xs text-text-muted">Net Worth</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatNumber(rankedUsers.length)}</p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Highest Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {rankedUsers[0] ? formatCurrency(rankedUsers[0].netWorth) : 'N/A'}
            </p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">
              {rankedUsers.length > 0 
                ? formatCurrency(rankedUsers.reduce((sum, u) => sum + u.total_spent + u.total_earnings, 0))
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
        
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Average Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">
              {rankedUsers.length > 0 
                ? formatCurrency(rankedUsers.reduce((sum, u) => sum + u.netWorth, 0) / rankedUsers.length)
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card variant="bordered" className="mb-8">
        <CardHeader>
          <CardTitle className="text-primary">Global Rankings</CardTitle>
          <CardDescription>
            Ranked by Net Worth (Cash + Portfolio Value - Loans)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Rank</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Player</th>
                  <th className="text-right py-2 px-4 font-semibold text-text-primary">Net Worth</th>
                  <th className="text-right py-2 px-4 font-semibold text-text-primary">Portfolio</th>
                  <th className="text-right py-2 px-4 font-semibold text-text-primary">Cash</th>
                  <th className="text-right py-2 px-4 font-semibold text-text-primary">P/L</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rankedUsers.map((user, index) => {
                  const isCurrentUser = user.id === profile?.id;
                  const plColor = user.profitLoss >= 0 ? 'text-success' : 'text-danger';

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-border-light/50 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-2 px-4 font-medium text-text-muted">
                        #{index + 1}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <span className="font-medium text-text-primary">{user.username}</span>
                            {isCurrentUser && (
                              <Badge variant="primary" className="ml-2 text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-semibold text-primary">
                        {formatCurrency(user.netWorth)}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {formatCurrency(user.portfolioValue)}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {formatCurrency(user.cash)}
                      </td>
                      <td className={`py-2 px-4 text-right ${plColor}`}>
                        {formatCurrency(user.profitLoss)}
                      </td>
                      <td className="py-2 px-4 text-text-muted">
                        {formatDateTime(user.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Recent Activity</CardTitle>
          <CardDescription>
            Latest transactions across all players
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {tx.user_profiles?.avatar && (
                      <img
                        src={tx.user_profiles.avatar}
                        alt={tx.user_profiles.username}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {tx.user_profiles?.username || 'Unknown'}
                        </span>
                        <Badge variant={tx.transaction_type === 'BUY' ? 'success' : 'default'}>
                          {tx.transaction_type}
                        </Badge>
                        <span className="font-bold text-text-primary">{tx.ticker}</span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatNumber(tx.shares ?? 0)} shares @ {formatCurrency(tx.price ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
