import type { Player } from '@/domain/entities/player';
import type {
  EventoNarrativo,
  OpcionEvento,
} from '@/domain/rules/eventos';
import { OVR_MAX } from '@/shared/constants/game';
import { clampearOvr } from '@/domain/value-objects/ovr';

import { playerRepository } from '@/data/repositories/player-repository';
import { eventoLogRepository } from '@/data/repositories/evento-log-repository';

/**
 * Casos de uso de EVENTS (Sprint 5, pantallas 11-12).
 * Aplica una decisión de evento al jugador: registra en `evento_log` y
 * materializa los efectos (OVR, etc.) vía repos.
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

export { OVR_MAX };