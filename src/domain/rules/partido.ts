import { OVR_MAX } from '@/shared/constants/game';

/**
 * Reglas de simulación de partido (§4.5 del plan).
 * Puro: solo recibe stats y devuelve el resultado — sin SQLite, sin React.
 *
 * Modelo: la probabilidad de victoria se calcula por diferencia de OVR
 * (el nuestro vs. el rival, estimado por prestigio del club). El jugador
 * anota goles según su posición y su rendimiento individual.
 */

export interface SimularPartidoParams {
  /** OVR actual del jugador (50-99). */
  ovrJugador: number;
  /** Prestigio del club rival (1-5) → OVR rival estimado. */
  prestigioRival: number;
  /** Posición del jugador: POR rara vez anota, delanteros más. */
  posicion: string;
  /** Peso de rendimiento del jugador (0.5-1.5; entrena/frescura). */
  forma?: number;
  random?: () => number;
}

export interface ResultadoSimulacion {
  /** Goles a favor / en contra (nuestro club). */
  golesFavor: number;
  golesContra: number;
  /** Goles del jugador en el partido. */
  golesJugador: number;
  /** Asistencias del jugador. */
  asistenciasJugador: number;
  /** true si el jugador fue amonestado (tarjeta amarilla). */
  amarilla: boolean;
  /** true si fue expulsado (tarjeta roja) — raro. */
  roja: boolean;
  victoria: boolean;
  empate: boolean;
  derrota: boolean;
}

const OVR_RIVAL_POR_PRESTIGIO: Record<number, number> = {
  1: 62,
  2: 68,
  3: 74,
  4: 80,
  5: 86,
};

/** Probabilidad de gol del jugador según posición (factor multiplicativo). */
const GOLES_POR_POSICION: Record<string, number> = {
  DC: 1.0,
  ED: 0.75,
  EI: 0.75,
  MCO: 0.6,
  MC: 0.4,
  LI: 0.25,
  LD: 0.25,
  DFC: 0.2,
  POR: 0.02,
};

const ASISTENCIAS_POR_POSICION: Record<string, number> = {
  MCO: 1.0,
  MC: 0.9,
  ED: 0.8,
  EI: 0.8,
  DC: 0.55,
  LI: 0.6,
  LD: 0.6,
  DFC: 0.15,
  POR: 0.05,
};

export function simularPartido(params: SimularPartidoParams): ResultadoSimulacion {
  const rnd = params.random ?? Math.random;
  const ovrRival = OVR_RIVAL_POR_PRESTIGIO[params.prestigioRival] ?? 68;
  const forma = params.forma ?? 1.0;

  // Diferencia de OVR + forma → probabilidad base de victoria.
  const diff = params.ovrJugador * forma - ovrRival;
  const probVictoria = Math.min(0.8, Math.max(0.1, 0.42 + diff * 0.012));

  const roll = rnd();
  const victoria = roll < probVictoria;
  const empate = !victoria && roll < probVictoria + 0.25;

  // Goles del equipo (más si ganamos).
  const golesFavor = victoria ? 2 + Math.floor(rnd() * 2) : empate ? 1 : Math.floor(rnd() * 2);
  const golesContra = victoria ? Math.floor(rnd() * 2) : empate ? 1 : 2 + Math.floor(rnd() * 2);

  // Rendimiento individual del jugador.
  const factorPosicion = GOLES_POR_POSICION[params.posicion] ?? 0.4;
  const probGol = (0.12 + params.ovrJugador / 300) * factorPosicion * forma;
  const golesJugador = rnd() < probGol ? 1 + (rnd() < 0.2 ? 1 : 0) : 0;
  const factorAsist = ASISTENCIAS_POR_POSICION[params.posicion] ?? 0.5;
  const probAsist = (0.18 + params.ovrJugador / 400) * factorAsist * forma;
  const asistenciasJugador = rnd() < probAsist ? 1 : 0;

  const amarilla = rnd() < 0.08;
  const roja = !amarilla && rnd() < 0.01;

  return {
    golesFavor,
    golesContra,
    golesJugador,
    asistenciasJugador,
    amarilla,
    roja,
    victoria,
    empate,
    derrota: !victoria && !empate,
  };
}

export const resultadoString = (r: ResultadoSimulacion): string =>
  `${r.golesFavor}-${r.golesContra}`;

/** Ajusta la "forma" del jugador: descansa al menos 2 días → forma óptima. */
export function calcularForma(descansoHoras: number): number {
  if (descansoHoras >= 96) return 1.3;
  if (descansoHoras >= 72) return 1.15;
  if (descansoHoras >= 48) return 1.0;
  if (descansoHoras >= 24) return 0.85;
  return 0.7;
}

export { OVR_MAX };
