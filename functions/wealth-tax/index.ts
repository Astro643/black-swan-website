// ============================================
// SUPABASE EDGE FUNCTION: WEALTH TAX
// Applies 15% tax on cash > $1,000,000 every 24 hours
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const HYPER_WEALTH_TAX_THRESHOLD = 1000000; // $1,000,000
const HYPER_WEALTH_TAX_RATE = 0.15; // 15%

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration');
  Deno.exit(1);
}

// ============================================
// SUPABASE CLIENT
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Get users with cash > $1,000,000
    const { data: richUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .gte('cash', HYPER_WEALTH_TAX_THRESHOLD);

    if (usersError) {
      throw usersError;
    }

    if (!richUsers || richUsers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No users meet the wealth tax threshold',
        processed: 0,
        totalTax: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let taxedCount = 0;
    let totalTax = 0;

    // Process each user
    for (const user of richUsers) {
      // Check if user has Tax Haven Registration
      const { data: hasTaxHaven, error: taxHavenError } = await supabase
        .from('inventories')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', 'tax_haven_registration')
        .eq('is_active', true)
        .single();

      if (taxHavenError && !taxHavenError.code?.includes('PGRST116')) {
        console.error('Error checking for Tax Haven:', taxHavenError);
      }

      if (hasTaxHaven) {
        console.log(`User ${user.username} has Tax Haven - skipping tax`);
        continue;
      }

      // Check if user has been taxed recently
      if (user.last_tax_at) {
        const hoursSinceTax = (new Date().getTime() - new Date(user.last_tax_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceTax < 24) {
          console.log(`User ${user.username} was taxed recently - skipping`);
          continue;
        }
      }

      // Calculate tax
      const taxableAmount = user.cash - HYPER_WEALTH_TAX_THRESHOLD;
      const taxAmount = taxableAmount * HYPER_WEALTH_TAX_RATE;

      if (taxAmount <= 0) {
        continue;
      }

      // Apply tax
      const newCash = user.cash - taxAmount;
      const newNetWorth = user.net_worth - taxAmount;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          cash: newCash,
          net_worth: newNetWorth,
          last_tax_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error applying tax to user ${user.username}:`, updateError);
        continue;
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'TAX',
          ticker: null,
          shares: null,
          price: null,
          amount: taxAmount,
          fee: 0,
          balance_after: newCash,
          metadata: {
            taxRate: HYPER_WEALTH_TAX_RATE,
            threshold: HYPER_WEALTH_TAX_THRESHOLD,
            taxableAmount,
          },
        });

      if (txError) {
        console.error(`Error creating tax transaction for user ${user.username}:`, txError);
      }

      // Create notification
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          notification_type: 'TAX_PAID',
          title: 'Hyper-Wealth Tax Applied',
          message: `You have been taxed $${taxAmount.toFixed(2)} (${(HYPER_WEALTH_TAX_RATE * 100).toFixed(0)}% of cash above $${HYPER_WEALTH_TAX_THRESHOLD.toLocaleString()}). Remaining cash: $${newCash.toFixed(2)}`,
          metadata: { taxAmount, taxRate: HYPER_WEALTH_TAX_RATE },
        });

      if (notifyError) {
        console.error(`Error creating tax notification for user ${user.username}:`, notifyError);
      }

      taxedCount++;
      totalTax += taxAmount;

      console.log(`Tax applied to ${user.username}: $${taxAmount.toFixed(2)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Wealth tax applied successfully',
      processed: taxedCount,
      totalTax,
      threshold: HYPER_WEALTH_TAX_THRESHOLD,
      taxRate: HYPER_WEALTH_TAX_RATE,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in wealth tax function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
