// ─────────────────────────────────────────────────────────────────
//  services/auth.service.ts [MOCK VERSION COMPLETE]
// ─────────────────────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    email: string;
}

export const login = async (email: string) => {
    return {
        user: { email, id: 'mock-id' },
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
    };
};

export const signIn = async (email: string, _password?: string) => {
    return login(email);
};

export const logout = async () => { };

export const signOut = async () => { };

export const getSession = async () => {
    return { session: { user: { email: 'dr.rubio@smilestudio.local' }, access_token: 'mock-token' } };
};

export const getUser = async (): Promise<AuthUser | null> => {
    return { id: 'mock-id', email: 'dr.rubio@smilestudio.local' };
};
