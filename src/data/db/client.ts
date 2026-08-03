import * as SQLite from 'expo-sqlite';

import { MIGRACIONES, VERSION_ACTUAL } from './migrations';

const NOMBRE_DATABASE = 'football-career.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre (una sola vez) y devuelve la BD aplicando migraciones pendientes.
 * Documentación SDK 57 verificada: `withTransactionAsync(task)` recibe
 * `() => Promise<void>` — las queries van contra el objeto `db`, no un `txn`.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = abrirYAplicarMigraciones();
  }
  return dbPromise;
}

async function abrirYAplicarMigraciones(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(NOMBRE_DATABASE);

  // WAL + FK: recomendados por la doc de expo-sqlite para apps reales.
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = fila?.user_version ?? 0;

  if (versionActual < VERSION_ACTUAL) {
    for (const migracion of MIGRACIONES) {
      if (migracion.version <= versionActual) continue;
      await db.withTransactionAsync(async () => {
        await db.execAsync(migracion.sql);
        await db.execAsync(`PRAGMA user_version = ${migracion.version}`);
      });
    }
  }

  return db;
}

/** Dev/Sprint 1: borra TODOS los datos (reset completo de carrera). */
export async function limpiarBaseDatos(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const tabla of [
      'partido',
      'entrenamiento',
      'evento_log',
      'trofeo',
      'historial_carrera',
      'temporada',
      'player',
    ]) {
      await db.execAsync(`DELETE FROM ${tabla}`);
    }
  });
}