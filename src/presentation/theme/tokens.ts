/**
 * Tokens de diseño — tema oscuro del wireframe (§5 del plan de trabajo).
 * Un único lugar de verdad para colores, tipografía, espaciados y radios.
 * NADA fuera de presentation/theme importa estos valores en bruto;
 * los componentes usan este módulo como única fuente.
 */

export const colors = {
  /** Fondo base de la app (wireframe #0D0D0D) */
  background: '#0D0D0D',
  /** Superficies elevadas (tarjetas, tab bar, inputs) */
  surface: '#141414',
  /** Superficies aún más elevadas (selects, hover/pressed) */
  surfaceRaised: '#1C1C1C',
  /** Bordes sutiles grises */
  border: '#2A2A2A',
  borderStrong: '#3A3A3A',

  /** Texto y acentos blancos */
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B4BA',
  textMuted: '#6E6E6E',

  /** Acento principal: blanco (botón CONTINUAR del wireframe) */
  accent: '#FFFFFF',
  onAccent: '#0D0D0D',

  /** Semánticos (estados, riesgos) */
  success: '#30A46C',
  warning: '#FFB224',
  danger: '#E5484D',
  info: '#3C87F7',

  /** Verde cancha (PositionPitch) */
  pitch: '#1B6B3A',
  pitchLine: '#2E8B57',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;
