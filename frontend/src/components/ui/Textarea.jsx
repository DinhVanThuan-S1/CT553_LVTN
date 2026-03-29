/**
 * Textarea Component (shadcn-style)
 */
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm',
        'placeholder:text-muted-foreground resize-y',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
export { Textarea };
