// ============================================
// STOCKS API ROUTE
// Handles stock data operations
// ============================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const GetStocksSchema = z.object({
  category: z.string().optional(),
  activeOnly: z.boolean().optional().default(true),
  limit: z.number().optional().default(100),
  offset: z.number().optional().default(0),
});

const GetStockSchema = z.object({
  ticker: z.string().min(1).max(10),
});

const UpdateStockSchema = z.object({
  ticker: z.string().min(1).max(10),
  current_price: z.number().positive().optional(),
  base_volatility: z.number().min(0.01).max(0.15).optional(),
  is_manipulated: z.boolean().optional(),
  manipulated_by: z.string().optional(),
  manipulated_type: z.enum(['PUMP', 'DUMP']).optional(),
});

// ============================================
// GET - Get all stocks or specific stock
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createServerSupabaseClient();

    // Return one stock when a ticker query parameter is supplied.
    const requestedTicker = searchParams.get('ticker');
    if (requestedTicker) {
      const validatedTicker = GetStockSchema.parse({ ticker: requestedTicker.toUpperCase() });
      const { data: stock, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('ticker', validatedTicker.ticker)
        .maybeSingle();

      if (stockError) {
        return NextResponse.json(createErrorResponse(stockError.message), { status: 400 });
      }
      if (!stock) {
        return NextResponse.json(createErrorResponse('Stock not found'), { status: 404 });
      }
      return NextResponse.json(createSuccessResponse(stock));
    }

    // Parse query parameters
    const query = {
      category: searchParams.get('category'),
      activeOnly: searchParams.get('activeOnly') !== 'false',
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const validated = GetStocksSchema.parse(query);

    // Build query
    let queryBuilder = supabase
      .from('stocks')
      .select('*', { count: 'exact' });

    // Apply filters
    if (validated.category) {
      queryBuilder = queryBuilder.eq('category', validated.category);
    }

    if (validated.activeOnly) {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    // Apply pagination
    queryBuilder = queryBuilder
      .order('ticker', { ascending: true })
      .range(validated.offset, validated.offset + validated.limit - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }

    return NextResponse.json(createSuccessResponse({
      data,
      count,
      page: Math.floor(validated.offset / validated.limit) + 1,
      limit: validated.limit,
      totalPages: count ? Math.ceil(count / validated.limit) : 0,
    }));
  } catch (error) {
    console.error('Error in GET /api/stocks:', error);
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
// POST - Admin: Create or update stock
// ============================================

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user is admin
    if (!session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    // In production, check admin status
    // For now, we'll allow it if user is authenticated
    const body = await request.json();
    const validated = UpdateStockSchema.parse(body);

    // Check if stock exists
    const { data: existingStock, error: fetchError } = await supabase
      .from('stocks')
      .select('*')
      .eq('ticker', validated.ticker)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json(createErrorResponse(fetchError.message), { status: 400 });
    }

    // Update or insert
    const updateData: Record<string, any> = {
      ticker: validated.ticker,
      updated_at: new Date().toISOString(),
    };

    if (validated.current_price !== undefined) {
      updateData.current_price = validated.current_price;
      updateData.last_price_update = new Date().toISOString();
    }
    if (validated.base_volatility !== undefined) {
      updateData.base_volatility = validated.base_volatility;
    }
    if (validated.is_manipulated !== undefined) {
      updateData.is_manipulated = validated.is_manipulated;
    }
    if (validated.manipulated_by !== undefined) {
      updateData.manipulated_by = validated.manipulated_by;
    }
    if (validated.manipulated_type !== undefined) {
      updateData.manipulated_type = validated.manipulated_type;
      updateData.manipulated_at = new Date().toISOString();
    }

    const { data, error } = existingStock
      ? await supabase
          .from('stocks')
          .update(updateData)
          .eq('id', existingStock.id)
          .select()
          .single()
      : await supabase
          .from('stocks')
          .insert({
            ...updateData,
            name: validated.ticker,
            category: 'TECH',
            is_active: true,
            volume_24h: 0,
            market_cap: 0,
          })
          .select()
          .single();

    if (error) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }

    return NextResponse.json(createSuccessResponse(data));
  } catch (error) {
    console.error('Error in POST /api/stocks:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 });
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
