import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Database, Table2, Key, ArrowRight } from 'lucide-react';

/* ── Schema data: all 165 GELITE tables ── */
import { SCHEMA_DATA } from './schemaData';

export type SchemaColumn = {
    num: number;
    name: string;
    type: string;
    nullable: boolean;
    isPK: boolean;
    isFK: boolean;
    fkTarget?: string;
    description: string;
};

export type SchemaTable = {
    name: string;
    geliteName: string;
    rows: number;
    comment: string;
    columns: SchemaColumn[];
};

export default function TablasBD() {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const filtered = SCHEMA_DATA.filter(t =>
        t.geliteName.toLowerCase().includes(search.toLowerCase()) ||
        t.columns.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
    );

    const toggle = (name: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(filtered.map(t => t.name)));
    const collapseAll = () => setExpanded(new Set());

    return (
        <div style={{ padding: '24px', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Database size={22} style={{ color: '#051650' }} />
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#051650', margin: 0 }}>
                    Mapa de Base de Datos
                </h1>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    {SCHEMA_DATA.length} tablas · {SCHEMA_DATA.reduce((s, t) => s + t.columns.length, 0)} columnas
                </span>
            </div>

            {/* Search + actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '8px 12px', flex: 1,
                }}>
                    <Search size={14} style={{ color: '#94a3b8' }} />
                    <input
                        placeholder="Buscar tabla o columna..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            border: 'none', background: 'none', outline: 'none',
                            fontSize: 13, fontWeight: 500, color: '#0f172a', width: '100%',
                        }}
                    />
                </div>
                <button onClick={expandAll} style={btnStyle}>Expandir todo</button>
                <button onClick={collapseAll} style={btnStyle}>Colapsar</button>
            </div>

            {/* Results count */}
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
                {filtered.length} tablas {search && `para "${search}"`}
            </p>

            {/* Tables list */}
            {filtered.map(table => {
                const isOpen = expanded.has(table.name);
                const totalFKs = table.columns.filter(c => c.isFK).length;
                return (
                    <div key={table.name} style={{
                        border: '1px solid #e2e8f0', borderRadius: 12,
                        marginBottom: 8, background: '#fff', overflow: 'hidden',
                    }}>
                        {/* Table header */}
                        <button
                            onClick={() => toggle(table.name)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px', border: 'none', background: isOpen ? '#f8fafc' : '#fff',
                                cursor: 'pointer', textAlign: 'left',
                            }}
                        >
                            {isOpen ? <ChevronDown size={14} style={{ color: '#051650' }} /> : <ChevronRight size={14} style={{ color: '#94a3b8' }} />}
                            <Table2 size={14} style={{ color: '#051650' }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#051650' }}>
                                {table.geliteName}
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 600, color: '#94a3b8',
                                padding: '2px 8px', background: '#f1f5f9', borderRadius: 6,
                            }}>
                                {table.rows.toLocaleString()} rows
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 600, color: '#94a3b8',
                                padding: '2px 8px', background: '#f1f5f9', borderRadius: 6,
                            }}>
                                {table.columns.length} cols
                            </span>
                            {totalFKs > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600, color: '#118DF0',
                                    padding: '2px 8px', background: '#eff6ff', borderRadius: 6,
                                }}>
                                    {totalFKs} FK
                                </span>
                            )}
                        </button>

                        {/* Columns table */}
                        {isOpen && (
                            <div style={{ padding: '0 16px 12px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={thStyle}>#</th>
                                            <th style={{ ...thStyle, textAlign: 'left' }}>Columna</th>
                                            <th style={thStyle}>Tipo</th>
                                            <th style={thStyle}>Null</th>
                                            <th style={{ ...thStyle, textAlign: 'left' }}>Descripción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.columns.map(col => (
                                            <tr key={col.num} style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                background: col.isPK ? '#fffff0' : col.isFK ? '#f0f9ff' : undefined,
                                            }}>
                                                <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                                                    {col.num}
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        {col.isPK && <Key size={10} style={{ color: '#eab308' }} />}
                                                        {col.isFK && <ArrowRight size={10} style={{ color: '#118DF0' }} />}
                                                        <span style={{ fontWeight: col.isPK || col.isFK ? 700 : 500, color: '#0f172a' }}>
                                                            {col.name}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '1px 6px', borderRadius: 4, fontSize: 11,
                                                        background: '#f1f5f9', color: '#64748b', fontWeight: 600,
                                                    }}>
                                                        {col.type}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center', color: col.nullable ? '#94a3b8' : '#e2e8f0' }}>
                                                    {col.nullable ? '✓' : '—'}
                                                </td>
                                                <td style={{ ...tdStyle, color: '#64748b' }}>
                                                    {col.isFK && col.fkTarget && (
                                                        <span style={{ color: '#118DF0', fontWeight: 600 }}>
                                                            → {col.fkTarget} ·{' '}
                                                        </span>
                                                    )}
                                                    {col.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b',
    cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
    padding: '8px 6px', textAlign: 'center', fontWeight: 700,
    color: '#64748b', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
    padding: '6px', fontSize: 12,
};
