import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import type { Player } from '@/domain/entities/player';
import type { Temporada } from '@/domain/entities/temporada';
import type { EventoNarrativo } from '@/domain/rules/eventos';
import {
  elegirEvento,
  PROBABILIDAD_EVENTO,
} from '@/domain/rules/eventos';
import {
  resultadoDesdeLineaTiempo,
  resolverPenalInaccion,
  simularPartido,
  type EventoTimeline,
  type ResultadoSimulacion,
} from '@/domain/rules/partido';
import { formaDesdeEnergia } from '@/domain/rules/energia';
import { OVR_MAX } from '@/shared/constants/game';

import { partidoRepository } from '@/data/repositories/partido-repository';
import { playerRepository } from '@/data/repositories/player-repository';
import { temporadaRepository } from '@/data/repositories/temporada-repository';
import {
  consumirEnergia,
  energiaActual,
  ENERGIA_PARTIDO,
} from '@/services/energiaService';

/**
 * Caso de uso: jugar un partido del fixture (design D2: split en dos pasos).
 *
 * - `iniciarPartido`: valida/consume energía (−ENERGIA_PARTIDO), simula la
 *   timeline determinista y la persiste ANTES del replay (eventos_json).
 * - `finalizarPartido`: toma la timeline RESUELTA (tras el mini-juego de
 *   penal en /match), deriva el resultado SIN re-simular (spec penalty R2),
 *   persiste resultado + stats, ajusta OVR, suspende si corresponde.
 * - `jugarPartido`: wrapper compatible (flujo actual del dashboard): inicia,
 *   resuelve penales pendientes de forma automática y finaliza.
 *
 * ENERGÍA (§4.2): jugar cuesta ENERGIA_PARTIDO barras. Además, si el jugador
 * se lesiona o es expulsado, se PIERDE el próximo partido (suspendido).
 */

export interface ResultadoPartidoJugado {
  partidoActualizado: Partido;
  simulacion: ResultadoSimulacion;
  /** Jugador con OVR/energía actualizados (la UI debe usarlo). */
  jugadorActualizado: Player;
  /** Evento narrativo que dispara la pantalla 11, o null. */
  eventoPosterior: EventoNarrativo | null;
}

/** Contenido de una sesión de partido iniciada (lo consume /match, PR3). */
export interface PartidoEnCurso {
  partido: Partido;
  temporada: Temporada;
  clubRival: Club;
  jugador: Player;
  lineaTiempo: EventoTimeline[];
}

/** Bonus de OVR por rendimiento individual en el partido (máx +1). */
function bonusOvr(goles: number, asistencias: number): number {
  if (goles >= 1) return 1;
  if (asistencias >= 2) return 1;
  return 0;
}

/** Serializa la timeline en el formato persistido (design D1). */
function eventosJsonDeLinea(lineaTiempo: EventoTimeline[]): string {
  return JSON.stringify({ lineaTiempo });
}

/**
 * Paso 1: valida energía, la consume y persiste la timeline ANTES del replay.
 * Devuelve la sesión completa para que el replayer (PR3) la replique.
 */
export async function iniciarPartido(
  player: Player,
  temporada: Temporada,
  partido: Partido,
  clubRival: Club,
  opciones: { consumirEnergia?: boolean } = {},
): Promise<PartidoEnCurso> {
  const consumir = opciones.consumirEnergia ?? true;

  // Energía: suma POR PARTIDO, con regen por tiempo (regla §4.2).
  const energiaInicio = energiaActual(player);
  if (consumir) {
    if (energiaInicio < ENERGIA_PARTIDO) {
      throw new Error('Energía insuficiente para jugar. Esperá a que se regenere.');
    }
    player = await consumirEnergia(player, ENERGIA_PARTIDO);
  }

  // La forma depende de la energía disponible al arrancar el partido.
  const simulacion = simularPartido({
    ovrJugador: player.ovr,
    prestigioRival: clubRival.prestigio,
    posicion: player.posicion,
    forma: formaDesdeEnergia(energiaInicio),
  });

  // D1: la timeline se persiste UNA vez al inicio (replay estable, sobrevive
  // backgrounding; nunca se regenera).
  await partidoRepository.guardarTimeline(partido.id, eventosJsonDeLinea(simulacion.lineaTiempo));

  return {
    partido,
    temporada,
    clubRival,
    jugador: player,
    lineaTiempo: simulacion.lineaTiempo,
  };
}

