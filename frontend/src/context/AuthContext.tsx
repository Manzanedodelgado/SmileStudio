// ─── Auth Context — SmileStudio ──────────────────────────
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService, tokenStorage, type AuthUser } from '../services/authService';

interface AuthState {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(tokenStorage.getUser());
    const [loading, setLoading] = useState<boolean>(true);

    // Al montar: verifica que el token sigue siendo válido
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!authService.isAuthenticated()) {
                setLoading(false);
                return;
            }

            const profile = await authService.getProfile();
            if (!cancelled) {
                setUser(profile);
                setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const authUser = await authService.login(email, password);
        setUser(authUser);
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
}
