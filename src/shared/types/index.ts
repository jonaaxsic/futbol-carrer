/**
 * Tipos compartidos entre capas.
 * Las entidades de dominio viven en domain/entities (Sprint 1).
 * Aquí solo tipos transversales de UI/estado.
 */

/** Identificador persistido (SQLite INTEGER PRIMARY KEY). */
export type EntityId = number;

/** Nivel de prestigio de un club (1 a 5 estrellas). */
export type Prestigio = 1 | 2 | 3 | 4 | 5;

/** Tipo de temporada (§4.5): normal avanza 1 año, rápido 2. */
export type SeasonMode = 'normal' | 'rapido';
