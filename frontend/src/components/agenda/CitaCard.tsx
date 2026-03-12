import { useRef, useState } from 'react';
import type { CitaAPI } from '../../services/appointments.api';
import './CitaCard.css';

/* ═══════════════════════════════════════════════════════
   CitaCard — Tarjeta compacta de cita para el grid
   ═══════════════════════════════════════════════════════ */

// ── Estado → icono texto (GELITE Spanish status names) ──
const ESTADO_ICON: Record<string, string> = {
    'Planificada': '○',
    'Confirmada': '●',
    'Finalizada': '✓',
    'Anulada': '✗',
    'Cancelada': '✗',
    'Desconocido': '?',
};

const ESTADO_LABEL: Record<string, string> = {
    'Planificada': 'Planificada',
    'Confirmada': 'Confirmada',
    'Finalizada': 'Finalizada',
    'Anulada': 'Anulada',
    'Cancelada': 'Cancelada',
    'Desconocido': 'Desconocido',
};

// ── Paleta de fondos azules (oscuro → claro, rotativos) ──
const CITA_COLORS = [
    { bg: '#1d4ed8', border: '#1e40af', text: '#0f172a' },
    { bg: '#2563eb', border: '#1d4ed8', text: '#0f172a' },
    { bg: '#3b82f6', border: '#2563eb', text: '#0f172a' },
    { bg: '#60a5fa', border: '#3b82f6', text: '#0f172a' },
    { bg: '#93c5fd', border: '#60a5fa', text: '#0f172a' },
    { bg: '#bfdbfe', border: '#93c5fd', text: '#0f172a' },
];

// ── Estado → CSS modifier class ──
const ESTADO_CSS: Record<string, string> = {
    'Planificada': 'planificada',
    'Confirmada': 'confirmada',
    'Finalizada': 'finalizada',
    'Anulada': 'anulada',
    'Cancelada': 'cancelada',
    'Desconocido': 'planificada',
};

// ── WhatsApp SVG mini ──
const WhatsAppIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// ── Abrir WhatsApp ──
const openWhatsApp = (movil?: string) => {
    if (!movil) return;
    let clean = movil.replace(/[\s\-\(\)\.]/g, '');
    if (/^[67]\d{8}$/.test(clean)) clean = '34' + clean;
    if (clean.startsWith('0034')) clean = clean.substring(2);
    window.open(`https://wa.me/${clean}`, '_blank');
};

/* ── Componente CitaCard individual ── */
export function CitaCard({ cita, compact = false, colorIndex = 0 }: { cita: CitaAPI; compact?: boolean; colorIndex?: number }) {
    const cssEstado = ESTADO_CSS[cita.estado] ?? 'planificada';
    const palette = CITA_COLORS[colorIndex % CITA_COLORS.length];

    return (
        <div
            className={`cita-card cita-card--${cssEstado}`}
            style={{
                background: palette.bg,
                borderLeftColor: palette.border,
                color: palette.text,
            }}
            title={`${ESTADO_LABEL[cita.estado] ?? cita.estado} · ${cita.tratamiento || 'Sin tratamiento'} · ${cita.notas || ''}`}
        >
            {/* Estado */}
            <div className={`cita-estado cita-estado--${cssEstado}`}>
                {ESTADO_ICON[cita.estado] ?? '○'}
            </div>

            {/* Info */}
            <div className="cita-info">
                {cita.numPac && (
                    <span className="cita-numpac">{cita.numPac}</span>
                )}
                <span className="cita-nombre">
                    {compact
                        ? (cita.apellidos || cita.nombreCompleto?.split(' ')[0] || 'PAC.')
                        : cita.nombreCompleto || 'PACIENTE'
                    }
                </span>
                {!compact && cita.tratamiento && (
                    <span className="cita-tratamiento">
                        {cita.tratamiento}
                    </span>
                )}

                {!compact && cita.notas && (
                    <span className="cita-notas" title={cita.notas}>
                        📝 {cita.notas}
                    </span>
                )}
                {!compact && cita.movil && (
                    <span className="cita-telefono" title={cita.movil}>
                        📱 {cita.movil}
                    </span>
                )}
            </div>

            {/* WhatsApp */}
            <button
                className="cita-whatsapp"
                disabled={!cita.movil}
                onClick={(e) => { e.stopPropagation(); openWhatsApp(cita.movil); }}
                title={cita.movil ? `WhatsApp: ${cita.movil}` : 'Sin móvil registrado'}
            >
                <WhatsAppIcon />
            </button>
        </div>
    );
}

/* ── Componente para celdas con posibles colisiones ── */
export function CitaSlot({ citas }: { citas: CitaAPI[] }) {
    const [expanded, setExpanded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    if (citas.length === 0) return null;

    // Ordenar: en consulta primero, luego en espera, confirmadas, planificadas, finalizadas, anuladas
    const ORDER: Record<string, number> = {
        'Confirmada': 0, 'Planificada': 1, 'Finalizada': 2,
        'Anulada': 3, 'Cancelada': 4, 'Desconocido': 5,
    };
    const sorted = [...citas].sort((a, b) =>
        (ORDER[a.estado] ?? 3) - (ORDER[b.estado] ?? 3)
    );

    if (sorted.length === 1) {
        return <CitaCard cita={sorted[0]} />;
    }

    const visible = sorted.slice(0, 2);
    const remaining = sorted.length - 2;

    return (
        <div ref={ref} className="cita-collision-wrapper" style={{ position: 'relative' }}>
            {visible.map((c) => (
                <CitaCard key={c.id} cita={c} compact />
            ))}
            {remaining > 0 && (
                <div className="cita-collision-badge" onClick={() => setExpanded(!expanded)}>
                    +{remaining} más
                </div>
            )}
            {expanded && (
                <div className="cita-expand-panel">
                    {sorted.map((c) => (
                        <CitaCard key={c.id} cita={c} />
                    ))}
                    <button
                        onClick={() => setExpanded(false)}
                        style={{
                            fontSize: 9, fontWeight: 700, color: '#94a3b8',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '2px 0', textAlign: 'center',
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Skeleton de carga ── */
export function CitaSkeleton() {
    return <div className="cita-skeleton" style={{ margin: '2px 0' }} />;
}

export default CitaCard;
