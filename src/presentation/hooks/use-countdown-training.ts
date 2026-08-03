import { useEffect, useState } from 'react';

/**
 * Countdown de entrenamiento (§4.2): recalcula el tiempo restante cada
 * segundo mientras la sesión no haya vencido. Al vencer, se resuelve la
 * sesión (la app pudo haber estado cerrada — los timestamps mandan).
 */
export function useCountdownTraining(finEstimadaTs: number | null): {
  restanteMs: number;
  terminado: boolean;
} {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (finEstimadaTs == null) return;
    const interval = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [finEstimadaTs]);

  const restante = finEstimadaTs == null ? 0 : finEstimadaTs - ahora;
  return {
    restanteMs: Math.max(0, restante),
    terminado: restante <= 0,
  };
}

/** Formatea ms → "HH:MM:SS" (o "MM:SS" si < 1 h). */
export function formatearCountdown(ms: number): string {
  const totalSeg = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  const dos = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${dos(h)}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}