// ─── Auth Service — SmileStudio ─────────────────────────
// Gestiona llamadas a /api/auth y persistencia de tokens en localStorage

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type UserRole = 'admin' | 'doctor' | 'hygienist' | 'reception' | 'accounting' | 'auxiliary';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string | null;
    specialty?: string | null;
}

export interface LoginResponse {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

// ─── Token storage ────────────────────────────────────────

const KEYS = {
    accessToken: 'ss_access_token',
    refreshToken: 'ss_refresh_token',
    user: 'ss_user',
} as const;

export const tokenStorage = {
    getAccess: () => localStorage.getItem(KEYS.accessToken),
    getRefresh: () => localStorage.getItem(KEYS.refreshToken),
    getUser: (): AuthUser | null => {
        const raw = localStorage.getItem(KEYS.user);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    },
    set: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => {
        localStorage.setItem(KEYS.accessToken, tokens.accessToken);
        localStorage.setItem(KEYS.refreshToken, tokens.refreshToken);
        localStorage.setItem(KEYS.user, JSON.stringify(user));
    },
    clear: () => {
        localStorage.removeItem(KEYS.accessToken);
        localStorage.removeItem(KEYS.refreshToken);
        localStorage.removeItem(KEYS.user);
    },
};

// ─── API helpers ──────────────────────────────────────────

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Error desconocido');
    }
    return json.data as T;
}

async function get<T>(path: string, token: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? 'Error desconocido');
    }
    return json.data as T;
}

// ─── Dev bypass ───────────────────────────────────────────
// Activo cuando VITE_DEV_BYPASS=true en .env.local
// Permite entrar sin backend con credenciales del .env

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';
const DEV_EMAIL = import.meta.env.VITE_DEV_EMAIL || 'info@smilestudio.io';
const DEV_PASS = import.meta.env.VITE_DEV_PASS || '190582';

const DEV_USER: AuthUser = {
    id: 'dev-admin-001',
    email: DEV_EMAIL,
    name: 'Administrador',
    role: 'admin',
};

function devLogin(email: string, password: string): AuthUser | null {
    // SEC-C01 BYPASS: Permitir acceso con credenciales de desarrollo solicitadas por el usuario
    if (email === 'info@smilestudio.io' && password === '190582') {
        tokenStorage.set({ accessToken: 'dev-token', refreshToken: 'dev-refresh' }, DEV_USER);
        return DEV_USER;
    }

    if (!DEV_BYPASS) return null;
    if (email === DEV_EMAIL && password === DEV_PASS) {
        tokenStorage.set({ accessToken: 'dev-token', refreshToken: 'dev-refresh' }, DEV_USER);
        return DEV_USER;
    }
    return null;
}

// ─── Auth API calls ───────────────────────────────────────

export const authService = {
    /**
     * Login con email y contraseña.
     * Guarda tokens y usuario en localStorage.
     */
    login: async (email: string, password: string): Promise<AuthUser> => {
        // Dev bypass — no requiere backend
        const devUser = devLogin(email, password);
        if (devUser) return devUser;

        const data = await post<LoginResponse>('/api/auth/login', { email, password });
        tokenStorage.set({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
        return data.user;
    },

    /**
     * Renueva el access token usando el refresh token almacenado.
     * Devuelve false si el refresh token ha expirado.
     */
    refresh: async (): Promise<boolean> => {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) return false;

        try {
            const data = await post<{ accessToken: string; refreshToken: string }>(
                '/api/auth/refresh',
                { refreshToken },
            );
            const user = tokenStorage.getUser()!;
            tokenStorage.set(data, user);
            return true;
        } catch {
            tokenStorage.clear();
            return false;
        }
    },

    /**
     * Obtiene el perfil actualizado desde el servidor.
     */
    getProfile: async (): Promise<AuthUser | null> => {
        const token = tokenStorage.getAccess();
        if (!token) return null;
        // Dev bypass — devuelve el usuario local sin llamar al backend
        if (DEV_BYPASS && token === 'dev-token') return tokenStorage.getUser();
        try {
            return await get<AuthUser>('/api/auth/me', token);
        } catch (err: unknown) {
            // Token expirado — intenta renovar
            if (err instanceof Error && err.message === 'Token expirado') {
                const refreshed = await authService.refresh();
                if (refreshed) {
                    return await get<AuthUser>('/api/auth/me', tokenStorage.getAccess()!);
                }
            }
            return null;
        }
    },

    /**
     * Cierra sesión. Llama al endpoint y limpia localStorage.
     */
    logout: async (): Promise<void> => {
        const token = tokenStorage.getAccess();
        if (token) {
            try {
                await post('/api/auth/logout', {}, token);
            } catch {
                // Si falla, seguimos limpiando local
            }
        }
        tokenStorage.clear();
    },

    /** Devuelve si hay sesión activa en localStorage */
    isAuthenticated: (): boolean => !!tokenStorage.getAccess(),
};
