import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import Link from 'next/link';
import DiscordSignInButton from './DiscordSignInButton';

export default async function LoginPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/trading');
  }

  return (
    <div className="min-h-screen bg-surface-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-white rounded-2xl border border-border-light shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Black Swan</h1>
          <p className="text-text-secondary">Sign in to access your trading dashboard</p>
        </div>

        <div className="space-y-4">
          <DiscordSignInButton />

          <div className="text-center text-sm text-text-muted">
            <p className="mb-2">
              By signing in, you agree to our
              <Link href="/terms" className="text-primary hover:underline mx-1">Terms of Service</Link>
              and
              <Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>
            </p>
            <p>We request 'identify' and 'guilds' scopes to verify your Discord account</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-primary hover:underline text-sm">Back to Home</Link>
      </div>
    </div>
  );
}
