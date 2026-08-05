/**
 * Entrenamientos por posición con 4 niveles de intensidad (§13b).
 * Cada posición tiene entrenamientos específicos con niveles:
 * - Bajo (3 km / 1-2 h)
 * - Medio (5 km / 3-4 h)
 * - Alto (10 km / 5-6 h)
 * - Extremo (20 km / 8 h)
 */

import type { Posicion } from '../value-objects/posicion';
import type { StatName } from '../entities/stats';

export type NivelEntrenamiento = 'bajo' | 'medio' | 'alto' | 'extremo';

export interface EntrenamientoPosicion {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: NivelEntrenamiento;
  duracionHoras: number;
  distanciaKm: number;
  statsObjetivo: StatName[];
  probSubida: number;
  deltaMin: number;
  deltaMax: number;
  probLesion: number;
}

/** Configuración de niveles base. */
const NIVELES: Record<NivelEntrenamiento, { horas: number; km: number; prob: number; dMin: number; dMax: number; lesion: number }> = {
  bajo: { horas: 2, km: 3, prob: 0.80, dMin: 1, dMax: 1, lesion: 0.02 },
  medio: { horas: 4, km: 5, prob: 0.70, dMin: 1, dMax: 2, lesion: 0.05 },
  alto: { horas: 6, km: 10, prob: 0.60, dMin: 2, dMax: 3, lesion: 0.10 },
  extremo: { horas: 8, km: 20, prob: 0.55, dMin: 3, dMax: 4, lesion: 0.18 },
};

