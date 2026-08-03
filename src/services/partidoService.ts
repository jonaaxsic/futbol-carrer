import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import type { Player } from '@/domain/entities/player';
import type { Temporada } from '@/domain/entities/temporada';
import type { EventoNarrativo } from '@/domain/rules/eventos';
import {
  elegirEvento,
  PROBABILIDAD_EVENTO,
} from '@/domain/rules/eventos';
import { simularPartido, type ResultadoSimulacion } from '@/domain/rules/partido';
import { OVR_MAX } from '@/shared/constants/game';

import { partidoRepository } from '@/data/repositories/partido-repository';
import { playerRepository } from '@/data/repositories/player-repository';
import { temporadaRepository } from '@/data/repositories/temporada-repository';

/**
 * Caso de uso: jugar un partido del fixture (Sprint 5).
 * Simula el resultado con la regla pura, persiste el resultado y las stats
 * individuales, acumula en la temporada, ajusta el OVR por rendimiento y
 * decide si ocurre un evento narrativo posterior (pantalla 11).
 */

export interface ResultadoPartidoJugado {
  partidoActualizado: Partido;
  simulacion: ResultadoSimulacion;
  /** Evento narrativo que dispara la pantalla 11, o null. */
  eventoPosterior: EventoNarrativo | null;
}

/** Bonus de OVR por rendimiento individual en el partido (máx +1). */
function bonusOvr(goles: number, asistencias: number): number {
  if (goles >= 2) return 1;
  if (goles === 1) return 1;
  if (asistencias >= 2) return 1;
  return 0;
}

export async function jugarPartido(
  player: Player,
  temporada: Temporada,
  partido: Partido,
  clubRival: Club,
  opciones: { conEvento?: boolean } = {},
): Promise<ResultadoPartidoJugado> {
  const conEvento = opciones.conEvento ?? true;
  const simulacion = simularPartido({
    ovrJugador: player.ovr,
    prestigioRival: clubRival.prestigio,
    posicion: player.posicion,
  });

  const eventosJson = JSON.stringify({
    golesJugador: simulacion.golesJugador,
    amarilla: simulacion.amarilla,
    roja: simulacion.roja,
  });

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
    eventoPosterior,
  };
}