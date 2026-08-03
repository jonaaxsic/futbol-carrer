import type { Club } from '@/domain/entities/club';
import type { Prestigio } from '@/shared/types';

/** Fila cruda de la tabla `club`. */
export interface ClubRow {
  id: number;
  nombre: string;
  pais: string;
  liga: string;
  prestigio: number;
  escudo_key: string | null;
}

/** Mapper: fila SQLite → entidad Club. */
export function filaToClub(fila: ClubRow): Club {
  if (fila.prestigio < 1 || fila.prestigio > 5) {
    throw new Error(`Prestigio inválido en BD: ${fila.prestigio}`);
  }
  return {
    id: fila.id,
    nombre: fila.nombre,
    pais: fila.pais as Club['pais'],
    liga: fila.liga,
    prestigio: fila.prestigio as Prestigio,
    escudoKey: fila.escudo_key,
  };
}