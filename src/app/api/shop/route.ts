// ============================================
// SHOP API ROUTE
// Handles shop item purchases and usage
// ============================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PurchaseItemSchema = z.object({
  shopItemId: z.string().min(1),
  itemId: z.string().min(1),
});

const UseItemSchema = z.object({
  inventoryItemId: z.string().min(1),
  targetTicker: z.string().min(1).max(10).optional(),
  targetUserId: z.string().min(1).optional(),
});

// ============================================
// GET - Get shop items
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createServerSupabaseClient();

    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let queryBuilder = supabase
      .from('shop_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (activeOnly) {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }

    return NextResponse.json(createSuccessResponse(data));
  } catch (error) {
    console.error('Error in GET /api/shop:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// POST - Purchase shop item
// ============================================

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    const body = await request.json();
    const validated = PurchaseItemSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('discord_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(createErrorResponse('User profile not found'), { status: 404 });
    }

    // Get shop item
    const { data: shopItem, error: itemError } = await supabase
      .from('shop_items')
      .select('*')
      .eq('id', validated.shopItemId)
      .eq('is_active', true)
      .single();

    if (itemError || !shopItem) {
      return NextResponse.json(createErrorResponse('Shop item not found or inactive'), { status: 404 });
    }

    // Check if user can afford the item
    if (profile.cash < shopItem.price) {
      return NextResponse.json(
        createErrorResponse(`Insufficient cash. Need $${shopItem.price.toFixed(2)}`),
        { status: 400 }
      );
    }

    // Deduct cash from user
    const newCash = profile.cash - shopItem.price;
    const { error: updateCashError } = await supabase
      .from('user_profiles')
      .update({
        cash: newCash,
        total_spent: profile.total_spent + shopItem.price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateCashError) {
      return NextResponse.json(createErrorResponse(updateCashError.message), { status: 400 });
    }

    // Add item to inventory
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('inventories')
      .insert({
        user_id: profile.id,
        shop_item_id: shopItem.id,
        item_id: validated.itemId as any,
        quantity: 1,
        purchased_at: new Date().toISOString(),
        last_used_at: null,
        uses_remaining: shopItem.max_uses,
        is_active: shopItem.is_active_pass,
        expires_at: null,
        metadata: null,
      })
      .select()
      .single();

    if (inventoryError) {
      // Rollback: refund the user
      await supabase
        .from('user_profiles')
        .update({
          cash: profile.cash,
          total_spent: profile.total_spent,
        })
        .eq('id', profile.id);

      return NextResponse.json(createErrorResponse(inventoryError.message), { status: 400 });
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: profile.id,
        transaction_type: 'BUY',
        ticker: null,
        shares: null,
        price: null,
        amount: shopItem.price,
        fee: 0,
        balance_after: newCash,
        metadata: {
          itemId: shopItem.item_id,
          itemName: shopItem.name,
          shopItemId: shopItem.id,
          inventoryItemId: inventoryItem.id,
        },
      });

    if (txError) {
      console.error('Error creating transaction:', txError);
    }

    // Handle special item effects
    if (shopItem.item_id === 'analyst_terminal_pass') {
      await supabase
        .from('user_profiles')
        .update({
          has_analyst_pass: true,
        })
        .eq('id', profile.id);
    }

    return NextResponse.json(createSuccessResponse({
      message: 'Item purchased successfully',
      item: shopItem,
      inventoryItem,
      newCash,
    }));
  } catch (error) {
    console.error('Error in POST /api/shop:', error);
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
// POST - Use shop item
// ============================================

export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    const body = await request.json();
    const validated = UseItemSchema.parse(body);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('discord_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(createErrorResponse('User profile not found'), { status: 404 });
    }

    // Get inventory item
    const { data: inventoryItem, error: inventoryError } = await supabase
      .from('inventories')
      .select('*, shop_items!inner(*)')
      .eq('id', validated.inventoryItemId)
      .eq('user_id', profile.id)
      .single();

    if (inventoryError || !inventoryItem) {
      return NextResponse.json(createErrorResponse('Inventory item not found'), { status: 404 });
    }

    // Check if item can be used
    if (inventoryItem.quantity < 1) {
      return NextResponse.json(createErrorResponse('No quantity left'), { status: 400 });
    }

    if (inventoryItem.shop_items.is_consumable && inventoryItem.uses_remaining !== null && inventoryItem.uses_remaining <= 0) {
      return NextResponse.json(createErrorResponse('No uses remaining'), { status: 400 });
    }

    // Handle item-specific effects
    let result: Record<string, any> = {};

    switch (inventoryItem.item_id) {
      // Stop-Loss Contract
      case 'stop_loss_contract':
        if (!validated.targetTicker) {
          return NextResponse.json(
            createErrorResponse('Please specify a ticker to attach the stop-loss to'),
            { status: 400 }
          );
        }

        // Get stock
        const { data: stock, error: stockError } = await supabase
          .from('stocks')
          .select('*')
          .eq('ticker', validated.targetTicker.toUpperCase())
          .single();

        if (stockError || !stock) {
          return NextResponse.json(createErrorResponse('Stock not found'), { status: 404 });
        }

        // Get user's position
        const { data: position, error: positionError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', profile.id)
          .eq('ticker', stock.ticker)
          .single();

        if (positionError || !position) {
          return NextResponse.json(
            createErrorResponse(`You don't own any shares of ${stock.ticker}`),
            { status: 400 }
          );
        }

        // Calculate stop-loss price (20% below current price)
        const stopLossPrice = stock.current_price * 0.8;

        // Update portfolio with stop-loss
        await supabase
          .from('portfolios')
          .update({
            stop_loss_price: stopLossPrice,
            stop_loss_contract_id: inventoryItem.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', position.id);

        result = {
          message: `Stop-loss contract attached to ${stock.ticker} at $${stopLossPrice.toFixed(2)}`,
          stopLossPrice,
          ticker: stock.ticker,
        };
        break;

      // Corporate Espionage Key
      case 'corporate_espionage_key':
        if (!validated.targetTicker) {
          return NextResponse.json(
            createErrorResponse('Please specify a ticker to spy on'),
            { status: 400 }
          );
        }

        // Get stock
        const { data: targetStock } = await supabase
          .from('stocks')
          .select('ticker, base_volatility')
          .eq('ticker', validated.targetTicker.toUpperCase())
          .single();

        if (!targetStock) {
          return NextResponse.json(createErrorResponse('Stock not found'), { status: 404 });
        }

        result = {
          message: `Stock ${targetStock.ticker} has a base volatility of ${(targetStock.base_volatility * 100).toFixed(2)}%`,
          ticker: targetStock.ticker,
          baseVolatility: targetStock.base_volatility,
        };
        break;

      // Pump Card
      case 'pump_card':
        if (!validated.targetTicker) {
          return NextResponse.json(
            createErrorResponse('Please specify a ticker to pump'),
            { status: 400 }
          );
        }

        // Schedule manipulation
        await supabase
          .from('manipulation_queue')
          .insert({
            user_id: profile.id,
            discord_id: session.user.id,
            ticker: validated.targetTicker.toUpperCase(),
            manipulation_type: 'PUMP',
            amount: 0.15,
            scheduled_for: new Date(Date.now() + 1000).toISOString(),
            is_executed: false,
          });

        result = {
          message: `Pump card used on ${validated.targetTicker}. Will take effect on next market tick.`,
          ticker: validated.targetTicker,
          manipulationType: 'PUMP',
        };
        break;

      // Dump Card
      case 'dump_card':
        if (!validated.targetTicker) {
          return NextResponse.json(
            createErrorResponse('Please specify a ticker to dump'),
            { status: 400 }
          );
        }

        // Schedule manipulation
        await supabase
          .from('manipulation_queue')
          .insert({
            user_id: profile.id,
            discord_id: session.user.id,
            ticker: validated.targetTicker.toUpperCase(),
            manipulation_type: 'DUMP',
            amount: 0.15,
            scheduled_for: new Date(Date.now() + 1000).toISOString(),
            is_executed: false,
          });

        result = {
          message: `Dump card used on ${validated.targetTicker}. Will take effect on next market tick.`,
          ticker: validated.targetTicker,
          manipulationType: 'DUMP',
        };
        break;

      default:
        result = { message: 'Item used successfully' };
    }

    // Consume the item if it's consumable
    if (inventoryItem.shop_items.is_consumable) {
      await supabase
        .from('inventories')
        .update({
          quantity: inventoryItem.quantity - 1,
          last_used_at: new Date().toISOString(),
          uses_remaining: inventoryItem.uses_remaining !== null 
            ? inventoryItem.uses_remaining - 1 
            : null,
        })
        .eq('id', inventoryItem.id);
    }

    // Update last used time
    await supabase
      .from('inventories')
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq('id', inventoryItem.id);

    return NextResponse.json(createSuccessResponse({
      message: 'Item used successfully',
      ...result,
    }));
  } catch (error) {
    console.error('Error in PUT /api/shop:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
