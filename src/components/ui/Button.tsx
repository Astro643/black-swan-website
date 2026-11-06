// ============================================
// BUTTON COMPONENT
// Reusable button with Indigo theme
// ============================================

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';

// ============================================
// BUTTON VARIANTS
// ============================================

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-surface-white',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-dark',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        outline: 'border border-primary bg-transparent text-primary hover:bg-primary/10',
        secondary: 'bg-surface-100 text-text-primary hover:bg-surface-200',
        ghost: 'hover:bg-surface-100 hover:text-text-primary',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-12 px-6 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ============================================
// BUTTON PROPS
// ============================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// ============================================
// BUTTON COMPONENT
// ============================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// ============================================
// EXPORT
// ============================================

export { Button, buttonVariants };
