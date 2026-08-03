import type { NivelTrofeo } from '@/domain/entities/trofeo';

/**
 * Reglas de cierre de temporada (§4.5 del plan).
 * Puro: decide trofeos, convocatoria y ofertas a partir de stats —
 * sin SQLite ni React. El service orquesta y persiste.
 */

export interface DatosCierre {
  ovr: number;
  edad: number;
  pj: number;
  goles: number;
  asistencias: number;
  /** Prestigio del club (1-5). */
  prestigioClub: number;
  random?: () => number;
}

export interface TrofeoGanado {
  nombre: string;
  competencia: string;
  nivel: NivelTrofeo;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Decide qué trofeos se ganan al cierre (ligas, copas e individuales).
 * La probabilidad de liga crece con OVR y prestigio del club.
 */
export function decidirTrofeos(datos: DatosCierre): TrofeoGanado[] {
  const rnd = datos.random ?? Math.random;
  const ganados: TrofeoGanado[] = [];

  const probLiga = clamp(
    0.06 + (datos.ovr - 62) * 0.012 + (datos.prestigioClub - 2) * 0.05,
    0.02,
    0.85,
  );
  if (rnd() < probLiga) ganados.push({ nombre: 'Campeón de liga', competencia: 'Liga', nivel: 'club' });

  const probCopa = probLiga * 0.5;
  if (rnd() < probCopa) ganados.push({ nombre: 'Campeón de copa', competencia: 'Copa Nacional', nivel: 'club' });

  // Individuales solo si se jugó lo suficiente.
  if (datos.pj >= 15) {
    if (datos.goles >= 18) {
      ganados.push({ nombre: 'Máximo goleador', competencia: 'Liga', nivel: 'individual' });
    }
    if (datos.goles >= 10 && datos.asistencias >= 8 && rnd() < 0.5) {
      ganados.push({ nombre: 'Mejor jugador del torneo', competencia: 'Liga', nivel: 'individual' });
    }
  }

  return ganados;
}

/**
 * Convocatoria a selección nacional: a partir de cierto OVR con edad útil.
 * Devuelve true cuando el jugador es convocado (se registra trofeo aparte).
 */
export function esConvocado(datos: DatosCierre): boolean {
  if (datos.ovr < 74 || datos.edad > 38) return false;
  const rnd = datos.random ?? Math.random;
  // A mayor OVR más probable (75 → ~35%, 90+ → seguro).
  return rnd() < clamp((datos.ovr - 72) * 0.045, 0.1, 0.95);
}

/** Trofeo por selección cuando el jugador convocado rinde (goles/PJ). */
export function trofeoSeleccion(datos: DatosCierre): TrofeoGanado | null {
  const rnd = datos.random ?? Math.random;
  if (datos.goles >= 6 && rnd() < 0.35) {
    return { nombre: 'Campeón continental', competencia: 'Selección nacional', nivel: 'seleccion' };
  }
  return null;
}

export interface ClubPotencial {
  id: number;
  nombre: string;
  prestigio: number;
  pais: string;
}

/**
 * Oferta de mejor club: se evalúa si el jugador merece subir de categoría
 * (OVR alto o gran temporada). El service comparará con el club actual.
 */
export function hayOfertaMejorClub(datos: DatosCierre): boolean {
  if (datos.ovr < 76) return false;
  const rnd = datos.random ?? Math.random;
  return rnd() < clamp((datos.ovr - 74) * 0.03, 0.1, 0.7);
}