import type { Player } from '@/domain/entities/player';
import type {
  EventoNarrativo,
  OpcionEvento,
} from '@/domain/rules/eventos';
import { patearPenal } from '@/domain/rules/eventos';
import { OVR_MAX } from '@/shared/constants/game';
import { clampearOvr } from '@/domain/value-objects/ovr';

import { playerRepository } from '@/data/repositories/player-repository';
import { eventoLogRepository } from '@/data/repositories/evento-log-repository';

/**
 * Casos de uso de EVENTS (Sprint 5, pantallas 11-12).
 * Aplica una decisión de evento al jugador: registra en `evento_log` y
 * materializa los efectos (OVR, etc.) vía repos. También resuelve el penal
 * usando la regla pura `patearPenal`.
 */

export interface OpcionAplicada {
  /** Texto de resultado para mostrar tras decidir. */
  mensaje: string;
  ovrAnterior: number | null;
  ovrNuevo: number | null;
}

/** Aplica la opción elegida de un evento narrativo. */
export async function aplicarOpcionEvento(
  player: Player,
  evento: EventoNarrativo,
  opcion: OpcionEvento,
): Promise<OpcionAplicada> {
  const ovrDelta =
    opcion.efectos.reduce((acc, e) => acc + (e.ovrDelta ?? 0), 0) ?? 0;

  let ovrNuevo: number | null = null;
  if (ovrDelta !== 0) {
    ovrNuevo = clampearOvr(player.ovr + ovrDelta);
    await playerRepository.updateOvr(player.id, ovrNuevo);
  }

  // Persistir evento con impacto.
  await eventoLogRepository.crear({
    playerId: player.id,
    tipo: evento.tipo,
    descripcion: `${evento.titulo}: ${opcion.texto}`,
    impactoJson: JSON.stringify({
      ovrDelta,
      efectos: opcion.efectos.map((e) => ({
        etiqueta: e.etiqueta,
        direccion: e.direccion,
      })),
    }),
  });

  return {
    mensaje: opcion.resultado ?? opcion.texto,
    ovrAnterior: ovrDelta !== 0 ? player.ovr : null,
    ovrNuevo,
  };
}

export interface ResultadoPenalResuelto {
  gol: boolean;
  atajado: boolean;
  mensaje: string;
}

/** Resuelve el sub-evento penal (pantalla 12) y lo registra. */
export async function resolverPenal(
  player: Player,
  direccion: string,
): Promise<ResultadoPenalResuelto> {
  const resultado = patearPenal({ ovr: player.ovr, posicion: player.posicion });
  const mensaje = resultado.gol
    ? `¡GOL! Pateaste a la ${direccion} y venciste al arquero.`
    : `¡Atajado! El arquero se lanzó a la ${direccion} y detuvo el disparo.`;

  await eventoLogRepository.crear({
    playerId: player.id,
    tipo: 'penal',
    descripcion: mensaje,
    impactoJson: JSON.stringify({ gol: resultado.gol, direccion }),
  });

  return { gol: resultado.gol, atajado: resultado.atajado, mensaje };
}

export { OVR_MAX };