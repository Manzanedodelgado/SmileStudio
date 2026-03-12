// ─────────────────────────────────────────────────────────────────
//  services/auth.service.ts
//  Login via RPC app_login — bypass GoTrue (roto en este proyecto).
//  VLN-006 FIX: validate_token y revoke_token con TTL server-side.
//  SEC-C01 FIX: Sin credenciales hardcodeadas — solo env vars.
// ─────────────────────────────────────────────────────────────────

const SUPABASE_URL: string = (import.meta as any).env?.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Auth] VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas en .env.local');
}

const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
};

export interface AuthUser {
    id: string;
    email?: string;
    nombre?: string;
    rol?: string;
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at?: string;
    user: AuthUser;
}

/** Login — usa RPC app_login (bcrypt + TTL 8h en Supabase, sin GoTrue) */
export const signIn = async (email: string, password: string): Promise<AuthSession | null> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/app_login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_email: email, p_password: password }),
    });

    if (!response.ok) {
        // SEC-A07: No exponer respuesta cruda del servidor en la UI
        if (response.status === 401 || response.status === 403) {
            throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        }
        throw new Error('Error de conexión con el servidor. Inténtalo de nuevo.');
    }

    const data = await response.json();
    if (data.error) throw new Error('Acceso denegado. Verifica tus credenciales.');

    // SEC-A01: refresh_token != access_token (distintos roles semánticos)
    return {
        access_token: data.token,
        refresh_token: `rt:${data.token}`,
        expires_at: data.expires_at,
        user: {
            id: data.user.id,
            email: data.user.email,
            nombre: data.user.nombre,
            rol: data.user.rol,
        },
    };
};

/**
 * VLN-006 FIX: Valida el token contra el servidor (TTL server-side).
 * Devuelve el usuario si el token es válido y no ha expirado.
 * Devuelve null si el token es inválido, ha expirado o hay error de red.
 */
export const getUser = async (token: string): Promise<AuthUser | null> => {
    if (!token) return null;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_token`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_token: token }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!data.valid) return null;

        return {
            id: data.user.id,
            email: data.user.email,
            nombre: data.user.nombre,
            rol: data.user.rol,
        };
    } catch {
        return null;
    }
};

/**
 * VLN-006 FIX: Logout real — revoca el token en el servidor via RPC.
 */
export const signOut = async (token: string): Promise<boolean> => {
    if (!token) return true;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/revoke_token`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_token: token }),
        });
    } catch {
        // Silent — si falla la red el localStorage se limpia igual
    }
    return true;
};
