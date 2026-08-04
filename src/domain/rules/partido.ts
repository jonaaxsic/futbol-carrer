import { OVR_MAX } from '@/shared/constants/game';

/**
 * Reglas de simulación de partido (§4.5 del plan, design D1/D2).
 * Puro: solo recibe stats y devuelve el resultado — sin SQLite, sin React.
 *
 * Modelo: la probabilidad de victoria se calcula por diferencia de OVR
 * (el nuestro vs. el rival, estimado por prestigio del club). El partido
 * genera UNA timeline determinista ordenada por minuto (single source of
 * truth): TODOS los goles viven en la timeline; el marcador se deriva de
 * ella (nunca se re-simula, spec penalty R2).
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
  /** Seam RNG inyectable: misma semilla → misma timeline (determinismo). */
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

/** Tipos de evento de la timeline de replay (§ design D1). */
export type TipoEvento = 'gol' | 'falta' | 'amarilla' | 'roja' | 'lesion' | 'penal';

export interface PenalTimeline {
  /** true → el replay PAUSA y pide input al usuario (≤1 por partido). */
  interactivo: boolean;
  /** Lado del arquero precomputado: el mini-juego decide gol si lo esquiva. */
  ladoArquero?: 'izquierda' | 'centro' | 'derecha';
  /** Resultado resuelto; pendiente (undefined) en el penal interactivo. */
  resultado?: 'gol' | 'atajado' | 'fallado';
}

export interface EventoTimeline {
  tipo: TipoEvento;
  /** Minuto de partido (1-90). */
  minuto: number;
  /** 'nosotros' = equipo del jugador; 'rival' = contrincante. */
  equipo: 'nosotros' | 'rival';
  /** 'jugador' si el evento pertenece al protagonista (gol, tarjeta, lesión). */
  jugador: 'jugador' | null;
  descripcion: string;
  /** true en goles de compañero con asistencia del protagonista. */
  asistenciaJugador?: boolean;
  penal?: PenalTimeline;
}

export interface ResultadoSimulacion {
  /** Goles a favor / en contra (nuestro club). */
  golesFavor: number;
  golesContra: number;
  /** Goles del jugador en el partido (incluye penales convertidos). */
  golesJugador: number;
  /** Asistencias del jugador (goles de compañero que él asistió). */
  asistenciasJugador: number;
  /** true si el jugador fue amonestado (tarjeta amarilla). */
  amarilla: boolean;
  /** true si fue expulsado (tarjeta) — raro. */
  roja: boolean;
  /** true si el jugador se lesionó durante el partido. */
  lesion: boolean;
  /** true si se pierde el PRÓXIMO partido (lesión o expulsión). */
  suspendidoProximo: boolean;
  /** Sucesos del partido (penal, roja, tiro libre, lesión, ocasión clara). */
  situaciones: SituacionPartido[];
  /** Timeline completa ordenada por minuto (source of truth, D1). */
  lineaTiempo: EventoTimeline[];
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

const LADOS_ARQUERO: ['izquierda', 'centro', 'derecha'] = [
  'izquierda',
  'centro',
  'derecha',
];

/** Genera `cantidad` minutos únicos (1-90) usando el RNG del partido. */
function minutosUnicos(rnd: () => number, cantidad: number): number[] {
  const usados = new Set<number>();
  const minutos: number[] = [];
  let intentos = 0;
  while (minutos.length < cantidad && intentos < 500) {
    intentos += 1;
    const minuto = 1 + Math.floor(rnd() * 90);
    if (!usados.has(minuto)) {
      usados.add(minuto);
      minutos.push(minuto);
    }
  }
  return minutos.sort((a, b) => a - b);
}

/** Cuenta goles de un equipo en la timeline (goles + penales convertidos). */
function contarGoles(lineaTiempo: EventoTimeline[], equipo: EventoTimeline['equipo']): number {
  return lineaTiempo.filter(
    (e) =>
      (e.tipo === 'gol' || (e.tipo === 'penal' && e.penal?.resultado === 'gol')) &&
      e.equipo === equipo,
  ).length;
}

/** Deriva `situaciones` (formato legacy eventos_json) desde la timeline. */
export function situacionesDesdeLineaTiempo(lineaTiempo: EventoTimeline[]): SituacionPartido[] {
  const situaciones: SituacionPartido[] = [];
  for (const e of lineaTiempo) {
    if (e.tipo === 'penal') {
      situaciones.push({ tipo: 'penal', minuto: e.minuto, descripcion: e.descripcion });
    } else if (e.tipo === 'roja') {
      situaciones.push({ tipo: 'expulsion', minuto: e.minuto, descripcion: e.descripcion });
    } else if (e.tipo === 'lesion') {
      situaciones.push({ tipo: 'lesion', minuto: e.minuto, descripcion: e.descripcion });
    } else if (e.tipo === 'falta') {
      situaciones.push({ tipo: 'tiro-libre', minuto: e.minuto, descripcion: e.descripcion });
    }
  }
  if (situaciones.length === 0) {
    situaciones.push({
      tipo: 'oportunidad-clara',
      minuto: lineaTiempo[0]?.minuto ?? 60,
      descripcion: 'El equipo generó ocasiones, pero el marcador no se movió.',
    });
  }
  return situaciones;
}

/**
 * Deriva el RESULTADO FINAL desde una timeline RESUELTA (spec penalty R2:
 * el marcador nunca se re-simula; el penal convertido se cuenta como gol).
 */
export function resultadoDesdeLineaTiempo(lineaTiempo: EventoTimeline[]): ResultadoSimulacion {
  const golesFavor = contarGoles(lineaTiempo, 'nosotros');
  const golesContra = contarGoles(lineaTiempo, 'rival');
  const golesJugador = lineaTiempo.filter(
    (e) => e.tipo === 'gol' && e.equipo === 'nosotros' && e.jugador === 'jugador',
  ).length;
  const asistenciasJugador = lineaTiempo.filter((e) => e.asistenciaJugador === true).length;

  const amarilla = lineaTiempo.some((e) => e.tipo === 'amarilla');
  const roja = lineaTiempo.some((e) => e.tipo === 'roja');
  const lesion = lineaTiempo.some((e) => e.tipo === 'lesion');
  const victoria = golesFavor > golesContra;
  const empate = golesFavor === golesContra;

  return {
    golesFavor,
    golesContra,
    golesJugador,
    asistenciasJugador,
    amarilla,
    roja,
    lesion,
    suspendidoProximo: roja || lesion,
    situaciones: situacionesDesdeLineaTiempo(lineaTiempo),
    lineaTiempo,
    victoria,
    empate,
    derrota: !victoria && !empate,
  };
}

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

