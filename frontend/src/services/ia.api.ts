// ─── Frontend API Client — IA & Automatizaciones ──────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ss_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}/ai${path}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AIResponse {
    text: string;
    tokens: number;
    model: string;
    provider: string;
}

export interface AIConfigData {
    id?: string;
    agentName: string;
    language: string;
    welcomeMsg: string;
    tone: { empathy: number; proactivity: number; formality: string };
    knowledge: string[];
    escalationRules: { condition: string; action: string }[];
}

export interface AutomationData {
    id: string;
    name: string;
    enabled: boolean;
    trigger: string;
    canal: string;
    steps: { delay?: number; action: string; template?: string }[];
    successRate: number;
    executions: number;
    createdAt: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const iaApi = {
    // Copiloto clínico
    copilotChat: (prompt: string, context?: string, patientId?: string) =>
        apiFetch<{ success: true; data: AIResponse }>('/copilot/chat', {
            method: 'POST',
            body: JSON.stringify({ prompt, context, patientId }),
        }).then(r => r.data),

    completeNote: (patientId: string, partialNote: string) =>
        apiFetch<{ success: true; data: { completedNote: string } }>('/copilot/complete-note', {
            method: 'POST',
            body: JSON.stringify({ patientId, partialNote }),
        }).then(r => r.data.completedNote),

    suggestTreatment: (patientId: string, symptoms?: string) =>
        apiFetch<{ success: true; data: { suggestions: { name: string; description: string; urgency: string }[] } }>('/copilot/suggest-treatment', {
            method: 'POST',
            body: JSON.stringify({ patientId, symptoms }),
        }).then(r => r.data.suggestions),

    analyzeImage: (imageUrl: string, analysisType: 'radiograph' | 'general' = 'general') =>
        apiFetch<{ success: true; data: { analysis: string; findings: string[]; recommendations: string[] } }>('/copilot/analyze-image', {
            method: 'POST',
            body: JSON.stringify({ imageUrl, analysisType }),
        }).then(r => r.data),

    // Configuración agente dental
    getConfig: () =>
        apiFetch<{ success: true; data: AIConfigData | null }>('/config').then(r => r.data),

    saveConfig: (data: Omit<AIConfigData, 'id'>) =>
        apiFetch<{ success: true; data: AIConfigData }>('/config', {
            method: 'PUT',
            body: JSON.stringify(data),
        }).then(r => r.data),

    // Automatizaciones
    getAutomations: () =>
        apiFetch<{ success: true; data: AutomationData[] }>('/automations').then(r => r.data),

    toggleAutomation: (id: string, enabled: boolean) =>
        apiFetch<{ success: true; data: AutomationData }>(`/automations/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled }),
        }).then(r => r.data),

    createAutomation: (data: Pick<AutomationData, 'name' | 'enabled' | 'trigger' | 'canal' | 'steps'>) =>
        apiFetch<{ success: true; data: AutomationData }>('/automations', {
            method: 'POST',
            body: JSON.stringify(data),
        }).then(r => r.data),

    // Insights
    getInsights: () =>
        apiFetch<{ success: true; data: { stats: { total: number; active: number; avgSuccess: number }; insights: string[] } }>('/evolution/insights').then(r => r.data),
};
