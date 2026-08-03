import type { EventoLogRepository } from '@/domain/interfaces/repositories';
import type { EventoLog } from '@/domain/entities/evento-log';

import { getDb } from '../db/client';
import { filaToEventoLog, type EventoLogRow } from '../mappers/evento-log-mapper';

/** Repositorio SQLite del log de eventos narrativos (Sprint 5). */
export const eventoLogRepository: EventoLogRepository = {
  async crear(data: {
    playerId: number;
    tipo: EventoLog['tipo'];
    descripcion: string;
    impactoJson: string | null;
  }): Promise<EventoLog> {
    const db = await getDb();
    const resultado = await db.runAsync(
      `INSERT INTO evento_log (player_id, fecha_ts, tipo, descripcion, impacto_json)
       VALUES (?, ?, ?, ?, ?)`,
      [data.playerId, Date.now(), data.tipo, data.descripcion, data.impactoJson],
    );
    const fila = await db.getFirstAsync<EventoLogRow>(
      'SELECT * FROM evento_log WHERE id = ?',
      resultado.lastInsertRowId,
    );
    if (!fila) throw new Error('No se pudo leer el evento recién creado');
    return filaToEventoLog(fila);
  },

  async findRecientes(playerId: number, limite = 30): Promise<EventoLog[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<EventoLogRow>(
      `SELECT * FROM evento_log
       WHERE player_id = ? ORDER BY fecha_ts DESC LIMIT ?`,
      [playerId, limite],
    );
    return filas.map(filaToEventoLog);
  },
};