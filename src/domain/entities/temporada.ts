import type { SeasonMode } from '@/shared/types';

/** Entidad Temporada (tabla `temporada`). Una por año de carrera (§4.5). */
export interface Temporada {
  id: number;
  playerId: number;
  /** Año de inicio (ej. 2026 para la temporada 2026-2027). */
  anioInicio: number;
  /**
   * Modo (§4.5): 'normal' avanza 1 año por temporada, 'rapido' avanza 2.
   */
  modo: SeasonMode;
  pj: number;
  goles: number;
  asistencias: number;
  ovrInicio: number | null;
  ovrFin: number | null;
  /** Solo una temporada activa por jugador. */
  activa: boolean;
}

/** Datos para abrir una temporada nueva. */
export interface NuevaTemporada {
  playerId: number;
  anioInicio: number;
  modo: SeasonMode;
  ovrInicio: number;
}