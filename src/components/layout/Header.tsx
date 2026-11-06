// ============================================
// HEADER COMPONENT
// Top navigation header
// ============================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { UserProfileRow } from '@/types/database';

// ============================================
// HEADER PROPS
// ============================================

interface HeaderProps {
  user?: UserProfileRow | null;
}

// ============================================
// HEADER COMPONENT
// ============================================

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  // ============================================
  // RENDER
  // ============================================

  return (
    <header className="sticky top-0 bg-surface-white/80 backdrop-blur-md border-b border-border-light z-40">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
        {/* Left side - Page title */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-text-primary">
              {getPageTitle(pathname)}
            </h1>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center gap-4">
          {/* Net worth display */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-text-muted">Net Worth</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(user.net_worth)}
                </p>
              </div>
              
              {/* Divider */}
              <div className="w-px h-8 bg-border-light" />
              
              <div className="text-right">
                <p className="text-xs text-text-muted">Cash</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(user.cash)}
                </p>
              </div>
            </div>
          )}

          {/* Sign out button */}
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href="/api/auth?action=signout" method="POST">
              Sign Out
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// HELPER FUNCTION
// ============================================

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/trading':
      return 'Trading Floor';
    case '/portfolio':
      return 'Portfolio';
    case '/leaderboard':
      return 'Leaderboard';
    case '/shop':
      return 'Virtual Shop';
    case '/admin':
      return 'Admin Panel';
    default:
      return 'Dashboard';
  }
}

// ============================================
// EXPORT
// ============================================

export { Header };
