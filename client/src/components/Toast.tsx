import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Icons } from './Icons';

export type Toast = {
  id: number;
  type?: 'success' | 'info' | 'warn' | 'error';
  title: string;
  desc?: string;
};

type ToastContextValue = {
  push: (t: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);

  const iconFor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <Icons.Check size={16} />;
      case 'warn':
      case 'error': return <Icons.AlertTriangle size={16} />;
      default: return <Icons.Info size={16} />;
    }
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type || 'info'}`}>
            <div className="toast__icon">{iconFor(t.type)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="toast__title">{t.title}</div>
              {t.desc && <div className="toast__desc">{t.desc}</div>}
            </div>
            <button
              className="icon-btn"
              style={{ width: 24, height: 24 }}
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <Icons.X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
