// ============================================
// INPUT COMPONENT
// Reusable input field with clean styling
// ============================================

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// INPUT PROPS
// ============================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost';
  error?: boolean;
  label?: string;
  helperText?: string;
}

// ============================================
// INPUT COMPONENT
// ============================================

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', error = false, label, helperText, type = 'text', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-surface-white border border-border-light',
      ghost: 'bg-transparent border-none',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            variantClasses[variant],
            error ? 'border-danger focus-visible:ring-danger/20' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className={cn('text-xs mt-2', error ? 'text-danger' : 'text-text-muted')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// EXPORT
// ============================================

export { Input };
