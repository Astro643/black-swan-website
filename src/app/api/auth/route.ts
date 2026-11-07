// ============================================
// AUTH API ROUTE
// Handles authentication operations
// ============================================

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils';

// ============================================
// GET - Get current session
// ============================================

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(createErrorResponse(error.message), { status: 401 });
    }

    if (!session) {
      return NextResponse.json(createErrorResponse('Not authenticated'), { status: 401 });
    }

    return NextResponse.json(createSuccessResponse(session));
  } catch (error) {
    console.error('Error in GET /api/auth:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// POST - Sign in with Discord
// ============================================

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { action } = await request.json();

    if (action === 'signin') {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const host = forwardedHost || request.headers.get('host');
      const forwardedProtocol = request.headers.get('x-forwarded-proto');
      const protocol = forwardedProtocol?.split(',')[0]?.trim() || 'https';

      if (!host) {
        return NextResponse.json(
          createErrorResponse('Unable to determine the website host'),
          { status: 500 }
        );
      }

      const redirectUrl = `${protocol}://${host}/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'identify guilds',
        },
      });

      if (error) {
        return NextResponse.json(createErrorResponse(error.message), { status: 400 });
      }

      return NextResponse.json(createSuccessResponse({ url: data.url }));
    }

    if (action === 'signout') {
      await supabase.auth.signOut();
      return NextResponse.json(createSuccessResponse({ message: 'Signed out successfully' }));
    }

    return NextResponse.json(createErrorResponse('Invalid action'), { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/auth:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Sign out
// ============================================

export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
    return NextResponse.json(createSuccessResponse({ message: 'Signed out successfully' }));
  } catch (error) {
    console.error('Error in DELETE /api/auth:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
