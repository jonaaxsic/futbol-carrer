import type { TemporadaRepository } from '@/domain/interfaces/repositories';
import type { NuevaTemporada, Temporada } from '@/domain/entities/temporada';

import { getDb } from '../db/client';
import { filaToTemporada, type TemporadaRow } from '../mappers/temporada-mapper';

/** Repositorio SQLite de temporadas. */
export const temporadaRepository: TemporadaRepository = {
  async create(data: NuevaTemporada): Promise<Temporada> {
    const db = await getDb();
    const resultado = await db.runAsync(
      `INSERT INTO temporada (player_id, anio_inicio, modo, ovr_inicio, activa)
       VALUES (?, ?, ?, ?, 1)`,
      [data.playerId, data.anioInicio, data.modo, data.ovrInicio],
    );
    const fila = await db.getFirstAsync<TemporadaRow>(
      'SELECT * FROM temporada WHERE id = ?',
      resultado.lastInsertRowId,
    );
    if (!fila) throw new Error('No se pudo leer la temporada recién creada');
    return filaToTemporada(fila);
  },

  async findActiva(playerId: number): Promise<Temporada | null> {
    const db = await getDb();
    const fila = await db.getFirstAsync<TemporadaRow>(
      `SELECT * FROM temporada WHERE player_id = ? AND activa = 1 LIMIT 1`,
      playerId,
    );
    return fila ? filaToTemporada(fila) : null;
  },

  async findAllByPlayer(playerId: number): Promise<Temporada[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<TemporadaRow>(
      'SELECT * FROM temporada WHERE player_id = ? ORDER BY anio_inicio ASC',
      playerId,
    );
    return filas.map(filaToTemporada);
  },

  async sumarStats(id: number, pj: number, goles: number, asistencias: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE temporada SET pj = pj + ?, goles = goles + ?, asistencias = asistencias + ? WHERE id = ?',
      [pj, goles, asistencias, id],
    );
  },

  async cerrar(id: number, ovrFin: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE temporada SET activa = 0, ovr_fin = ? WHERE id = ?',
      [ovrFin, id],
    );
  },
};