import type { PartidoRepository } from '@/domain/interfaces/repositories';
import type { Partido } from '@/domain/entities/partido';

import { getDb } from '../db/client';
import { filaToPartido, type PartidoRow } from '../mappers/partido-mapper';

/** Repositorio SQLite de partidos (fixture de temporada). */
export const partidoRepository: PartidoRepository = {
  async createMany(partidos): Promise<void> {
    const db = await getDb();
    for (const p of partidos) {
      await db.runAsync(
        `INSERT INTO partido (temporada_id, fecha_ts, rival_club_id, competencia, local)
         VALUES (?, ?, ?, ?, ?)`,
        [p.temporadaId, p.fechaTs, p.rivalClubId, p.competencia, p.local ? 1 : 0],
      );
    }
  },

  async findByTemporada(temporadaId: number): Promise<Partido[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<PartidoRow>(
      'SELECT * FROM partido WHERE temporada_id = ? ORDER BY fecha_ts ASC',
      temporadaId,
    );
    return filas.map(filaToPartido);
  },

  async findProximos(temporadaId: number, desdeTs: number, limite = 10): Promise<Partido[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<PartidoRow>(
      `SELECT * FROM partido
       WHERE temporada_id = ? AND jugo = 0 AND fecha_ts >= ?
       ORDER BY fecha_ts ASC LIMIT ?`,
      [temporadaId, desdeTs, limite],
    );
    return filas.map(filaToPartido);
  },

  async marcarJugado(id, resultado, goles, asistencias, eventosJson): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE partido SET jugo = 1, resultado = ?, goles = ?, asistencias = ?, eventos_json = ?
       WHERE id = ?`,
      [resultado, goles, asistencias, eventosJson, id],
    );
  },

  /** Persiste la timeline del replay sin marcar el partido como jugado (D1). */
  async guardarTimeline(id: number, eventosJson: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE partido SET eventos_json = ? WHERE id = ?', [eventosJson, id]);
  },

  /** Marca un partido como suspendido (lesión/expulsión): se omite sin stats. */
  async marcarSuspendido(id: number, motivo: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE partido SET suspendido = 1, eventos_json = ? WHERE id = ?`,
      [JSON.stringify({ suspendido: motivo }), id],
    );
  },

  /** Omite definitivamente un partido suspendido (no suma PJ ni goles). */
  async omitir(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE partido SET jugo = 1, suspendido = 1 WHERE id = ?', [id]);
  },
};