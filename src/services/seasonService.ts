import type { Club } from '@/domain/entities/club';
import type { Player } from '@/domain/entities/player';
import type { Posicion } from '@/domain/value-objects/posicion';
import type { Temporada } from '@/domain/entities/temporada';
import type { Trofeo, NivelTrofeo } from '@/domain/entities/trofeo';
import {
  decidirTrofeos,
  esConvocado,
  hayOfertaMejorClub,
  seleccionarCandidatos,
  trofeoSeleccion,
  type DatosCierre,
  type TrofeoGanado,
} from '@/domain/rules/temporada';
import { aplicarDecliveEdad } from '@/domain/rules/progresion';
import { checkRetirementConditions, type DecisionRetiro } from '@/domain/rules/retiro';
import type { Country } from '@/shared/constants/game';
import type { SeasonMode } from '@/shared/types';
import { OVR_MAX } from '@/shared/constants/game';

import { playerRepository } from '@/data/repositories/player-repository';
import { temporadaRepository } from '@/data/repositories/temporada-repository';
import { clubRepository } from '@/data/repositories/club-repository';
import { historialRepository } from '@/data/repositories/historial-repository';
import { trofeoRepository } from '@/data/repositories/trofeo-repository';
import { eventoLogRepository } from '@/data/repositories/evento-log-repository';
import { generarFixtureTemporada, obtenerProximosPartidos } from '@/services/calendarService';
import { jugarPartido } from '@/services/partidoService';
import { elegirEvento, type EventoNarrativo } from '@/domain/rules/eventos';
import type { Partido } from '@/domain/entities/partido';

/**
 * Caso de uso: cierre de temporada (§4.5 del plan, design D6).
 * Dos pasos: `proponerCierre` (solo calcula: trofeos, convocatoria,
 * candidatos, retiro, decisión) y `finalizarCierre` (persiste: cierra la
 * temporada, aplica la DECISIÓN del usuario {cambio|quedarse}, setPosicion,
 * regenera fixture y abre la siguiente).
 */

export interface ResultadoCierreTemporada {
  temporadaCerrada: Temporada;
  nuevaTemporada: Temporada;
  player: Player;
  clubActual: Club;
  clubNuevo: Club | null;
  trofeos: Trofeo[];
  convocadoSeleccion: boolean;
  ofertaRecibida: boolean;
  /** Decisión narrativa de fin de temporada (flujo Copero) o null. */
  decision: EventoNarrativo | null;
  /** Condiciones de retiro evaluadas (§4.6): si seRetira, la carrera termina. */
  retiro: DecisionRetiro;
}

/** Propuesta de cierre: TODO lo calculable antes de la decisión del usuario. */
export interface PropuestaCierre {
  temporada: Temporada;
  clubActual: Club;
  player: Player;
  /** 2-3 clubes mejores (spec club-transfer R1); [] si no hay oferta. */
  candidatos: Club[];
  trofeosGanados: TrofeoGanado[];
  convocadoSeleccion: boolean;
  trofeoSeleccionGanado: TrofeoGanado | null;
  retiro: DecisionRetiro;
  decision: EventoNarrativo | null;
}

/** Decisión del usuario al finalizar el cierre (D6). */
export type DecisionCierre =
  | { tipo: 'quedarse' }
  | { tipo: 'cambio'; clubId: number; posicion: Posicion };

/** Edad base al cerrar (16 + años transcurridos). */
function calcularEdadNueva(player: Player, temporada: Temporada, modo: SeasonMode): number {
  return player.edad + (modo === 'rapido' ? 2 : 1);
}

/** OVR se ajusta con la edad: pico 27-34, declive después (regla §4.3). */
function ajustarOvrPorEdad(ovr: number, edadNueva: number, temporada: Temporada): number {
  let delta = 0;
  if (edadNueva <= 25) delta += 1; // en crecimiento
  else if (edadNueva >= 27 && edadNueva <= 34) delta += 0; // pico
  else if (edadNueva > 34) delta -= 1; // declive
  // Si el jugador no jugó casi nada, no sube por edad.
  if (temporada.pj < 5) delta = Math.min(delta, 0);
  return Math.min(OVR_MAX, Math.max(50, ovr + delta));
}

/**
 * PASO 1 — Calcula todo el cierre sin persistir nada (spec R1: el club NO
 * cambia sin la decisión del usuario). Devuelve la propuesta para /club-oferta.
 */