  // Goles del equipo (más si ganamos). El penal pendiente NO suma todavía:
  // suma solo si el usuario lo convierte en el mini propio (se deriva luego).
  let golesFavor = victoria ? 2 + Math.floor(rnd() * 2) : empate ? 1 : Math.floor(rnd() * 2);
  const golesContra = victoria ? Math.floor(rnd() * 2) : empate ? 1 : 2 + Math.floor(rnd() * 2);

  // Rendimiento individual del jugador.
  const factorPosicion = GOLES_POR_POSICION[params.posicion] ?? 0.4;
  const probGol = (0.12 + params.ovrJugador / 300) * factorPosicion * forma;
  const golesJugador = rnd() < probGol ? 1 + (rnd() < 0.2 ? 1 : 0) : 0;
  const factorAsist = ASISTENCIAS_POR_POSICION[params.posicion] ?? 0.5;
  const probAsist = (0.18 + params.ovrJugador / 400) * factorAsist * forma;

  const amarilla = rnd() < 0.08;
  const roja = !amarilla && rnd() < 0.015;
  const lesion = rnd() < 0.045;

  // ---- Timeline de eventos (D1: source of truth) ----
  const eventos: EventoTimeline[] = [];

  // Goles del jugador.
  const minutosJugador = minutosUnicos(rnd, golesJugador);
  for (const minuto of minutosJugador) {
    eventos.push({
      tipo: 'gol',
      minuto,
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: '¡Gol del jugador!',
    });
  }

  // Goles de compañeros (los goles que el jugador pueda asistir).
  const golesCompaniero = Math.max(0, golesFavor - golesJugador);
  const minutosCompaniero = minutosUnicos(rnd, golesCompaniero);
  for (const minuto of minutosCompaniero) {
    const asistio = rnd() < probAsist;
    eventos.push({
      tipo: 'gol',
      minuto,
      equipo: 'nosotros',
      jugador: null,
      asistenciaJugador: asistio,
      descripcion: asistio
        ? 'Gol de un compañero con asistencia del jugador.'
        : 'Gol de un compañero.',
    });
  }

  // Goles en contra (rival).
  const minutosRival = minutosUnicos(rnd, golesContra);
  for (const minuto of minutosRival) {
    eventos.push({
      tipo: 'gol',
      minuto,
      equipo: 'rival',
      jugador: null,
      descripcion: 'Gol del rival.',
    });
  }

  // Penal INTERACTIVO del jugador (≤1 por partido, spec R6): queda PENDIENTE
  // con ladoArquero precomputado; el mini juego resuelve gol/atajado/fallado.
  const penalInteractivo = rnd() < 0.12;
  if (penalInteractivo) {
    eventos.push({
      tipo: 'penal',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: '¡Penal para el equipo! Elegí la dirección del disparo.',
      penal: {
        interactivo: true,
        ladoArquero: LADOS_ARQUERO[Math.floor(rnd() * 3)],
      },
    });
  }

