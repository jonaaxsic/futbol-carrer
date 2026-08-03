/**
 * Reglas de ENERGÍA (nuevo sistema de juego).
 * Puro: solo recibe estado y timestamps — sin SQLite, sin React.
 *
 * Reglas:
 * - Máximo 10 barras. Partido = 3 barras. Entrenamiento = 2 barras.
 * - Regeneración por TIEMPO REAL: 1 barra cada 2 horas de reloj
 *   (se calcula por timestamp, funciona aunque la app esté cerrada).
 * - La forma del jugador deriva de la energía disponible.
 */

export interface EnergiaEstado {
  /** Barras almacenadas la última vez que se persistió. */
  energia: number;
  energiaMax: number;
  /** Epoch ms de la última persistencia/consumo. */
  energiaActualizadaTs: number;
}

/** 1 barra cada 2 horas (ms). */
export const MS_REGEN_BARRA = 7_200_000;
export const ENERGIA_MAX = 10;
export const ENERGIA_PARTIDO = 3;
export const ENERGIA_ENTRENAMIENTO = 2;

/**
 * Barras disponibles AHORA según el timestamp almacenado:
 * energia_actual = min(max, almacenada + floor((ahora - ts) / 2h))
 */
export function calcularEnergiaDisponible(estado: EnergiaEstado, ahoraTs: number): number {
  const transcurrido = Math.max(0, ahoraTs - estado.energiaActualizadaTs);
  const regeneradas = Math.floor(transcurrido / MS_REGEN_BARRA);
  return Math.min(estado.energiaMax, estado.energia + regeneradas);
}

/** Ms hasta la próxima barra regenerada, o null si ya está lleno. */
export function proximaBarraEnMs(estado: EnergiaEstado, ahoraTs: number): number | null {
  if (estado.energia >= estado.energiaMax) return null;
  const disponible = calcularEnergiaDisponible(estado, ahoraTs);
  if (disponible >= estado.energiaMax) return null;
  const transcurrido = Math.max(0, ahoraTs - estado.energiaActualizadaTs);
  return MS_REGEN_BARRA - (transcurrido % MS_REGEN_BARRA);
}

/** Forma (0.5-1.25) derivada de la energía: más energía = mejor rendimiento. */
export function formaDesdeEnergia(energia: number): number {
  if (energia >= 9) return 1.25;
  if (energia >= 7) return 1.1;
  if (energia >= 5) return 0.95;
  if (energia >= 3) return 0.8;
  if (energia >= 1) return 0.65;
  return 0.5;
}

export function puedeJugarPartido(energia: number): boolean {
  return energia >= ENERGIA_PARTIDO;
}

export function puedeEntrenar(energia: number): boolean {
  return energia >= ENERGIA_ENTRENAMIENTO;
}
