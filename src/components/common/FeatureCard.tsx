// ============================================
// FEATURE CARD COMPONENT
// Displays game features with icons
// ============================================

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// ICON COMPONENTS
// ============================================

const IconComponents: Record<string, React.ReactNode> = {
  'chart-line': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    </svg>
  ),
  'bolt': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'dollar-sign': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'shopping-bag': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'trophy': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  'message-square': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  'trending-up': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  'trending-down': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
};

// ============================================
// FEATURE CARD PROPS
// ============================================

interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: string;
  color?: string;
  hoverEffect?: boolean;
}

// ============================================
// FEATURE CARD COMPONENT
// ============================================

export function FeatureCard({
  title,
  description,
  icon,
  color = '#4B0082',
  hoverEffect = true,
  className,
  ...props
}: FeatureCardProps) {
  const iconComponent = IconComponents[icon] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-surface-white border border-border-light p-6 transition-all duration-300',
        hoverEffect && 'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
      {...props}
    >
      {/* Icon container */}
      <div
        className="mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="text-2xl" style={{ color }}>
          {iconComponent}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      
      {/* Description */}
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================
// EXPORT
// ============================================

export { FeatureCard };
