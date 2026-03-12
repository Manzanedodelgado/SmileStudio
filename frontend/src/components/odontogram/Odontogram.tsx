import React, { useState } from 'react';
import type { OdontogramTooth, ToothStatus } from '../../services/clinical.api';

/* ═══════════════════════════════════════════════════════════════════
   ODONTOGRAMA INTERACTIVO — FDI Notation
   Cuadrante 1 (18-11) | Cuadrante 2 (21-28)   ← superior
   Cuadrante 4 (48-41) | Cuadrante 3 (31-38)   ← inferior
   ═══════════════════════════════════════════════════════════════════ */

export const TOOTH_STATUS_CONFIG: Record<ToothStatus, { label: string; color: string; bg: string }> = {
    healthy:   { label: 'Sano',           color: '#16a34a', bg: '#f0fdf4' },
    caries:    { label: 'Caries',         color: '#dc2626', bg: '#fef2f2' },
    treated:   { label: 'Obturado',       color: '#2563eb', bg: '#eff6ff' },
    extracted: { label: 'Extraído',       color: '#6b7280', bg: '#f9fafb' },
    implant:   { label: 'Implante',       color: '#7c3aed', bg: '#f5f3ff' },
    crown:     { label: 'Corona',         color: '#d97706', bg: '#fffbeb' },
    rootCanal: { label: 'Endodoncia',     color: '#0891b2', bg: '#ecfeff' },
    bridge:    { label: 'Puente',         color: '#ea580c', bg: '#fff7ed' },
    missing:   { label: 'Ausente',        color: '#94a3b8', bg: '#f8fafc' },
    watchlist: { label: 'En observación', color: '#ca8a04', bg: '#fefce8' },
};

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

// Tipo de diente por número FDI
function getToothType(n: number): 'incisor' | 'canine' | 'premolar' | 'molar' {
    const pos = n % 10;
    if (pos === 1 || pos === 2) return 'incisor';
    if (pos === 3) return 'canine';
    if (pos === 4 || pos === 5) return 'premolar';
    return 'molar';
}

interface ToothProps {
    number: number;
    data?: OdontogramTooth;
    selected: boolean;
    onClick: () => void;
}

function ToothCell({ number, data, selected, onClick }: ToothProps) {
    const status: ToothStatus = data?.status as ToothStatus ?? 'healthy';
    const cfg = TOOTH_STATUS_CONFIG[status];
    const type = getToothType(number);
    const extracted = status === 'extracted' || status === 'missing';

    return (
        <div
            onClick={onClick}
            title={`${number} — ${cfg.label}`}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, cursor: 'pointer', width: 36,
            }}
        >
            {/* Número */}
            <span style={{
                fontSize: 9, fontWeight: 600, color: selected ? '#002855' : '#94a3b8',
                fontFamily: "'Inter', sans-serif",
            }}>
                {number}
            </span>

            {/* Diente SVG */}
            <div style={{
                width: 30, height: 34, position: 'relative',
                transition: 'transform 0.1s',
                transform: selected ? 'scale(1.15)' : 'scale(1)',
            }}>
                <svg viewBox="0 0 30 34" style={{ width: '100%', height: '100%' }}>
                    {/* Sombra exterior del diente */}
                    {!extracted && (
                        <ellipse
                            cx="15" cy="17"
                            rx={type === 'molar' ? 12 : type === 'premolar' ? 10 : 7}
                            ry="14"
                            fill={cfg.bg}
                            stroke={selected ? '#002855' : cfg.color}
                            strokeWidth={selected ? 2 : 1.5}
                        />
                    )}
                    {/* Cara oclusal/incisal (centro) */}
                    {!extracted && (type === 'molar' || type === 'premolar') && (
                        <ellipse
                            cx="15" cy="17"
                            rx={type === 'molar' ? 6 : 4}
                            ry={type === 'molar' ? 6 : 5}
                            fill={cfg.color}
                            opacity={0.15}
                            stroke={cfg.color}
                            strokeWidth={1}
                        />
                    )}
                    {/* X para extraído/ausente */}
                    {extracted && (
                        <>
                            <line x1="5" y1="5" x2="25" y2="29" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                            <line x1="25" y1="5" x2="5" y2="29" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                        </>
                    )}
                    {/* Implante */}
                    {status === 'implant' && (
                        <ellipse cx="15" cy="17" rx="5" ry="5"
                            fill="#7c3aed" opacity={0.7} />
                    )}
                    {/* Endodoncia — punto central */}
                    {status === 'rootCanal' && (
                        <ellipse cx="15" cy="17" rx="3" ry="3"
                            fill="#0891b2" />
                    )}
                    {/* Corona — línea superior */}
                    {status === 'crown' && (
                        <rect x="6" y="8" width="18" height="5" rx="2"
                            fill="#d97706" opacity={0.7} />
                    )}
                </svg>

                {/* Indicador de selección */}
                {selected && (
                    <div style={{
                        position: 'absolute', inset: -2,
                        borderRadius: 4,
                        border: '2px solid #002855',
                        pointerEvents: 'none',
                    }} />
                )}
            </div>

            {/* Badge de estado (solo si no es sano) */}
            {status !== 'healthy' && !extracted && (
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: cfg.color, flexShrink: 0,
                }} />
            )}
            {(status === 'healthy' || extracted) && <div style={{ width: 8, height: 8 }} />}
        </div>
    );
}

