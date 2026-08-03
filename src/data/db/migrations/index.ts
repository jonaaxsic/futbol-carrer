import { SQL_001 } from './001-inicial';
import { SQL_002 } from './002-energia';

/**
 * Registro de migraciones versionadas.
 * Regla: NUNCA editar una migración ya aplicada — añadir una nueva.
 */
export const MIGRACIONES: readonly { version: number; nombre: string; sql: string }[] = [
  { version: 1, nombre: '001-inicial', sql: SQL_001 },
  { version: 2, nombre: '002-energia', sql: SQL_002 },
];

export const VERSION_ACTUAL = MIGRACIONES[MIGRACIONES.length - 1].version;
