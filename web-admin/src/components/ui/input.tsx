'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <>
        <input
          className={cn(
            'flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-200 ring-offset-slate-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-cyan-500/30 focus:border-cyan-400/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </>
    );
  }
);
Input.displayName = 'Input';

export { Input };