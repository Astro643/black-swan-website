import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getPublicOrigin(request: Request): string {
  const configuredUrl = process.env.RENDER_EXTERNAL_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto?.split(',')[0]?.trim() || 'https';

  if (!host || host.startsWith('localhost')) {
    throw new Error('Could not determine the public Render host for the auth callback.');
  }

  return `${protocol}://${host}`;
}

export async function GET(request: Request) {
  let origin: string;

  try {
    origin = getPublicOrigin(request);
  } catch (error) {
    console.error('Auth callback could not determine public origin:', error);
    return NextResponse.json({ error: 'Public website URL is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Supabase OAuth code exchange failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
    }

    if (data.session?.user) {
      const authUserId = data.session.user.id;
      const metadata = data.session.user.user_metadata || {};
      const username = metadata.user_name || metadata.full_name || data.session.user.email || 'User';
      const discriminator = metadata.user_discriminator || '0';
      const avatar = metadata.avatar_url || metadata.picture || null;

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('discord_id', authUserId)
        .maybeSingle();

      if (!profile && !profileError) {
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            discord_id: authUserId,
            username,
            discriminator,
            avatar,
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
          console.error('Could not create initial user profile:', createError);
        }
      } else if (profileError) {
        console.error('Could not check initial user profile:', profileError);
      }
    }

    return NextResponse.redirect(new URL('/trading', origin));
  } catch (error) {
    console.error('Unexpected auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', origin));
  }
}
