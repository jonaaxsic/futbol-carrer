import type { NuevoPlayer, Player } from '@/domain/entities/player';
import { validarOvr } from '@/domain/value-objects/ovr';

import { playerRepository } from '@/data/repositories/player-repository';

/**
 * Caso de uso: gestión del jugador (onboarding, pantallas 4-7).
 * Depende de la INTERFAZ PlayerRepository (O/D) — el SQL vive en data/.
 */
export async function crearJugador(datos: NuevoPlayer): Promise<Player> {
  validarOvr(datos.ovr); // regla de dominio: OVR fuera de rango no entra a la BD
  return playerRepository.create(datos);
}

/** Jugador con carrera activa (null = aún no hay carrera). */
export async function obtenerJugadorActivo(): Promise<Player | null> {
  return playerRepository.findActivo();
}