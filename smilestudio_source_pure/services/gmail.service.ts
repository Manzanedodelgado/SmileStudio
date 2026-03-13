// ─────────────────────────────────────────────────────────────────
//  services/gmail.service.ts [MOCK VERSION - UI ONLY]
// ─────────────────────────────────────────────────────────────────

export const isGmailConfigured = (): boolean => true;
export const isGmailAuthorized = (): boolean => true;
export const disconnectGmail = (): void => { };
export const startGmailAuth = (): void => { };
export const handleOAuthRedirect = async (): Promise<boolean> => false;

export interface GmailInvoiceEmail {
    id: string;
    threadId: string;
    fecha: string;
    de: string;
    deEmail: string;
    asunto: string;
    snippet: string;
    hasAttachment: boolean;
    attachments: any[];
    bodyText: string;
    bodyHtml: string;
    enlaceGmail: string;
}

const MOCK_EMAILS: GmailInvoiceEmail[] = [
    {
        id: 'mock-1', threadId: 't1',
        fecha: new Date().toISOString(),
        de: 'Suministros Dentales Iberia', deEmail: 'facturas@sdi.es',
        asunto: 'FACTURA 2025/0234 - Pedido material clínica',
        snippet: 'Estimados clientes, adjuntamos factura correspondiente al pedido realizado...',
        hasAttachment: true,
        attachments: [{ id: 'a1', filename: 'Factura_2025_0234.pdf', mimeType: 'application/pdf', size: 48200 }],
        bodyText: 'SUMINISTROS DENTALES IBERIA S.L.\nCIF: B12345678\nFactura nº 2025/0234\nFecha: 23/02/2025\nBase imponible: 1.240,00 €\nIVA 21%: 260,40 €\nTOTAL: 1.500,40 €',
        bodyHtml: '',
        enlaceGmail: '#mock',
    }
];

export const fetchInvoiceEmails = async (): Promise<GmailInvoiceEmail[]> => {
    return MOCK_EMAILS;
};

export const downloadAttachment = async (): Promise<string | null> => null;
