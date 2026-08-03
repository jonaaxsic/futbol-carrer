/**
 * Reglas del fixture de temporada (§4.1 del plan).
 * Puro: solo recibe datos y devuelve estructura — sin SQLite, sin React.
 *
 * Regla de juego: partidos casi diarios (1-2 días de separación), generado
 * completo al momento de crear la carrera (anclado a HOY, no a una fecha
 * fija), con competencias según el prestigio del club: Liga (siempre) →
 * Copa Nacional (prestigio ≥ 2) → Continental (prestigio ≥ 4).
 */

export interface PartidoFixture {
  /** Epoch ms — se distancian 1-2 días entre sí. */
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  local: boolean;
}

export interface OpcionesFixture {
  /** Id del club del jugador (se documenta; se usa para alternar localías). */
  clubId: number;
  /** Ids de otros clubes de la MISMA división (rivales de liga). */
  rivalesIds: readonly number[];
  prestigio: number;
  /** Nombre de la liga/división (ej. 'Primera División'). */
  liga: string;
  /** Nombre de la copa nacional (ej. 'Copa Chile'), null si no aplica. */
  copa: string | null;
  /** Epoch ms del inicio de la temporada (hoy, al crear la carrera). */
  inicioTs: number;
  /** Fuente de aleatoriedad inyectable (testeable). */
  random?: () => number;
}

const MS_DIA = 86_400_000;

/** El fixture arranca en el momento en que se crea la carrera. */
export function fechaInicioTemporada(inicioTs: number): number {
  return inicioTs;
}

/**
 * Genera el fixture completo de una temporada:
 * - Liga: todos contra todos (ida y vuelta) entre los clubes de la división.
 * - Copa: 2 rondas extra (prestigio ≥ 2).
 * - Continental: 4 partidos de fase de grupos (prestigio ≥ 4).
 * Los partidos se espacian 1-2 días (casi diarios); las copas se intercalan.
 */
export function generarFixture(opciones: OpcionesFixture): PartidoFixture[] {
  const { clubId, rivalesIds, prestigio, liga, copa, inicioTs } = opciones;
  const rnd = opciones.random ?? Math.random;
  const partidos: PartidoFixture[] = [];
  let cursor = fechaInicioTemporada(inicioTs);

  const avanzar = () => {
    cursor += (1 + Math.floor(rnd() * 2)) * MS_DIA; // 1 o 2 días
  };

  // Defensa: el jugador nunca se enfrenta a su propio club.
  const rivales = rivalesIds.filter((id) => id !== clubId);
  if (rivales.length === 0) return partidos;

  // Liga: todos contra todos, ida y vuelta (local alternado).
  for (const rivalId of rivales) {
    partidos.push({ fechaTs: cursor, rivalClubId: rivalId, competencia: liga, local: true });
    avanzar();
  }
  for (let i = rivales.length - 1; i >= 0; i--) {
    partidos.push({ fechaTs: cursor, rivalClubId: rivales[i], competencia: liga, local: false });
    avanzar();
  }

  // Copa nacional: dos rondas extra contra rivales locales.
  if (copa && prestigio >= 2 && rivales.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const rivalId = rivales[(i * 13) % rivales.length];
      partidos.push({ fechaTs: cursor, rivalClubId: rivalId, competencia: copa, local: i === 0 });
      avanzar();
    }
  }

  // Continental: fase de grupos (prestigio ≥ 4) contra rivales de mayor nivel.
  if (prestigio >= 4 && rivales.length >= 1) {
    const fuertes = [...rivales].sort((a, b) => b - a).slice(0, 2);
    for (const rivalId of fuertes) {
      partidos.push({ fechaTs: cursor, rivalClubId: rivalId, competencia: 'Continental', local: false });
      avanzar();
    }
  }

  return partidos;
}