interface OdontogramProps {
    teeth: OdontogramTooth[];
    onToothClick: (number: number, current: OdontogramTooth | undefined) => void;
    selectedTooth?: number | null;
}

export default function Odontogram({ teeth, onToothClick, selectedTooth }: OdontogramProps) {
    const toothMap = new Map(teeth.map(t => [t.toothNumber, t]));

    const renderRow = (numbers: number[], label?: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {numbers.map(n => (
                <ToothCell
                    key={n}
                    number={n}
                    data={toothMap.get(n)}
                    selected={selectedTooth === n}
                    onClick={() => onToothClick(n, toothMap.get(n))}
                />
            ))}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Superior */}
            <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {renderRow(UPPER_RIGHT)}
                <div style={{ width: 1, background: '#e2e8f0', margin: '0 6px' }} />
                {renderRow(UPPER_LEFT)}
            </div>

            {/* Línea divisoria horizontal */}
            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />

            {/* Inferior */}
            <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {renderRow(LOWER_RIGHT)}
                <div style={{ width: 1, background: '#e2e8f0', margin: '0 6px' }} />
                {renderRow(LOWER_LEFT)}
            </div>

            {/* Leyenda */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '6px 12px',
                marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9',
                justifyContent: 'center',
            }}>
                {(Object.entries(TOOTH_STATUS_CONFIG) as [ToothStatus, typeof TOOTH_STATUS_CONFIG[ToothStatus]][]).map(([key, cfg]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                        <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'Inter', sans-serif" }}>
                            {cfg.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Status picker (modal-like popover) ────────────────────────────────────
interface ToothStatusPickerProps {
    toothNumber: number;
    current?: OdontogramTooth;
    onSelect: (status: ToothStatus, notes?: string) => void;
    onClose: () => void;
}

export function ToothStatusPicker({ toothNumber, current, onSelect, onClose }: ToothStatusPickerProps) {
    const [notes, setNotes] = useState(current?.notes ?? '');

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000,
            }}
        >
            <div style={{
                background: '#fff', borderRadius: 12, padding: 20, width: 320,
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}>
                <div style={{
                    fontSize: 14, fontWeight: 700, color: '#0f172a',
                    marginBottom: 12, fontFamily: "'Inter', sans-serif",
                }}>
                    Diente {toothNumber}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                    {(Object.entries(TOOTH_STATUS_CONFIG) as [ToothStatus, typeof TOOTH_STATUS_CONFIG[ToothStatus]][]).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => onSelect(key, notes || undefined)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                                border: current?.status === key ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                                background: current?.status === key ? cfg.bg : '#fff',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 12, fontWeight: 600, color: '#334155',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                            {cfg.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', fontFamily: "'Inter', sans-serif" }}>
                        Notas
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Observaciones del diente..."
                        style={{
                            width: '100%', marginTop: 4, padding: '6px 8px',
                            border: '1px solid #e2e8f0', borderRadius: 6,
                            fontSize: 12, fontFamily: "'Inter', sans-serif",
                            outline: 'none', resize: 'vertical', minHeight: 50,
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '8px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif", color: '#64748b',
                    }}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
