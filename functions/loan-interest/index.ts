// ============================================
// SUPABASE EDGE FUNCTION: LOAN INTEREST
// Applies 5% hourly interest to all active loans
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const LOAN_INTEREST_RATE = 0.05; // 5% per hour

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

    // Get active loans
    const { data: activeLoans, error: loansError } = await supabase
      .from('loans')
      .select('*, user_profiles!inner(*)')
      .eq('is_active', true);

    if (loansError) {
      throw loansError;
    }

    if (!activeLoans || activeLoans.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No active loans found',
        processed: 0,
        totalInterest: 0,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    let totalInterest = 0;

    // Process each loan
    for (const loan of activeLoans) {
      const user = loan.user_profiles;
      
      if (!user) continue;

      // Calculate time since last interest
      const now = new Date();
      const lastInterestAt = user.last_interest_at || loan.taken_at;
      const hoursPassed = Math.floor(
        (now.getTime() - new Date(lastInterestAt).getTime()) / (1000 * 60 * 60)
      );

      // Only apply interest if at least 1 hour has passed
      if (hoursPassed >= 1) {
        const interest = loan.amount * LOAN_INTEREST_RATE * hoursPassed;
        const newLoanAmount = loan.amount + interest;

        // Update user profile
        const { error: userUpdateError } = await supabase
          .from('user_profiles')
          .update({
            loan_amount: newLoanAmount,
            last_interest_at: now.toISOString(),
            net_worth: user.net_worth - interest, // Interest is a liability
            updated_at: now.toISOString(),
          })
          .eq('id', user.id);

        if (userUpdateError) {
          console.error('Error updating user profile:', userUpdateError);
          continue;
        }

        // Update loan
        const { error: loanUpdateError } = await supabase
          .from('loans')
          .update({
            amount: newLoanAmount,
            total_interest_paid: loan.total_interest_paid + interest,
          })
          .eq('id', loan.id);

        if (loanUpdateError) {
          console.error('Error updating loan:', loanUpdateError);
          continue;
        }

        // Create transaction record
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            transaction_type: 'INTEREST',
            ticker: null,
            shares: null,
            price: null,
            amount: interest,
            fee: 0,
            balance_after: user.cash,
            metadata: {
              loanId: loan.id,
              hoursPassed,
              interestRate: LOAN_INTEREST_RATE,
            },
          });

        if (txError) {
          console.error('Error creating transaction:', txError);
        }

        // Create notification
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            notification_type: 'LOAN_DUE',
            title: 'Loan Interest Applied',
            message: `Interest of $${interest.toFixed(2)} has been added to your loan. Total loan: $${newLoanAmount.toFixed(2)}`,
            metadata: { interest, newLoanAmount },
          });

        if (notifyError) {
          console.error('Error creating notification:', notifyError);
        }

        processedCount++;
        totalInterest += interest;
      }
    }

    // Check for liquidations
    const { data: users } = await supabase
      .from('user_profiles')
      .select('*');

    if (users) {
      for (const user of users) {
        if (user.is_liquidated) continue;

        const { data: activeLoan } = await supabase
          .from('loans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!activeLoan) continue;

        // Calculate net worth
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('*, stocks!inner(current_price)')
          .eq('user_id', user.id);

        const portfolioValue = portfolio?.reduce((total, position) => {
          return total + (position.shares * position.stocks.current_price);
        }, 0) || 0;

        const netWorth = user.cash + portfolioValue;
        const loanToValueRatio = activeLoan.amount / netWorth;

        // Liquidate if loan exceeds 100% of net worth or if unpaid for too long
        const hoursSinceLoan = (new Date().getTime() - new Date(activeLoan.taken_at).getTime()) / (1000 * 60 * 60);
        const shouldLiquidate = loanToValueRatio > 1 || hoursSinceLoan >= 24;

        if (shouldLiquidate) {
          // Sell all portfolio positions
          if (portfolio) {
            let liquidationValue = 0;

            for (const position of portfolio) {
              const sellValue = position.shares * position.stocks.current_price;
              liquidationValue += sellValue;

              // Delete portfolio position
              await supabase
                .from('portfolios')
                .delete()
                .eq('id', position.id);

              // Log transaction
              await supabase
                .from('transactions')
                .insert({
                  user_id: user.id,
                  transaction_type: 'LIQUIDATION',
                  ticker: position.ticker,
                  shares: position.shares,
                  price: position.stocks.current_price,
                  amount: sellValue,
                  fee: 0,
                  balance_after: user.cash,
                  metadata: { liquidation: true },
                });
            }

            // Pay off as much of the loan as possible
            const remainingLoan = activeLoan.amount - liquidationValue;

            if (remainingLoan <= 0) {
              // Loan is fully covered
              await supabase
                .from('user_profiles')
                .update({
                  cash: user.cash + (liquidationValue - activeLoan.amount),
                  loan_amount: 0,
                  is_liquidated: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

              await supabase
                .from('loans')
                .update({
                  is_active: false,
                  repaid_at: new Date().toISOString(),
                })
                .eq('id', activeLoan.id);
            } else {
              // Partial payment
              await supabase
                .from('user_profiles')
                .update({
                  cash: 0,
                  loan_amount: remainingLoan,
                  is_liquidated: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

              await supabase
                .from('loans')
                .update({
                  amount: remainingLoan,
                  is_active: false,
                })
                .eq('id', activeLoan.id);
            }

            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                notification_type: 'LIQUIDATION',
                title: 'Account Liquidated',
                message: `Your account has been liquidated. Portfolio sold for $${liquidationValue.toFixed(2)}. Remaining debt: $${Math.max(remainingLoan, 0).toFixed(2)}`,
                metadata: { liquidationValue, remainingLoan },
              });

            console.log(`User ${user.username} liquidated. Value: $${liquidationValue.toFixed(2)}, Remaining: $${Math.max(remainingLoan, 0).toFixed(2)}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Loan interest applied successfully',
      processed: processedCount,
      totalInterest,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in loan interest function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
