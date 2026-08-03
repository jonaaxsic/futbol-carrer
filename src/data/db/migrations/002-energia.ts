/**
 * Migración 002 — Sistema de energía + partidos suspendidos.
 * - `player`: energía (máx 10), regeneración 1 barra cada 2h de reloj real.
 *   Se guarda el timestamp del último gasto para recalcular al abrir la app
 *   (sin timers en segundo plano, §4.2).
 * - `partido`: flag `suspendido` para partidos que el jugador se pierde
 *   por lesión o expulsión (se omiten sin acumular stats).
 */
export const SQL_002 = `
ALTER TABLE player ADD COLUMN energia INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN energia_max INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN energia_actualizada_ts INTEGER;

ALTER TABLE partido ADD COLUMN suspendido INTEGER NOT NULL DEFAULT 0;
`;
