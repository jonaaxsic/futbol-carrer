import type { Country } from '@/shared/constants/game';

import type { Posicion } from '../value-objects/posicion';
import type { PlayerStats } from './stats';

export type Pierna = 'izquierda' | 'derecha';
export type EstadoJugador = 'activo' | 'retirado';

/** Entidad Player — el protagonista de la carrera (tabla `player`). */
export interface Player {
  id: number;
  /** Apodo / nombre mostrado en la camiseta (pantalla 5). */
  nombre: string;
  apellido: string | null;
  numero: number;
  pais: Country;
  posicion: Posicion;
  pierna: Pierna;
  edad: number;
  ovr: number;
  /** Stats específicas del jugador (§14). */
  stats: PlayerStats;
  /** Club actual (null cuando no hay carrera activa). */
  clubId: number | null;
  estado: EstadoJugador;
  temporadaActual: number;
  /** Barras de energía disponibles (almacenadas al último gasto). */
  energia: number;
  /** Máximo de barras (10 por defecto). */
  energiaMax: number;
  /** Epoch ms del último gasto/actualización — base de la regeneración. */
  energiaActualizadaTs: number;
  /** Epoch ms de creación. */
  createdAtTs: number;
}

/** Datos mínimos para crear un jugador (onboarding pantallas 4-7). */
export interface NuevoPlayer {
  nombre: string;
  apellido?: string;
  numero: number;
  pais: Country;
  posicion: Posicion;
  pierna: Pierna;
  edad: number;
  ovr: number;
  stats?: PlayerStats;
  clubId?: number | null;
}