// ─────────────────────────────────────────────────────────────────
//  services/invoice-parser.service.ts [MOCK VERSION - UI ONLY]
// ─────────────────────────────────────────────────────────────────

import type { GmailInvoiceEmail } from './gmail.service';

export interface FacturaExtraida {
    gmail_message_id: string;
    enlace_gmail: string;
    proveedor: string;
    proveedor_email: string;
    proveedor_cif: string | null;
    numero_factura: string | null;
    fecha_email: string;
    fecha_factura: string | null;
    concepto: string;
    categoria: string | null;
    base_imponible: number | null;
    iva_pct: number | null;
    total: number | null;
    tiene_adjunto: boolean;
    nombre_adjunto: string | null;
    pdf_preview_url: string | null;
    enlace_factura_portal: string | null;
    estado: 'pendiente' | 'cruzado' | 'descartado';
    raw_snippet: string;
}

export const parseInvoiceEmail = async (email: GmailInvoiceEmail): Promise<FacturaExtraida> => {
    return {
        gmail_message_id: email.id,
        enlace_gmail: email.enlaceGmail,
        proveedor: email.de,
        proveedor_email: email.deEmail,
        proveedor_cif: 'B12345678',
        numero_factura: 'INV-2025-001',
        fecha_email: email.fecha,
        fecha_factura: email.fecha,
        concepto: email.asunto,
        categoria: '🦷 Material dental',
        base_imponible: 100,
        iva_pct: 21,
        total: 121,
        tiene_adjunto: email.hasAttachment,
        nombre_adjunto: 'factura.pdf',
        pdf_preview_url: null,
        enlace_factura_portal: null,
        estado: 'pendiente',
        raw_snippet: email.snippet,
    };
};

export const parseAllInvoiceEmails = async (emails: GmailInvoiceEmail[]): Promise<FacturaExtraida[]> => {
    const results = [];
    for (const e of emails) {
        results.push(await parseInvoiceEmail(e));
    }
    return results;
};

export const saveFacturasToSupabase = async (): Promise<void> => { };
export const loadFacturasFromSupabase = async (): Promise<FacturaExtraida[]> => [];
export const updateFacturaEstado = async (): Promise<void> => { };
