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
 * Caso de uso: jugar un partido del fixture.
 * Simula el resultado con la regla pura, persiste resultado + situaciones
 * (penales, rojas, lesiones...) en eventos_json, acumula en la temporada,
 * ajusta el OVR por rendimiento y decide si ocurre un evento narrativo
 * posterior (pantalla 11).
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

/** Bonus de OVR por rendimiento individual en el partido (máx +1). */
function bonusOvr(goles: number, asistencias: number): number {
  if (goles >= 1) return 1;
  if (asistencias >= 2) return 1;
  return 0;
}

export async function jugarPartido(
  player: Player,
  temporada: Temporada,
  partido: Partido,
  clubRival: Club,
  opciones: { conEvento?: boolean; consumirEnergia?: boolean } = {},
): Promise<ResultadoPartidoJugado> {
  const conEvento = opciones.conEvento ?? true;
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

  const eventosJson = JSON.stringify({
    golesJugador: simulacion.golesJugador,
    asistenciasJugador: simulacion.asistenciasJugador,
    amarilla: simulacion.amarilla,
    roja: simulacion.roja,
    lesion: simulacion.lesion,
    suspendidoProximo: simulacion.suspendidoProximo,
    situaciones: simulacion.situaciones,
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

export type { Player, Temporada, Partido };