// ─── Frontend API Client — Gestoría / Accounting ─────────────────────────────
// Llama al backend Express /api/accounting
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('ss_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}/accounting${path}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GestoriaSummary {
    ingresosBrutos: number;
    facturas: number;
    facturasEmitidas: { pendientes: number; cobradas: number };
    facturasPendientesCruce: number;
    movimientosPendientes: number;
    modelosFiscales: { borrador: number; presentado: number };
}

export interface FacturaEmitida {
    id: string;
    numeroSerie: string;
    numPac?: string | null;
    nifCliente: string;
    nombreCliente: string;
    concepto: string;
    baseImponible: string;
    ivaPct: string;
    total: string;
    fechaEmision: string;
    estadoPago: string;
    verifactuEstado: string;
    verifactuHash?: string | null;
}

export interface FacturaEmail {
    gmailMessageId: string;
    proveedorExtraido?: string | null;
    proveedorId?: string | null;
    numeroFactura?: string | null;
    fechaFactura?: string | null;
    baseImponible?: string | null;
    ivaPct?: string | null;
    total?: string | null;
    archivoPdfUrl?: string | null;
    estado: string;
    createdAt: string;
    proveedor?: { id: string; nombreFiscal: string; cifNif?: string | null } | null;
}

export interface Proveedor {
    id: string;
    nombreFiscal: string;
    cifNif?: string | null;
    emailContacto?: string | null;
    categoriaDefecto?: string | null;
    iban?: string | null;
    createdAt: string;
}

export interface MovimientoBancario {
    id: string;
    ibanCuenta: string;
    fechaOperacion: string;
    conceptoBanco: string;
    importe: string;
    saldoPosterior?: string | null;
    estadoConcil: string;
    fEmitidaId?: string | null;
    fRecibidaId?: string | null;
    facturaEmitida?: { id: string; numeroSerie: string; nombreCliente: string } | null;
    facturaRecibida?: { gmailMessageId: string; proveedorExtraido?: string | null; numeroFactura?: string | null } | null;
}

export interface ModeloFiscal {
    id: string;
    modelo: string;
    ejercicio: number;
    periodo: string;
    estado: string;
    fechaLimite: string;
    cuotaResultante?: string | null;
    archivoJustif?: string | null;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const accountingApi = {
    // Summary
    getSummary: () =>
        apiFetch<{ success: true; data: GestoriaSummary }>('/summary').then(r => r.data),

    // Facturas emitidas
    getInvoices: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ success: true; data: FacturaEmitida[]; pagination: Pagination }>(`/invoices${qs}`);
    },

    getInvoiceById: (id: string) =>
        apiFetch<{ success: true; data: FacturaEmitida }>(`/invoices/${id}`).then(r => r.data),

    createInvoice: (body: Omit<FacturaEmitida, 'id' | 'estadoPago' | 'verifactuEstado' | 'verifactuHash'>) =>
        apiFetch<{ success: true; data: FacturaEmitida }>('/invoices', {
            method: 'POST',
            body: JSON.stringify(body),
        }).then(r => r.data),

    updateInvoiceStatus: (id: string, estadoPago: string) =>
        apiFetch<{ success: true; data: FacturaEmitida }>(`/invoices/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ estadoPago }),
        }).then(r => r.data),

    // Facturas email
    getEmailInvoices: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ success: true; data: FacturaEmail[]; pagination: Pagination }>(`/email-invoices${qs}`);
    },

    updateEmailInvoice: (gmailMessageId: string, body: { estado: string; proveedorId?: string }) =>
        apiFetch<{ success: true; data: FacturaEmail }>(`/email-invoices/${encodeURIComponent(gmailMessageId)}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }).then(r => r.data),

    // Proveedores
    getSuppliers: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ success: true; data: Proveedor[]; pagination: Pagination }>(`/suppliers${qs}`);
    },

    getSupplierById: (id: string) =>
        apiFetch<{ success: true; data: Proveedor }>(`/suppliers/${id}`).then(r => r.data),

    createSupplier: (body: Omit<Proveedor, 'id' | 'createdAt'>) =>
        apiFetch<{ success: true; data: Proveedor }>('/suppliers', {
            method: 'POST',
            body: JSON.stringify(body),
        }).then(r => r.data),

    updateSupplier: (id: string, body: Partial<Omit<Proveedor, 'id' | 'createdAt'>>) =>
        apiFetch<{ success: true; data: Proveedor }>(`/suppliers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }).then(r => r.data),

    // Banco
    getBankMovements: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ success: true; data: MovimientoBancario[]; pagination: Pagination }>(`/bank-movements${qs}`);
    },

    reconcileMovement: (id: string, body: { fEmitidaId?: string; fRecibidaId?: string }) =>
        apiFetch<{ success: true; data: MovimientoBancario }>(`/bank-movements/${id}/reconcile`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }).then(r => r.data),

    // Modelos fiscales
    getTaxModels: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<{ success: true; data: ModeloFiscal[] }>(`/tax-models${qs}`).then(r => r.data);
    },

    upsertTaxModel: (body: Omit<ModeloFiscal, 'id'>) =>
        apiFetch<{ success: true; data: ModeloFiscal }>('/tax-models', {
            method: 'PUT',
            body: JSON.stringify(body),
        }).then(r => r.data),
};