/**
 * Paso 2: persiste el resultado derivado de la timeline RESUELTA, acumula
 * stats de temporada, ajusta OVR y decide suspensión/evento posterior.
 */
export async function finalizarPartido(
  player: Player,
  temporada: Temporada,
  partido: Partido,
  clubRival: Club,
  lineaTiempoResuelta: EventoTimeline[],
  opciones: { conEvento?: boolean } = {},
): Promise<ResultadoPartidoJugado> {
  const conEvento = opciones.conEvento ?? true;

  // Spec penalty R2: el resultado se DERIVA de la timeline resuelta (los
  // penales interactivos ya tienen resultado); nunca se re-simula.
  const simulacion = resultadoDesdeLineaTiempo(lineaTiempoResuelta);
  const eventosJson = eventosJsonDeLinea(lineaTiempoResuelta);

  await partidoRepository.marcarJugado(
    partido.id,
    `${simulacion.golesFavor}-${simulacion.golesContra}`,
    simulacion.golesJugador,
    simulacion.asistenciasJugador,
    eventosJson,
  );

  await temporadaRepository.sumarStats(
    temporada.id,
    1,
    simulacion.golesJugador,
    simulacion.asistenciasJugador,
  );

  // OVR: pequeño bonus por rendimiento individual (siempre acotado).
  const delta = bonusOvr(simulacion.golesJugador, simulacion.asistenciasJugador);
  if (delta !== 0) {
    const nuevoOvr = Math.min(OVR_MAX, player.ovr + delta);
    await playerRepository.updateOvr(player.id, nuevoOvr);
    player.ovr = nuevoOvr;
  }

  // Lesión / expulsión → te pierdes el PRÓXIMO partido (queda suspendido).
  if (simulacion.suspendidoProximo) {
    const siguientes = await partidoRepository.findProximos(
      temporada.id,
      partido.fechaTs + 1,
      1,
    );
    if (siguientes[0]) {
      await partidoRepository.marcarSuspendido(
        siguientes[0].id,
        simulacion.roja ? 'expulsión' : 'lesión',
      );
    }
  }

  // ¿Evento narrativo posterior? (solo si se pide — el flujo Copero lo
  // decide UNA vez por temporada, no por partido).
  const eventoPosterior =
    conEvento && Math.random() < PROBABILIDAD_EVENTO
      ? elegirEvento({
          ovr: player.ovr,
          posicion: player.posicion,
          edad: player.edad,
          temporada: temporada.anioInicio,
        })
      : null;

  return {
    partidoActualizado: {
      ...partido,
      jugo: true,
      resultado: `${simulacion.golesFavor}-${simulacion.golesContra}`,
      goles: simulacion.golesJugador,
      asistencias: simulacion.asistenciasJugador,
      eventosJson,
    },
    simulacion,
    jugadorActualizado: player,
    eventoPosterior,
  };
}

/**
 * Persiste la timeline (posiblemente mutada por el mini-juego de penal) sin
 * marcar el partido como jugado (design D1: el replay sobrevive al fondo).
 */
export async function guardarLineaTiempo(partidoId: number, lineaTiempo: EventoTimeline[]): Promise<void> {
  await partidoRepository.guardarTimeline(partidoId, eventosJsonDeLinea(lineaTiempo));
}

/**
 * Wrapper compatible (flujo actual del dashboard, se reemplaza en PR3):
 * inicia, resuelve los penales interactivos pendientes de forma automática
 * (sin input → fallado, spec R5) y finaliza.
 */
export async function jugarPartido(
  player: Player,
  temporada: Temporada,
  partido: Partido,
  clubRival: Club,
  opciones: { conEvento?: boolean; consumirEnergia?: boolean } = {},
): Promise<ResultadoPartidoJugado> {
  const conEvento = opciones.conEvento ?? true;
  const consumir = opciones.consumirEnergia ?? true;

  const enCurso = await iniciarPartido(player, temporada, partido, clubRival, { consumirEnergia: consumir });
  const lineaResuelta = resolverPenalInaccion(enCurso.lineaTiempo);
  const resultado = await finalizarPartido(
    enCurso.jugador,
    temporada,
    partido,
    clubRival,
    lineaResuelta,
    { conEvento },
  );

  // El partido vuelve con el resultado derivado (no el simulado al inicio).
  return resultado;
}

export type { Player, Temporada, Partido };