/**
 * Entidad de historial de carrera (tabla `historial_carrera`, pantalla 8).
 * Una fila por etapa (club + rango de años).
 */
export interface HistorialEtapa {
  id: number;
  playerId: number;
  clubId: number;
  anioInicio: number;
  anioFin: number | null;
  pj: number;
  goles: number;
  asistencias: number;
}