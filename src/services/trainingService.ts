import type { Entrenamiento, TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import type { Player } from '@/domain/entities/player';
import { STATS_POR_POSICION, type PlayerStats } from '@/domain/entities/stats';
import { calcularResultadoEntrenamiento, TIPOS_ENTRENAMIENTO } from '@/domain/rules/progresion';
import { entrenamientosParaPosicion } from '@/domain/rules/entrenamientos-por-posicion';
import type { PlayerRepository } from '@/domain/interfaces/repositories';

import { entrenamientoRepository } from '@/data/repositories/entrenamiento-repository';
import { playerRepository } from '@/data/repositories/player-repository';
import {
  consumirEnergia,
  energiaActual,
  ENERGIA_ENTRENAMIENTO,
} from '@/services/energiaService';

/**
 * Casos de uso de entrenamiento (§4.2 + §14 stats + §13b por posición).
 * El "tiempo real" se guarda con timestamps: si la app se cierra,
 * al volver se detecta que la sesión ya venció y se resuelve sola.
 * Cada sesión es VOLUNTARIA y cuesta ENERGIA_ENTRENAMIENTO barras.
 */

const MS_HORA = 3_600_000;

/** Busca la configuración de un entrenamiento por su ID. */
function buscarConfiguracion(tipo: TipoEntrenamiento, posicion: string) {
  // Primero buscar en los entrenamientos por posición
  const entrenamientosPosicion = entrenamientosParaPosicion(posicion as any);
  const encontrado = entrenamientosPosicion.find(e => e.id === tipo);
  if (encontrado) {
    return {
      duracionHoras: encontrado.duracionHoras,
      probSubida: encontrado.probSubida,
      deltaMin: encontrado.deltaMin,
      deltaMax: encontrado.deltaMax,
      probLesion: encontrado.probLesion,
      statsObjetivo: encontrado.statsObjetivo,
    };
  }
  // Fallback a los tipos antiguos
  const basico = TIPOS_ENTRENAMIENTO[tipo as keyof typeof TIPOS_ENTRENAMIENTO];
  return basico ? {
    duracionHoras: basico.duracionHoras,
    probSubida: basico.probSubida,
    deltaMin: basico.deltaMin,
    deltaMax: basico.deltaMax,
    probLesion: basico.probLesion,
    statsObjetivo: STATS_POR_POSICION[posicion as keyof typeof STATS_POR_POSICION] ?? [],
  } : null;
}

/** Inicia un entrenamiento (cuesta energía; se bloquea sin energía suficiente). */
export async function iniciarEntrenamiento(
  playerId: number,
  tipo: TipoEntrenamiento,
): Promise<Entrenamiento> {
  const pendiente = await entrenamientoRepository.findPendiente(playerId);
  if (pendiente && !estaCompletado(pendiente)) {
    throw new Error('Ya hay un entrenamiento en curso');
  }

  const player = await playerRepository.findById(playerId);
  if (!player) throw new Error('Jugador inexistente');

  if (energiaActual(player) < ENERGIA_ENTRENAMIENTO) {
    throw new Error('Energía insuficiente para entrenar. Esperá a que se regenere.');
  }
  await consumirEnergia(player, ENERGIA_ENTRENAMIENTO);

  const cfg = buscarConfiguracion(tipo, player.posicion);
  if (!cfg) throw new Error('Tipo de entrenamiento no válido');

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
 * Resuelve el entrenamiento si ya venció: aplica el delta de stats al
 * jugador (calculado con la regla pura) y devuelve el resultado.
 * Si aún no venció, devuelve null (la UI muestra el countdown).
 */
export async function resolverEntrenamiento(
  playerId: number,
): Promise<{ entrenamiento: Entrenamiento; resultado: { statsDelta: Partial<Record<import('@/domain/entities/stats').StatName, number>>; ovrDelta: number; lesion: boolean } } | null> {
  const pendiente = await entrenamientoRepository.findPendiente(playerId);
  if (!pendiente || !estaCompletado(pendiente)) return null;

  const player = await playerRepository.findById(playerId);
  if (!player) return null;

  // Buscar configuración del entrenamiento para obtener stats objetivo
  const cfg = buscarConfiguracion(pendiente.tipo, player.posicion);
  const statsRelevantes = cfg?.statsObjetivo ?? STATS_POR_POSICION[player.posicion];

  const resultado = calcularResultadoEntrenamiento(
    pendiente.tipo,
    player.stats,
    statsRelevantes,
    player.edad,
  );

  // Aplicar deltas a las stats
  const nuevasStats: PlayerStats = { ...player.stats };
  for (const [stat, delta] of Object.entries(resultado.statsDelta)) {
    if (delta != null) {
      const actual = nuevasStats[stat as keyof PlayerStats] ?? 50;
      nuevasStats[stat as keyof PlayerStats] = Math.max(1, Math.min(99, actual + delta));
    }
  }

  // Calcular nuevo OVR como promedio de stats
  const values = Object.values(nuevasStats).filter((v): v is number => v != null);
  const nuevoOvr = values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : player.ovr;

  await entrenamientoRepository.completar(pendiente.id, resultado.ovrDelta, true);
  await playerRepository.updateStats(playerId, nuevasStats);
  await playerRepository.updateOvr(playerId, nuevoOvr);

  return {
    entrenamiento: { ...pendiente, completado: true, ovrDelta: resultado.ovrDelta },
    resultado,
  };
}

/** Entrenamiento pendiente del jugador (para el countdown de la UI). */
export async function obtenerEntrenamientoPendiente(playerId: number): Promise<Entrenamiento | null> {
  return entrenamientoRepository.findPendiente(playerId);
}

export type { Player, PlayerRepository };
