import type { TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import type { PlayerStats, StatName } from '@/domain/entities/stats';
import { clampStat } from '@/domain/entities/stats';
import { OVR_MAX, OVR_MIN } from '@/shared/constants/game';

/**
 * Reglas de progresión de stats (§14 del plan).
 * Puro y testeable sin UI: calcula el delta de stats según tipo de
 * entrenamiento, posición, edad (pico 27-34, declive después de 34) y random.
 */

export interface ResultadoEntrenamiento {
  statsDelta: Partial<Record<StatName, number>>;
  ovrDelta: number;
  lesion: boolean;
}

/** Probabilidades y rangos por tipo (§4.2). */
export const TIPOS_ENTRENAMIENTO: Record<
  TipoEntrenamiento,
  {
    etiqueta: string;
    descripcion: string;
    duracionHoras: number;
    probSubida: number;
    deltaMin: number;
    deltaMax: number;
    probLesion: number;
  }
> = {
  basico: {
    etiqueta: 'Entrenamiento básico',
    descripcion: '1-2 h · ganancia pequeña, riesgo bajo',
    duracionHoras: 2,
    probSubida: 0.75,
    deltaMin: 1,
    deltaMax: 2,
    probLesion: 0.02,
  },
  normal: {
    etiqueta: 'Preparación habitual',
    descripcion: '3-4 h · ganancia media, riesgo medio de lesión leve',
    duracionHoras: 4,
    probSubida: 0.6,
    deltaMin: 2,
    deltaMax: 4,
    probLesion: 0.06,
  },
  extremo: {
    etiqueta: 'Concentración extra',
    descripcion: '8 h · ganancia alta (+4 posible), riesgo alto de lesión',
    duracionHoras: 8,
    probSubida: 0.65,
    deltaMin: 3,
    deltaMax: 5,
    probLesion: 0.15,
  },
};

/** Edad de pico: 27-34 años (mayor subida); a partir de 34 el declive pesa. */
const edadAjuste = (edad: number): number => {
  if (edad < 20) return 0.75; // crece menos, aún está formándose
  if (edad <= 26) return 0.9;
  if (edad <= 34) return 1.0; // plenitud
  return 0.6; // declive físico
};

/**
 * Calcula el resultado de un entrenamiento: delta de stats específicas
 * y posible lesión. Las stats se clampean entre 1 y 99.
 */
export function calcularResultadoEntrenamiento(
  tipo: TipoEntrenamiento,
  statsActuales: PlayerStats,
  statsRelevantes: StatName[],
  edad: number,
  random: () => number = Math.random,
): ResultadoEntrenamiento {
  const cfg = TIPOS_ENTRENAMIENTO[tipo];
  const roll = random();
  const ajuste = edadAjuste(edad);

  const statsDelta: Partial<Record<StatName, number>> = {};

  if (roll <= cfg.probSubida) {
    // Elegir 1-2 stats aleatorias para mejorar
    const numStats = 1 + Math.floor(random() * 2); // 1 o 2
    const statsElegidas = statsRelevantes
      .sort(() => random() - 0.5)
      .slice(0, numStats);

    for (const stat of statsElegidas) {
      const actual = statsActuales[stat] ?? 50;
      const delta = Math.max(
        cfg.deltaMin,
        Math.round((cfg.deltaMin + random() * (cfg.deltaMax - cfg.deltaMin)) * ajuste),
      );
      statsDelta[stat] = clampStat(actual + delta) - actual;
    }
  } else {
    // Pérdida pequeña en 1 stat
    const statPerdida = statsRelevantes[Math.floor(random() * statsRelevantes.length)];
    const actual = statsActuales[statPerdida] ?? 50;
    const delta = -Math.min(2, Math.round(1 + random() * 2));
    statsDelta[statPerdida] = clampStat(actual + delta) - actual;
  }

  const lesion = random() < cfg.probLesion;
  if (lesion) {
    // La lesión reduce 1-2 stats
    const statLesion = statsRelevantes[Math.floor(random() * statsRelevantes.length)];
    const actual = statsActuales[statLesion] ?? 50;
    statsDelta[statLesion] = clampStat(actual - 2) - actual;
  }

  // Calcular delta de OVR como promedio de los deltas
  const deltas = Object.values(statsDelta).filter((d): d is number => d != null);
  const ovrDelta = deltas.length > 0
    ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
    : 0;

  return { statsDelta, ovrDelta, lesion };
}