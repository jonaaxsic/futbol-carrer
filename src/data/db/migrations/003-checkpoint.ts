/**
 * Migración 003 — Checkpoint de partido pausado.
 * Añade columna nullable `checkpoint_fase` a la tabla `partido`.
 * Valores: 'primer_tiempo' | 'entretiempo_o_segundo' | NULL.
 * Additiva, sin reescritura de datos, reversible (DROP COLUMN en SQLite >= 3.35).
 */
export const SQL_003 = `
ALTER TABLE partido ADD COLUMN checkpoint_fase TEXT;
`;