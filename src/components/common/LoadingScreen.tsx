// ============================================
// LOADING SCREEN COMPONENT
// Full-screen loading indicator
// ============================================

'use client';

import { cn } from '@/lib/utils';

// ============================================
// LOADING SCREEN PROPS
// ============================================

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

// ============================================
// LOADING SCREEN COMPONENT
// ============================================

export function LoadingScreen({ message = 'Loading...', className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-white/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full bg-primary" />
        </div>
        
        {/* Message */}
        <p className="text-text-primary font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// SMALL LOADING SPINNER
// ============================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={cn('animate-spin rounded-full border-primary/20 border-t-primary',
        sizeClasses[size], className)}
    />
  );
}

// ============================================
// SKELETON LOADING
// ============================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width = '100%', 
  height = 20 
}: SkeletonProps) {
  const baseClasses = 'bg-surface-100 animate-pulse';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width,
    height: variant === 'text' ? undefined : height,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}
