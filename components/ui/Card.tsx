import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  as?: React.ElementType;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = 'default',
      padding = 'md',
      interactive = false,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const baseClasses = clsx(
      // Base styles
      'rounded-lg',
      
      // Variant styles
      {
        'bg-white shadow-sm border border-gray-200': variant === 'default',
        'bg-white shadow-md hover:shadow-lg transition-shadow': variant === 'elevated',
        'bg-white border-2 border-gray-300': variant === 'outlined',
        'bg-gray-50 border border-gray-200': variant === 'filled',
      },
      
      // Padding styles
      {
        'p-0': padding === 'none',
        'p-3': padding === 'sm',
        'p-4': padding === 'md',
        'p-6': padding === 'lg',
      },
      
      // Interactive styles
      {
        'cursor-pointer hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': interactive,
      },
      
      className
    );

    return (
      <Component
        ref={ref}
        className={baseClasses}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx('border-b border-gray-200 pb-3 mb-4', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx('space-y-2', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx('border-t border-gray-200 pt-3 mt-4 flex items-center justify-between', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardFooter.displayName = 'CardFooter';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className, level = 3, ...props }, ref) => {
    const Component = `h${level}` as React.ElementType;
    
    return (
      <Component
        ref={ref}
        className={clsx(
          'font-semibold text-gray-900 leading-tight',
          {
            'text-2xl': level === 1,
            'text-xl': level === 2,
            'text-lg': level === 3,
            'text-base': level === 4,
            'text-sm': level === 5,
            'text-xs': level === 6,
          },
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={clsx('text-gray-600 text-sm leading-relaxed', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
};

export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
};