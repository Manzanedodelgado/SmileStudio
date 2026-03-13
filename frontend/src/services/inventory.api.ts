// ─── Inventory API Client ─────────────────────────────────────────────────────
const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/inventory`;

function headers(): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ss_access_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers(), ...opts?.headers } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    return body.data as T;
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface Lot {
    id: string;
    lotNumber: string;
    expiryDate: string | null;
    quantity: number;
    location: string;
    status: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    minReorder: number;
    stockTotal: number;
    isLowStock: boolean;
    lotsExpiringSoon: number;
    lots: Lot[];
}

export interface Stats {
    totalProducts: number;
    lowStockCount: number;
    expiringSoonCount: number;
    totalLots: number;
}

export interface PreOrderItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    stockActual: number;
    minReorder: number;
    suggested: number;
}

export interface Movement {
    id: string;
    productId: string;
    product: { name: string; sku: string };
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string | null;
    createdAt: string;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const inventoryApi = {
    getStats: () => req<Stats>('/stats'),
    getProducts: () => req<Product[]>('/products'),
    createProduct: (data: { name: string; sku: string; category: string; minReorder: number }) =>
        req<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: Partial<Product>) =>
        req<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    addLot: (data: { productId: string; lotNumber: string; expiryDate?: string; quantity: number; location?: string }) =>
        req<Lot>('/lots', { method: 'POST', body: JSON.stringify(data) }),

    adjustStock: (data: { productId: string; lotId?: string; quantity: number; reason: string }) =>
        req('/movements', { method: 'POST', body: JSON.stringify(data) }),
    getMovements: (productId?: string) =>
        req<Movement[]>(`/movements${productId ? `?productId=${productId}` : ''}`),

    getPreOrder: () => req<{ critical: PreOrderItem[]; generatedAt: string }>('/ai-order'),
};
