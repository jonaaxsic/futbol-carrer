/**
 * Migración 001 — Schema inicial (Sprint 1).
 * Modelo de datos del plan §3, con nombres en español (convención de dominio).
 *
 * Notas:
 * - `match` es palabra reservada de SQLite (cláusula de FTS) → la tabla se llama `partido`.
 * - Todos los timestamps son INTEGER epoch ms (registro "tiempo real" sin reloj de fondo, §4.1-4.2).
 * - `PRAGMA user_version` controla la versión del schema (ver client.ts).
 */
export const SQL_001 = `
CREATE TABLE IF NOT EXISTS club (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL UNIQUE,
  pais          TEXT NOT NULL,
  liga          TEXT NOT NULL,
  prestigio     INTEGER NOT NULL DEFAULT 1,
  escudo_key    TEXT
);

CREATE TABLE IF NOT EXISTS player (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre            TEXT NOT NULL,
  apellido          TEXT,
  numero            INTEGER NOT NULL,
  pais              TEXT NOT NULL,
  posicion          TEXT NOT NULL,
  pierna            TEXT NOT NULL DEFAULT 'derecha',
  edad              INTEGER NOT NULL,
  ovr               INTEGER NOT NULL,
  club_id           INTEGER REFERENCES club(id),
  valor_mercado     INTEGER NOT NULL DEFAULT 150000,
  estado            TEXT NOT NULL DEFAULT 'activo',
  temporada_actual  INTEGER NOT NULL DEFAULT 1,
  created_at_ts     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS temporada (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  anio_inicio  INTEGER NOT NULL,
  modo         TEXT NOT NULL DEFAULT 'normal',
  pj           INTEGER NOT NULL DEFAULT 0,
  goles        INTEGER NOT NULL DEFAULT 0,
  asistencias  INTEGER NOT NULL DEFAULT 0,
  ovr_inicio   INTEGER,
  ovr_fin      INTEGER,
  activa       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS partido (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  temporada_id   INTEGER NOT NULL REFERENCES temporada(id) ON DELETE CASCADE,
  fecha_ts       INTEGER NOT NULL,
  rival_club_id  INTEGER REFERENCES club(id),
  competencia    TEXT NOT NULL,
  local          INTEGER NOT NULL DEFAULT 1,
  resultado      TEXT,
  jugo           INTEGER NOT NULL DEFAULT 0,
  goles          INTEGER NOT NULL DEFAULT 0,
  asistencias    INTEGER NOT NULL DEFAULT 0,
  eventos_json   TEXT
);

CREATE TABLE IF NOT EXISTS entrenamiento (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id        INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  tipo             TEXT NOT NULL,
  inicio_ts        INTEGER NOT NULL,
  duracion_horas   REAL NOT NULL,
  fin_estimada_ts  INTEGER NOT NULL,
  ovr_delta        INTEGER,
  completado       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS evento_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id     INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  fecha_ts      INTEGER NOT NULL,
  tipo          TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  impacto_json  TEXT
);

CREATE TABLE IF NOT EXISTS trofeo (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  competencia  TEXT NOT NULL,
  anio         INTEGER NOT NULL,
  nivel        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS historial_carrera (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id     INTEGER NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  club_id       INTEGER NOT NULL REFERENCES club(id),
  anio_inicio   INTEGER NOT NULL,
  anio_fin      INTEGER,
  pj            INTEGER NOT NULL DEFAULT 0,
  goles         INTEGER NOT NULL DEFAULT 0,
  asistencias   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_player_estado        ON player(estado);
CREATE INDEX IF NOT EXISTS idx_temporada_player     ON temporada(player_id);
CREATE INDEX IF NOT EXISTS idx_partido_temporada    ON partido(temporada_id);
CREATE INDEX IF NOT EXISTS idx_entrenamiento_player ON entrenamiento(player_id);
CREATE INDEX IF NOT EXISTS idx_historial_player     ON historial_carrera(player_id);
`;