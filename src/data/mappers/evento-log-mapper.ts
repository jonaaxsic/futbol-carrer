import type { EventoLog, TipoEvento } from '@/domain/entities/evento-log';

/** Fila cruda de la tabla `evento_log`. */
export interface EventoLogRow {
  id: number;
  player_id: number;
  fecha_ts: number;
  tipo: string;
  descripcion: string;
  impacto_json: string | null;
}

const TIPOS_VALIDOS: readonly TipoEvento[] = [
  'lesion',
  'prensa',
  'oferta',
  'decision',
  'banca',
  'penal',
  'otro',
];

/** Mapper: fila SQLite → entidad EventoLog. */
export function filaToEventoLog(fila: EventoLogRow): EventoLog {
  if (!TIPOS_VALIDOS.includes(fila.tipo as TipoEvento)) {
    throw new Error(`Tipo de evento inválido en BD: ${fila.tipo}`);
  }
  return {
    id: fila.id,
    playerId: fila.player_id,
    fechaTs: fila.fecha_ts,
    tipo: fila.tipo as TipoEvento,
    descripcion: fila.descripcion,
    impactoJson: fila.impacto_json,
  };
}