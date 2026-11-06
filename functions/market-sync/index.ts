// ============================================
// SUPABASE EDGE FUNCTION: MARKET SYNC
// Syncs market data and handles manipulation queue
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const MARKET_CONFIG = {
  BASE_VOLATILITY_RANGE: { min: 0.01, max: 0.15 },
  RANDOM_SWING_RANGE: { min: -1.0, max: 1.0 },
  BLACK_SWAN_CHANCE: 0.02, // 2% chance per hour
  BLACK_SWAN_CRASH_RANGE: { min: 0.60, max: 0.80 }, // 60-80% crash
  BLACK_SWAN_GOLD_BOOST: 2.00, // 200% increase (3x)
  MANIPULATED_PRICE_CHANGE: 0.15, // 15% for Pump/Dump cards
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration');
  Deno.exit(1);
}

// ============================================
// SUPABASE CLIENT
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    fetch: async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      return response;
    },
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRandomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ============================================
// MAIN FUNCTION
// ============================================

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all active stocks
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .order('ticker', { ascending: true });

    if (stocksError) {
      throw stocksError;
    }

    if (!stocks || stocks.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No active stocks found',
        processed: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // PROCESS MANIPULATION QUEUE
    // ============================================

    const { data: pendingManipulations, error: manipError } = await supabase
      .from('manipulation_queue')
      .select('*')
      .eq('is_executed', false)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (manipError) {
      console.error('Error fetching pending manipulations:', manipError);
    }

    if (pendingManipulations && pendingManipulations.length > 0) {
      for (const manipulation of pendingManipulations) {
        const stock = stocks.find(s => s.ticker === manipulation.ticker);
        if (!stock) continue;

        // Mark stock as manipulated
        const { error: manipUpdateError } = await supabase
          .from('stocks')
          .update({
            is_manipulated: true,
            manipulated_by: manipulation.discord_id,
            manipulated_type: manipulation.manipulation_type,
            manipulated_at: new Date().toISOString(),
          })
          .eq('id', stock.id);

        if (manipUpdateError) {
          console.error('Error marking stock as manipulated:', manipUpdateError);
          continue;
        }

        // Mark manipulation as executed
        await supabase
          .from('manipulation_queue')
          .update({
            is_executed: true,
            executed_at: new Date().toISOString(),
          })
          .eq('id', manipulation.id);

        // Consume the item from inventory
        const { error: consumeError } = await supabase
          .from('inventories')
          .update({
            quantity: supabase.rpc('decrement', { amount: 1, column: 'quantity' }),
            last_used_at: new Date().toISOString(),
          })
          .eq('id', manipulation.id);

        if (consumeError) {
          console.error('Error consuming manipulation item:', consumeError);
        }
      }
    }

    // ============================================
    // CHECK FOR BLACK SWAN EVENT
    // ============================================

    const random = Math.random();
    const shouldTriggerBlackSwan = random < MARKET_CONFIG.BLACK_SWAN_CHANCE;

    let blackSwanResult: Record<string, any> | null = null;

    if (shouldTriggerBlackSwan) {
      // Randomly choose between TECH or MEME crash
      const isTechCrash = Math.random() < 0.5;
      const category = isTechCrash ? 'TECH' : 'MEME';
      const affectedTickers = stocks
        .filter(s => s.category === category)
        .map(s => s.ticker);

      const crashMultiplier = 1 - getRandomInRange(
        MARKET_CONFIG.BLACK_SWAN_CRASH_RANGE.min,
        MARKET_CONFIG.BLACK_SWAN_CRASH_RANGE.max
      );

      // Update affected stocks
      for (const ticker of affectedTickers) {
        const stock = stocks.find(s => s.ticker === ticker);
        if (stock) {
          const newPrice = stock.current_price * crashMultiplier;
          
          await supabase
            .from('stocks')
            .update({
              current_price: newPrice,
              last_price_update: new Date().toISOString(),
            })
            .eq('id', stock.id);

          // Log Black Swan event
          await supabase
            .from('market_events')
            .insert({
              event_type: 'BLACK_SWAN',
              ticker: stock.ticker,
              old_price: stock.current_price,
              new_price: newPrice,
              change_percent: ((newPrice - stock.current_price) / stock.current_price) * 100,
              category,
              triggered_by: 'SYSTEM',
              metadata: { eventType: `BLACK_SWAN_${category}`, crashMultiplier },
            });
        }
      }

      // Boost GOLD
      const goldStock = stocks.find(s => s.ticker === 'GOLD');
      if (goldStock) {
        const newPrice = goldStock.current_price * MARKET_CONFIG.BLACK_SWAN_GOLD_BOOST;
        
        await supabase
          .from('stocks')
          .update({
            current_price: newPrice,
            last_price_update: new Date().toISOString(),
          })
          .eq('id', goldStock.id);

        await supabase
          .from('market_events')
          .insert({
            event_type: 'BLACK_SWAN',
            ticker: 'GOLD',
            old_price: goldStock.current_price,
            new_price: newPrice,
            change_percent: ((newPrice - goldStock.current_price) / goldStock.current_price) * 100,
            category: 'SAFE_HAVEN',
            triggered_by: 'SYSTEM',
            metadata: { eventType: `BLACK_SWAN_${category}_GOLD_BOOST`, boostMultiplier: MARKET_CONFIG.BLACK_SWAN_GOLD_BOOST },
          });
      }

      // Process bailout bonds
      const { data: usersWithBailout, error: bailoutError } = await supabase
        .from('inventories')
        .select('user_id')
        .eq('item_id', 'bailout_bond')
        .eq('is_active', true);

      if (!bailoutError && usersWithBailout) {
        for (const { user_id } of usersWithBailout) {
          // Calculate user's loss from the crash
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user_id)
            .single();

          if (!userProfile) continue;

          const { data: userPortfolio } = await supabase
            .from('portfolios')
            .select('*, stocks!inner(ticker, current_price)')
            .eq('user_id', user_id);

          if (userPortfolio) {
            let lossAmount = 0;
            for (const position of userPortfolio) {
              if (affectedTickers.includes(position.ticker)) {
                const stock = stocks.find(s => s.ticker === position.ticker);
                if (stock) {
                  // Approximate original value (before crash)
                  const originalValue = position.shares * (stock.current_price / crashMultiplier);
                  const newValue = position.shares * stock.current_price;
                  lossAmount += originalValue - newValue;
                }
              }
            }

            const reimbursement = lossAmount * 0.5;

            if (reimbursement > 0) {
              await supabase
                .from('user_profiles')
                .update({
                  cash: supabase.rpc('increment', { amount: reimbursement, column: 'cash' }),
                  net_worth: supabase.rpc('increment', { amount: reimbursement, column: 'net_worth' }),
                })
                .eq('id', user_id);

              await supabase
                .from('transactions')
                .insert({
                  user_id,
                  transaction_type: 'BAILOUT',
                  ticker: null,
                  shares: null,
                  price: null,
                  amount: reimbursement,
                  fee: 0,
                  balance_after: supabase.rpc('select', { column: 'cash' }),
                  metadata: { eventType: `BLACK_SWAN_${category}`, lossAmount, reimbursementRate: 0.5 },
                });

              await supabase
                .from('notifications')
                .insert({
                  user_id,
                  notification_type: 'BAILOUT_ACTIVATED',
                  title: 'Bailout Bond Activated',
                  message: `You received $${reimbursement.toFixed(2)} from your Bailout Bond due to the ${category} Black Swan crash.`,
                  metadata: { reimbursement, eventType: `BLACK_SWAN_${category}` },
                });
            }
          }
        }
      }

      blackSwanResult = {
        triggered: true,
        category,
        affectedTickers,
        crashMultiplier,
        goldNewPrice: goldStock ? goldStock.current_price * MARKET_CONFIG.BLACK_SWAN_GOLD_BOOST : null,
        bailoutUsers: usersWithBailout?.length || 0,
      };
    }

    // ============================================
    // UPDATE STOCK PRICES
    // ============================================

    let priceUpdates = 0;

    for (const stock of stocks) {
      // Skip if stock is manipulated (will be handled separately)
      if (stock.is_manipulated && stock.manipulated_type) {
        // Handle manipulated price
        let newPrice: number;
        
        if (stock.manipulated_type === 'PUMP') {
          newPrice = stock.current_price * (1 + MARKET_CONFIG.MANIPULATED_PRICE_CHANGE);
        } else {
          newPrice = stock.current_price * (1 - MARKET_CONFIG.MANIPULATED_PRICE_CHANGE);
        }

        await supabase
          .from('stocks')
          .update({
            current_price: newPrice,
            last_price_update: new Date().toISOString(),
            is_manipulated: false,
            manipulated_by: null,
            manipulated_type: null,
            manipulated_at: null,
          })
          .eq('id', stock.id);

        // Log manipulation event
        await supabase
          .from('market_events')
          .insert({
            event_type: 'MANIPULATION',
            ticker: stock.ticker,
            old_price: stock.current_price,
            new_price: newPrice,
            change_percent: ((newPrice - stock.current_price) / stock.current_price) * 100,
            category: stock.category,
            triggered_by: stock.manipulated_by || 'SYSTEM',
            metadata: { manipulationType: stock.manipulated_type },
          });

        priceUpdates++;
        continue;
      }

      // Normal price update
      const randomSwing = getRandomInRange(
        MARKET_CONFIG.RANDOM_SWING_RANGE.min,
        MARKET_CONFIG.RANDOM_SWING_RANGE.max
      );
      const volatility = stock.base_volatility;
      const priceChange = 1 + (randomSwing * volatility);
      const newPrice = stock.current_price * priceChange;

      // Ensure price doesn't go negative
      const finalPrice = Math.max(newPrice, 0.01);

      await supabase
        .from('stocks')
        .update({
          current_price: finalPrice,
          last_price_update: new Date().toISOString(),
        })
        .eq('id', stock.id);

      // Log price update event
      const changePercent = ((finalPrice - stock.current_price) / stock.current_price) * 100;
      
      if (Math.abs(changePercent) > 1) {
        await supabase
          .from('market_events')
          .insert({
            event_type: 'PRICE_UPDATE',
            ticker: stock.ticker,
            old_price: stock.current_price,
            new_price: finalPrice,
            change_percent: changePercent,
            category: stock.category,
            triggered_by: 'SYSTEM',
          });
      }

      priceUpdates++;
    }

    // ============================================
    // UPDATE USER NET WORTH
    // ============================================

    const { data: users } = await supabase
      .from('user_profiles')
      .select('*');

    if (users) {
      for (const user of users) {
        // Get user's portfolio
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', user.id);

        if (portfolio) {
          // Calculate portfolio value
          const portfolioValue = portfolio.reduce((total, position) => {
            const stock = stocks.find(s => s.ticker === position.ticker);
            if (stock) {
              return total + (position.shares * stock.current_price);
            }
            return total;
          }, 0);

          const newNetWorth = user.cash + portfolioValue - user.loan_amount;

          if (Math.abs(newNetWorth - user.net_worth) > 0.01) {
            await supabase
              .from('user_profiles')
              .update({
                net_worth: newNetWorth,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }
        }
      }
    }

    // ============================================
    // CLEANUP OLD MANIPULATION QUEUE
    // ============================================

    await supabase
      .from('manipulation_queue')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return new Response(JSON.stringify({
      success: true,
      message: 'Market sync completed successfully',
      processed: {
        priceUpdates,
        manipulations: pendingManipulations?.length || 0,
      },
      blackSwan: blackSwanResult,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market sync function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
