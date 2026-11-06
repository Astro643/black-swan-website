// ============================================
// CARD COMPONENT
// Reusable card container with clean styling
// ============================================

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// CARD PROPS
// ============================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// ============================================
// CARD COMPONENT
// ============================================

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const variantClasses = {
      default: 'bg-surface-white',
      bordered: 'bg-surface-white border border-border-light',
      elevated: 'bg-surface-white border border-border-light shadow-md',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: '',
      bordered: 'border-b border-border-light',
    };

    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================
// CARD TITLE
// ============================================

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, variant = 'h3', children, ...props }, ref) => {
    const Tag = variant;
    return (
      <Tag
        ref={ref}
        className={cn('font-semibold text-text-primary', className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// ============================================
// CARD DESCRIPTION
// ============================================

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-text-secondary', className)}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

// ============================================
// CARD CONTENT
// ============================================

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

// ============================================
// CARD FOOTER
// ============================================

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: '',
      bordered: 'border-t border-border-light',
    };

    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', variantClasses[variant], className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

// ============================================
// EXPORT
// ============================================

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
