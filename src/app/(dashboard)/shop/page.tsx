// ============================================
// VIRTUAL SHOP PAGE
// Marketplace for purchasing game items
// ============================================

import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { ShopView } from '@/components/shop/ShopView';

// ============================================
// SHOP PAGE COMPONENT
// ============================================

export default async function ShopPage() {
  const supabase = createServerSupabaseClient();
  const profile = await getUserProfile();

  if (!profile) {
    return null;
  }

  // ============================================
  // FETCH SHOP DATA
  // ============================================

  // Get all shop items
  const { data: shopItems } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  // Get user inventory
  const { data: inventory } = await supabase
    .from('inventories')
    .select('*, shop_items!inner(*)')
    .eq('user_id', profile.id)
    .order('item_id', { ascending: true });

  // Get user portfolio for net worth calculation
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', profile.id);

  // Get stocks for portfolio value calculation
  const { data: stocks } = await supabase
    .from('stocks')
    .select('*')
    .eq('is_active', true);

  // ============================================
  // CALCULATE PORTFOLIO VALUE
  // ============================================

  const portfolioValue = portfolio?.reduce((total, position) => {
    const stock = stocks?.find(s => s.ticker === position.ticker);
    if (stock) {
      return total + (position.shares * stock.current_price);
    }
    return total;
  }, 0) || 0;

  const netWorth = profile.cash + portfolioValue - profile.loan_amount;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Virtual Shop
        </h1>
        <p className="text-text-secondary">
          Purchase protection items, intelligence tools, and chaos cards
        </p>
      </div>

      {/* Shop View */}
      <ShopView
        profile={profile}
        shopItems={shopItems || []}
        inventory={inventory || []}
        netWorth={netWorth}
      />
    </div>
  );
}
