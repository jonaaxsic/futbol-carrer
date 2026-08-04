/**
 * Constantes del dominio de juego (§2 del plan de trabajo).
 * Aquí viven los números globales; las reglas de progresión van en domain/rules.
 */

/** Rango de OVR del juego (50 → 99) */
export const OVR_MIN = 50;
export const OVR_MAX = 99;

/** OVR inicial de la carrera (edad 16), según el plan §4.5. */
export const OVR_START = 50;

/** La carrera arranca a los 16 años y termina a los 40 (§4.6). */
export const CAREER_START_AGE = 16;
export const RETIREMENT_AGE = 40;

/** Duración de entrenamientos en horas (§4.2). */
export const TRAINING_DURATION_HOURS = {
  basic: 2,
  normal: 4,
  extreme: 8,
} as const;

/** Países disponibles para la nacionalidad del jugador (pantalla 4). */
export const COUNTRIES = [
  'Chile',
  'Argentina',
  'Brasil',
  'Uruguay',
  'Colombia',
  'México',
  'Perú',
  'Paraguay',
  'Ecuador',
  'España',
  'Portugal',
  'Inglaterra',
  'Alemania',
  'Italia',
  'Francia',
] as const;

export type Country = (typeof COUNTRIES)[number];

/** Nombre real de la primera división de cada país (para fixtures y ofertas). */
export const LIGAS_POR_PAIS: Record<Country, string> = {
  Chile: 'Primera División',
  Argentina: 'Liga Profesional',
  Brasil: 'Serie A',
  Uruguay: 'Primera División',
  Colombia: 'Categoría Primera A',
  México: 'Liga MX',
  Perú: 'Liga 1',
  Paraguay: 'Primera División',
  Ecuador: 'LigaPro Serie A',
  España: 'La Liga',
  Portugal: 'Primeira Liga',
  Inglaterra: 'Premier League',
  Alemania: 'Bundesliga',
  Italia: 'Serie A',
  Francia: 'Ligue 1',
};
