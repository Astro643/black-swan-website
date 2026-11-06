// ============================================
// PORTFOLIO API ROUTE
// Handles portfolio operations (buy/sell stocks)
// ============================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { z } from 'zod';
import { FINANCIAL_CONFIG } from '@/lib/constants';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const BuyStockSchema = z.object({
  ticker: z.string().min(1).max(10),
  shares: z.number().int().positive().max(1000000),
});

const SellStockSchema = z.object({
  ticker: z.string().min(1).max(10),
  shares: z.number().int().positive().max(1000000),
});

// ============================================
// GET - Get user portfolio
// ============================================

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('discord_id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json(createErrorResponse('User profile not found'), { status: 404 });
    }

    // Get portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*, stocks!inner(ticker, name, current_price, category)')
      .eq('user_id', profile.id)
      .order('ticker', { ascending: true });

    if (portfolioError) {
      return NextResponse.json(createErrorResponse(portfolioError.message), { status: 400 });
    }

    // Get stocks for price data
    const { data: stocks } = await supabase
      .from('stocks')
      .select('ticker, current_price')
      .eq('is_active', true);

    // Calculate portfolio value
    const portfolioValue = portfolio?.reduce((total, position) => {
      const stock = stocks?.find(s => s.ticker === position.ticker);
      if (stock) {
        return total + (position.shares * stock.current_price);
      }
      return total;
    }, 0) || 0;

    const totalInvested = portfolio?.reduce((total, position) => total + position.total_invested, 0) || 0;
    const profitLoss = portfolioValue - totalInvested;

    return NextResponse.json(createSuccessResponse({
      portfolio,
      portfolioValue,
      totalInvested,
      profitLoss,
      profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error in GET /api/portfolio:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// POST - Buy stock
// ============================================

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    const body = await request.json();
    const validated = BuyStockSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('discord_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(createErrorResponse('User profile not found'), { status: 404 });
    }

    // Get stock
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('ticker', validated.ticker.toUpperCase())
      .eq('is_active', true)
      .single();

    if (stockError || !stock) {
      return NextResponse.json(createErrorResponse('Stock not found or inactive'), { status: 404 });
    }

    // Calculate total cost
    const totalCost = validated.shares * stock.current_price;

    // Check if user has enough cash
    if (profile.cash < totalCost) {
      return NextResponse.json(
        createErrorResponse(`Insufficient cash. Need $${totalCost.toFixed(2)}`),
        { status: 400 }
      );
    }

    // Check if user already has this stock
    const { data: existingPosition } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', profile.id)
      .eq('ticker', stock.ticker)
      .single();

    // Update or create position
    if (existingPosition) {
      // Update existing position
      const newShares = existingPosition.shares + validated.shares;
      const newTotalInvested = existingPosition.total_invested + totalCost;
      const newAveragePrice = newTotalInvested / newShares;

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          shares: newShares,
          average_price: newAveragePrice,
          total_invested: newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPosition.id);

      if (updateError) {
        return NextResponse.json(createErrorResponse(updateError.message), { status: 400 });
      }
    } else {
      // Create new position
      const { error: insertError } = await supabase
        .from('portfolios')
        .insert({
          user_id: profile.id,
          stock_id: stock.id,
          ticker: stock.ticker,
          shares: validated.shares,
          average_price: stock.current_price,
          total_invested: totalCost,
          stop_loss_price: null,
          stop_loss_contract_id: null,
        });

      if (insertError) {
        return NextResponse.json(createErrorResponse(insertError.message), { status: 400 });
      }
    }

    // Deduct cash from user
    const newCash = profile.cash - totalCost;
    const { error: updateCashError } = await supabase
      .from('user_profiles')
      .update({
        cash: newCash,
        net_worth: profile.net_worth - totalCost,
        total_spent: profile.total_spent + totalCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateCashError) {
      return NextResponse.json(createErrorResponse(updateCashError.message), { status: 400 });
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: profile.id,
        transaction_type: 'BUY',
        ticker: stock.ticker,
        shares: validated.shares,
        price: stock.current_price,
        amount: totalCost,
        fee: FINANCIAL_CONFIG.TRANSACTION_FEE,
        balance_after: newCash,
        metadata: { stock_id: stock.id },
      });

    if (txError) {
      console.error('Error creating transaction:', txError);
      // Don't fail the request, just log the error
    }

    // Check for whale transaction
    if (totalCost >= FINANCIAL_CONFIG.WHALE_TRACKER_THRESHOLD) {
      // Notify users with whale tracker
      const { data: usersWithWhaleTracker } = await supabase
        .from('inventories')
        .select('user_id')
        .eq('item_id', 'whale_tracker_subscription')
        .eq('is_active', true);

      if (usersWithWhaleTracker && usersWithWhaleTracker.length > 0) {
        const userIds = usersWithWhaleTracker.map(u => u.user_id);
        
        for (const userId of userIds) {
          if (userId !== profile.id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                notification_type: 'WHALE_TRANSACTION',
                title: 'Whale Transaction Detected',
                message: `User ${profile.username} bought ${validated.shares} shares of ${stock.ticker} for $${totalCost.toFixed(2)}`,
                metadata: {
                  userId: profile.id,
                  username: profile.username,
                  ticker: stock.ticker,
                  shares: validated.shares,
                  amount: totalCost,
                },
              });
          }
        }
      }
    }

    return NextResponse.json(createSuccessResponse({
      message: 'Stock purchased successfully',
      shares: validated.shares,
      ticker: stock.ticker,
      totalCost,
      newCash,
    }));
  } catch (error) {
    console.error('Error in POST /api/portfolio/buy:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Sell stock
// ============================================

export async function DELETE(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    const body = await request.json();
    const validated = SellStockSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('discord_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(createErrorResponse('User profile not found'), { status: 404 });
    }

    // Get stock
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('ticker', validated.ticker.toUpperCase())
      .eq('is_active', true)
      .single();

    if (stockError || !stock) {
      return NextResponse.json(createErrorResponse('Stock not found or inactive'), { status: 404 });
    }

    // Get user's position
    const { data: position, error: positionError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', profile.id)
      .eq('ticker', stock.ticker)
      .single();

    if (positionError || !position) {
      return NextResponse.json(createErrorResponse('Position not found'), { status: 404 });
    }

    // Check if user has enough shares
    if (position.shares < validated.shares) {
      return NextResponse.json(
        createErrorResponse(`Insufficient shares. You only have ${position.shares} shares of ${stock.ticker}`),
        { status: 400 }
      );
    }

    // Calculate sale value
    const totalValue = validated.shares * stock.current_price;

    // Update or delete position
    if (position.shares === validated.shares) {
      // Delete position (selling all shares)
      const { error: deleteError } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', position.id);

      if (deleteError) {
        return NextResponse.json(createErrorResponse(deleteError.message), { status: 400 });
      }
    } else {
      // Update position (partial sale)
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          shares: position.shares - validated.shares,
          updated_at: new Date().toISOString(),
        })
        .eq('id', position.id);

      if (updateError) {
        return NextResponse.json(createErrorResponse(updateError.message), { status: 400 });
      }
    }

    // Add cash to user
    const newCash = profile.cash + totalValue;
    const { error: updateCashError } = await supabase
      .from('user_profiles')
      .update({
        cash: newCash,
        net_worth: profile.net_worth + totalValue,
        total_earnings: profile.total_earnings + totalValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateCashError) {
      return NextResponse.json(createErrorResponse(updateCashError.message), { status: 400 });
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: profile.id,
        transaction_type: 'SELL',
        ticker: stock.ticker,
        shares: validated.shares,
        price: stock.current_price,
        amount: totalValue,
        fee: FINANCIAL_CONFIG.TRANSACTION_FEE,
        balance_after: newCash,
        metadata: { stock_id: stock.id },
      });

    if (txError) {
      console.error('Error creating transaction:', txError);
    }

    // Check for whale transaction
    if (totalValue >= FINANCIAL_CONFIG.WHALE_TRACKER_THRESHOLD) {
      // Notify users with whale tracker
      const { data: usersWithWhaleTracker } = await supabase
        .from('inventories')
        .select('user_id')
        .eq('item_id', 'whale_tracker_subscription')
        .eq('is_active', true);

      if (usersWithWhaleTracker && usersWithWhaleTracker.length > 0) {
        const userIds = usersWithWhaleTracker.map(u => u.user_id);
        
        for (const userId of userIds) {
          if (userId !== profile.id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                notification_type: 'WHALE_TRANSACTION',
                title: 'Whale Transaction Detected',
                message: `User ${profile.username} sold ${validated.shares} shares of ${stock.ticker} for $${totalValue.toFixed(2)}`,
                metadata: {
                  userId: profile.id,
                  username: profile.username,
                  ticker: stock.ticker,
                  shares: validated.shares,
                  amount: totalValue,
                },
              });
          }
        }
      }
    }

    return NextResponse.json(createSuccessResponse({
      message: 'Stock sold successfully',
      shares: validated.shares,
      ticker: stock.ticker,
      totalValue,
      newCash,
    }));
  } catch (error) {
    console.error('Error in DELETE /api/portfolio/sell:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
