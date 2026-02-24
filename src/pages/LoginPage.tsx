import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const err = await login(email, password);
        if (err) setError(err);
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0e1a 0%, #101827 50%, #0f172a 100%)',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />
            </div>

            <div style={{ width: 420, position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
                    }}>
                        <MapPin size={30} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', margin: 0 }}>
                        GeoField
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                        Centro de Mando — Inicio de Sesión
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: 20, padding: '36px 32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                }}>
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Correo Electrónico
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                                <input
                                    type="email" required autoFocus
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@geofield.mx"
                                    style={{
                                        width: '100%', padding: '13px 14px 13px 42px', borderRadius: 12,
                                        border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.4)',
                                        color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.15)'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                                <input
                                    type={showPw ? 'text' : 'password'} required
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '13px 44px 13px 42px', borderRadius: 12,
                                        border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(15,23,42,0.4)',
                                        color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.15)'}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4,
                                }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 10, marginBottom: 20,
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <Lock size={14} /> {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                            fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                            background: loading ? '#1e40af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                            transition: 'all 0.2s',
                        }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>

                {/* Demo credentials */}
                <div style={{
                    marginTop: 24, textAlign: 'center', fontSize: 12, color: '#475569',
                    background: 'rgba(15,23,42,0.3)', borderRadius: 12, padding: '14px 20px',
                    border: '1px solid rgba(148,163,184,0.06)',
                }}>
                    <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Cuentas Demo</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                        <div><span style={{ color: '#94a3b8' }}>admin@geofield.mx</span> / admin123</div>
                        <div><span style={{ color: '#94a3b8' }}>admin@geofield.co</span> / admin123</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
