import type { Player } from '@/domain/entities/player';
import {
  ENERGIA_ENTRENAMIENTO,
  ENERGIA_MAX,
  ENERGIA_PARTIDO,
  calcularEnergiaDisponible,
  formaDesdeEnergia,
  proximaBarraEnMs,
  puedeEntrenar,
  puedeJugarPartido,
} from '@/domain/rules/energia';

import { playerRepository } from '@/data/repositories/player-repository';

/**
 * Casos de uso de energía (regla §4.2).
 * El "tiempo real" se resuelve por timestamp: la energía disponible se
 * recalcula al leer (nunca con timers), y SOLO se persiste al gastar.
 */

/** Energía disponible HOY (recalcula la regeneración desde el último gasto). */
export function energiaActual(player: Player, ahoraTs = Date.now()): number {
  return calcularEnergiaDisponible(
    {
      energia: player.energia,
      energiaMax: player.energiaMax,
      energiaActualizadaTs: player.energiaActualizadaTs,
    },
    ahoraTs,
  );
}

/** ms restantes para recuperar la próxima barra (null si está lleno). */
export function proximaBarraEn(player: Player, ahoraTs = Date.now()): number | null {
  return proximaBarraEnMs(
    {
      energia: player.energia,
      energiaMax: player.energiaMax,
      energiaActualizadaTs: player.energiaActualizadaTs,
    },
    ahoraTs,
  );
}

/** Forma de rendimiento derivada de la energía actual (§4.2 → §4.5). */
export function formaDesdeEnergiaActual(player: Player, ahoraTs = Date.now()): number {
  return formaDesdeEnergia(energiaActual(player, ahoraTs));
}

/** ¿Puede jugar un partido? (cuesta ENERGIA_PARTIDO barras). */
export function puedeJugar(player: Player, ahoraTs = Date.now()): boolean {
  return puedeJugarPartido(energiaActual(player, ahoraTs));
}

/** ¿Puede entrenar? (cuesta ENERGIA_ENTRENAMIENTO barras). */
export function puedeEntrenarAhora(player: Player, ahoraTs = Date.now()): boolean {
  return puedeEntrenar(energiaActual(player, ahoraTs));
}

/**
 * Gasta `cantidad` barras de energía (jugando o entrenando).
 * Valida disponibilidad y persiste el nuevo estado con su timestamp.
 * Devuelve el jugador actualizado (la UI actualiza el store con él).
 */
export async function consumirEnergia(
  player: Player,
  cantidad: number,
  ahoraTs = Date.now(),
): Promise<Player> {
  const disponibles = energiaActual(player, ahoraTs);
  if (disponibles < cantidad) {
    throw new Error(
      `Energía insuficiente: necesitás ${cantidad} y tenés ${Math.floor(disponibles)}`,
    );
  }
  const restante = Math.max(0, disponibles - cantidad);
  await playerRepository.setEnergia(player.id, restante, ahoraTs);
  return { ...player, energia: restante, energiaActualizadaTs: ahoraTs };
}

export { ENERGIA_ENTRENAMIENTO, ENERGIA_MAX, ENERGIA_PARTIDO };
