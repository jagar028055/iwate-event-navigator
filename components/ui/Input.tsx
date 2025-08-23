import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      variant = 'default',
      inputSize = 'md',
      className,
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const inputClasses = clsx(
      // Base styles
      'block transition-colors duration-200 focus:outline-none',
      
      // Variant styles
      {
        'border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent': variant === 'default',
        'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-primary-500 focus:ring-0': variant === 'filled',
        'border-2 border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-0': variant === 'outlined',
      },
      
      // Size styles
      {
        'px-3 py-1.5 text-sm': inputSize === 'sm',
        'px-4 py-2 text-base': inputSize === 'md',
        'px-5 py-3 text-lg': inputSize === 'lg',
      },
      
      // Full width
      {
        'w-full': fullWidth,
      },
      
      // Error states
      {
        'border-red-500 focus:ring-red-500 focus:border-red-500': hasError && variant === 'default',
        'border-red-500 focus:border-red-500': hasError && (variant === 'filled' || variant === 'outlined'),
      },
      
      // Disabled state
      {
        'bg-gray-50 text-gray-500 cursor-not-allowed': disabled,
      },
      
      // Icon padding adjustments
      {
        'pl-10': leftIcon && inputSize === 'md',
        'pl-9': leftIcon && inputSize === 'sm',
        'pl-12': leftIcon && inputSize === 'lg',
        'pr-10': rightIcon && inputSize === 'md',
        'pr-9': rightIcon && inputSize === 'sm',
        'pr-12': rightIcon && inputSize === 'lg',
      },
      
      className
    );

    const iconClasses = clsx(
      'absolute text-gray-400 pointer-events-none',
      {
        'w-4 h-4': inputSize === 'sm',
        'w-5 h-5': inputSize === 'md',
        'w-6 h-6': inputSize === 'lg',
      }
    );

    const leftIconClasses = clsx(
      iconClasses,
      {
        'left-3 top-1/2 transform -translate-y-1/2': inputSize === 'md',
        'left-2.5 top-1/2 transform -translate-y-1/2': inputSize === 'sm',
        'left-4 top-1/2 transform -translate-y-1/2': inputSize === 'lg',
      }
    );

    const rightIconClasses = clsx(
      iconClasses,
      {
        'right-3 top-1/2 transform -translate-y-1/2': inputSize === 'md',
        'right-2.5 top-1/2 transform -translate-y-1/2': inputSize === 'sm',
        'right-4 top-1/2 transform -translate-y-1/2': inputSize === 'lg',
      }
    );

    return (
      <div className={clsx('space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium',
              hasError ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-500'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="必須項目">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={leftIconClasses} aria-hidden="true">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={
              clsx(
                error && `${inputId}-error`,
                helperText && `${inputId}-helper`
              ) || undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className={rightIconClasses} aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-red-600 text-sm font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-gray-600 text-sm"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };