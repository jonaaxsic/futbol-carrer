import type { Entrenamiento } from '@/domain/entities/entrenamiento';

/** Fila cruda de la tabla `entrenamiento`. */
export interface EntrenamientoRow {
  id: number;
  player_id: number;
  tipo: string;
  inicio_ts: number;
  duracion_horas: number;
  fin_estimada_ts: number;
  ovr_delta: number | null;
  completado: number;
}

/** Mapper: fila SQLite → entidad Entrenamiento. */
export function filaToEntrenamiento(fila: EntrenamientoRow): Entrenamiento {
  if (fila.tipo !== 'basico' && fila.tipo !== 'normal' && fila.tipo !== 'extremo') {
    throw new Error(`Tipo de entrenamiento inválido en BD: ${fila.tipo}`);
  }
  return {
    id: fila.id,
    playerId: fila.player_id,
    tipo: fila.tipo,
    inicioTs: fila.inicio_ts,
    duracionHoras: fila.duracion_horas,
    finEstimadaTs: fila.fin_estimada_ts,
    ovrDelta: fila.ovr_delta,
    completado: fila.completado === 1,
  };
}