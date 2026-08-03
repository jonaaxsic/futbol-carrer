import type { TrofeoRepository } from '@/domain/interfaces/repositories';
import type { NivelTrofeo, Trofeo } from '@/domain/entities/trofeo';

import { getDb } from '../db/client';
import { filaToTrofeo, type TrofeoRow } from '../mappers/trofeo-mapper';

/** Repositorio SQLite de trofeos (Sprint 6). */
export const trofeoRepository: TrofeoRepository = {
  async crear(data: {
    playerId: number;
    nombre: string;
    competencia: string;
    anio: number;
    nivel: NivelTrofeo;
  }): Promise<Trofeo> {
    const db = await getDb();
    const resultado = await db.runAsync(
      `INSERT INTO trofeo (player_id, nombre, competencia, anio, nivel)
       VALUES (?, ?, ?, ?, ?)`,
      [data.playerId, data.nombre, data.competencia, data.anio, data.nivel],
    );
    const fila = await db.getFirstAsync<TrofeoRow>(
      'SELECT * FROM trofeo WHERE id = ?',
      resultado.lastInsertRowId,
    );
    if (!fila) throw new Error('No se pudo leer el trofeo recién creado');
    return filaToTrofeo(fila);
  },

  async findByPlayer(playerId: number): Promise<Trofeo[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<TrofeoRow>(
      'SELECT * FROM trofeo WHERE player_id = ? ORDER BY anio DESC, id DESC',
      playerId,
    );
    return filas.map(filaToTrofeo);
  },
};