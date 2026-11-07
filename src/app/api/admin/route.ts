// ============================================
// ADMIN API ROUTE
// Handles system administration operations
// ============================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { z } from 'zod';
import { MARKET_CONFIG, FINANCIAL_CONFIG } from '@/lib/constants';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const SystemActionSchema = z.object({
  action: z.enum([
    'reset-market',
    'trigger-black-swan',
    'apply-loan-interest',
    'apply-wealth-tax',
    'diagnostics',
    'cleanup',
  ]),
  category: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
});

const UpdateStockSchema = z.object({
  ticker: z.string().min(1).max(10),
  current_price: z.number().positive().optional(),
  base_volatility: z.number().min(0.01).max(0.15).optional(),
  is_active: z.boolean().optional(),
});

const UpdateUserSchema = z.object({
  userId: z.string().min(1),
  cash: z.number().optional(),
  net_worth: z.number().optional(),
  loan_amount: z.number().optional(),
  is_liquidated: z.boolean().optional(),
});

// ============================================
// HELPER: Check if user is admin
// ============================================

async function checkAdmin(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return false;
  }

  // Check if user is admin
  const adminGuildId = process.env.ADMIN_GUILD_ID;
  const adminDiscordId = process.env.ADMIN_DISCORD_ID;

  if (!adminGuildId && !adminDiscordId) {
    // No admin configured, allow all for development
    return true;
  }

  if (adminDiscordId && session.user.id === adminDiscordId) {
    return true;
  }

  // In production, check Discord API for guild ownership
  // For now, use simple check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('discord_id')
    .eq('discord_id', session.user.id)
    .single();

  return profile?.discord_id === adminDiscordId;
}

