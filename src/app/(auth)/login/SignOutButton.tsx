'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    setLoading(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError('Supabase public environment variables are missing.');
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient(url, key);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setLoading(false);
      return;
    }

    window.location.replace('/login');
  };

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="rounded-md bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-60"
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
      {error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}
