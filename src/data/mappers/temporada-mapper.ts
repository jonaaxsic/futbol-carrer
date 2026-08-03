import type { Temporada } from '@/domain/entities/temporada';
import type { SeasonMode } from '@/shared/types';

/** Fila cruda de la tabla `temporada`. */
export interface TemporadaRow {
  id: number;
  player_id: number;
  anio_inicio: number;
  modo: string;
  pj: number;
  goles: number;
  asistencias: number;
  ovr_inicio: number | null;
  ovr_fin: number | null;
  activa: number;
}

/** Mapper: fila SQLite → entidad Temporada. */
export function filaToTemporada(fila: TemporadaRow): Temporada {
  if (fila.modo !== 'normal' && fila.modo !== 'rapido') {
    throw new Error(`Modo de temporada inválido en BD: ${fila.modo}`);
  }
  return {
    id: fila.id,
    playerId: fila.player_id,
    anioInicio: fila.anio_inicio,
    modo: fila.modo as SeasonMode,
    pj: fila.pj,
    goles: fila.goles,
    asistencias: fila.asistencias,
    ovrInicio: fila.ovr_inicio,
    ovrFin: fila.ovr_fin,
    activa: fila.activa === 1,
  };
}