// ============================================
// GET - Get system diagnostics
// ============================================

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const isAdminUser = await checkAdmin(supabase);

    if (!isAdminUser) {
      return NextResponse.json(createErrorResponse('Not authorized'), { status: 403 });
    }

    // Get system statistics
    const [
      userCount,
      stockCount,
      transactionCount,
      activeLoans,
      recentEvents,
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('stocks').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('market_events').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const { count: totalUsers } = userCount;
    const { count: totalStocks } = stockCount;
    const { count: totalTransactions } = transactionCount;
    const { count: totalActiveLoans } = activeLoans;

    // Get total volume
    const { data: volumeData } = await supabase
      .from('transactions')
      .select('amount');

    const totalVolume = volumeData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Get total cash in system
    const { data: users } = await supabase
      .from('user_profiles')
      .select('cash');

    const totalCash = users?.reduce((sum, u) => sum + (u.cash || 0), 0) || 0;

    return NextResponse.json(createSuccessResponse({
      stats: {
        totalUsers: totalUsers || 0,
        totalStocks: totalStocks || 0,
        totalTransactions: totalTransactions || 0,
        totalActiveLoans: totalActiveLoans || 0,
        totalVolume,
        totalCash,
      },
      recentEvents: recentEvents.data || [],
      config: {
        market: MARKET_CONFIG,
        financial: FINANCIAL_CONFIG,
      },
    }));
  } catch (error) {
    console.error('Error in GET /api/admin:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// POST - Execute system action
// ============================================

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const isAdminUser = await checkAdmin(supabase);

    if (!isAdminUser) {
      return NextResponse.json(createErrorResponse('Not authorized'), { status: 403 });
    }

    const body = await request.json();
    const validated = SystemActionSchema.parse(body);

    let result: Record<string, any> = {};

    switch (validated.action) {
      // Reset market
      case 'reset-market':
        // Reset all stock prices to their initial values
        // This is a destructive operation - only allow in dry-run mode or with explicit confirmation
        if (validated.dryRun) {
          const { data: stocks } = await supabase
            .from('stocks')
            .select('*')
            .eq('is_active', true);

          result = {
            message: 'Dry run: Would reset prices for all active stocks',
            affectedStocks: stocks?.length || 0,
            stocks: stocks?.map(s => ({
              ticker: s.ticker,
              currentPrice: s.current_price,
              // Would reset to some initial value
            })),
          };
        } else {
          // In production, this would require additional confirmation
          result = {
            message: 'Market reset requires explicit confirmation. Use dryRun=true to preview.',
          };
        }
        break;

      // Trigger Black Swan event
      case 'trigger-black-swan':
        const category = validated.category || 'TECH';
        
        // Get stocks in the specified category
        const { data: categoryStocks } = await supabase
          .from('stocks')
          .select('*')
          .eq('category', category)
          .eq('is_active', true);

        if (!categoryStocks || categoryStocks.length === 0) {
          return NextResponse.json(
            createErrorResponse(`No active stocks found in category: ${category}`),
            { status: 400 }
          );
        }

        // Calculate crash multiplier (60-80%)
        const crashMultiplier = 1 - (0.6 + Math.random() * 0.2);
        const goldBoostMultiplier = 2.0;

        if (validated.dryRun) {
          result = {
            message: `Dry run: Would trigger Black Swan event for ${category} stocks`,
            category,
            affectedStocks: categoryStocks.map(s => s.ticker),
            crashMultiplier,
            goldBoostMultiplier,
          };
        } else {
          // Apply crash to all stocks in category
          const updates = categoryStocks.map(stock => ({
            id: stock.id,
            current_price: stock.current_price * crashMultiplier,
            last_price_update: new Date().toISOString(),
          }));

          const { error: updateError } = await supabase
            .from('stocks')
            .upsert(updates);

          if (updateError) {
            throw updateError;
          }

          // Boost GOLD
          const { data: goldStock } = await supabase
            .from('stocks')
            .select('*')
            .eq('ticker', 'GOLD')
            .single();

          if (goldStock) {
            await supabase
              .from('stocks')
              .update({
                current_price: goldStock.current_price * goldBoostMultiplier,
                last_price_update: new Date().toISOString(),
              })
              .eq('id', goldStock.id);
          }

          // Log market events
          for (const stock of categoryStocks) {
            await supabase
              .from('market_events')
              .insert({
                event_type: 'BLACK_SWAN',
                ticker: stock.ticker,
                old_price: stock.current_price,
                new_price: stock.current_price * crashMultiplier,
                change_percent: ((stock.current_price * crashMultiplier - stock.current_price) / stock.current_price) * 100,
                category,
                triggered_by: 'ADMIN',
                metadata: { crashMultiplier },
              });
          }

          // Process bailout bonds
          const { data: usersWithBailout } = await supabase
            .from('inventories')
            .select('user_id')
            .eq('item_id', 'bailout_bond')
            .eq('is_active', true);

          if (usersWithBailout && usersWithBailout.length > 0) {
            for (const { user_id } of usersWithBailout) {
              // Calculate user's loss from the crash
              const { data: userPortfolio } = await supabase
                .from('portfolios')
                .select('*, stocks!inner(ticker, current_price)')
                .eq('user_id', user_id);

              if (userPortfolio) {
                let lossAmount = 0;
                for (const position of userPortfolio) {
                  const stock = categoryStocks.find(s => s.ticker === position.stocks.ticker);
                  if (stock) {
                    const originalValue = position.shares * (stock.current_price / crashMultiplier);
                    const newValue = position.shares * stock.current_price;
                    lossAmount += originalValue - newValue;
                  }
                }

                const reimbursement = lossAmount * 0.5;

                if (reimbursement > 0) {
                  const { data: bailoutProfile } = await supabase
                    .from('user_profiles')
                    .select('cash, net_worth')
                    .eq('id', user_id)
                    .maybeSingle();

                  if (!bailoutProfile) {
                    console.warn(`Skipping bailout for ${user_id}: profile was not found.`);
                    continue;
                  }

                  const newCash = bailoutProfile.cash + reimbursement;
                  const newNetWorth = bailoutProfile.net_worth + reimbursement;

                  const { error: bailoutUpdateError } = await supabase
                    .from('user_profiles')
                    .update({ cash: newCash, net_worth: newNetWorth })
                    .eq('id', user_id);

                  if (bailoutUpdateError) {
                    console.error(`Failed to update bailout balance for ${user_id}:`, bailoutUpdateError);
                    continue;
                  }

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
                      balance_after: newCash,
                      metadata: { eventType: 'BLACK_SWAN', lossAmount, reimbursementRate: 0.5 },
                    });

                  await supabase
                    .from('notifications')
                    .insert({
                      user_id,
                      notification_type: 'BAILOUT_ACTIVATED',
                      title: 'Bailout Bond Activated',
                      message: `You received $${reimbursement.toFixed(2)} from your Bailout Bond due to the ${category} Black Swan crash.`,
                      metadata: { reimbursement, eventType: 'BLACK_SWAN' },
                    });
                }
              }
            }
          }

          result = {
            message: `Black Swan event triggered for ${category} stocks`,
            category,
            affectedStocks: categoryStocks.map(s => s.ticker),
            crashMultiplier,
            goldBoostMultiplier,
            bailoutUsers: usersWithBailout?.length || 0,
          };
        }
        break;

      // Apply loan interest
      case 'apply-loan-interest':
        const { data: activeLoans } = await supabase
          .from('loans')
          .select('*, user_profiles!inner(*)')
          .eq('is_active', true);

        if (!activeLoans || activeLoans.length === 0) {
          result = {
            message: 'No active loans found',
            processed: 0,
          };
          break;
        }

        let processedCount = 0;
        let totalInterest = 0;

        for (const loan of activeLoans) {
          const hoursPassed = Math.floor(
            (new Date().getTime() - new Date(loan.taken_at).getTime()) / (1000 * 60 * 60)
          );

          if (hoursPassed >= 1) {
            const interest = loan.amount * FINANCIAL_CONFIG.LOAN_INTEREST_RATE * hoursPassed;
            const newLoanAmount = loan.amount + interest;

            await supabase
              .from('user_profiles')
              .update({
                loan_amount: newLoanAmount,
                last_interest_at: new Date().toISOString(),
              })
              .eq('id', loan.user_id);

            await supabase
              .from('loans')
              .update({
                amount: newLoanAmount,
                total_interest_paid: loan.total_interest_paid + interest,
              })
              .eq('id', loan.id);

            const { data: borrowerProfile } = await supabase
              .from('user_profiles')
              .select('cash')
              .eq('id', loan.user_id)
              .maybeSingle();

            await supabase
              .from('transactions')
              .insert({
                user_id: loan.user_id,
                transaction_type: 'INTEREST',
                ticker: null,
                shares: null,
                price: null,
                amount: interest,
                fee: 0,
                balance_after: borrowerProfile?.cash ?? 0,
                metadata: { loanId: loan.id, hoursPassed, interestRate: FINANCIAL_CONFIG.LOAN_INTEREST_RATE },
              });

            processedCount++;
            totalInterest += interest;
          }
        }

        result = {
          message: `Loan interest applied to ${processedCount} loans`,
          processed: processedCount,
          totalInterest,
        };
        break;

      // Apply wealth tax
      case 'apply-wealth-tax':
        const { data: richUsers } = await supabase
          .from('user_profiles')
          .select('*')
          .gte('cash', FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD);

        if (!richUsers || richUsers.length === 0) {
          result = {
            message: 'No users meet the wealth tax threshold',
            processed: 0,
          };
          break;
        }

        let taxedCount = 0;
        let totalTax = 0;

        for (const user of richUsers) {
          // Check for Tax Haven
          const { data: hasTaxHaven } = await supabase
            .from('inventories')
            .select('id')
            .eq('user_id', user.id)
            .eq('item_id', 'tax_haven_registration')
            .eq('is_active', true)
            .single();

          if (hasTaxHaven) {
            continue;
          }

          const taxableAmount = user.cash - FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD;
          const taxAmount = taxableAmount * FINANCIAL_CONFIG.HYPER_WEALTH_TAX_RATE;

          if (taxAmount > 0) {
            const newCash = user.cash - taxAmount;

            await supabase
              .from('user_profiles')
              .update({
                cash: newCash,
                net_worth: user.net_worth - taxAmount,
                last_tax_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            await supabase
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
                  taxRate: FINANCIAL_CONFIG.HYPER_WEALTH_TAX_RATE,
                  threshold: FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD,
                  taxableAmount,
                },
              });

            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                notification_type: 'TAX_PAID',
                title: 'Hyper-Wealth Tax Applied',
                message: `You have been taxed $${taxAmount.toFixed(2)} (${(FINANCIAL_CONFIG.HYPER_WEALTH_TAX_RATE * 100).toFixed(0)}% of cash above $${FINANCIAL_CONFIG.HYPER_WEALTH_TAX_THRESHOLD.toLocaleString()}).`,
                metadata: { taxAmount, taxRate: FINANCIAL_CONFIG.HYPER_WEALTH_TAX_RATE },
              });

            taxedCount++;
            totalTax += taxAmount;
          }
        }

        result = {
          message: `Wealth tax applied to ${taxedCount} users`,
          processed: taxedCount,
          totalTax,
        };
        break;

      // Diagnostics
      case 'diagnostics':
        result = {
          message: 'System diagnostics',
          timestamp: new Date().toISOString(),
          status: 'OK',
        };
        break;

      // Cleanup
      case 'cleanup':
        // Clean up old manipulation queue entries
        const { error: cleanupError } = await supabase
          .from('manipulation_queue')
          .delete()
          .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (cleanupError) {
          throw cleanupError;
        }

        result = {
          message: 'Cleanup completed',
          deletedManipulations: 1, // Would return actual count in real implementation
        };
        break;

      default:
        result = { message: 'Unknown action' };
    }

    return NextResponse.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Error in POST /api/admin:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
