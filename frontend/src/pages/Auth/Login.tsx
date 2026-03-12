import { useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            // El AuthContext actualiza user → App.tsx redirige automáticamente
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f4f7f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
        }}>
            {/* Blur decorations */}
            <div style={{
                position: 'absolute', top: '-20%', right: '-10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'rgba(219,234,254,0.5)',
                filter: 'blur(120px)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-20%', left: '-10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'rgba(239,246,255,0.5)',
                filter: 'blur(120px)',
            }} />

            <form onSubmit={handleSubmit} style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid #fff',
                boxShadow: '0 8px 32px rgba(0,40,85,0.08)',
                borderRadius: '2rem',
                padding: '40px',
                width: '100%',
                maxWidth: 420,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ShieldCheck size={32} color="#fff" />
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '1.5rem', fontWeight: 700, color: '#002855',
                        margin: 0, letterSpacing: '-0.025em',
                    }}>
                        SmileStudio <span style={{ color: '#0056b3' }}>2026</span>
                    </h1>
                    <p style={{
                        fontSize: 13, fontWeight: 500, textTransform: 'uppercase',
                        letterSpacing: '0.2em', color: '#64748b', marginTop: 4,
                    }}>
                        Rubio García Dental
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        width: '100%', padding: '10px 14px',
                        background: '#FFF0F3', border: '1px solid #fecdd3',
                        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
                        color: '#E03555', fontSize: 13, fontWeight: 500,
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Fields */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Email */}
                    <div>
                        <label style={{
                            fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'rgba(0,40,85,0.6)',
                            display: 'block', marginBottom: 6,
                        }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: '#94a3b8',
                            }} />
                            <input
                                type="email"
                                placeholder="usuario@smilestudio.io"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%', height: 48, padding: '0 14px 0 42px',
                                    background: '#f8fafc',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: 16,
                                    fontSize: 14, color: '#0f172a',
                                    outline: 'none', transition: 'all 200ms ease',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => {
                                    e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                                    e.target.style.borderColor = '#0056b3';
                                }}
                                onBlur={e => {
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.borderColor = '#f1f5f9';
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{
                            fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'rgba(0,40,85,0.6)',
                            display: 'block', marginBottom: 6,
                        }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: '#94a3b8',
                            }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', height: 48, padding: '0 14px 0 42px',
                                    background: '#f8fafc',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: 16,
                                    fontSize: 14, color: '#0f172a',
                                    outline: 'none', transition: 'all 200ms ease',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => {
                                    e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)';
                                    e.target.style.borderColor = '#0056b3';
                                }}
                                onBlur={e => {
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.borderColor = '#f1f5f9';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} style={{
                    width: '100%', height: 48, borderRadius: 16,
                    background: loading
                        ? 'linear-gradient(135deg, #93c5fd, #60a5fa)'
                        : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 20px 25px -5px rgba(30,58,138,0.1)',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms ease',
                }}>
                    {loading ? (
                        <div style={{
                            width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                    ) : (
                        <>
                            <LogIn size={16} />
                            ACCEDER AL SISTEMA
                        </>
                    )}
                </button>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                        Acceso restringido a personal autorizado
                    </p>
                    <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
                        © 2026 Rubio García Dental, SLP
                    </p>
                </div>
            </form>
        </div>
    );
}
