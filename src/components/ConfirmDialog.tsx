import Modal, { BtnPrimary, BtnSecondary, BtnDanger } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
    open, onClose, onConfirm,
    title = '¿Estás seguro?',
    message,
    confirmText = 'Confirmar',
    variant = 'danger',
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            width={420}
            footer={
                <>
                    <BtnSecondary onClick={onClose}>Cancelar</BtnSecondary>
                    {variant === 'danger'
                        ? <BtnDanger onClick={() => { onConfirm(); onClose(); }}>{confirmText}</BtnDanger>
                        : <BtnPrimary onClick={() => { onConfirm(); onClose(); }}>{confirmText}</BtnPrimary>
                    }
                </>
            }
        >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: variant === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: variant === 'danger' ? '#f87171' : '#60a5fa',
                }}>
                    <AlertTriangle size={20} />
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-geo-text-muted)', lineHeight: 1.6 }}>{message}</p>
            </div>
        </Modal>
    );
}
