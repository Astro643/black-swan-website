// ============================================
// SIDEBAR COMPONENT
// Navigation sidebar with Indigo theme
// ============================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import type { UserProfileRow } from '@/types/database';

// ============================================
// SIDEBAR PROPS
// ============================================

interface SidebarProps {
  user?: UserProfileRow | null;
}

// ============================================
// NAVIGATION ITEMS
// ============================================

const navItems = [
  {
    label: 'Trading Floor',
    href: '/trading',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Shop',
    href: '/shop',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
];

// Admin navigation items
const adminNavItems = [
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ============================================
// SIDEBAR COMPONENT
// ============================================

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // Check if user is admin (simplified check)
  const isAdmin = user?.username === 'Astro643' || user?.discord_id === process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID;

  // ============================================
  // RENDER
  // ============================================

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[250px] bg-surface-white border-r border-border-light z-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border-light">
        <Link href="/trading" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-primary">Black Swan</span>
            <span className="text-xs text-text-muted">Stock Market</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary'
                )}
              >
                <span className="text-primary/60">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <div className="pt-4 border-t border-border-light mt-4">
              <p className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                Admin
              </p>
              <ul className="space-y-2">
                {adminNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary'
                      )}
                    >
                      <span className="text-primary/60">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ul>
      </nav>

      {/* User profile */}
      {user && (
        <div className="p-4 border-t border-border-light">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.username}
              </p>
              <p className="text-xs text-text-muted">
                {formatCurrency(user.cash)}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
