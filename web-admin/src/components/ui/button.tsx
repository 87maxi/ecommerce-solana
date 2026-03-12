'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none',
          {
            // Variant styles
            'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 focus:ring-cyan-500':
              variant === 'primary',
            'bg-slate-700/50 border border-cyan-500/30 text-cyan-300 hover:bg-slate-600/50 hover:border-cyan-400/50 focus:ring-cyan-500':
              variant === 'secondary',
            'border border-cyan-500/30 bg-slate-800/50 text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-400/50 focus:ring-cyan-500':
              variant === 'outline',
            'text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400 focus:ring-cyan-500':
              variant === 'ghost',
            'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300 focus:ring-cyan-500':
              variant === 'link',

            // Size styles
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 py-2 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',

            // Loading state
            'opacity-70 cursor-not-allowed': loading,
          },
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin">
            <svg
              className="h-full w-full"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };