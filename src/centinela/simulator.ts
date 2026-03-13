// ═══════════════════════════════════════════════════════
//  Process Simulator — Generates realistic SmileStudio errors
// ═══════════════════════════════════════════════════════

import type { SmileStudioModule, ErrorSeverity } from './types';
import { CentinelaEngine } from './engine';

interface SimulatedError {
    message: string;
    severity: ErrorSeverity;
    module: SmileStudioModule;
    stack?: string;
    context?: Record<string, unknown>;
}

const ERROR_TEMPLATES: SimulatedError[] = [
    // ─── Agenda ───────────────────────────────────────
    {
        module: 'agenda',
        severity: 'error',
        message: 'Conflicto de horario: cita duplicada en Gabinete 1 a las 10:30',
        context: { operatoryId: 'gab-1', time: '10:30', patientId: 'p-042' },
    },
    {
        module: 'agenda',
        severity: 'warning',
        message: 'Recordatorio WhatsApp no enviado: paciente sin número registrado',
        context: { patientId: 'p-105', appointmentId: 'apt-2026' },
    },
    {
        module: 'agenda',
        severity: 'critical',
        message: 'Error al guardar cita: timeout de conexión a PostgreSQL (30s)',
        stack: `Error: Connection timeout after 30000ms\n    at PostgresClient.connect (db/client.ts:42)\n    at AppointmentService.create (modules/appointments/service.ts:89)\n    at AgendaController.createAppointment (modules/appointments/controller.ts:34)`,
        context: { dbHost: 'localhost', dbPort: 5432 },
    },
    {
        module: 'agenda',
        severity: 'info',
        message: 'Cita cancelada automáticamente: paciente no confirmó en 48h',
        context: { patientId: 'p-078', appointmentId: 'apt-1993' },
    },

    // ─── Pacientes ────────────────────────────────────
    {
        module: 'pacientes',
        severity: 'error',
        message: 'Error de validación: CIF/NIF inválido en ficha de paciente',
        context: { patientId: 'p-201', field: 'nif', value: '123456XXX' },
    },
    {
        module: 'pacientes',
        severity: 'warning',
        message: 'Consentimiento informado caducado: requiere renovación',
        context: { patientId: 'p-055', documentType: 'consent-general', expired: '2025-12-01' },
    },
    {
        module: 'pacientes',
        severity: 'critical',
        message: 'Error RGPD: intento de acceso a historia clínica sin rol autorizado',
        stack: `Error: Unauthorized access attempt\n    at RBACMiddleware.check (middleware/rbac.ts:67)\n    at PatientController.getHistory (modules/patients/controller.ts:112)\n    at Router.handle (router.ts:305)`,
        context: { userId: 'usr-auxiliary-02', role: 'auxiliary', resource: 'clinical_history' },
    },
    {
        module: 'pacientes',
        severity: 'info',
        message: 'Historial médico actualizado correctamente para 3 pacientes',
    },

    // ─── Facturación ──────────────────────────────────
    {
        module: 'facturacion',
        severity: 'critical',
        message: 'Secuencia de facturación rota: salto detectado F2026-0142 → F2026-0144',
        stack: `Error: Invoice sequence gap detected\n    at InvoiceService.validateSequence (modules/billing/service.ts:201)\n    at InvoiceService.create (modules/billing/service.ts:45)`,
        context: { lastInvoice: 'F2026-0142', newInvoice: 'F2026-0144', gap: 1 },
    },
    {
        module: 'facturacion',
        severity: 'error',
        message: 'Error al generar PDF de factura: PDFKit memory overflow',
        stack: `Error: Maximum call stack size exceeded\n    at PDFDocument.addPage (pdfkit/document.ts:89)\n    at InvoiceRenderer.render (services/pdf/invoice.ts:134)`,
        context: { invoiceId: 'F2026-0139', pages: 47 },
    },
    {
        module: 'facturacion',
        severity: 'warning',
        message: 'Factura pendiente de envío a SII/AEAT: plazo límite en 48h',
        context: { invoiceId: 'F2026-0137', deadline: '2026-03-09T23:59:00' },
    },
    {
        module: 'facturacion',
        severity: 'error',
        message: 'Tipo IVA no reconocido: 23% aplicado en factura (debería ser 21%)',
        context: { invoiceId: 'F2026-0140', appliedVat: 23, expectedVat: 21 },
    },

    // ─── Contabilidad ─────────────────────────────────
    {
        module: 'contabilidad',
        severity: 'critical',
        message: 'Descuadre en conciliación bancaria: diferencia de €2.340,50',
        context: { period: '2026-02', bankBalance: 45680.30, bookBalance: 43339.80, diff: 2340.50 },
    },
    {
        module: 'contabilidad',
        severity: 'error',
        message: 'Error al importar extracto bancario: formato OFX corrupto',
        stack: `Error: Invalid OFX format at line 247\n    at OFXParser.parse (services/banking/ofx-parser.ts:89)\n    at BankService.importStatement (modules/accounting/bank.ts:34)`,
    },
    {
        module: 'contabilidad',
        severity: 'warning',
        message: 'Modelo 303 (IVA) trimestral: plazo de presentación en 5 días',
        context: { model: '303', period: 'Q1-2026', deadline: '2026-04-20' },
    },
    {
        module: 'contabilidad',
        severity: 'warning',
        message: 'Factura de proveedor sin categoría contable asignada',
        context: { supplierId: 'prov-Henry-Schein', invoiceId: 'EXT-2026-0892' },
    },

    // ─── WhatsApp ─────────────────────────────────────
    {
        module: 'whatsapp',
        severity: 'critical',
        message: 'Evolution API desconectada: sesión WhatsApp expirada, requiere re-escaneo QR',
        stack: `Error: Session expired - QR code rescan required\n    at EvolutionClient.checkSession (services/whatsapp/evolution.ts:56)\n    at WhatsAppService.sendMessage (modules/communication/service.ts:23)`,
    },
    {
        module: 'whatsapp',
        severity: 'error',
        message: 'Mensaje no entregado: número de teléfono no válido para WhatsApp',
        context: { phone: '+34600XXXXXX', patientId: 'p-089' },
    },
    {
        module: 'whatsapp',
        severity: 'warning',
        message: 'Rate limit alcanzado: 200 mensajes/hora superados, esperando cooldown',
        context: { currentRate: 215, maxRate: 200, cooldownMinutes: 15 },
    },
    {
        module: 'whatsapp',
        severity: 'info',
        message: 'Campaña de recall enviada exitosamente: 45 de 50 mensajes entregados',
        context: { campaignId: 'camp-recall-march', sent: 50, delivered: 45, failed: 5 },
    },

    // ─── IA ───────────────────────────────────────────
    {
        module: 'ia',
        severity: 'critical',
        message: 'Ollama no responde: servidor de IA local caído (puerto 11434)',
        stack: `Error: ECONNREFUSED 127.0.0.1:11434\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141)\n    at OllamaClient.generate (services/ai/ollama.ts:42)`,
        context: { host: '127.0.0.1', port: 11434, model: 'llama3.1:8b' },
    },
    {
        module: 'ia',
        severity: 'error',
        message: 'Transcripción fallida: modelo Whisper sin memoria GPU suficiente',
        stack: `Error: CUDA out of memory\n    at WhisperService.transcribe (services/ai/whisper.ts:78)`,
        context: { audioLength: '12min', gpuMemory: '8GB', required: '12GB' },
    },
    {
        module: 'ia',
        severity: 'warning',
        message: 'Sugerencia de entrada médica rechazada: confianza inferior al umbral (62%)',
        context: { confidence: 0.62, threshold: 0.75, appointmentId: 'apt-2030' },
    },
    {
        module: 'ia',
        severity: 'info',
        message: 'Modelo LLM actualizado: llama3.1:8b → llama3.2:8b',
    },

    // ─── Imagen Médica ────────────────────────────────
    {
        module: 'imagen',
        severity: 'critical',
        message: 'Archivo DICOM corrupto: no se puede leer cabecera DICOM en panorámica',
        stack: `Error: Invalid DICOM header at offset 132\n    at DICOMParser.readHeader (services/imaging/dicom-parser.ts:45)\n    at ImageService.importDICOM (modules/imaging/service.ts:67)`,
        context: { filename: 'PAN_20260305_P089.dcm', size: '45MB' },
    },
    {
        module: 'imagen',
        severity: 'error',
        message: 'Error al generar thumbnail: Sharp no puede procesar formato RAW',
        context: { filename: 'intraoral_001.cr2', format: 'CR2' },
    },
    {
        module: 'imagen',
        severity: 'warning',
        message: 'Almacenamiento MinIO al 87%: espacio disponible bajo',
        context: { used: '412GB', total: '475GB', freePercent: 13 },
    },

    // ─── Auth ─────────────────────────────────────────
    {
        module: 'auth',
        severity: 'critical',
        message: 'Múltiples intentos de login fallidos: posible ataque de fuerza bruta',
        context: { ip: '192.168.1.xxx', attempts: 15, timeWindow: '2min' },
    },
    {
        module: 'auth',
        severity: 'error',
        message: 'Token JWT expirado y refresh token inválido: sesión terminada',
        context: { userId: 'usr-doc-01', sessionDuration: '8h' },
    },
    {
        module: 'auth',
        severity: 'warning',
        message: 'Certificado SSL expira en 14 días: renovación programada',
        context: { domain: 'api.rubiogarcia.dental', expiresAt: '2026-03-21' },
    },

    // ─── Sistema ──────────────────────────────────────
    {
        module: 'sistema',
        severity: 'critical',
        message: 'Uso de CPU al 98%: servidor local saturado',
        context: { cpu: 98, memory: 85, uptime: '72h' },
    },
    {
        module: 'sistema',
        severity: 'error',
        message: 'Redis desconectado: caché y sesiones no disponibles',
        stack: `Error: ECONNREFUSED 127.0.0.1:6379\n    at RedisClient.connect (services/cache/redis.ts:28)`,
    },
    {
        module: 'sistema',
        severity: 'warning',
        message: 'Backup diario completado con advertencias: 3 archivos omitidos',
        context: { totalFiles: 15420, backed: 15417, skipped: 3 },
    },
    {
        module: 'sistema',
        severity: 'info',
        message: 'Cron job ejecutado: limpieza de logs antiguos (>30 días)',
    },
];

