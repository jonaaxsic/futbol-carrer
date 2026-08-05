/**
 * Entidad Entrenamiento (tabla `entrenamiento`, §4.2 + §13b).
 * El "tiempo real" se guarda como timestamps epoch ms para que el countdown
 * siga funcionando aunque la app se cierre.
 */

/** Tipos de entrenamiento: los 3 originales + los específicos por posición. */
export type TipoEntrenamiento =
  | 'basico' | 'normal' | 'extremo'
  // Por posición (§13b)
  | 'por-reflejos' | 'por-saque' | 'por-aereo' | 'por-fisico'
  | 'dfc-marcar' | 'dfc-aereo' | 'dfc-salida' | 'dfc-fisico'
  | 'li-banda' | 'li-centro' | 'li-defensa' | 'li-fisico'
  | 'ld-banda' | 'ld-centro' | 'ld-defensa' | 'ld-fisico'
  | 'mc-pase' | 'mc-regate' | 'mc-tiro' | 'mc-fisico'
  | 'mco-creation' | 'mco-tiro' | 'mco-regate' | 'mco-fisico'
  | 'ei-desborde' | 'ei-centro' | 'ei-gol' | 'ei-fisico'
  | 'ed-desborde' | 'ed-centro' | 'ed-gol' | 'ed-fisico'
  | 'dc-remate' | 'dc-aereo' | 'dc-movimiento' | 'dc-fisico';

export interface Entrenamiento {
  id: number;
  playerId: number;
  tipo: TipoEntrenamiento;
  nivel?: 'bajo' | 'medio' | 'alto' | 'extremo';
  inicioTs: number;
  duracionHoras: number;
  /** Fecha estimada de fin (inicioTs + duración) — la calcula el servicio. */
  finEstimadaTs: number;
  /** Delta de OVR aplicado al completarse (null si aún no se evalúa). */
  ovrDelta: number | null;
  completado: boolean;
}