/**
 * Entidad Partido (tabla `partido`).
 * Nota: el plan original llamaba a esta tabla `match`, pero MATCH es una
 * palabra reservada de SQLite (cláusula de FTS) → se usa `partido`.
 */
export interface Partido {
  id: number;
  temporadaId: number;
  /** Epoch ms de la fecha del partido (fixture generado cada 3-4 días, §4.1). */
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  /** true = local, false = visitante. */
  local: boolean;
  /** Resultado ej. "2-1"; null si aún no se jugó. */
  resultado: string | null;
  jugo: boolean;
  goles: number;
  asistencias: number;
  /** JSON con eventos del partido (targetas, penales...) — Sprint 5. */
  eventosJson: string | null;
}

/** Datos para insertar un partido del fixture (resto con defaults en BD). */
export interface NuevoPartido {
  temporadaId: number;
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  local: boolean;
}