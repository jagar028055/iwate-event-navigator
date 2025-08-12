import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      ariaLabel,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = clsx(
      // Base styles
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
      'active:transform active:scale-95',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none',
      
      // Variant styles
      {
        'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg': variant === 'primary',
        'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50': variant === 'secondary',
        'bg-transparent text-primary-600 border border-primary-300 hover:bg-primary-50 hover:border-primary-400': variant === 'outline',
        'bg-transparent text-gray-600 hover:bg-gray-100': variant === 'ghost',
        'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg': variant === 'danger',
      },
      
      // Size styles
      {
        'px-3 py-1.5 text-sm min-h-[32px]': size === 'sm',
        'px-4 py-2 text-base min-h-[40px]': size === 'md',
        'px-6 py-3 text-lg min-h-[48px]': size === 'lg',
      },
      
      // Full width
      {
        'w-full': fullWidth,
      },
      
      // Loading state
      {
        'pointer-events-none': loading,
      },
      
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={baseClasses}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={clsx({ 'sr-only': loading && !children })}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };