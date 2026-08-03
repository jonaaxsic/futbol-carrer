import type { Country } from '@/shared/constants/game';

import type { Posicion } from '../value-objects/posicion';

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
  /** Club actual (null cuando no hay carrera activa). */
  clubId: number | null;
  estado: EstadoJugador;
  temporadaActual: number;
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
  clubId?: number | null;
}