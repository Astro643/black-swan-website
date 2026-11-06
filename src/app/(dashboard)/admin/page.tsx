// ============================================
// ADMIN PANEL PAGE
// Secure control deck for system administration
// ============================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile, isAdmin } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

// ============================================
// ADMIN PANEL PAGE COMPONENT
// ============================================

export default async function AdminPanelPage() {
  const supabase = createServerSupabaseClient();
  const profile = await getUserProfile();
  const isUserAdmin = await isAdmin();

  // Check authentication
  if (!profile) {
    redirect('/login');
  }

  // Check admin status
  if (!isUserAdmin) {
    redirect('/trading');
  }

  // ============================================
  // FETCH ADMIN DATA
  // ============================================

  // Get all users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('net_worth', { ascending: false });

  // Get all stocks
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .order('ticker', { ascending: true });

  // Get all transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, user_profiles!inner(username)')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get market events
  const { data: marketEvents } = await supabase
    .from('market_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get system stats
  const { count: userCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });

  const { count: stockCount } = await supabase
    .from('stocks')
    .select('*', { count: 'exact', head: true });

  const { count: transactionCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  const { data: totalVolume } = await supabase
    .from('transactions')
    .select('amount')
    .then(({ data }) => ({
      data,
      total: data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    }));

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Admin Panel
            </h1>
            <p className="text-text-secondary">
              System diagnostics and control
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin badge */}
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Admin Dashboard */}
      <AdminDashboard
        profile={profile}
        users={users || []}
        stocks={stocks || []}
        transactions={transactions || []}
        marketEvents={marketEvents || []}
        stats={{
          userCount: userCount || 0,
          stockCount: stockCount || 0,
          transactionCount: transactionCount || 0,
          totalVolume: totalVolume?.total || 0,
        }}
      />
    </div>
  );
}
