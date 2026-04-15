/**
 * CustomSelect - SkillMap-style dropdown
 * Dùng chung cho các trang employer
 * Dùng position:fixed để thoát khỏi overflow:hidden/auto
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * @param {string}   value      - giá trị hiện tại
 * @param {Function} onChange   - (value: string) => void
 * @param {Array}    options    - [{ value, label }]
 * @param {string}   placeholder - text khi chưa chọn
 * @param {string}   className  - override class ngoài wrapper
 */
export function CustomSelect({ value, onChange, options = [], placeholder, className = '' }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const updateRect = useCallback(() => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();

    function onScroll() { updateRect(); }
    function onClickOutside(e) {
      const inTrigger = triggerRef.current?.closest('[data-custom-select]')?.contains(e.target);
      const inPanel = panelRef.current?.contains(e.target);
      if (!inTrigger && !inPanel) setOpen(false);
    }
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, updateRect]);

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} data-custom-select>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { updateRect(); setOpen(v => !v); }}
        className={`w-full h-9 flex items-center gap-2 pl-3 pr-2.5 rounded-lg border text-sm font-medium transition-all ${
          open
            ? 'border-primary bg-background text-primary ring-2 ring-ring ring-offset-1'
            : 'border-input bg-background text-foreground hover:border-primary/60'
        }`}
      >
        <span className={`flex-1 text-left truncate ${!selected && placeholder ? 'text-muted-foreground font-normal' : ''}`}>
          {selected?.label ?? placeholder ?? value}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
          open ? 'rotate-180 text-primary' : 'text-muted-foreground'
        }`} />
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
          }}
          className="bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden animate-fade-in"
        >
          <div className="py-1.5 max-h-60 overflow-y-auto">
            {options.map(({ value: v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center gap-2 ${
                  value === v
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {value === v && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                <span className={value === v ? '' : 'ml-3.5'}>{label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

