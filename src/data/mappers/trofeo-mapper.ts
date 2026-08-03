import type { Trofeo, NivelTrofeo } from '@/domain/entities/trofeo';

/** Fila cruda de la tabla `trofeo`. */
export interface TrofeoRow {
  id: number;
  player_id: number;
  nombre: string;
  competencia: string;
  anio: number;
  nivel: string;
}

const NIVELES_VALIDOS: NivelTrofeo[] = ['club', 'seleccion', 'individual'];

/** Mapper: fila SQLite → entidad Trofeo. */
export function filaToTrofeo(fila: TrofeoRow): Trofeo {
  if (!NIVELES_VALIDOS.includes(fila.nivel as NivelTrofeo)) {
    throw new Error(`Nivel de trofeo inválido en BD: ${fila.nivel}`);
  }
  return {
    id: fila.id,
    playerId: fila.player_id,
    nombre: fila.nombre,
    competencia: fila.competencia,
    anio: fila.anio,
    nivel: fila.nivel as NivelTrofeo,
  };
}