  // Penal del RIVAL: NO interactivo, resuelto en la simulación.
  if (rnd() < 0.08) {
    const convertido = rnd() < 0.78;
    eventos.push({
      tipo: 'penal',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'rival',
      jugador: null,
      descripcion: convertido
        ? 'Penal convertido por el rival.'
        : 'Penal en contra atajado por el arquero.',
      penal: { interactivo: false, resultado: convertido ? 'gol' : 'atajado' },
    });
  }

  // Tiro libre: narrativo, con posibilidad de gol (gol de compañero).
  if (rnd() < 0.1) {
    const gol = rnd() < 0.35;
    eventos.push({
      tipo: 'falta',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: gol
        ? 'Ejecutó un tiro libre que terminó en gol del equipo.'
        : 'Probó con un tiro libre que se fue desviado.',
    });
    if (gol) golesFavor += 1; // el evento que materializa el gol se agrega abajo
    if (gol) {
      eventos.push({
        tipo: 'gol',
        minuto: 90,
        equipo: 'nosotros',
        jugador: null,
        descripcion: 'Gol de tiro libre del equipo.',
      });
    }
  }

  // Amarilla / roja / lesión del jugador.
  if (amarilla) {
    eventos.push({
      tipo: 'amarilla',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: 'Vio la tarjeta amarilla.',
    });
  }
  if (roja) {
    eventos.push({
      tipo: 'roja',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: 'Vio la tarjeta roja y dejó al equipo con uno menos.',
    });
  }
  if (lesion) {
    eventos.push({
      tipo: 'lesion',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: 'Sufrió una lesión y no podrá estar en el próximo partido.',
    });
  }

  // Ocasión clara: refuerza la narrativa sin impactar el marcador.
  if (eventos.length === 0 && rnd() < 0.6) {
    eventos.push({
      tipo: 'falta',
      minuto: 1 + Math.floor(rnd() * 90),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: 'Generó una ocasión clarísima que no se convirtió en gol.',
    });
  }

  const lineaTiempo = eventos.sort((a, b) => a.minuto - b.minuto);

  // El penal interactivo pendiente (sin resultado) NO cuenta en el marcador
  // provisional: se deriva de la timeline ya materializada. El marcador
  // final tras el mini-juego se calcula con resultadoDesdeLineaTiempo.
  const resultado = resultadoDesdeLineaTiempo(lineaTiempo);
  // La victoria provisional se re-deriva del marcador contado (los penales
  // del rival convertidos ya están en la timeline).
  resultado.victoria = resultado.golesFavor > resultado.golesContra;
  resultado.empate = resultado.golesFavor === resultado.golesContra;
  resultado.derrota = !resultado.victoria && !resultado.empate;
  return resultado;
}

export const resultadoString = (r: ResultadoSimulacion): string =>
  `${r.golesFavor}-${r.golesContra}`;

/**
 * Resuelve los penales interactivos PENDIENTES como fallados (spec R5,
 * inaction default): el wrapper headless `jugarPartido` los usa porque no
 * hay input del usuario durante el replay.
 */
export function resolverPenalInaccion(lineaTiempo: EventoTimeline[]): EventoTimeline[] {
  return lineaTiempo.map((e) =>
    e.tipo === 'penal' && e.penal?.interactivo && !e.penal.resultado
      ? {
          ...e,
          penal: { ...e.penal, resultado: 'fallado' as const },
          descripcion: 'Penal fallado: no se eligió dirección a tiempo.',
        }
      : e,
  );
}

/** Dirección posible en el mini-juego de penal (spec penalty R2/R3). */
export type DireccionPenal = 'izquierda' | 'centro' | 'derecha';

/**
 * Resuelve el penal interactivo del minuto dado con la elección del usuario
 * (spec penalty R2): gol solo si la dirección del disparo difiere del lado
 * precomputado del arquero; si coincide → atajado. Nunca re-simula el partido.
 */
export function resolverPenalConEleccion(
  lineaTiempo: EventoTimeline[],
  minuto: number,
  eleccion: DireccionPenal,
): EventoTimeline[] {
  return lineaTiempo.map((e) => {
    if (e.tipo !== 'penal' || e.minuto !== minuto || !e.penal?.interactivo || e.penal.resultado) {
      return e;
    }
    const gol = eleccion !== e.penal.ladoArquero;
    return {
      ...e,
      descripcion: gol
        ? '¡Penal convertido! Elegiste bien y venciste al arquero.'
        : 'Penal atajado: el arquero adivinó tu dirección.',
      penal: { ...e.penal, resultado: gol ? ('gol' as const) : ('atajado' as const) },
    };
  });
}

export { OVR_MAX };