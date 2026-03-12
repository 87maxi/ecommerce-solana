'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <>
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-[var(--card)] px-3 py-2 text-sm ring-offset-background placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-[var(--muted-light)] focus:border-[var(--primary)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };