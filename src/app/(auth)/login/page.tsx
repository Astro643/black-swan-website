// ============================================
// LOGIN PAGE
// Discord OAuth authentication
// ============================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// ============================================
// LOGIN PAGE COMPONENT
// ============================================

export default async function LoginPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is already logged in, redirect to trading floor
  if (session) {
    redirect('/trading');
  }

  // ============================================
  // DISCORD OAUTH URL
  // ============================================

  const redirectUrl = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 
    `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/auth/callback`;

  const discordAuthUrl = supabase.auth.signInWithOAuth({
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-surface-white flex flex-col items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-surface-white rounded-2xl border border-border-light shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Black Swan
          </h1>
          
          <p className="text-text-secondary">
            Sign in to access your trading dashboard
          </p>
        </div>

        {/* Discord Login Button */}
        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-4 text-lg"
            asChild
          >
            <a href={discordAuthUrl.data.url || '/auth/callback'}>
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Sign in with Discord
            </a>
          </Button>

          {/* Info */}
          <div className="text-center text-sm text-text-muted">
            <p className="mb-2">
              By signing in, you agree to our
              <Link href="/terms" className="text-primary hover:underline mx-1">
                Terms of Service
              </Link>
              and
              <Link href="/privacy" className="text-primary hover:underline ml-1">
                Privacy Policy
              </Link>
            </p>
            <p>
              We request 'identify' and 'guilds' scopes to verify your Discord account
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-primary hover:underline text-sm">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
