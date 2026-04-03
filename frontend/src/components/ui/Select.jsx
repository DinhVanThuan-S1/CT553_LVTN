/**
 * Select Component (shadcn-style)
 * Mũi tên native được ẩn bởi global CSS (index.css).
 * Chỉ hiện 1 mũi tên tùy chỉnh (ChevronDown).
 */
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full h-9 px-3 pr-8 rounded-lg border border-input bg-background text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
});

Select.displayName = 'Select';
export { Select };
