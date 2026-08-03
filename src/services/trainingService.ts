import type { Entrenamiento, TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import type { Player } from '@/domain/entities/player';
import { calcularResultadoEntrenamiento, TIPOS_ENTRENAMIENTO } from '@/domain/rules/progresion';
import type { PlayerRepository } from '@/domain/interfaces/repositories';

import { entrenamientoRepository } from '@/data/repositories/entrenamiento-repository';
import { playerRepository } from '@/data/repositories/player-repository';

/**
 * Casos de uso de entrenamiento (Sprint 4).
 * El "tiempo real" se guarda con timestamps: si la app se cierra,
 * al volver se detecta que la sesión ya venció y se resuelve sola.
 */

const MS_HORA = 3_600_000;

/** Inicia un entrenamiento (bloqueado si ya hay uno en curso). */
export async function iniciarEntrenamiento(
  playerId: number,
  tipo: TipoEntrenamiento,
): Promise<Entrenamiento> {
  const pendiente = await entrenamientoRepository.findPendiente(playerId);
  if (pendiente && !estaCompletado(pendiente)) {
    throw new Error('Ya hay un entrenamiento en curso');
  }

  const cfg = TIPOS_ENTRENAMIENTO[tipo];
  const inicioTs = Date.now();
  return entrenamientoRepository.create({
    playerId,
    tipo,
    inicioTs,
    duracionHoras: cfg.duracionHoras,
    finEstimadaTs: inicioTs + cfg.duracionHoras * MS_HORA,
  });
}

/** true si la sesión ya venció (aunque la app estuviera cerrada). */
export function estaCompletado(entrenamiento: Entrenamiento): boolean {
  return entrenamiento.finEstimadaTs <= Date.now();
}

/**
 * Resuelve el entrenamiento si ya venció: aplica el delta de OVR al
 * jugador (calculado con la regla pura) y devuelve el resultado.
 * Si aún no venció, devuelve null (la UI muestra el countdown).
 */
export async function resolverEntrenamiento(
  playerId: number,
): Promise<{ entrenamiento: Entrenamiento; resultado: { ovrDelta: number; lesion: boolean } } | null> {
  const pendiente = await entrenamientoRepository.findPendiente(playerId);
  if (!pendiente || !estaCompletado(pendiente)) return null;

  const player = await playerRepository.findById(playerId);
  if (!player) return null;

  const resultado = calcularResultadoEntrenamiento(pendiente.tipo, player.ovr, player.edad);
  const nuevoOvr = Math.max(0, player.ovr + resultado.ovrDelta);

  await entrenamientoRepository.completar(pendiente.id, resultado.ovrDelta, true);
  await playerRepository.updateOvr(playerId, nuevoOvr);

  return { entrenamiento: { ...pendiente, completado: true, ovrDelta: resultado.ovrDelta }, resultado };
}

/** Entrenamiento pendiente del jugador (para el countdown de la UI). */
export async function obtenerEntrenamientoPendiente(playerId: number): Promise<Entrenamiento | null> {
  return entrenamientoRepository.findPendiente(playerId);
}

export type { Player, PlayerRepository };
