import { OVR_MAX, OVR_MIN } from '@/shared/constants/game';

/**
 * Value object: OVR (Overall). Rango 50–99 (§4.3 del plan).
 * Función pura de validación, testeable sin UI.
 */
export function validarOvr(valor: unknown): asserts valor is number {
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    throw new Error('OVR debe ser un entero');
  }
  if (valor < OVR_MIN || valor > OVR_MAX) {
    throw new Error(`OVR fuera de rango (${OVR_MIN}-${OVR_MAX}): ${valor}`);
  }
}

/** Clampa un OVR dentro del rango legal (para deltas de entrenamiento/matches). */
export function clampearOvr(valor: number): number {
  return Math.max(OVR_MIN, Math.min(OVR_MAX, Math.round(valor)));
}