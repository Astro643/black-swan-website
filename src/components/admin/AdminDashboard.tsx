// ============================================
// ADMIN DASHBOARD COMPONENT
// Complete system administration interface
// ============================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import type { UserProfileRow, StockRow, TransactionRow, MarketEventRow } from '@/types/database';

// ============================================
// ADMIN DASHBOARD PROPS
// ============================================

interface AdminDashboardStats {
  userCount: number;
  stockCount: number;
  transactionCount: number;
  totalVolume: number;
}

interface AdminDashboardProps {
  profile: UserProfileRow;
  users: UserProfileRow[];
  stocks: StockRow[];
  transactions: (TransactionRow & { user_profiles?: { username: string; avatar?: string | null } | null })[];
  marketEvents: MarketEventRow[];
  stats: AdminDashboardStats;
}

// ============================================
// SYSTEM ACTION TYPES
// ============================================

type SystemAction = 
  | 'reset_market'
  | 'trigger_black_swan'
  | 'apply_loan_interest'
  | 'apply_wealth_tax'
  | 'run_diagnostics';

// ============================================
// ADMIN DASHBOARD COMPONENT
// ============================================

export function AdminDashboard({
  profile,
  users,
  stocks,
  transactions,
  marketEvents,
  stats,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stocks' | 'transactions' | 'events'>('overview');
  const [loading, setLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ action: string; success: boolean; message: string } | null>(null);

  // ============================================
  // SYSTEM ACTIONS
  // ============================================

  const handleSystemAction = async (action: SystemAction) => {
    setLoading(action);
    setActionResult(null);

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.success) {
        setActionResult({
          action,
          success: true,
          message: result.message || `Action ${action} completed successfully`,
        });
      } else {
        setActionResult({
          action,
          success: false,
          message: result.error || 'Action failed',
        });
      }
    } catch (error) {
      setActionResult({
        action,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(null);
      // Refresh data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // ============================================
  // TAB CONTENT
  // ============================================

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(stats.userCount)}
          icon="users"
          color="primary"
        />
        <StatCard
          title="Active Stocks"
          value={formatNumber(stats.stockCount)}
          icon="trending-up"
          color="primary"
        />
        <StatCard
          title="Total Transactions"
          value={formatNumber(stats.transactionCount)}
          icon="receipt"
          color="primary"
        />
        <StatCard
          title="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          icon="dollar-sign"
          color="primary"
        />
      </div>

      {/* System Actions */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">System Actions</CardTitle>
          <CardDescription>
            Execute system-wide operations. All actions are irreversible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => handleSystemAction('reset_market')}
              disabled={loading === 'reset_market'}
              className="w-full"
            >
              {loading === 'reset_market' ? 'Processing...' : 'Reset Market'}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleSystemAction('trigger_black_swan')}
              disabled={loading === 'trigger_black_swan'}
              className="w-full"
            >
              {loading === 'trigger_black_swan' ? 'Processing...' : 'Trigger Black Swan'}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleSystemAction('apply_loan_interest')}
              disabled={loading === 'apply_loan_interest'}
              className="w-full"
            >
              {loading === 'apply_loan_interest' ? 'Processing...' : 'Apply Loan Interest'}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleSystemAction('apply_wealth_tax')}
              disabled={loading === 'apply_wealth_tax'}
              className="w-full"
            >
              {loading === 'apply_wealth_tax' ? 'Processing...' : 'Apply Wealth Tax'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleSystemAction('run_diagnostics')}
              disabled={loading === 'run_diagnostics'}
              className="w-full"
            >
              {loading === 'run_diagnostics' ? 'Processing...' : 'Run Diagnostics'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Result */}
      {actionResult && (
        <Card variant={actionResult.success ? 'bordered' : 'default'}>
          <CardContent className={actionResult.success ? 'bg-success/10' : 'bg-danger/10'}>
            <div className="flex items-center gap-2">
              <Badge variant={actionResult.success ? 'success' : 'destructive'}>
                {actionResult.success ? 'Success' : 'Error'}
              </Badge>
              <span className="text-sm">{actionResult.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Market Events */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Recent Market Events</CardTitle>
        </CardHeader>
        <CardContent>
          {marketEvents.length > 0 ? (
            <div className="space-y-2">
              {marketEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-surface-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={event.event_type === 'BLACK_SWAN' ? 'destructive' : 'default'}>
                      {event.event_type}
                    </Badge>
                    <span className="text-sm">{typeof event.metadata?.description === 'string' ? event.metadata.description : event.event_type}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No recent market events</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">User Management</CardTitle>
          <CardDescription>
            {formatNumber(users.length)} registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">User</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Cash</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Net Worth</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Loan</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Status</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border-light/50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        {user.avatar && (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">{formatCurrency(user.cash)}</td>
                    <td className="py-2 px-4">{formatCurrency(user.net_worth)}</td>
                    <td className="py-2 px-4">
                      {user.loan_amount > 0 ? formatCurrency(user.loan_amount) : '-'}
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant={user.is_liquidated ? 'destructive' : user.is_active ? 'success' : 'default'}>
                        {user.is_liquidated ? 'Liquidated' : user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-text-muted">
                      {formatDateTime(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStocksTab = () => (
    <div className="space-y-4">
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Stock Management</CardTitle>
          <CardDescription>
            {formatNumber(stocks.length)} active stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Ticker</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Name</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Price</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Category</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Volatility</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Status</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.id} className="border-b border-border-light/50">
                    <td className="py-2 px-4 font-medium">{stock.ticker}</td>
                    <td className="py-2 px-4">{stock.name}</td>
                    <td className="py-2 px-4">{formatCurrency(stock.current_price)}</td>
                    <td className="py-2 px-4">
                      <Badge variant="default">{stock.category}</Badge>
                    </td>
                    <td className="py-2 px-4">{stock.base_volatility.toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <Badge variant={stock.is_manipulated ? 'warning' : stock.is_active ? 'success' : 'default'}>
                        {stock.is_manipulated ? 'Manipulated' : stock.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-4">
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Recent Transactions</CardTitle>
          <CardDescription>
            Last {formatNumber(transactions.length)} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">User</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Type</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Ticker</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Shares</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Price</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Amount</th>
                  <th className="text-left py-2 px-4 font-semibold text-text-primary">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border-light/50">
                    <td className="py-2 px-4">{tx.user_profiles?.username || 'Unknown'}</td>
                    <td className="py-2 px-4">
                      <Badge variant={tx.transaction_type === 'BUY' ? 'success' : 'default'}>
                        {tx.transaction_type}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 font-medium">{tx.ticker}</td>
                    <td className="py-2 px-4">{formatNumber(tx.shares ?? 0)}</td>
                    <td className="py-2 px-4">{formatCurrency(tx.price ?? 0)}</td>
                    <td className="py-2 px-4">{formatCurrency(tx.amount)}</td>
                    <td className="py-2 px-4 text-text-muted">
                      {formatDateTime(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-4">
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-primary">Market Events History</CardTitle>
          <CardDescription>
            {formatNumber(marketEvents.length)} recorded events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {marketEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-surface-50 rounded-lg border border-border-light/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={event.event_type === 'BLACK_SWAN' ? 'destructive' : 'default'}>
                        {event.event_type}
                      </Badge>
                      <span className="font-semibold">{typeof event.metadata?.description === 'string' ? event.metadata.description : event.event_type}</span>
                    </div>
                    {typeof event.metadata?.details === 'string' && (
                      <p className="text-sm text-text-muted mt-1">{event.metadata.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================
  // TAB NAVIGATION
  // ============================================

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'events', label: 'Events' },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsersTab();
      case 'stocks':
        return renderStocksTab();
      case 'transactions':
        return renderTransactionsTab();
      case 'events':
        return renderEventsTab();
      default:
        return renderOverviewTab();
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string;
  icon?: string;
  color?: string;
}

function StatCard({ title, value, icon, color = 'primary' }: StatCardProps) {
  const iconClasses = {
    users: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    'trending-down': 'M13 7h8m0 0v8m0-8l8 8-4-4-6 6',
    receipt: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    'dollar-sign': 'M12 1L8 5h8m0 0v8m0-8H4m15 0a3 3 0 11-6 0 3 3 0 016 0z',
  } as const;

  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  } as const;

  return (
    <Card variant="elevated">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon && iconClasses[icon as keyof typeof iconClasses] && (
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                dangerouslySetInnerHTML={{ __html: iconClasses[icon as keyof typeof iconClasses] }}
              />
            </div>
          )}
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-xl font-bold text-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
