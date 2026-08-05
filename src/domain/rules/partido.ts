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
export type TipoEvento =
  | 'gol'
  | 'falta'
  | 'amarilla'
  | 'roja'
  | 'lesion'
  | 'penal'
  | 'tiro-libre-interactivo';

/** Zona de disparo del grid 3×2 (spec interactive-situations R1). */
export type ZonaDisparo =
  | 'arriba-izquierda'
  | 'arriba-centro'
  | 'arriba-derecha'
  | 'abajo-izquierda'
  | 'abajo-centro'
  | 'abajo-derecha';

/**
 * Resultado de una situación interactiva (spec R1/R3).
 * La spec literal enumera 4 valores; `rebote` lo exige la barrera del
 * tiro libre (task 3a.1): un disparo a zona baja/centro cubierta por la
 * barrera resuelve rebote, no 'afuera'.
 */
export type ResultadoSituacion = 'gol' | 'atajado' | 'palo' | 'afuera' | 'rebote';

/** Zonas baja/centro (la barrera del tiro libre solo cubre esas filas). */
const ZONAS_BARRERA: readonly ZonaDisparo[] = [
  'arriba-centro',
  'abajo-izquierda',
  'abajo-centro',
  'abajo-derecha',
];

export interface SituacionInteractiva {
  /** true → el replay PAUSA y pide input al usuario (≤2 por partido). */
  interactivo: boolean;
  /** Zona que cubre el arquero (precomputada): gol si el disparo la esquiva. */
  ladoArquero?: ZonaDisparo;
  /**
   * Zona de la barrera del tiro libre (precomputada, solo tiro-libre-interactivo):
   * un disparo a esa zona (baja/centro) resuelve `rebote`.
   */
  ladoDefensor?: ZonaDisparo;
  /**
   * Resultado precomputado cuando el usuario elige la zona cubierta por el
   * arquero (spec R1 scenario: 'atajado' | 'palo' | 'afuera'), determinista.
   */
  resultadoCubierto?: Exclude<ResultadoSituacion, 'gol' | 'rebote'>;
  /** Resultado resuelto; pendiente (undefined) en la situación interactiva. */
  resultado?: ResultadoSituacion;
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
  /** Situación interactiva (penal o tiro libre). Eventos viejos sin el campo se leen como no interactivos. */
  situacion?: SituacionInteractiva;
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

/** Las 6 zonas del grid (spec interactive-situations R1). */
const ZONAS: readonly ZonaDisparo[] = [
  'arriba-izquierda',
  'arriba-centro',
  'arriba-derecha',
  'abajo-izquierda',
  'abajo-centro',
  'abajo-derecha',
];

/** Resultados posibles si el usuario elige la zona cubierta por el arquero. */
const CUBIERTOS: readonly Exclude<ResultadoSituacion, 'gol' | 'rebote'>[] = [
  'atajado',
  'palo',
  'afuera',
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

/** Minuto libre (1-90) no ocupado por otro evento (spec R7: situaciones en minutos únicos). */
function minutoLibre(rnd: () => number, usados: Set<number>): number {
  let minuto = 1 + Math.floor(rnd() * 90);
  let intentos = 0;
  while (usados.has(minuto) && intentos < 500) {
    intentos += 1;
    minuto = 1 + Math.floor(rnd() * 90);
  }
  usados.add(minuto);
  return minuto;
}

/** Cuenta goles de un equipo en la timeline (goles + situaciones convertidas). */
function contarGoles(lineaTiempo: EventoTimeline[], equipo: EventoTimeline['equipo']): number {
  return lineaTiempo.filter(
    (e) =>
      (e.tipo === 'gol' ||
        ((e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') &&
          e.situacion?.resultado === 'gol')) &&
      e.equipo === equipo,
  ).length;
}

/** Deriva `situaciones` (formato legacy eventos_json) desde la timeline. */
export function situacionesDesdeLineaTiempo(lineaTiempo: EventoTimeline[]): SituacionPartido[] {
  const situaciones: SituacionPartido[] = [];
  for (const e of lineaTiempo) {
    if (e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') {
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

  // ---- Situaciones interactivas (≤2 por partido: 1 penal + 1 TL, spec R7) ----
  const minutosUsados = new Set(eventos.map((e) => e.minuto));

  // Penal INTERACTIVO del jugador (≤1 por partido, spec R6): queda PENDIENTE
  // con ladoArquero precomputado; el mini juego resuelve gol/atajado/palo/afuera.
  if (rnd() < 0.12) {
    eventos.push({
      tipo: 'penal',
      minuto: minutoLibre(rnd, minutosUsados),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: '¡Penal para el equipo! Elegí la zona del disparo.',
      situacion: {
        interactivo: true,
        ladoArquero: ZONAS[Math.floor(rnd() * ZONAS.length)],
        resultadoCubierto: CUBIERTOS[Math.floor(rnd() * CUBIERTOS.length)],
      },
    });
  }

  // Penal del RIVAL: NO interactivo, resuelto en la simulación.
  if (rnd() < 0.08) {
    const convertido = rnd() < 0.78;
    eventos.push({
      tipo: 'penal',
      minuto: minutoLibre(rnd, minutosUsados),
      equipo: 'rival',
      jugador: null,
      descripcion: convertido
        ? 'Penal convertido por el rival.'
        : 'Penal en contra atajado por el arquero.',
      situacion: { interactivo: false, resultado: convertido ? 'gol' : 'atajado' },
    });
  }

  // Tiro libre INTERACTIVO del jugador (≤1 por partido): la barrera cubre una
  // zona baja/centro (rebote si la elige), el arquero otra (resultadoCubierto).
  if (rnd() < 0.1) {
    eventos.push({
      tipo: 'tiro-libre-interactivo',
      minuto: minutoLibre(rnd, minutosUsados),
      equipo: 'nosotros',
      jugador: 'jugador',
      descripcion: '¡Tiro libre peligroso! Elegí la zona del disparo.',
      situacion: {
        interactivo: true,
        ladoArquero: ZONAS[Math.floor(rnd() * ZONAS.length)],
        ladoDefensor: ZONAS_BARRERA[Math.floor(rnd() * ZONAS_BARRERA.length)],
        resultadoCubierto: CUBIERTOS[Math.floor(rnd() * CUBIERTOS.length)],
      },
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
 * Resuelve las situaciones interactivas PENDIENTES como falladas (spec R5,
 * inaction default): el wrapper headless `jugarPartido` las usa porque no
 * hay input del usuario durante el replay.
 */
export function resolverInaccion(lineaTiempo: EventoTimeline[]): EventoTimeline[] {
  return lineaTiempo.map((e) => {
    const s = e.situacion;
    const interactiva = (e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') && s?.interactivo;
    if (!interactiva || s?.resultado) return e;
    return {
      ...e,
      situacion: { ...s, resultado: 'afuera' as const },
      descripcion:
        e.tipo === 'penal'
          ? 'Penal fallado: no se eligió zona a tiempo.'
          : 'Tiro libre fallado: no se eligió zona a tiempo.',
    };
  });
}

/**
 * Resuelve el penal interactivo del minuto dado con la zona elegida por el
 * usuario (spec R2/R3): gol solo si la zona difiere de la del arquero; si
 * coincide, se aplica `resultadoCubierto` precomputado. Nunca re-simula.
 */
export function resolverPenalConEleccion(
  lineaTiempo: EventoTimeline[],
  minuto: number,
  eleccion: ZonaDisparo,
): EventoTimeline[] {
  return lineaTiempo.map((e) => {
    if (e.tipo !== 'penal' || e.minuto !== minuto || !e.situacion?.interactivo || e.situacion.resultado) {
      return e;
    }
    const s = e.situacion;
    const resultado: ResultadoSituacion = eleccion !== s.ladoArquero ? 'gol' : (s.resultadoCubierto ?? 'atajado');
    return {
      ...e,
      descripcion:
        resultado === 'gol'
          ? '¡Penal convertido! Elegiste bien y venciste al arquero.'
          : resultado === 'atajado'
            ? 'Penal atajado: el arquero adivinó tu zona.'
            : resultado === 'palo'
              ? 'Penal al palo: el arquero tocó justo el balón.'
              : 'Penal afuera: el disparo se fue desviado.',
      situacion: { ...s, resultado: resultado },
    };
  });
}

/**
 * Resuelve el tiro libre interactivo del minuto dado con la zona elegida
 * (spec R4): la barrera (zona baja/centro) devuelve `rebote` si la elige;
 * la zona del arquero aplica `resultadoCubierto`; una zona alta libre → gol;
 * zona baja/centro sin barrera → 'afuera'. Nunca re-simula el partido.
 */
export function resolverTiroLibreConEleccion(
  lineaTiempo: EventoTimeline[],
  minuto: number,
  eleccion: ZonaDisparo,
): EventoTimeline[] {
  return lineaTiempo.map((e) => {
    if (
      e.tipo !== 'tiro-libre-interactivo' ||
      e.minuto !== minuto ||
      !e.situacion?.interactivo ||
      e.situacion.resultado
    ) {
      return e;
    }
    const s = e.situacion;
    let resultado: ResultadoSituacion;
    if (eleccion === s.ladoDefensor) {
      resultado = 'rebote'; // la barrera desvía el disparo
    } else if (eleccion === s.ladoArquero) {
      resultado = s.resultadoCubierto ?? 'atajado';
    } else if (eleccion === 'arriba-izquierda' || eleccion === 'arriba-derecha') {
      resultado = 'gol'; // esquina alta libre
    } else {
      resultado = 'afuera'; // zona baja/centro sin barrera
    }
    return {
      ...e,
      descripcion:
        resultado === 'gol'
          ? '¡Gol de tiro libre! Clavaste el balón en la escuadra.'
          : resultado === 'rebote'
            ? 'La barrera desvió el disparo.'
            : resultado === 'atajado'
              ? 'Tiro libre atajado por el arquero.'
              : resultado === 'palo'
                ? 'Tiro libre al palo.'
                : 'Tiro libre afuera.',
      situacion: { ...s, resultado: resultado },
    };
  });
}

export { OVR_MAX };