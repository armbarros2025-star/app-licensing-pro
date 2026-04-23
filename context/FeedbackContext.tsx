import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
}

interface ToastItem extends Required<Omit<ToastOptions, 'durationMs'>> {
  id: string;
  durationMs: number;
}

interface ConfirmRequest {
  id: string;
  options: ConfirmOptions;
  resolve: (accepted: boolean) => void;
}

interface FeedbackContextType {
  showToast: (options: ToastOptions) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

const createId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmQueue, setConfirmQueue] = useState<ConfirmRequest[]>([]);
  const dismissTimers = useRef<Map<string, number>>(new Map());
  const confirmQueueRef = useRef<ConfirmRequest[]>([]);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string>('');
  const confirmDialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmQueueRef.current = confirmQueue;
  }, [confirmQueue]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timer = dismissTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      dismissTimers.current.delete(id);
    }
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = createId();
    const toast: ToastItem = {
      id,
      type: options.type ?? 'info',
      title: options.title,
      description: options.description ?? '',
      durationMs: options.durationMs ?? 4200
    };

    setToasts(prev => [...prev, toast]);

    const timer = window.setTimeout(() => removeToast(id), toast.durationMs);
    dismissTimers.current.set(id, timer);
  }, [removeToast]);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmQueue(prev => [...prev, { id: createId(), options, resolve }]);
    });
  }, []);

  const currentConfirm = confirmQueue[0];

  const settleCurrentConfirm = useCallback((accepted: boolean) => {
    setConfirmQueue(prev => {
      if (prev.length === 0) return prev;
      prev[0].resolve(accepted);
      return prev.slice(1);
    });
  }, []);

  useEffect(() => {
    if (!currentConfirm) return;

    previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const focusRaf = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        settleCurrentConfirm(false);
        return;
      }

      if (event.key === 'Tab') {
        const container = confirmDialogRef.current;
        if (!container) return;

        const focusable = Array.from(
          container.querySelectorAll(
            'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement && !element.hasAttribute('disabled') && element.tabIndex !== -1
        );

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEsc);
    return () => {
      window.cancelAnimationFrame(focusRaf);
      document.body.style.overflow = previousBodyOverflowRef.current;
      document.removeEventListener('keydown', onEsc);
      previousFocusedElementRef.current?.focus?.();
    };
  }, [currentConfirm, settleCurrentConfirm]);

  useEffect(() => {
    return () => {
      dismissTimers.current.forEach(timer => window.clearTimeout(timer));
      dismissTimers.current.clear();
      confirmQueueRef.current.forEach(item => item.resolve(false));
    };
  }, []);

  const value = useMemo(() => ({ showToast, confirmAction }), [showToast, confirmAction]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,380px)] flex-col gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const appearance = {
            success: {
              icon: <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />,
              container: 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
            },
            error: {
              icon: <XCircle className="mt-0.5 h-5 w-5 text-rose-600" />,
              container: 'border-rose-200 bg-rose-50/95 text-rose-900'
            },
            warning: {
              icon: <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />,
              container: 'border-amber-200 bg-amber-50/95 text-amber-900'
            },
            info: {
              icon: <Info className="mt-0.5 h-5 w-5 text-sky-600" />,
              container: 'border-sky-200 bg-sky-50/95 text-sky-900'
            }
          }[toast.type];

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
              className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${appearance.container}`}
            >
              <div className="flex items-start gap-3">
                {appearance.icon}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black leading-tight">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-1 text-xs font-semibold opacity-90">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/50 hover:text-slate-700"
                  aria-label="Fechar aviso"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentConfirm && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              settleCurrentConfirm(false);
            }
          }}
        >
          <div
            ref={confirmDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`confirm-title-${currentConfirm.id}`}
            aria-describedby={currentConfirm.options.description ? `confirm-description-${currentConfirm.id}` : undefined}
            className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 id={`confirm-title-${currentConfirm.id}`} className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {currentConfirm.options.title}
            </h3>
            {currentConfirm.options.description && (
              <p id={`confirm-description-${currentConfirm.id}`} className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                {currentConfirm.options.description}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => settleCurrentConfirm(false)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {currentConfirm.options.cancelText ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => settleCurrentConfirm(true)}
                className={`rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors ${
                  currentConfirm.options.tone === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {currentConfirm.options.confirmText ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};
