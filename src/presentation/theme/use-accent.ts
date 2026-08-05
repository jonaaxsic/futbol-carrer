import { coloresDeClub } from '@/domain/rules/club-colors';
import type { Club } from '@/domain/entities/club';
import { colors } from '@/presentation/theme/tokens';

/**
 * Acento dinámico por identidad de club (PR5, task 5.2).
 * `accent` = primario del club, `onAccent` = texto legible sobre él
 * (blanco o casi-negro según luminancia, mismo criterio que colorTextoDe).
 * Sin club (onboarding pre-club) → acento blanco del wireframe (fallback).
 * Se aplica SOLO a superficies interactivas prominentes (CTA principal,
 * marcador, crest); los semánticos no cambian (task 5.5).
 */
export interface AccentColors {
  accent: string;
  onAccent: string;
}

/** Texto legible sobre un color de relleno (rec. 709, umbral 150). */
export function colorTextoDeHex(hex: string): string {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 150 ? colors.onAccent : colors.textPrimary;
}

/** Acento del club (blanco wireframe si no hay club). */
export function useAccentColors(club: Club | null | undefined): AccentColors {
  const colores = coloresDeClub(club);
  return {
    accent: colores.primario,
    onAccent: colorTextoDeHex(colores.primario),
  };
}