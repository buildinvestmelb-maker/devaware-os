import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ToastLevel } from '../../bridge/types';
import { useWindowStore } from '../../store/useWindowStore';

const TOAST_ICONS: Record<ToastLevel, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-[#3daee9]' },
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: XCircle, color: 'text-rose-400' },
};

export function ToastStack() {
  const toasts = useWindowStore((s) => s.toasts);
  const dismissToast = useWindowStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dismissToast(toast.id);
      }, 6500),
    );
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Workspace Notifications"
      className="pointer-events-none fixed right-3 bottom-16 z-50 flex w-80 max-w-[calc(100vw-24px)] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const meta = TOAST_ICONS[toast.level] ?? TOAST_ICONS.info;
        const Icon = meta.icon;

        return (
          <div
            key={toast.id}
            role="status"
            data-testid="toast-notification"
            className="plasma-glass animate-plasma-in pointer-events-auto flex items-start gap-2.5 rounded-xl px-3.5 py-3 shadow-2xl"
          >
            <Icon size={16} className={`mt-0.5 shrink-0 ${meta.color}`} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-100">
                {toast.title}
              </div>
              {toast.message && (
                <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
