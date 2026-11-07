// ============================================
// RECENT TRANSACTIONS COMPONENT
// Displays user's recent transaction history
// ============================================

'use client';

import { useMemo } from 'react';
import { cn, formatCurrency, formatDate, formatRelativeTime, getTransactionTypeLabel, getTransactionTypeColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TransactionRow } from '@/types/database';

// ============================================
// RECENT TRANSACTIONS PROPS
// ============================================

interface RecentTransactionsProps {
  transactions: (TransactionRow & { user_profiles?: { username: string; avatar?: string } })[];
  limit?: number;
}

// ============================================
// RECENT TRANSACTIONS COMPONENT
// ============================================

export function RecentTransactions({ transactions, limit = 10 }: RecentTransactionsProps) {
  // ============================================
  // SORT AND LIMIT TRANSACTIONS
  // ============================================

  const sortedTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-surface-50 rounded-lg border border-border-light/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Transaction icon */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${getTransactionTypeColor(tx.transaction_type)}20` }}
                    >
                      {getTransactionIcon(tx.transaction_type)}
                    </div>
                    
                    <div>
                      <p className="font-medium text-text-primary">
                        {getTransactionTypeLabel(tx.transaction_type)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {tx.ticker && <span>({tx.ticker})</span>}
                        {tx.shares && <span> {tx.shares} shares</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      tx.transaction_type === 'BUY' ? 'text-success' :
                      tx.transaction_type === 'SELL' ? 'text-danger' :
                      'text-text-primary'
                    )}>
                      {tx.transaction_type === 'BUY' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">No recent transactions</p>
            </div>
          )}
        </div>

        {/* View all link */}
        {transactions.length > limit && (
          <div className="mt-4 pt-4 border-t border-border-light text-center">
            <button className="text-sm text-primary hover:underline">
              View all transactions
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTransactionIcon(type: string): React.ReactNode {
  switch (type) {
    case 'BUY':
      return (
        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'SELL':
      return (
        <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      );
    case 'LOAN_TAKE':
      return (
        <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'LOAN_REPAY':
      return (
        <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'INTEREST':
      return (
        <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'TAX':
      return (
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

// ============================================
// EXPORT
// ============================================

export { RecentTransactions };
