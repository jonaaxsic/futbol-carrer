/**
 * Constantes de timing del replay de partido (§ design D8).
 * Un partido replay dura ~4.5 min: 2' primer tiempo + 2' segundo + 30'' agregado.
 * El reloj del replayer (src/app/match.tsx, PR3) avanza contra estas constantes.
 */

/** Duración real del primer tiempo en ms (minutos 1-45). */
export const DURACION_1T = 120_000;

/** Duración real del segundo tiempo en ms (minutos 46-90). */
export const DURACION_2T = 120_000;

/** Agregado en ms (minutos 90+; solo narración, sin goles nuevos). */
export const AGREGADO = 30_000;

/** Timeout del mini-juego de penal en ms (sin input → fallado, spec R5). */
export const PENAL_TIMEOUT_MS = 8_000;

/** Duración total del replay. */
export const DURACION_TOTAL_MS = DURACION_1T + DURACION_2T + AGREGADO;

/**
 * Mapea un minuto de partido (1-90) al offset del reloj del replay.
 * 1T: minutos 1-45 → 0..DURACION_1T · 2T: minutos 46-90 → DURACION_1T..+2T.
 * Minutos fuera de rango se acotan a los extremos.
 */
export function minutoAOffsetMs(minuto: number): number {
  const m = Math.min(90, Math.max(1, Math.round(minuto)));
  if (m <= 45) {
    return Math.round(((m - 1) / 45) * DURACION_1T);
  }
  return DURACION_1T + Math.round(((m - 46) / 45) * DURACION_2T);
}
