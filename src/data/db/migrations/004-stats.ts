/**
 * Migración 004 — Agregar columna stats al jugador (§14).
 * Stats específicas por posición (JSON serializado).
 */
export const SQL_004 = `
ALTER TABLE player ADD COLUMN stats TEXT;
`;
