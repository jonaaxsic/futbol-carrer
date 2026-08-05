/**
 * Constantes de timing del replay de partido (§ design D8).
 * Un partido replay dura ~4.5 min: 2' primer tiempo + 2' segundo + 2-6' agregado.
 * El reloj del replayer (src/app/match.tsx, PR3) avanza contra estas constantes.
 */

/** Duración real del primer tiempo en ms (minutos 1-45). */
export const DURACION_1T = 120_000;

/** Duración real del segundo tiempo en ms (minutos 46-90). */
export const DURACION_2T = 120_000;

/** Duración de cada minuto de tiempo agregado en ms (10 s reales = 1 min de partido). */
const MS_POR_MINUTO_AGREGADO = 10_000;

/** Genera el tiempo agregado aleatorio (2-6 minutos, solo 2T). */
export function generarAgregado(): number {
  const minutos = 2 + Math.floor(Math.random() * 5); // 2, 3, 4, 5 o 6
  return minutos * MS_POR_MINUTO_AGREGADO;
}

/** Timeout del mini-juego de penal en ms (sin input → fallado, spec R5). */
export const PENAL_TIMEOUT_MS = 8_000;

/** Duración total del replay (se calcula al inicio del partido). */
export function calcularDuracionTotal(agregado: number): number {
  return DURACION_1T + DURACION_2T + agregado;
}

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

/**
 * Calcula el minuto de partido incluyendo tiempo agregado.
 * Retorna { minuto, esAgregado, minutoAgregado }.
 */
export function calcularMinutoConAgregado(
  ms: number,
  duracionTotal: number,
): { minuto: number; esAgregado: boolean; minutoAgregado: number } {
  const fin2T = DURACION_1T + DURACION_2T;
  if (ms < fin2T) {
    // Dentro del tiempo reglamentario
    if (ms < DURACION_1T) {
      return {
        minuto: Math.max(1, Math.min(45, 1 + Math.floor((ms / DURACION_1T) * 45))),
        esAgregado: false,
        minutoAgregado: 0,
      };
    }
    return {
      minuto: Math.max(46, Math.min(90, 46 + Math.floor(((ms - DURACION_1T) / DURACION_2T) * 45))),
      esAgregado: false,
      minutoAgregado: 0,
    };
  }
  // Tiempo agregado: cada 10s = 1 minuto
  const agregadoMs = ms - fin2T;
  const minutoAgreg = Math.min(6, Math.floor(agregadoMs / 10_000) + 1);
  return {
    minuto: 90,
    esAgregado: true,
    minutoAgregado: minutoAgreg,
  };
}
