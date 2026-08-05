import type {
  PlayerRepository,
} from '@/domain/interfaces/repositories';
import type { NuevoPlayer, Player } from '@/domain/entities/player';
import type { PlayerStats } from '@/domain/entities/stats';

import { getDb } from '../db/client';
import { filaToPlayer, type PlayerRow } from '../mappers/player-mapper';

/**
 * Implementación SQLite de PlayerRepository.
 * Aquí SOLO vive SQL — el dominio no conoce esta capa (O/D).
 */
export const playerRepository: PlayerRepository = {
  async create(data: NuevoPlayer): Promise<Player> {
    const db = await getDb();
    const ahora = Date.now();
    const statsJson = data.stats ? JSON.stringify(data.stats) : null;
    const resultado = await db.runAsync(
      `INSERT INTO player
         (nombre, apellido, numero, pais, posicion, pierna, edad, ovr,
          stats, club_id, estado, temporada_actual, energia, energia_max,
          energia_actualizada_ts, created_at_ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.apellido ?? null,
        data.numero,
        data.pais,
        data.posicion,
        data.pierna,
        data.edad,
        data.ovr,
        statsJson,
        data.clubId ?? null,
        'activo',
        1,
        10,
        10,
        ahora,
        ahora,
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

  async updateStats(id: number, stats: PlayerStats): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET stats = ? WHERE id = ?', [JSON.stringify(stats), id]);
  },

  async setClub(id: number, clubId: number | null): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET club_id = ? WHERE id = ?', [clubId, id]);
  },

  async setPosicion(id: number, posicion: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET posicion = ? WHERE id = ?', [posicion, id]);
  },

  async setTemporadaActual(id: number, temporada: number): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE player SET temporada_actual = ? WHERE id = ?', [temporada, id]);
  },

  async retirar(id: number): Promise<void> {
    const db = await getDb();
    await db.runAsync("UPDATE player SET estado = 'retirado' WHERE id = ?", [id]);
  },

  async setEnergia(id: number, energia: number, energiaActualizadaTs: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE player SET energia = ?, energia_actualizada_ts = ? WHERE id = ?',
      [energia, energiaActualizadaTs, id],
    );
  },

  async deleteAll(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM player');
  },
};