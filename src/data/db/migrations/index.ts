import { SQL_001 } from './001-inicial';

/**
 * Registro de migraciones versionadas.
 * Regla: NUNCA editar una migración ya aplicada — añadir una nueva.
 */
export const MIGRACIONES: readonly { version: number; nombre: string; sql: string }[] = [
  { version: 1, nombre: '001-inicial', sql: SQL_001 },
];

export const VERSION_ACTUAL = MIGRACIONES[MIGRACIONES.length - 1].version;