export async function proponerCierre(
  player: Player,
  temporada: Temporada,
  clubActual: Club,
  pais: Country,
): Promise<PropuestaCierre> {
  const datosCierre: DatosCierre = {
    ovr: player.ovr,
    edad: player.edad,
    pj: temporada.pj,
    goles: temporada.goles,
    asistencias: temporada.asistencias,
    prestigioClub: clubActual.prestigio,
  };

  // 1) Trofeos de club + individuales (se persisten en finalizarCierre).
  const trofeosGanados = decidirTrofeos(datosCierre);

  // 2) Convocatoria a selección nacional.
  const convocado = esConvocado(datosCierre);
  const sel = convocado ? trofeoSeleccion(datosCierre) : null;

  // 3) Oferta de mejor club → 2-3 candidatos (spec R1: choice, no automático).
  let candidatos: Club[] = [];
  if (hayOfertaMejorClub(datosCierre)) {
    const mejores = await clubRepository.findByPais(pais);
    candidatos = seleccionarCandidatos(mejores, clubActual.prestigio);
  }

  // 4) Edad/OVR proyectados + retiro (para la pantalla; se persiste al final).
  const edadNueva = calcularEdadNueva(player, temporada, temporada.modo);
  const ovrFin = ajustarOvrPorEdad(player.ovr, edadNueva, temporada);
  const retiro = checkRetirementConditions({
    edad: edadNueva,
    ovr: ovrFin,
    temporadasCompletadas: player.temporadaActual,
    tieneOferta: candidatos.length > 0,
  });

  // 5) Decisión narrativa (1 por temporada, flujo Copero).
  const decision =
    Math.random() < 0.8
      ? elegirEvento({
          ovr: ovrFin,
          posicion: player.posicion,
          edad: edadNueva,
          temporada: temporada.anioInicio,
        })
      : null;

  return {
    temporada,
    clubActual,
    player,
    candidatos,
    trofeosGanados,
    convocadoSeleccion: convocado,
    trofeoSeleccionGanado: sel,
    retiro,
    decision,
  };
}

/**
 * PASO 2 — Persiste el cierre aplicando la decisión del usuario.
 * - 'quedarse': sigue en el club actual (spec R2).
 * - 'cambio': setPosicion + setClub + regenera fixture (spec R4/R5).
 */
export async function finalizarCierre(
  propuesta: PropuestaCierre,
  decision: DecisionCierre,
): Promise<ResultadoCierreTemporada> {
  const { player, temporada, clubActual } = propuesta;
  const clubNuevo =
    decision.tipo === 'cambio'
      ? (await clubRepository.findById(decision.clubId)) ?? null
      : null;

  // 1) Trofeos (calculados en la propuesta: misma semilla de decisión).
  const trofeosCreados: Promise<Trofeo>[] = propuesta.trofeosGanados.map((t) =>
    trofeoRepository.crear({
      playerId: player.id,
      nombre: t.nombre,
      competencia: t.competencia,
      anio: temporada.anioInicio,
      nivel: t.nivel as NivelTrofeo,
    }),
  );
  if (propuesta.convocadoSeleccion && propuesta.trofeoSeleccionGanado) {
    const sel = propuesta.trofeoSeleccionGanado;
    trofeosCreados.push(
      trofeoRepository.crear({
        playerId: player.id,
        nombre: sel.nombre,
        competencia: sel.competencia,
        anio: temporada.anioInicio,
        nivel: sel.nivel as NivelTrofeo,
      }),
    );
    await eventoLogRepository.crear({
      playerId: player.id,
      tipo: 'decision',
      descripcion: `Convocado a la selección tras la temporada ${temporada.anioInicio}`,
      impactoJson: null,
    });
  }

  // 2) Sumar stats de la temporada al historial de carrera.
  await historialRepository.sumarStats(
    player.id,
    clubActual.id,
    temporada.pj,
    temporada.goles,
    temporada.asistencias,
  );

  // 3) Cerrar temporada y abrir la siguiente.
  const edadNueva = calcularEdadNueva(player, temporada, temporada.modo);
  const ovrFin = ajustarOvrPorEdad(player.ovr, edadNueva, temporada);
  await temporadaRepository.cerrar(temporada.id, ovrFin);

  // 4) Cambio de club (solo con decisión explícita del usuario).
  const clubFinal = clubNuevo ?? clubActual;
  if (clubNuevo && clubNuevo.id !== clubActual.id) {
    await historialRepository.cerrarEtapa(player.id, clubActual.id, temporada.anioInicio);
    await historialRepository.abrirEtapa(
      player.id,
      clubNuevo.id,
      temporada.anioInicio + (temporada.modo === 'rapido' ? 2 : 1),
    );
    await playerRepository.setClub(player.id, clubNuevo.id);
    // Spec R4/R5: la posición nueva se persiste SOLO vía este flujo.
    await playerRepository.setPosicion(player.id, decision.tipo === 'cambio' ? decision.posicion : player.posicion);
  }

  // 5) Actualizar jugador: edad, OVR ajustado, stats con declive y temporada actual.
  const statsConDeclive = aplicarDecliveEdad(player.stats, edadNueva);
  const values = Object.values(statsConDeclive).filter((v): v is number => v != null);
  const ovrDeStats = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : ovrFin;

  await playerRepository.updateOvr(player.id, ovrDeStats);
  await playerRepository.updateStats(player.id, statsConDeclive);
  await playerRepository.setClub(player.id, clubFinal.id);
  await playerRepository.setTemporadaActual(player.id, player.temporadaActual + 1);

  const playerActualizado: Player = {
    ...player,
    edad: edadNueva,
    ovr: ovrDeStats,
    stats: statsConDeclive,
    posicion:
      decision.tipo === 'cambio' && clubNuevo ? decision.posicion : player.posicion,
    clubId: clubFinal.id,
    temporadaActual: player.temporadaActual + 1,
  };

  const nuevaTemporada = await temporadaRepository.create({
    playerId: player.id,
    anioInicio: temporada.anioInicio + (temporada.modo === 'rapido' ? 2 : 1),
    modo: temporada.modo,
    ovrInicio: ovrFin,
  });

  await generarFixtureTemporada(nuevaTemporada, clubFinal);

  // 6) Retiro: se re-evalúa con la oferta REAL (aceptada o no).
  const retiro = checkRetirementConditions({
    edad: edadNueva,
    ovr: ovrFin,
    temporadasCompletadas: player.temporadaActual,
    tieneOferta: clubNuevo != null,
  });

  return {
    temporadaCerrada: temporada,
    nuevaTemporada,
    player: playerActualizado,
    clubActual,
    clubNuevo,
    trofeos: await Promise.all(trofeosCreados),
    convocadoSeleccion: propuesta.convocadoSeleccion,
    ofertaRecibida: clubNuevo != null,
    decision: propuesta.decision,
    retiro,
  };
}

