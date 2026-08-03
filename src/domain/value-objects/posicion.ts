/**
 * Value Object: Posición en la cancha.
 * Fuente única de verdad del dominio (la pantalla 6 importa de acá, no duplica).
 */

export const POSICIONES = [
  { id: 'POR', etiqueta: 'Portero', descripcion: 'Tu misión: atajar y dar seguridad al equipo.' },
  { id: 'DFC', etiqueta: 'Defensa Central', descripcion: 'Tu misión: cortar ataques y ganar duelos.' },
  { id: 'LI', etiqueta: 'Lateral Izquierdo', descripcion: 'Tu misión: cubrir la banda y apoyar en ataque.' },
  { id: 'LD', etiqueta: 'Lateral Derecho', descripcion: 'Tu misión: cubrir la banda y apoyar en ataque.' },
  { id: 'MC', etiqueta: 'Mediocampista Central', descripcion: 'Tu misión: distribuir y dominar el medio.' },
  { id: 'MCO', etiqueta: 'Mediocampista Ofensivo', descripcion: 'Tu misión: crear juego y asistir.' },
  { id: 'EI', etiqueta: 'Extremo Izquierdo', descripcion: 'Tu misión: desbordar y asistir.' },
  { id: 'ED', etiqueta: 'Extremo Derecho', descripcion: 'Tu misión: desbordar y asistir.' },
  { id: 'DC', etiqueta: 'Delantero Centro', descripcion: 'Tu misión: marcar goles y ser decisivo.' },
] as const;

export type Posicion = (typeof POSICIONES)[number]['id'];

/** Guard de tipo: valida que un string devuelto por SQLite sea una posición válida. */
export function esPosicion(valor: string): valor is Posicion {
  return POSICIONES.some((p) => p.id === valor);
}