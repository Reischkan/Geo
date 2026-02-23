import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    width?: number;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Modal({ open, onClose, title, subtitle, width = 520, children, footer }: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={ref}
                style={{
                    width, maxWidth: '94vw', maxHeight: '88vh',
                    background: 'linear-gradient(135deg, #111827 0%, #1a2236 100%)',
                    border: '1px solid var(--color-geo-border-light)',
                    borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'fadeInUp 0.25s ease',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '20px 24px 16px', borderBottom: '1px solid var(--color-geo-border)',
                }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
                        {subtitle && <p style={{ fontSize: 13, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: 'var(--color-geo-surface-2)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-geo-text-dim)', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-geo-surface-3)'; e.currentTarget.style.color = 'var(--color-geo-text)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-geo-surface-2)'; e.currentTarget.style.color = 'var(--color-geo-text-dim)'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '16px 24px', borderTop: '1px solid var(--color-geo-border)',
                        display: 'flex', justifyContent: 'flex-end', gap: 10,
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/* Reusable form field wrapper */
export function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-geo-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {label}
            </label>
            {children}
            {hint && <p style={{ fontSize: 11, color: 'var(--color-geo-text-dim)', marginTop: 4 }}>{hint}</p>}
        </div>
    );
}

/* Reusable buttons */
export function BtnPrimary({ children, onClick, disabled, style }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '9px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
                background: disabled ? 'var(--color-geo-surface-3)' : 'var(--color-geo-primary)',
                color: disabled ? 'var(--color-geo-text-dim)' : '#fff',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all 0.15s', ...style,
            }}
        >
            {children}
        </button>
    );
}

export function BtnSecondary({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '9px 20px', borderRadius: 10, border: '1px solid var(--color-geo-border)',
                fontSize: 13, fontWeight: 600, background: 'transparent',
                color: 'var(--color-geo-text-muted)', cursor: 'pointer',
                transition: 'all 0.15s', ...style,
            }}
        >
            {children}
        </button>
    );
}

export function BtnDanger({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '9px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
                background: 'rgba(239,68,68,0.15)', color: '#f87171',
                cursor: 'pointer', transition: 'all 0.15s', ...style,
            }}
        >
            {children}
        </button>
    );
}
