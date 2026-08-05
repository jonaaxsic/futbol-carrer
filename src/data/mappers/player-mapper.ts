import type { EstadoJugador, Pierna, Player } from '@/domain/entities/player';
import type { PlayerStats } from '@/domain/entities/stats';
import { esPosicion, type Posicion } from '@/domain/value-objects/posicion';
import type { Country } from '@/shared/constants/game';

/** Fila cruda de la tabla `player` (snake_case como viene de SQLite). */
export interface PlayerRow {
  id: number;
  nombre: string;
  apellido: string | null;
  numero: number;
  pais: string;
  posicion: string;
  pierna: string;
  edad: number;
  ovr: number;
  stats: string | null;
  club_id: number | null;
  estado: string;
  temporada_actual: number;
  energia: number;
  energia_max: number;
  /** null solo en filas anteriores a la migración 002 (≈ al crear). */
  energia_actualizada_ts: number | null;
  created_at_ts: number;
}

function esPierna(valor: string): valor is Pierna {
  return valor === 'izquierda' || valor === 'derecha';
}

function esEstado(valor: string): valor is EstadoJugador {
  return valor === 'activo' || valor === 'retirado';
}

/** Mapper: fila SQLite → entidad de dominio (con validación de tipos). */
export function filaToPlayer(fila: PlayerRow): Player {
  if (!esPosicion(fila.posicion)) {
    throw new Error(`Posición inválida en BD: ${fila.posicion}`);
  }
  if (!esPierna(fila.pierna)) {
    throw new Error(`Pierna inválida en BD: ${fila.pierna}`);
  }
  if (!esEstado(fila.estado)) {
    throw new Error(`Estado inválido en BD: ${fila.estado}`);
  }

  // Parsear stats JSON (fallback: stats vacías para filas antiguas).
  let stats: PlayerStats = {};
  if (fila.stats) {
    try {
      stats = JSON.parse(fila.stats) as PlayerStats;
    } catch {
      stats = {};
    }
  }

  return {
    id: fila.id,
    nombre: fila.nombre,
    apellido: fila.apellido,
    numero: fila.numero,
    pais: fila.pais as Country,
    posicion: fila.posicion as Posicion,
    pierna: fila.pierna,
    edad: fila.edad,
    ovr: fila.ovr,
    stats,
    clubId: fila.club_id,
    estado: fila.estado,
    temporadaActual: fila.temporada_actual,
    energia: fila.energia,
    energiaMax: fila.energia_max,
    // Fallback para filas previas a la migración 002: arrancan "llenas".
    energiaActualizadaTs: fila.energia_actualizada_ts ?? fila.created_at_ts,
    createdAtTs: fila.created_at_ts,
  };
}