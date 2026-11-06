// ============================================
// AUTH CALLBACK ROUTE
// Handles Discord OAuth callback
// ============================================

import { createRouteHandler } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ============================================
// CALLBACK HANDLER
// ============================================

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ============================================
  // SUPABASE CLIENT SETUP
  // ============================================

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  // ============================================
  // EXCHANGE CODE FOR SESSION
  // ============================================

  try {
    const cookieStore = cookies();
    
    // Create Supabase client
    const supabase = createRouteHandler({
      cookies: () => cookieStore,
    });

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    // ============================================
    // CHECK IF USER EXISTS IN DATABASE
    // ============================================

    if (data.session?.user) {
      const discordId = data.session.user.id;
      const username = data.session.user.user_metadata?.user_name || data.session.user.email || 'User';
      const discriminator = data.session.user.user_metadata?.user_discriminator || '0';
      const avatar = data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture || null;

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('discord_id', discordId)
        .single();

      // Create user profile if it doesn't exist
      if (!profile && !profileError?.code?.includes('PGRST116')) {
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            discord_id: discordId,
            username: username,
            discriminator: discriminator,
            avatar: avatar,
            cash: 1000,
            net_worth: 1000,
            loan_amount: 0,
            loan_taken_at: null,
            last_interest_at: null,
            loan_payments_missed: 0,
            total_earnings: 0,
            total_spent: 0,
            cosmetic_ids: [],
            has_analyst_pass: false,
            is_liquidated: false,
            last_tax_at: null,
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
        }
      }
    }

    // ============================================
    // REDIRECT TO DASHBOARD
    // ============================================

    return NextResponse.redirect(new URL('/trading', request.url));
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
