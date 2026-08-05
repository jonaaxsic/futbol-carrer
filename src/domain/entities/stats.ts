/**
 * Sistema de estadísticas del jugador (§14).
 * 15 stats que varían según la posición. Todas parten de 50.
 * OVR = promedio de todas las stats.
 */

import type { Posicion } from '../value-objects/posicion';

/** Todas las stats posibles (máximo 15 por jugador). */
export type StatName =
  | 'velocidad'
  | 'resistencia'
  | 'potenciaTiro'
  | 'remate'
  | 'regate'
  | 'pase'
  | 'cabezazo'
  | 'juegoEquipo'
  | 'salto'
  | 'entradas'
  | 'marcado'
  | 'atajadas'
  | 'colocacion'
  | 'reflejos'
  | 'juegoAereo';

/** Stats base (todas en 50). */
export const STATS_BASE: Record<StatName, number> = {
  velocidad: 50,
  resistencia: 50,
  potenciaTiro: 50,
  remate: 50,
  regate: 50,
  pase: 50,
  cabezazo: 50,
  juegoEquipo: 50,
  salto: 50,
  entradas: 50,
  marcado: 50,
  atajadas: 50,
  colocacion: 50,
  reflejos: 50,
  juegoAereo: 50,
};

/** Stats relevantes por posición (las que se entrenan y mejoran). */
export const STATS_POR_POSICION: Record<Posicion, StatName[]> = {
  POR: ['atajadas', 'reflejos', 'colocacion', 'juegoAereo', 'velocidad', 'resistencia'],
  DFC: ['entradas', 'marcado', 'cabezazo', 'juegoAereo', 'velocidad', 'resistencia', 'juegoEquipo'],
  LI: ['velocidad', 'resistencia', 'pase', 'entradas', 'marcado', 'juegoEquipo'],
  LD: ['velocidad', 'resistencia', 'pase', 'entradas', 'marcado', 'juegoEquipo'],
  MC: ['pase', 'regate', 'potenciaTiro', 'juegoEquipo', 'resistencia', 'velocidad'],
  MCO: ['pase', 'regate', 'potenciaTiro', 'remate', 'juegoEquipo', 'velocidad'],
  EI: ['velocidad', 'regate', 'pase', 'potenciaTiro', 'resistencia', 'juegoEquipo'],
  ED: ['velocidad', 'regate', 'pase', 'potenciaTiro', 'resistencia', 'juegoEquipo'],
  DC: ['remate', 'potenciaTiro', 'cabezazo', 'velocidad', 'regate', 'juegoEquipo'],
};

/** Tipo que representa las stats del jugador (solo las relevantes para su posición). */
export type PlayerStats = Partial<Record<StatName, number>>;

/** Calcula el OVR como promedio de todas las stats del jugador. */
export function calcularOVR(stats: PlayerStats): number {
  const values = Object.values(stats).filter((v): v is number => v != null);
  if (values.length === 0) return 50;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Inicializa las stats base para una posición dada. */
export function statsIniciales(posicion: Posicion): PlayerStats {
  const relevantes = STATS_POR_POSICION[posicion];
  const stats: PlayerStats = {};
  for (const stat of relevantes) {
    stats[stat] = STATS_BASE[stat];
  }
  return stats;
}

/** Clampa un valor de stat entre 1 y 99. */
export function clampStat(value: number): number {
  return Math.max(1, Math.min(99, value));
}

/** Etiquetas legibles de cada stat. */
export const STAT_LABELS: Record<StatName, string> = {
  velocidad: 'Velocidad',
  resistencia: 'Resistencia',
  potenciaTiro: 'Potencia de tiro',
  remate: 'Remate',
  regate: 'Regate',
  pase: 'Pase',
  cabezazo: 'Cabezazo',
  juegoEquipo: 'Juego en equipo',
  salto: 'Salto',
  entradas: 'Entradas',
  marcado: 'Marcado',
  atajadas: 'Atajadas',
  colocacion: 'Colocación',
  reflejos: 'Reflejos',
  juegoAereo: 'Juego aéreo',
};
