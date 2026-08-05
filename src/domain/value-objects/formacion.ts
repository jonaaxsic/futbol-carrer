import { POSICIONES, esPosicion, type Posicion } from '@/domain/value-objects/posicion';

/**
 * Value Object: Formación táctica (design D4).
 * 5 formaciones base con 11 slots cada una: posición + coordenada relativa
 * en la cancha (x ∈ [0,1] izquierda→derecha, y ∈ [0,1] propio arco→rival).
 * Fuente única para el pitch del onboarding, el once del partido y la
 * selección de posición al cambiar de club (spec formations R1/R5).
 */

export type NombreFormacion = '4-3-3' | '4-4-2' | '4-2-3-1' | '5-3-2' | '3-5-2';

export interface SlotFormacion {
  posicion: Posicion;
  /** 0 = banda izquierda, 1 = banda derecha. */
  x: number;
  /** 0 = propio arco (portero), 1 = arco rival (delanteros). */
  y: number;
}

export interface Formacion {
  nombre: NombreFormacion;
  /** Exactamente 11 slots (spec R1). */
  slots: readonly SlotFormacion[];
}

/** Fallback para posiciones que una formación no contiene (MCO → MC). */
export const POSICION_FALLBACK: Partial<Record<Posicion, Posicion>> = {
  MCO: 'MC',
};

const MEDIO = (x: number, y: number): SlotFormacion => ({ posicion: 'MC', x, y });

export const FORMACIONES: readonly Formacion[] = [
  {
    nombre: '4-3-3',
    slots: [
      { posicion: 'POR', x: 0.5, y: 0.05 },
      { posicion: 'LI', x: 0.14, y: 0.2 },
      { posicion: 'DFC', x: 0.38, y: 0.22 },
      { posicion: 'DFC', x: 0.62, y: 0.22 },
      { posicion: 'LD', x: 0.86, y: 0.2 },
      MEDIO(0.5, 0.42),
      MEDIO(0.28, 0.55),
      MEDIO(0.72, 0.55),
      { posicion: 'EI', x: 0.16, y: 0.78 },
      { posicion: 'ED', x: 0.84, y: 0.78 },
      { posicion: 'DC', x: 0.5, y: 0.9 },
    ],
  },
  {
    nombre: '4-4-2',
    slots: [
      { posicion: 'POR', x: 0.5, y: 0.05 },
      { posicion: 'LI', x: 0.14, y: 0.2 },
      { posicion: 'DFC', x: 0.38, y: 0.22 },
      { posicion: 'DFC', x: 0.62, y: 0.22 },
      { posicion: 'LD', x: 0.86, y: 0.2 },
      { posicion: 'EI', x: 0.05, y: 0.52 },
      MEDIO(0.34, 0.5),
      MEDIO(0.66, 0.5),
      { posicion: 'ED', x: 0.95, y: 0.52 },
      { posicion: 'DC', x: 0.35, y: 0.82 },
      { posicion: 'DC', x: 0.65, y: 0.82 },
    ],
  },
  {
    nombre: '4-2-3-1',
    slots: [
      { posicion: 'POR', x: 0.5, y: 0.05 },
      { posicion: 'LI', x: 0.14, y: 0.2 },
      { posicion: 'DFC', x: 0.38, y: 0.22 },
      { posicion: 'DFC', x: 0.62, y: 0.22 },
      { posicion: 'LD', x: 0.86, y: 0.2 },
      MEDIO(0.32, 0.42),
      MEDIO(0.68, 0.42),
      { posicion: 'EI', x: 0.14, y: 0.72 },
      { posicion: 'MCO', x: 0.5, y: 0.74 },
      { posicion: 'ED', x: 0.86, y: 0.72 },
      { posicion: 'DC', x: 0.5, y: 0.9 },
    ],
  },
  {
    nombre: '5-3-2',
    slots: [
      { posicion: 'POR', x: 0.5, y: 0.05 },
      { posicion: 'LI', x: 0.1, y: 0.18 },
      { posicion: 'DFC', x: 0.3, y: 0.24 },
      { posicion: 'DFC', x: 0.5, y: 0.27 },
      { posicion: 'DFC', x: 0.7, y: 0.24 },
      { posicion: 'LD', x: 0.9, y: 0.18 },
      MEDIO(0.3, 0.5),
      MEDIO(0.5, 0.56),
      MEDIO(0.7, 0.5),
      { posicion: 'DC', x: 0.35, y: 0.85 },
      { posicion: 'DC', x: 0.65, y: 0.85 },
    ],
  },
  {
    nombre: '3-5-2',
    slots: [
      { posicion: 'POR', x: 0.5, y: 0.05 },
      { posicion: 'DFC', x: 0.27, y: 0.2 },
      { posicion: 'DFC', x: 0.5, y: 0.23 },
      { posicion: 'DFC', x: 0.73, y: 0.2 },
      { posicion: 'LI', x: 0.05, y: 0.55 },
      MEDIO(0.3, 0.52),
      MEDIO(0.5, 0.6),
      MEDIO(0.7, 0.52),
      { posicion: 'LD', x: 0.95, y: 0.55 },
      { posicion: 'DC', x: 0.35, y: 0.86 },
      { posicion: 'DC', x: 0.65, y: 0.86 },
    ],
  },
] as const;

export function formacionPorNombre(nombre: NombreFormacion): Formacion {
  const f = FORMACIONES.find((form) => form.nombre === nombre);
  if (!f) throw new Error(`Formación desconocida: ${nombre}`);
  return f;
}

/** Formación base determinística de un club (sin almacenamiento; D4). */
export function formacionBaseDeClub(clubId: number): Formacion {
  if (!Number.isFinite(clubId) || clubId <= 0) return FORMACIONES[0];
  return FORMACIONES[clubId % FORMACIONES.length];
}

/** Posiciones presentes en una formación (sin repetir, en orden de cancha). */
export function posicionesDeFormacion(f: Formacion): Posicion[] {
  const set = new Set<Posicion>();
  for (const slot of f.slots) set.add(slot.posicion);
  return [...set];
}

/** true si la formación incluye la posición. */
export function formacionUsa(f: Formacion, posicion: Posicion): boolean {
  return f.slots.some((s) => s.posicion === posicion);
}

/**
 * Resuelve la posición efectiva de un jugador dentro de una formación:
 * si la formación no tiene su posición, aplica POSICION_FALLBACK.
 */
export function posicionEnFormacion(f: Formacion, posicion: Posicion): Posicion {
  if (formacionUsa(f, posicion)) return posicion;
  const fallback = POSICION_FALLBACK[posicion];
  return fallback && formacionUsa(f, fallback) ? fallback : posicion;
}

/** Valida que una formación tenga 11 slots y todas las posiciones existan. */
export function validarFormacion(f: Formacion): boolean {
  if (f.slots.length !== 11) return false;
  return f.slots.every((s) => esPosicion(s.posicion));
}

/** Todas las posiciones válidas del juego (para la pantalla de selección). */
export const POSICIONES_BASE = POSICIONES.map((p) => p.id);