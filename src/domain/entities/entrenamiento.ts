/**
 * Entidad Entrenamiento (tabla `entrenamiento`, §4.2).
 * El "tiempo real" se guarda como timestamps epoch ms para que el countdown
 * siga funcionando aunque la app se cierre.
 */

export type TipoEntrenamiento = 'basico' | 'normal' | 'extremo';

export interface Entrenamiento {
  id: number;
  playerId: number;
  tipo: TipoEntrenamiento;
  inicioTs: number;
  duracionHoras: number;
  /** Fecha estimada de fin (inicioTs + duración) — la calcula el servicio. */
  finEstimadaTs: number;
  /** Delta de OVR aplicado al completarse (null si aún no se evalúa). */
  ovrDelta: number | null;
  completado: boolean;
}