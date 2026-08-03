import type { Partido } from '@/domain/entities/partido';

/** Fila cruda de la tabla `partido`. */
export interface PartidoRow {
  id: number;
  temporada_id: number;
  fecha_ts: number;
  rival_club_id: number;
  competencia: string;
  local: number;
  resultado: string | null;
  jugo: number;
  suspendido: number;
  goles: number;
  asistencias: number;
  eventos_json: string | null;
}

/** Mapper: fila SQLite → entidad Partido. */
export function filaToPartido(fila: PartidoRow): Partido {
  return {
    id: fila.id,
    temporadaId: fila.temporada_id,
    fechaTs: fila.fecha_ts,
    rivalClubId: fila.rival_club_id,
    competencia: fila.competencia,
    local: fila.local === 1,
    resultado: fila.resultado,
    jugo: fila.jugo === 1,
    suspendido: fila.suspendido === 1,
    goles: fila.goles,
    asistencias: fila.asistencias,
    eventosJson: fila.eventos_json,
  };
}