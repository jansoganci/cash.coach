import React from 'react';
import { cn } from '@/lib/utils';

/**
 * A collection of financial-themed loading spinners
 */

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent' | 'white';
}

// Sizing utility
const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

// Color utility
const variantClasses = {
  primary: 'text-primary-600',
  secondary: 'text-gray-600',
  accent: 'text-green-600',
  white: 'text-white',
};

// Coin Flip Spinner
export function CoinSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary'
}: SpinnerProps) {
  return (
    <div className={cn(
      'relative animate-flip',
      sizeClasses[size],
      className
    )}>
      <div className={cn(
        'absolute inset-0 rounded-full border-2 border-current opacity-25',
        variantClasses[variant]
      )}></div>
      <div className={cn(
        'absolute inset-0 rounded-full border-t-2 border-current',
        variantClasses[variant]
      )}>
        <span className="absolute top-0 left-1/2 -ml-0.5 h-1.5 w-1 bg-current"></span>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Chart Loading Spinner
export function ChartSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary'
}: SpinnerProps) {
  return (
    <div className={cn(
      'flex items-end justify-center space-x-1',
      sizeClasses[size],
      className
    )}>
      <div className={cn(
        'h-1/3 w-1.5 animate-chart-bar-1 rounded-t',
        variantClasses[variant]
      )}></div>
      <div className={cn(
        'h-2/3 w-1.5 animate-chart-bar-2 rounded-t',
        variantClasses[variant]
      )}></div>
      <div className={cn(
        'h-full w-1.5 animate-chart-bar-3 rounded-t',
        variantClasses[variant]
      )}></div>
      <div className={cn(
        'h-1/2 w-1.5 animate-chart-bar-4 rounded-t',
        variantClasses[variant]
      )}></div>
      <div className={cn(
        'h-3/4 w-1.5 animate-chart-bar-5 rounded-t',
        variantClasses[variant]
      )}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Dollar Sign Spinner
export function DollarSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary'
}: SpinnerProps) {
  return (
    <div className={cn(
      'relative animate-pulse',
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      <div className="flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v8m0 0v4m0-4h4m-4 0H8" 
            className="animate-dash"
          />
        </svg>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Wallet Spinner
export function WalletSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary'
}: SpinnerProps) {
  return (
    <div className={cn(
      'relative',
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="h-full w-full animate-bounce" 
        stroke="currentColor"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="2" />
        <path d="M22 10H18C16.8954 10 16 10.8954 16 12V12C16 13.1046 16.8954 14 18 14H22" strokeWidth="2" />
        <circle cx="18" cy="12" r="1" fill="currentColor" className="animate-ping" />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Main Spinner Component that combines all spinners
export function FinancialSpinner({ 
  className, 
  size = 'md', 
  variant = 'primary',
  type = 'dollar'
}: SpinnerProps & { 
  type?: 'coin' | 'chart' | 'dollar' | 'wallet' | 'random' 
}) {
  // Use random spinner if specified
  if (type === 'random') {
    const spinners = ['coin', 'chart', 'dollar', 'wallet'];
    type = spinners[Math.floor(Math.random() * spinners.length)] as any;
  }

  switch (type) {
    case 'coin':
      return <CoinSpinner className={className} size={size} variant={variant} />;
    case 'chart':
      return <ChartSpinner className={className} size={size} variant={variant} />;
    case 'wallet':
      return <WalletSpinner className={className} size={size} variant={variant} />;
    case 'dollar':
    default:
      return <DollarSpinner className={className} size={size} variant={variant} />;
  }
}