import type { EntrenamientoRepository } from '@/domain/interfaces/repositories';
import type { Entrenamiento } from '@/domain/entities/entrenamiento';

import { getDb } from '../db/client';
import { filaToEntrenamiento, type EntrenamientoRow } from '../mappers/entrenamiento-mapper';

/** Repositorio SQLite de sesiones de entrenamiento. */
export const entrenamientoRepository: EntrenamientoRepository = {
  async create(data): Promise<Entrenamiento> {
    const db = await getDb();
    const resultado = await db.runAsync(
      `INSERT INTO entrenamiento
         (player_id, tipo, inicio_ts, duracion_horas, fin_estimada_ts)
       VALUES (?, ?, ?, ?, ?)`,
      [data.playerId, data.tipo, data.inicioTs, data.duracionHoras, data.finEstimadaTs],
    );
    const fila = await db.getFirstAsync<EntrenamientoRow>(
      'SELECT * FROM entrenamiento WHERE id = ?',
      resultado.lastInsertRowId,
    );
    if (!fila) throw new Error('No se pudo leer el entrenamiento recién creado');
    return filaToEntrenamiento(fila);
  },

  async findPendiente(playerId: number): Promise<Entrenamiento | null> {
    const db = await getDb();
    const fila = await db.getFirstAsync<EntrenamientoRow>(
      `SELECT * FROM entrenamiento
       WHERE player_id = ? AND completado = 0
       ORDER BY inicio_ts DESC LIMIT 1`,
      playerId,
    );
    return fila ? filaToEntrenamiento(fila) : null;
  },

  async completar(id: number, ovrDelta: number, completado: boolean): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE entrenamiento SET ovr_delta = ?, completado = ? WHERE id = ?',
      [ovrDelta, completado ? 1 : 0, id],
    );
  },
};