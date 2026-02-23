import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';

interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

interface ToastContextValue {
    toast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((type: Toast['type'], message: string) => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const icons = { success: <CheckCircle size={16} />, error: <AlertTriangle size={16} />, info: <Info size={16} /> };
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
                {toasts.map(t => (
                    <div
                        key={t.id}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 16px', borderRadius: 12, minWidth: 280, maxWidth: 420,
                            background: 'linear-gradient(135deg, #1a2236, #111827)',
                            border: `1px solid ${colors[t.type]}44`,
                            boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${colors[t.type]}22`,
                            animation: 'fadeInUp 0.3s ease', pointerEvents: 'auto',
                            color: 'var(--color-geo-text)',
                        }}
                    >
                        <div style={{ color: colors[t.type], flexShrink: 0 }}>{icons[t.type]}</div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.message}</div>
                        <button
                            onClick={() => dismiss(t.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-geo-text-dim)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
