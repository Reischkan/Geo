import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserInfo { id: string; email: string; name: string; role: string; }
interface TenantInfo { id: string; name: string; slug: string; logoUrl: string; }
interface AuthState {
    token: string | null;
    user: UserInfo | null;
    tenant: TenantInfo | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<string | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthState>({
    token: null, user: null, tenant: null, loading: true,
    login: async () => null, logout: () => { },
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('geofield_token'));
    const [user, setUser] = useState<UserInfo | null>(null);
    const [tenant, setTenant] = useState<TenantInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session from stored token
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (!res.ok) throw new Error('expired');
                return res.json();
            })
            .then(data => {
                setUser(data.user);
                setTenant(data.tenant);
            })
            .catch(() => {
                // Token expired / invalid
                localStorage.removeItem('geofield_token');
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const login = async (email: string, password: string): Promise<string | null> => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return err.message || 'Credenciales inválidas';
            }
            const data = await res.json();
            localStorage.setItem('geofield_token', data.token);
            setToken(data.token);
            setUser(data.user);
            setTenant(data.tenant);
            return null; // no error
        } catch {
            return 'Error de conexión al servidor';
        }
    };

    const logout = () => {
        localStorage.removeItem('geofield_token');
        setToken(null);
        setUser(null);
        setTenant(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, tenant, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
