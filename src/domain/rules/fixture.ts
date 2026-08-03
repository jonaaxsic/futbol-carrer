/**
 * Reglas del fixture de temporada (§4.1 del plan).
 * Puro: solo recibe datos y devuelve estructura — sin SQLite, sin React.
 *
 * Regla de juego: un partido cada 3-4 días (aleatorio dentro del rango),
 * generado completo al inicio de cada temporada, con competencias según
 * el prestigio del club: Liga (siempre) → Copa Nacional (prestigio ≥ 2)
 * → Continental (prestigio ≥ 4).
 */

export interface PartidoFixture {
  /** Epoch ms — se distancian 3-4 días entre sí. */
  fechaTs: number;
  rivalClubId: number;
  competencia: string;
  local: boolean;
}

export interface OpcionesFixture {
  /** Id del club del jugador (se documenta; se usa para alternar localías). */
  clubId: number;
  /** Ids de otros clubes del mismo país (rivales de liga). */
  rivalesIds: readonly number[];
  prestigio: number;
  /** Nombre de la liga del país (ej. 'Liga Nacional'). */
  liga: string;
  /** Nombre de la copa nacional (ej. 'Copa Chile'), null si no aplica. */
  copa: string | null;
  anioInicio: number;
  /** Fuente de aleatoriedad inyectable (testeable). */
  random?: () => number;
}

const MS_DIA = 86_400_000;

/** 1 de julio del año de inicio + margen de vacaciones. */
export function fechaInicioTemporada(anioInicio: number): number {
  return Date.UTC(anioInicio, 6, 1, 12);
}

/**
 * Genera el fixture completo de una temporada:
 * - Liga: todos contra todos (ida y vuelta) entre los clubes del país.
 * - Copa: 2 rondas extra (prestigio ≥ 2).
 * - Continental: 4 partidos de fase de grupos (prestigio ≥ 4).
 * Los partidos se espacian 3-4 días; las copas se intercalan al final.
 */
export function generarFixture(opciones: OpcionesFixture): PartidoFixture[] {
  const { clubId, rivalesIds, prestigio, liga, copa, anioInicio } = opciones;
  const rnd = opciones.random ?? Math.random;
  const partidos: PartidoFixture[] = [];
  let cursor = fechaInicioTemporada(anioInicio);

  const avanzar = () => {
    cursor += (3 + Math.floor(rnd() * 2)) * MS_DIA; // 3 o 4 días
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