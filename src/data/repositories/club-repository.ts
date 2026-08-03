import type { ClubRepository } from '@/domain/interfaces/repositories';
import type { Club } from '@/domain/entities/club';

import { getDb } from '../db/client';
import { filaToClub, type ClubRow } from '../mappers/club-mapper';

/** Repositorio SQLite de clubes. */
export const clubRepository: ClubRepository = {
  async findAll(): Promise<Club[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<ClubRow>(
      'SELECT * FROM club ORDER BY prestigio DESC, nombre ASC',
    );
    return filas.map(filaToClub);
  },

  async findById(id: number): Promise<Club | null> {
    const db = await getDb();
    const fila = await db.getFirstAsync<ClubRow>(
      'SELECT * FROM club WHERE id = ?',
      id,
    );
    return fila ? filaToClub(fila) : null;
  },

  async findByPais(pais: string): Promise<Club[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<ClubRow>(
      `SELECT * FROM club WHERE pais = ? ORDER BY prestigio DESC LIMIT 3`,
      pais,
    );
    return filas.map(filaToClub);
  },

  /** Todos los clubes de una división del país (fixture: mismos rivales de liga). */
  async findByPaisYLiga(pais: string, liga: string): Promise<Club[]> {
    const db = await getDb();
    const filas = await db.getAllAsync<ClubRow>(
      'SELECT * FROM club WHERE pais = ? AND liga = ? ORDER BY prestigio DESC',
      [pais, liga],
    );
    return filas.map(filaToClub);
  },
};