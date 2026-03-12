import React, { useState, useEffect } from 'react';
import { Plus, Loader2, FileText, Trash2, ChevronDown, ChevronUp, Stethoscope } from 'lucide-react';
import type { Patient } from '../../services/patients.api';
import {
    getPatientHistory,
    createClinicalRecord,
    deleteClinicalRecord,
    updateToothStatus,
    type ClinicalRecord,
    type OdontogramTooth,
    type ToothStatus,
    type CreateRecordInput,
} from '../../services/clinical.api';
import Odontogram, { ToothStatusPicker } from '../odontogram/Odontogram';

/* ═══════════════════════════════════════════════════════════════════
   HISTORIA CLÍNICA PANEL
   - Odontograma interactivo
   - Timeline de entradas médicas
   ═══════════════════════════════════════════════════════════════════ */

const RECORD_TYPES: { value: string; label: string; color: string }[] = [
    { value: 'visit',    label: 'Visita',       color: '#2563eb' },
    { value: 'xray',     label: 'Radiografía',  color: '#7c3aed' },
    { value: 'surgery',  label: 'Cirugía',      color: '#dc2626' },
    { value: 'hygiene',  label: 'Higiene',      color: '#16a34a' },
    { value: 'orthodontics', label: 'Ortodoncia', color: '#d97706' },
    { value: 'other',    label: 'Otro',         color: '#64748b' },
];