/**
 * Wrapper compatible (flujo Copero / automatizado): propone y finaliza
 * de inmediato — cambio automático al mejor candidato si existe, quedarse
 * en caso contrario (mismo comportamiento que el cierre original).
 */
export async function cerrarTemporada(
  player: Player,
  temporada: Temporada,
  clubActual: Club,
  pais: Country,
): Promise<ResultadoCierreTemporada> {
  const propuesta = await proponerCierre(player, temporada, clubActual, pais);
  const decision: DecisionCierre = propuesta.candidatos[0]
    ? { tipo: 'cambio', clubId: propuesta.candidatos[0].id, posicion: player.posicion }
    : { tipo: 'quedarse' };
  return finalizarCierre(propuesta, decision);
}

export interface ResumenTemporadaSimulada {
  partidosJugados: number;
  partidos: Partido[];
  /** Stats finales de la temporada (suma de todo el fixture). */
  goles: number;
  asistencias: number;
  victorias: number;
  derrotas: number;
}

/**
 * Simula TODA la temporada de un toque (estilo Copero): juega cada partido
 * del fixture pendiente con el motor puro y persiste resultados/stats.
 * Devuelve el resumen para que la UI muestre qué pasó.
 */
export async function simularTemporadaCompleta(
  player: Player,
  temporada: Temporada,
  club: Club,
): Promise<ResumenTemporadaSimulada> {
  const pendientes = await obtenerProximosPartidos(temporada.id, 0, 100);

  let goles = 0;
  let asistencias = 0;
  let victorias = 0;
  let derrotas = 0;
  let ovrActual = player.ovr;
  const jugados: Partido[] = [];

  for (const partido of pendientes) {
    const rival = await clubRepository.findById(partido.rivalClubId);
    if (!rival) continue;
    // Simular UNA temporada completa: sin eventos por partido (se resuelven
    // en el cierre, una vez por temporada — flujo tipo Copero).
    const playerActual = { ...player, ovr: ovrActual };
    const resultado = await jugarPartido(playerActual, temporada, partido, rival, {
      conEvento: false,
      consumirEnergia: false,
    });

    if (resultado.simulacion.victoria) victorias += 1;
    if (resultado.simulacion.derrota) derrotas += 1;
    goles += resultado.simulacion.golesJugador;
    asistencias += resultado.simulacion.asistenciasJugador;
    jugados.push(resultado.partidoActualizado);
    // La temporada acumula de a un partido en BD; el OVR se ajusta en cierre.
    ovrActual = playerActual.ovr;
  }

  return { partidosJugados: jugados.length, goles, asistencias, victorias, derrotas, partidos: jugados };
}

export type { Player, Temporada, Trofeo, NivelTrofeo };