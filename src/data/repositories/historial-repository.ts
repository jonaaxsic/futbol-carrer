import type { HistorialRepository } from '@/domain/interfaces/repositories';
import type { HistorialEtapa } from '@/domain/entities/historial-carrera';

import { getDb } from '../db/client';

interface HistorialRow {
  id: number;
  player_id: number;
  club_id: number;
  anio_inicio: number;
  anio_fin: number | null;
  pj: number;
  goles: number;
  asistencias: number;
}

/** Repositorio SQLite del historial de carrera (etapas por club). */
export const historialRepository: HistorialRepository = {
  async crearEtapaInicial(
    playerId: number,
    clubId: number,
    anioInicio: number,
  ): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO historial_carrera (player_id, club_id, anio_inicio, pj, goles, asistencias)
       VALUES (?, ?, ?, 0, 0, 0)`,
      [playerId, clubId, anioInicio],
    );
  },

  async sumarStats(
    playerId: number,
    clubId: number,
    pj: number,
    goles: number,
    asistencias: number,
  ): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE historial_carrera
       SET pj = pj + ?, goles = goles + ?, asistencias = asistencias + ?
       WHERE player_id = ? AND club_id = ? AND anio_fin IS NULL`,
      [pj, goles, asistencias, playerId, clubId],
    );
  },

  async cerrarEtapa(playerId: number, clubId: number, anioFin: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE historial_carrera SET anio_fin = ?
       WHERE player_id = ? AND club_id = ? AND anio_fin IS NULL`,
      [anioFin, playerId, clubId],
    );
  },

  async abrirEtapa(
    playerId: number,
    clubId: number,
    anioInicio: number,
    pj = 0,
    goles = 0,
    asistencias = 0,
  ): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO historial_carrera (player_id, club_id, anio_inicio, pj, goles, asistencias)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [playerId, clubId, anioInicio, pj, goles, asistencias],
    );
  },

  async findByPlayer(playerId: number): Promise<HistorialEtapa[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<HistorialRow>(
      'SELECT * FROM historial_carrera WHERE player_id = ? ORDER BY anio_inicio ASC',
      playerId,
    );
    return filas.map((f) => ({
      id: f.id,
      playerId: f.player_id,
      clubId: f.club_id,
      anioInicio: f.anio_inicio,
      anioFin: f.anio_fin,
      pj: f.pj,
      goles: f.goles,
      asistencias: f.asistencias,
    }));
  },
};