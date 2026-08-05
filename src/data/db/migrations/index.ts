import { SQL_001 } from './001-inicial';
import { SQL_002 } from './002-energia';
import { SQL_003 } from './003-checkpoint';
import { SQL_004 } from './004-stats';

/**
 * Registro de migraciones versionadas.
 * Regla: NUNCA editar una migración ya aplicada — añadir una nueva.
 */
export const MIGRACIONES: readonly { version: number; nombre: string; sql: string }[] = [
  { version: 1, nombre: '001-inicial', sql: SQL_001 },
  { version: 2, nombre: '002-energia', sql: SQL_002 },
  { version: 3, nombre: '003-checkpoint', sql: SQL_003 },
  { version: 4, nombre: '004-stats', sql: SQL_004 },
];

export const VERSION_ACTUAL = MIGRACIONES[MIGRACIONES.length - 1].version;
