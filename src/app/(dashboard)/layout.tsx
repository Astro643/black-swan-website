// ============================================
// DASHBOARD LAYOUT
// Wraps all authenticated pages
// ============================================

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/wrappers';
import { getUserProfile } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

// ============================================
// DASHBOARD LAYOUT COMPONENT
// ============================================

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If user is not logged in, redirect to login
  if (!session) {
    redirect('/login');
  }

  // Get user profile
  const profile = await getUserProfile();

  // If profile doesn't exist, redirect to create profile
  if (!profile) {
    redirect('/login');
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex min-h-screen bg-surface-white">
      {/* Sidebar */}
      <Sidebar user={profile} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen ml-0 md:ml-[250px]">
        {/* Header */}
        <Header user={profile} />
        
        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
