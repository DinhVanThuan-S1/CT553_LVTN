/**
 * Toast notification system
 * Sử dụng: import { toast } from '../components/ui/Toast';
 * toast.success('Thành công!');
 * toast.error('Có lỗi!');
 */
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(null);

let globalAddToast = null;

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600',
  error: 'border-red-500/30 bg-red-500/5 text-red-600',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-600',
  info: 'border-blue-500/30 bg-blue-500/5 text-blue-600',
};

function ToastItem({ id, type, message, onRemove }) {
  const Icon = icons[type];
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm',
      'animate-in slide-in-from-right fade-in duration-300',
      styles[type]
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => onRemove(id)} className="opacity-50 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
  }, [addToast]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const addToast = useContext(ToastContext);
  return {
    success: (msg) => addToast?.('success', msg),
    error: (msg) => addToast?.('error', msg),
    warning: (msg) => addToast?.('warning', msg),
    info: (msg) => addToast?.('info', msg),
  };
}

// Global toast (dùng bên ngoài React components)
export const toast = {
  success: (msg) => globalAddToast?.('success', msg),
  error: (msg) => globalAddToast?.('error', msg),
  warning: (msg) => globalAddToast?.('warning', msg),
  info: (msg) => globalAddToast?.('info', msg),
};