export class ProcessSimulator {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private engine: CentinelaEngine;
    private running = false;
    private speed: number; // ms between errors
    private usedIndices: Set<number> = new Set();

    constructor(engine: CentinelaEngine, speed = 2000) {
        this.engine = engine;
        this.speed = speed;
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.usedIndices.clear();

        this.intervalId = setInterval(() => {
            this.emitRandomError();
        }, this.speed + Math.random() * this.speed);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
    }

    setSpeed(ms: number): void {
        this.speed = ms;
        if (this.running) {
            this.stop();
            this.start();
        }
    }

    isRunning(): boolean {
        return this.running;
    }

    emitBurst(count = 5): void {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.emitRandomError(), i * 200);
        }
    }

    private emitRandomError(): void {
        // Reset used indices when all have been used
        if (this.usedIndices.size >= ERROR_TEMPLATES.length) {
            this.usedIndices.clear();
        }

        let idx: number;
        do {
            idx = Math.floor(Math.random() * ERROR_TEMPLATES.length);
        } while (this.usedIndices.has(idx));

        this.usedIndices.add(idx);
        const template = ERROR_TEMPLATES[idx];

        this.engine.captureError({
            message: template.message,
            severity: template.severity,
            module: template.module,
            source: 'simulated',
            stack: template.stack,
            context: template.context,
        });
    }
}
