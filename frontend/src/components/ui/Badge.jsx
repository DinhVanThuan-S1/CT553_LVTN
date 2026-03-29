/**
 * Badge Component (shadcn-style)
 */
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-600 border-red-500/20',
  secondary: 'bg-muted text-muted-foreground border-border',
  outline: 'bg-transparent text-foreground border-border',
};

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
