import type {
  PlayerRepository,
} from '@/domain/interfaces/repositories';
import type { NuevoPlayer, Player } from '@/domain/entities/player';

import { getDb } from '../db/client';
import { filaToPlayer, type PlayerRow } from '../mappers/player-mapper';

/**
 * Implementación SQLite de PlayerRepository.
 * Aquí SOLO vive SQL — el dominio no conoce esta capa (O/D).
 */
export const playerRepository: PlayerRepository = {
  async create(data: NuevoPlayer): Promise<Player> {
    const db = await getDb();
    const resultado = await db.runAsync(
      `INSERT INTO player
         (nombre, apellido, numero, pais, posicion, pierna, edad, ovr,
          club_id, estado, temporada_actual, created_at_ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.apellido ?? null,
        data.numero,
        data.pais,
        data.posicion,
        data.pierna,
        data.edad,
        data.ovr,
        data.clubId ?? null,
        'activo',
        1,
        Date.now(),
      ],
    );
    const fila = await db.getFirstAsync<PlayerRow>(
      'SELECT * FROM player WHERE id = ?',
      resultado.lastInsertRowId,
    );
    if (!fila) throw new Error('No se pudo leer el jugador recién creado');
    return filaToPlayer(fila);
  },

  async findById(id: number): Promise<Player | null> {
    const db = await getDb();
    const fila = await db.getFirstAsync<PlayerRow>(
      'SELECT * FROM player WHERE id = ?',
      id,
    );
    return fila ? filaToPlayer(fila) : null;
  },

  async findActivo(): Promise<Player | null> {
    const db = await getDb();
    const fila = await db.getFirstAsync<PlayerRow>(
      `SELECT * FROM player WHERE estado = 'activo' ORDER BY id DESC LIMIT 1`,
    );
    return fila ? filaToPlayer(fila) : null;
  },

  async updateOvr(id: number, ovr: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET ovr = ? WHERE id = ?', [ovr, id]);
  },

  async setClub(id: number, clubId: number | null): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET club_id = ? WHERE id = ?', [clubId, id]);
  },

  async setTemporadaActual(id: number, temporada: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET temporada_actual = ? WHERE id = ?', [temporada, id]);
  },

  async retirar(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync("UPDATE player SET estado = 'retirado' WHERE id = ?", [id]);
  },

  async deleteAll(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM player');
  },
};