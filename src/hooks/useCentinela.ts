// ═══════════════════════════════════════════════════════
//  useCentinela — React hook for Centinela Engine
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CentinelaError, CentinelaStats } from '../centinela/types';
import { CentinelaEngine } from '../centinela/engine';
import { ProcessSimulator } from '../centinela/simulator';

interface UseCentinelaReturn {
    errors: CentinelaError[];
    stats: CentinelaStats;
    markHandled: (id: string) => void;
    markAllHandled: () => void;
    clearAll: () => void;
    simulatorRunning: boolean;
    startSimulation: () => void;
    stopSimulation: () => void;
    emitBurst: (count?: number) => void;
    setSimulationSpeed: (ms: number) => void;
}

const defaultStats: CentinelaStats = {
    totalErrors: 0,
    criticalCount: 0,
    unhandledCount: 0,
    errorsPerMinute: 0,
    systemHealth: 'healthy',
    uptimePercent: 100,
    moduleHealthMap: {} as CentinelaStats['moduleHealthMap'],
};

export function useCentinela(): UseCentinelaReturn {
    const [errors, setErrors] = useState<CentinelaError[]>([]);
    const [stats, setStats] = useState<CentinelaStats>(defaultStats);
    const [simulatorRunning, setSimulatorRunning] = useState(false);

    const engineRef = useRef<CentinelaEngine>(CentinelaEngine.getInstance());
    const simulatorRef = useRef<ProcessSimulator>(new ProcessSimulator(engineRef.current, 2500));

    useEffect(() => {
        const engine = engineRef.current;
        engine.install();

        const unsub = engine.subscribe((errs, st) => {
            setErrors(errs);
            setStats(st);
        });

        // ─── Lógica para conectar API remota ───
        if (import.meta.hot) {
            import.meta.hot.on('centinela:error', (errorData: any) => {
                engine.captureError({
                    message: errorData.message || 'Error Remoto',
                    stack: errorData.stack,
                    module: errorData.module || 'sistema',
                    severity: errorData.severity || 'error',
                    context: errorData.context || {},
                    source: errorData.source || 'remote'
                });
            });
        }

        return () => {
            unsub();
            simulatorRef.current.stop();
        };
    }, []);

    const markHandled = useCallback((id: string) => {
        engineRef.current.markHandled(id);
    }, []);

    const markAllHandled = useCallback(() => {
        engineRef.current.markAllHandled();
    }, []);

    const clearAll = useCallback(() => {
        engineRef.current.clearAll();
    }, []);

    const startSimulation = useCallback(() => {
        simulatorRef.current.start();
        setSimulatorRunning(true);
    }, []);

    const stopSimulation = useCallback(() => {
        simulatorRef.current.stop();
        setSimulatorRunning(false);
    }, []);

    const emitBurst = useCallback((count = 5) => {
        simulatorRef.current.emitBurst(count);
    }, []);

    const setSimulationSpeed = useCallback((ms: number) => {
        simulatorRef.current.setSpeed(ms);
    }, []);

    return {
        errors,
        stats,
        markHandled,
        markAllHandled,
        clearAll,
        simulatorRunning,
        startSimulation,
        stopSimulation,
        emitBurst,
        setSimulationSpeed,
    };
}