function typeLabel(type: string) {
    return RECORD_TYPES.find(t => t.value === type)?.label ?? type;
}
function typeColor(type: string) {
    return RECORD_TYPES.find(t => t.value === type)?.color ?? '#64748b';
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

/* ── New record form ── */
function NewRecordForm({
    patientId,
    onSaved,
    onCancel,
}: {
    patientId: string;
    onSaved: (r: ClinicalRecord) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<Partial<CreateRecordInput>>({ type: 'visit' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!form.title?.trim() || !form.content?.trim()) {
            setError('El título y el contenido son obligatorios');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const record = await createClinicalRecord({
                patientId,
                type: form.type ?? 'visit',
                title: form.title!,
                content: form.content!,
            });
            onSaved(record);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error guardando');
        } finally {
            setSaving(false);
        }
    };

    const set = (k: keyof CreateRecordInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }));

    return (
        <div style={{
            background: '#f8fafc', borderRadius: 10, padding: 16,
            border: '1px solid #e2e8f0', marginBottom: 12,
        }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
                Nueva entrada clínica
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                    <label style={labelStyle}>Tipo</label>
                    <select style={inputStyle} value={form.type ?? 'visit'} onChange={set('type')}>
                        {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Fecha</label>
                    <input style={inputStyle} type="datetime-local" value={form.date ?? ''} onChange={set('date')} />
                </div>
            </div>

            <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>Título *</label>
                <input
                    style={inputStyle}
                    value={form.title ?? ''}
                    onChange={set('title')}
                    placeholder="Ej: Obturación clase II diente 26"
                    autoFocus
                />
            </div>
            <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>Descripción / notas clínicas *</label>
                <textarea
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                    value={form.content ?? ''}
                    onChange={set('content')}
                    placeholder="Descripción del procedimiento, observaciones, plan de tratamiento..."
                />
            </div>

            {error && (
                <div style={{
                    padding: '7px 10px', borderRadius: 6, background: '#fef2f2',
                    color: '#dc2626', fontSize: 12, marginBottom: 8,
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onCancel} style={btnSecondaryStyle}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{ ...btnPrimaryStyle, flex: 1 }}>
                    {saving ? <Loader2 size={13} /> : 'Guardar entrada'}
                </button>
            </div>
        </div>
    );
}

/* ── Clinical record item ── */
function RecordItem({
    record, onDelete,
}: {
    record: ClinicalRecord; onDelete: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const color = typeColor(record.type);

    return (
        <div style={{
            borderLeft: `3px solid ${color}`,
            background: '#fff', borderRadius: '0 8px 8px 0',
            marginBottom: 8, overflow: 'hidden',
        }}>
            <div
                onClick={() => setExpanded(e => !e)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', cursor: 'pointer',
                }}
            >
                {/* Type badge */}
                <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                    background: color + '18', color, textTransform: 'uppercase', letterSpacing: '0.05em',
                    fontFamily: "'Inter', sans-serif", flexShrink: 0,
                }}>
                    {typeLabel(record.type)}
                </span>

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 13, fontWeight: 600, color: '#0f172a',
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {record.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                        {formatDateTime(record.date)}
                    </div>
                </div>

                {/* Expand + delete */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(record.id); }}
                        style={{ ...iconBtn, color: '#dc2626' }}
                        title="Eliminar"
                    >
                        <Trash2 size={13} />
                    </button>
                    {expanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                </div>
            </div>

            {expanded && (
                <div style={{
                    padding: '0 12px 12px',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 10,
                }}>
                    <p style={{
                        fontSize: 13, color: '#334155', lineHeight: 1.6,
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'pre-wrap', margin: 0,
                    }}>
                        {record.content}
                    </p>
                    {record.treatments?.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {record.treatments.map((t, i) => (
                                <span key={i} style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 4,
                                    background: '#eff6ff', color: '#2563eb',
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ═══ MAIN COMPONENT ═══ */
export default function HistoriaClinicaPanel({ patient }: { patient: Patient }) {
    const [records, setRecords] = useState<ClinicalRecord[]>([]);
    const [teeth, setTeeth] = useState<OdontogramTooth[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [pickerTooth, setPickerTooth] = useState<{ number: number; data?: OdontogramTooth } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getPatientHistory(patient.id)
            .then(data => {
                if (!cancelled) {
                    setRecords(data.records);
                    setTeeth(data.odontogram);
                }
            })
            .catch(console.error)
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [patient.id]);

    const handleToothClick = (number: number, data?: OdontogramTooth) => {
        setSelectedTooth(number);
        setPickerTooth({ number, data });
    };

    const handleStatusSelect = async (status: ToothStatus, notes?: string) => {
        if (!pickerTooth) return;
        setSaving(true);
        try {
            const updated = await updateToothStatus({
                patientId: patient.id,
                toothNumber: pickerTooth.number,
                status,
                notes,
            });
            setTeeth(prev => {
                const idx = prev.findIndex(t => t.toothNumber === pickerTooth.number);
                if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = updated;
                    return copy;
                }
                return [...prev, updated];
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
            setPickerTooth(null);
            setSelectedTooth(null);
        }
    };

    const handleRecordSaved = (record: ClinicalRecord) => {
        setRecords(prev => [record, ...prev]);
        setShowNewForm(false);
    };

    const handleDeleteRecord = async (id: string) => {
        if (!confirm('¿Eliminar esta entrada clínica?')) return;
        try {
            await deleteClinicalRecord(id);
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('Error eliminando entrada');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: '#94a3b8' }}>
                <Loader2 size={22} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Odontograma */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#fafbfc',
                flexShrink: 0,
            }}>
                <div style={{
                    fontSize: 11, fontWeight: 800, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: 10, fontFamily: "'Inter', sans-serif",
                }}>
                    Odontograma {saving && <span style={{ color: '#2563eb' }}>(guardando...)</span>}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <Odontogram
                        teeth={teeth}
                        onToothClick={handleToothClick}
                        selectedTooth={selectedTooth}
                    />
                </div>
            </div>

            {/* Entradas médicas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 10,
                }}>
                    <span style={{
                        fontSize: 11, fontWeight: 800, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        Entradas clínicas ({records.length})
                    </span>
                    <button
                        onClick={() => setShowNewForm(v => !v)}
                        style={btnPrimaryStyle}
                    >
                        <Plus size={13} />
                        Nueva entrada
                    </button>
                </div>

                {showNewForm && (
                    <NewRecordForm
                        patientId={patient.id}
                        onSaved={handleRecordSaved}
                        onCancel={() => setShowNewForm(false)}
                    />
                )}

                {records.length === 0 && !showNewForm ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 8, padding: '32px 16px', color: '#94a3b8',
                    }}>
                        <FileText size={36} strokeWidth={1} />
                        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", margin: 0 }}>
                            Sin entradas clínicas registradas
                        </p>
                    </div>
                ) : (
                    records.map(r => (
                        <RecordItem key={r.id} record={r} onDelete={handleDeleteRecord} />
                    ))
                )}
            </div>

            {/* Picker de estado diente */}
            {pickerTooth && (
                <ToothStatusPicker
                    toothNumber={pickerTooth.number}
                    current={pickerTooth.data}
                    onSelect={handleStatusSelect}
                    onClose={() => { setPickerTooth(null); setSelectedTooth(null); }}
                />
            )}
        </div>
    );
}

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b',
    marginBottom: 4, fontFamily: "'Inter', sans-serif",
};
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 9px',
    border: '1px solid #e2e8f0', borderRadius: 7,
    fontSize: 12, fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box', color: '#0f172a',
    background: '#fff',
};
const btnPrimaryStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 7,
    background: '#002855', color: '#fff', border: 'none',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
};
const btnSecondaryStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 7,
    background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
};
const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, border: 'none', borderRadius: 5,
    background: 'transparent', cursor: 'pointer',
};
