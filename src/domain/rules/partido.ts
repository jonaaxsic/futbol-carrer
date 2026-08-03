import { OVR_MAX } from '@/shared/constants/game';

/**
 * Reglas de simulación de partido (§4.5 del plan).
 * Puro: solo recibe stats y devuelve el resultado — sin SQLite, sin React.
 *
 * Modelo: la probabilidad de victoria se calcula por diferencia de OVR
 * (el nuestro vs. el rival, estimado por prestigio del club). El jugador
 * anota goles según su posición y su rendimiento individual.
 */

export interface SimularPartidoParams {
  /** OVR actual del jugador (50-99). */
  ovrJugador: number;
  /** Prestigio del club rival (1-5) → OVR rival estimado. */
  prestigioRival: number;
  /** Posición del jugador: POR rara vez anota, delanteros más. */
  posicion: string;
  /** Peso de rendimiento del jugador (0.5-1.5; entrena/frescura). */
  forma?: number;
  random?: () => number;
}

/** Tipo de situación generada durante el partido (se guarda en eventos_json). */
export type TipoSituacion =
  | 'penal'
  | 'expulsion'
  | 'tiro-libre'
  | 'lesion'
  | 'oportunidad-clara';

export interface SituacionPartido {
  tipo: TipoSituacion;
  /** Minuto aproximado del suceso (1-90). */
  minuto: number;
  descripcion: string;
}

export interface ResultadoSimulacion {
  /** Goles a favor / en contra (nuestro club). */
  golesFavor: number;
  golesContra: number;
  /** Goles del jugador en el partido (incluye penales convertidos). */
  golesJugador: number;
  /** Asistencias del jugador. */
  asistenciasJugador: number;
  /** true si el jugador fue amonestado (tarjeta amarilla). */
  amarilla: boolean;
  /** true si fue expulsado (tarjeta roja) — raro. */
  roja: boolean;
  /** true si el jugador se lesionó durante el partido. */
  lesion: boolean;
  /** true si el jugador se pierde el PRÓXIMO partido (lesión o expulsión). */
  suspendidoProximo: boolean;
  /** Sucesos del partido (penal, roja, tiro libre, lesión, ocasión clara). */
  situaciones: SituacionPartido[];
  victoria: boolean;
  empate: boolean;
  derrota: boolean;
}

const OVR_RIVAL_POR_PRESTIGIO: Record<number, number> = {
  1: 62,
  2: 68,
  3: 74,
  4: 80,
  5: 86,
};

/** Probabilidad de gol del jugador según posición (factor multiplicativo). */
const GOLES_POR_POSICION: Record<string, number> = {
  DC: 1.0,
  ED: 0.75,
  EI: 0.75,
  MCO: 0.6,
  MC: 0.4,
  LI: 0.25,
  LD: 0.25,
  DFC: 0.2,
  POR: 0.02,
};

const ASISTENCIAS_POR_POSICION: Record<string, number> = {
  MCO: 1.0,
  MC: 0.9,
  ED: 0.8,
  EI: 0.8,
  DC: 0.55,
  LI: 0.6,
  LD: 0.6,
  DFC: 0.15,
  POR: 0.05,
};

export function simularPartido(params: SimularPartidoParams): ResultadoSimulacion {
  const rnd = params.random ?? Math.random;
  const ovrRival = OVR_RIVAL_POR_PRESTIGIO[params.prestigioRival] ?? 68;
  const forma = params.forma ?? 1.0;

  // Diferencia de OVR + forma → probabilidad base de victoria.
  const diff = params.ovrJugador * forma - ovrRival;
  const probVictoria = Math.min(0.8, Math.max(0.1, 0.42 + diff * 0.012));

  const roll = rnd();
  const victoria = roll < probVictoria;
  const empate = !victoria && roll < probVictoria + 0.25;

  // Goles del equipo (más si ganamos).
  let golesFavor = victoria ? 2 + Math.floor(rnd() * 2) : empate ? 1 : Math.floor(rnd() * 2);
  const golesContra = victoria ? Math.floor(rnd() * 2) : empate ? 1 : 2 + Math.floor(rnd() * 2);

  // Rendimiento individual del jugador.
  const factorPosicion = GOLES_POR_POSICION[params.posicion] ?? 0.4;
  const probGol = (0.12 + params.ovrJugador / 300) * factorPosicion * forma;
  let golesJugador = rnd() < probGol ? 1 + (rnd() < 0.2 ? 1 : 0) : 0;
  const factorAsist = ASISTENCIAS_POR_POSICION[params.posicion] ?? 0.5;
  const probAsist = (0.18 + params.ovrJugador / 400) * factorAsist * forma;
  const asistenciasJugador = rnd() < probAsist ? 1 : 0;

  const amarilla = rnd() < 0.08;
  const roja = !amarilla && rnd() < 0.015;

  // ---- Situaciones del partido (narrativa + reglas, §4.5.x) ----
  // Se generan y se guardan en `partido.eventos_json`. Algunas impactan el
  // resultado (penal convertido) o el próximo partido (lesión / expulsión).
  const situaciones: SituacionPartido[] = [];
  const minutoAleatorio = () => 1 + Math.floor(rnd() * 90);

  // Penal: el jugador lo puede convertir (suma a sus goles).
  if (rnd() < 0.12) {
    const convertido = rnd() < 0.78;
    situaciones.push({
      tipo: 'penal',
      minuto: minutoAleatorio(),
      descripcion: convertido
        ? 'Cobró un penal y lo convirtió.'
        : 'Cobró un penal y el arquero lo atajó.',
    });
    if (convertido) {
      golesFavor += 1;
      golesJugador += 1;
    }
  }

  // Tiro libre: narrativo, con posibilidad de asistencia.
  if (rnd() < 0.1) {
    const gol = rnd() < 0.35;
    situaciones.push({
      tipo: 'tiro-libre',
      minuto: minutoAleatorio(),
      descripcion: gol
        ? 'Ejecutó un tiro libre que terminó en gol del equipo.'
        : 'Probó con un tiro libre que se fue desviado.',
    });
    if (gol) golesFavor += 1;
  }

  // Lesión: además de la situación, se pierde el próximo partido.
  const lesion = rnd() < 0.045;
  if (lesion) {
    situaciones.push({
      tipo: 'lesion',
      minuto: minutoAleatorio(),
      descripcion: 'Sufrió una lesión y no podrá estar en el próximo partido.',
    });
  }

  if (roja) {
    situaciones.push({
      tipo: 'expulsion',
      minuto: minutoAleatorio(),
      descripcion: 'Vio la tarjeta roja y dejó al equipo con uno menos.',
    });
  }

  // Ocasión clara: refuerza la narrativa sin impactar el marcador.
  if (situaciones.length === 0 && rnd() < 0.6) {
    const minuto = minutoAleatorio();
    situaciones.push({
      tipo: 'oportunidad-clara',
      minuto,
      descripcion:
        'Generó una ocasión clarísima que no se convirtió en gol.',
    });
  }

  const suspendidoProximo = lesion || roja;

  return {
    golesFavor,
    golesContra,
    golesJugador,
    asistenciasJugador,
    amarilla,
    roja,
    lesion,
    suspendidoProximo,
    situaciones,
    victoria,
    empate,
    derrota: !victoria && !empate,
  };
}

export const resultadoString = (r: ResultadoSimulacion): string =>
  `${r.golesFavor}-${r.golesContra}`;

export { OVR_MAX };
