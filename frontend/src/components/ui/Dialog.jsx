/**
 * Dialog / Modal Component (shadcn-style)
 */
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export function Dialog({ open, onClose, children, className }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose?.()}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />
      {/* Content */}
      <div
        className={cn(
          'relative z-50 w-full max-h-[90vh] overflow-y-auto bg-card border rounded-xl shadow-2xl animate-in zoom-in-95 mx-4',
          className || 'max-w-lg'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h3 className="text-lg font-semibold">{children}</h3>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function DialogBody({ children, className }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function DialogFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30', className)}>
      {children}
    </div>
  );
}
