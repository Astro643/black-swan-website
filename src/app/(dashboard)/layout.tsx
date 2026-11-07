// ============================================
// DASHBOARD LAYOUT
// Wraps all authenticated pages
// ============================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const profile = await getUserProfile();

  // Do not redirect to a login page that redirects authenticated users
  // back to /trading. The login page now displays a recoverable profile error.
  if (!profile) {
    redirect('/login?error=profile_missing');
  }

  return (
    <div className="flex min-h-screen bg-surface-white">
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-h-screen ml-0 md:ml-[250px]">
        <Header user={profile} />
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
