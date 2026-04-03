/**
 * ConfirmDialog - Hộp thoại xác nhận action nguy hiểm
 * Thay thế window.confirm() với UI đẹp hơn
 *
 * Usage:
 *   const [confirmState, setConfirm] = useState(null);
 *   // Mở: setConfirm({ title, message, onConfirm: () => doSomething() })
 *   // Đóng: setConfirm(null)
 *   <ConfirmDialog state={confirmState} onClose={() => setConfirm(null)} />
 */
import { useState } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from './Dialog';
import { Button } from './Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

/**
 * @param {object} props
 * @param {{ title, message, confirmLabel, variant, onConfirm } | null} props.state
 * @param {function} props.onClose
 */
export function ConfirmDialog({ state, onClose }) {
  const [loading, setLoading] = useState(false);

  if (!state) return null;

  const {
    title = 'Xác nhận',
    message = 'Bạn có chắc muốn thực hiện hành động này?',
    confirmLabel = 'Xác nhận',
    variant = 'danger',  // 'danger' | 'warning'
    onConfirm,
    icon,
  } = state;

  const isDanger = variant === 'danger';
  const Icon = icon || (isDanger ? Trash2 : AlertTriangle);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm?.();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onClose={onClose} className="max-w-sm">
      <DialogHeader onClose={onClose}>{title}</DialogHeader>
      <DialogBody>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            <Icon className={`w-5 h-5 ${isDanger ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{message}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {isDanger ? 'Hành động này không thể hoàn tác.' : 'Vui lòng xác nhận trước khi tiếp tục.'}
            </p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          type="button"
          size="sm"
          className={isDanger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
