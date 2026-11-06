// ============================================
// BADGE COMPONENT
// Small inline status indicators
// ============================================

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';

// ============================================
// BADGE VARIANTS
// ============================================

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface-100 text-text-primary',
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-surface-200 text-text-secondary',
        destructive: 'bg-danger/10 text-danger',
        warning: 'bg-warning/10 text-warning',
        success: 'bg-success/10 text-success',
        info: 'bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ============================================
// BADGE PROPS
// ============================================

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

// ============================================
// BADGE COMPONENT
// ============================================

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, dot = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      >
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================
// EXPORT
// ============================================

export { Badge, badgeVariants };
