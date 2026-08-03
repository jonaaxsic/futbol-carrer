import type { TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import { OVR_MAX, OVR_MIN } from '@/shared/constants/game';

/**
 * Reglas de progresión de OVR (§4.3 del plan).
 * Puro y testeable sin UI: calcula el delta de OVR según tipo de
 * entrenamiento, edad (pico 27-34, declive después de 34) y random.
 */

export interface ResultadoEntrenamiento {
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
    descripcion: '1-2 h · ganancia pequeña de OVR, riesgo bajo',
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
    descripcion: '8 h · ganancia alta (+4 OVR posible), riesgo alto de lesión',
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
 * Calcula el resultado de un entrenamiento: delta de OVR (positivo si
 * la mayoría de probabilidad gana, negativo en el caso contrario) y
 * posible lesión. Los ranges se clampa entre OVR_MIN y OVR_MAX.
 */
export function calcularResultadoEntrenamiento(
  tipo: TipoEntrenamiento,
  ovrActual: number,
  edad: number,
  random: () => number = Math.random,
): ResultadoEntrenamiento {
  const cfg = TIPOS_ENTRENAMIENTO[tipo];
  const roll = random();
  const ajuste = edadAjuste(edad);

  let ovrDelta: number;
  if (roll <= cfg.probSubida) {
    ovrDelta = Math.max(cfg.deltaMin, Math.round((cfg.deltaMin + random() * (cfg.deltaMax - cfg.deltaMin)) * ajuste));
  } else {
    ovrDelta = -Math.min(2, Math.round(1 + random() * 2));
  }

  const lesion = random() < cfg.probLesion;
  if (lesion) {
    // La lesión cuesta OVR aunque haya sido un buen entreno.
    ovrDelta = Math.min(ovrDelta, -1);
  }

  const nuevo = Math.min(OVR_MAX, Math.max(OVR_MIN, ovrActual + ovrDelta));
  return { ovrDelta: nuevo - ovrActual, lesion };
}