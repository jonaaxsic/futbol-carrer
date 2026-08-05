/**
 * Entidad Partido (tabla `partido`).
 * Nota: el plan original llamaba a esta tabla `match`, pero MATCH es una
 * palabra reservada de SQLite (cláusula de FTS) → se usa `partido`.
 */
export type FaseCheckpoint = 'primer_tiempo' | 'entretiempo_o_segundo' | null;

export interface Partido {
  id: number;
  temporadaId: number;
  /** Epoch ms de la fecha del partido (fixture generado al crear la carrera, §4.1). */
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  /** true = local, false = visitante. */
  local: boolean;
  /** Resultado ej. "2-1"; null si aún no se jugó. */
  resultado: string | null;
  jugo: boolean;
  /** true si el jugador se perdió el partido (lesión/expulsión, se omite). */
  suspendido: boolean;
  goles: number;
  asistencias: number;
  /** JSON con situaciones del partido (penales, rojas, lesiones...) §4.5. */
  eventosJson: string | null;
  /** Fase del checkpoint para reanudación de partido pausado (PR2). */
  checkpointFase: FaseCheckpoint;
}

/** Datos para insertar un partido del fixture (resto con defaults en BD). */
export interface NuevoPartido {
  temporadaId: number;
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  local: boolean;
}