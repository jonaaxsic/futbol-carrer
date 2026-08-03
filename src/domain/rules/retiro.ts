import { RETIREMENT_AGE } from '@/shared/constants/game';

/**
 * Motor de condiciones de retiro (§4.6 del plan).
 * Puro: decide si la carrera termina. Edad 40 = retiro forzado;
 * entre 37-39 el jugador se retira si no tiene ofertas (OVR en declive).
 */

export interface RetiroParams {
  edad: number;
  ovr: number;
  /** Número de temporadas completadas. */
  temporadasCompletadas: number;
  /** true si hubo oferta de club para renovar/migrar. */
  tieneOferta: boolean;
  random?: () => number;
}

export type MotivoRetiro = 'edad' | 'sin-ofertas' | 'retiro-voluntario';

export interface DecisionRetiro {
  seRetira: boolean;
  motivo: MotivoRetiro | null;
}

export function checkRetirementConditions(params: RetiroParams): DecisionRetiro {
  const rnd = params.random ?? Math.random;

  // Edad tope: siempre se retira (forzoso).
  if (params.edad >= RETIREMENT_AGE) return { seRetira: true, motivo: 'edad' };

  // 37-39: sin ofertas y OVR bajo → se retira. Con oferta, sigue.
  if (params.edad >= 37 && params.edad <= 39) {
    if (!params.tieneOferta) {
      // Probabilidad creciente con la edad.
      const probRetiro = (params.edad - 36) * 0.28; // 37→28%, 39→84%
      if (rnd() < probRetiro) return { seRetira: true, motivo: 'sin-ofertas' };
    }
  }

  // Retiro voluntario temprano (raro): solo después de 8+ temporadas y OVR bajo.
  if (
    params.temporadasCompletadas >= 8 &&
    params.ovr < 65 &&
    rnd() < 0.03
  ) {
    return { seRetira: true, motivo: 'retiro-voluntario' };
  }

  return { seRetira: false, motivo: null };
}