/** Entrenamientos disponibles por posición. */
export const ENTRENAMIENTOS_POR_POSICION: Record<Posicion, Omit<EntrenamientoPosicion, 'nivel' | 'duracionHoras' | 'distanciaKm' | 'probSubida' | 'deltaMin' | 'deltaMax' | 'probLesion'>[]> = {
  POR: [
    { id: 'por-reflejos', nombre: 'Reflejos y atajadas', descripcion: 'Ejercicios de reacción y posicionamiento', statsObjetivo: ['reflejos', 'atajadas', 'colocacion'] },
    { id: 'por-saque', nombre: 'Saques y distribution', descripcion: 'Saques largos y cortos, juego con pies', statsObjetivo: ['pase', 'potenciaTiro'] },
    { id: 'por-aereo', nombre: 'Juego aéreo', descripcion: 'Cabezazos y dominio del área', statsObjetivo: ['juegoAereo', 'salto', 'cabezazo'] },
    { id: 'por-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['velocidad', 'resistencia'] },
  ],
  DFC: [
    { id: 'dfc-marcar', nombre: 'Marcado y entradas', descripcion: 'Trabajo defensivo individual', statsObjetivo: ['marcado', 'entradas'] },
    { id: 'dfc-aereo', nombre: 'Juego aéreo', descripcion: 'Cabezazos y despejes', statsObjetivo: ['cabezazo', 'juegoAereo', 'salto'] },
    { id: 'dfc-salida', nombre: 'Salida de balón', descripcion: 'Pases largos y construcción', statsObjetivo: ['pase', 'juegoEquipo'] },
    { id: 'dfc-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['velocidad', 'resistencia'] },
  ],
  LI: [
    { id: 'li-banda', nombre: 'Desborde por banda', descripcion: 'Velocidad y regate en la banda', statsObjetivo: ['velocidad', 'regate'] },
    { id: 'li-centro', nombre: 'Centro y pase', descripcion: 'Centros al área y pases precisos', statsObjetivo: ['pase', 'potenciaTiro'] },
    { id: 'li-defensa', nombre: 'Defensa individual', descripcion: 'Marcado y entradas en banda', statsObjetivo: ['entradas', 'marcado'] },
    { id: 'li-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  LD: [
    { id: 'ld-banda', nombre: 'Desborde por banda', descripcion: 'Velocidad y regate en la banda', statsObjetivo: ['velocidad', 'regate'] },
    { id: 'ld-centro', nombre: 'Centro y pase', descripcion: 'Centros al área y pases precisos', statsObjetivo: ['pase', 'potenciaTiro'] },
    { id: 'ld-defensa', nombre: 'Defensa individual', descripcion: 'Marcado y entradas en banda', statsObjetivo: ['entradas', 'marcado'] },
    { id: 'ld-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  MC: [
    { id: 'mc-pase', nombre: 'Pase y visión', descripcion: 'Pases cortos, largos y control', statsObjetivo: ['pase', 'juegoEquipo'] },
    { id: 'mc-regate', nombre: 'Regate y創造ación', descripcion: 'Dribling y pases en movimiento', statsObjetivo: ['regate', 'velocidad'] },
    { id: 'mc-tiro', nombre: 'Tiro y potencia', descripcion: 'Lanzamientos desde fuera del área', statsObjetivo: ['potenciaTiro', 'remate'] },
    { id: 'mc-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  MCO: [
    { id: 'mco-creation', nombre: 'Creatividad y pase', descripcion: 'Último pase y visión de juego', statsObjetivo: ['pase', 'juegoEquipo', 'regate'] },
    { id: 'mco-tiro', nombre: 'Tiro y definición', descripcion: 'Remates de media y larga distancia', statsObjetivo: ['remate', 'potenciaTiro'] },
    { id: 'mco-regate', nombre: 'Regate y desborde', descripcion: 'Dribling en espacios reducidos', statsObjetivo: ['regate', 'velocidad'] },
    { id: 'mco-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  EI: [
    { id: 'ei-desborde', nombre: 'Desborde y velocidad', descripcion: 'Velocidad y regate por la banda', statsObjetivo: ['velocidad', 'regate'] },
    { id: 'ei-centro', nombre: 'Centro y asistencia', descripcion: 'Centros precisos y pases clave', statsObjetivo: ['pase', 'potenciaTiro'] },
    { id: 'ei-gol', nombre: 'Definición', descripcion: 'Remates y definición ante el arquero', statsObjetivo: ['remate', 'potenciaTiro'] },
    { id: 'ei-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  ED: [
    { id: 'ed-desborde', nombre: 'Desborde y velocidad', descripcion: 'Velocidad y regate por la banda', statsObjetivo: ['velocidad', 'regate'] },
    { id: 'ed-centro', nombre: 'Centro y asistencia', descripcion: 'Centros precisos y pases clave', statsObjetivo: ['pase', 'potenciaTiro'] },
    { id: 'ed-gol', nombre: 'Definición', descripcion: 'Remates y definición ante el arquero', statsObjetivo: ['remate', 'potenciaTiro'] },
    { id: 'ed-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
  DC: [
    { id: 'dc-remate', nombre: 'Remate y definición', descripcion: 'Trabajo de finishing en el área', statsObjetivo: ['remate', 'potenciaTiro'] },
    { id: 'dc-aereo', nombre: 'Juego aéreo', descripcion: 'Cabezazos y posicionamiento', statsObjetivo: ['cabezazo', 'juegoAereo', 'salto'] },
    { id: 'dc-movimiento', nombre: 'Movimiento sin balón', descripcion: 'Desmarques y aperturas de espacio', statsObjetivo: ['velocidad', 'juegoEquipo'] },
    { id: 'dc-fisico', nombre: 'Físico general', descripcion: 'Correr, bicicleta, resistencia', statsObjetivo: ['resistencia', 'velocidad'] },
  ],
};

/**
 * Genera la lista completa de entrenamientos para una posición.
 * Cada tipo tiene 4 niveles de intensidad.
 */
export function entrenamientosParaPosicion(posicion: Posicion): EntrenamientoPosicion[] {
  const tipos = ENTRENAMIENTOS_POR_POSICION[posicion];
  const resultado: EntrenamientoPosicion[] = [];

  for (const tipo of tipos) {
    for (const nivel of ['bajo', 'medio', 'alto', 'extremo'] as NivelEntrenamiento[]) {
      const cfg = NIVELES[nivel];
      resultado.push({
        ...tipo,
        nivel,
        duracionHoras: cfg.horas,
        distanciaKm: cfg.km,
        probSubida: cfg.prob,
        deltaMin: cfg.dMin,
        deltaMax: cfg.dMax,
        probLesion: cfg.lesion,
      });
    }
  }

  return resultado;
}

/** Etiquetas legibles de nivel. */
export const NIVEL_ETIQUETA: Record<NivelEntrenamiento, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  extremo: 'Extremo',
};

/** Colores de nivel. */
export const NIVEL_COLOR: Record<NivelEntrenamiento, string> = {
  bajo: '#22C55E', // green
  medio: '#EAB308', // yellow
  alto: '#F97316', // orange
  extremo: '#EF4444', // red
};
