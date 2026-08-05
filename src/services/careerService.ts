import type { NuevoPlayer, Player } from '@/domain/entities/player';
import type { Temporada } from '@/domain/entities/temporada';
import type { Trofeo } from '@/domain/entities/trofeo';
import { statsIniciales } from '@/domain/entities/stats';
import { validarOvr } from '@/domain/value-objects/ovr';
import type { SeasonMode } from '@/shared/types';
import type { PlayerRepository, TemporadaRepository } from '@/domain/interfaces/repositories';

import { playerRepository } from '@/data/repositories/player-repository';
import { temporadaRepository } from '@/data/repositories/temporada-repository';
import { historialRepository } from '@/data/repositories/historial-repository';
import { clubRepository } from '@/data/repositories/club-repository';
import { trofeoRepository } from '@/data/repositories/trofeo-repository';
import { generarFixtureTemporada } from '@/services/calendarService';

/**
 * Caso de uso: iniciar carrera (pantalla 7 → Dashboard).
 * Orquesta tres repositorios en secuencia. Sin transacción atómica
 * (cada repo abre su propia conexión): si falla, se compensa borrando
 * al jugador recién creado (única carrera por instalación).
 */

export interface CarreraIniciada {
  player: Player;
  temporada: Temporada;
}

export interface DatosInicioCarrera {
  player: NuevoPlayer;
  clubId: number;
  modo: SeasonMode;
  /** Año de inicio de la primera temporada (normalmente el actual). */
  anioInicio: number;
}

export async function iniciarCarrera(datos: DatosInicioCarrera): Promise<CarreraIniciada> {
  validarOvr(datos.player.ovr); // invariante de dominio antes de persistir

  const club = await clubRepository.findById(datos.clubId);
  if (!club) throw new Error('Club inexistente: no se puede iniciar carrera');

  // §14: inicializar stats según la posición del jugador.
  const stats = statsIniciales(datos.player.posicion);
  const player = await playerRepository.create({ ...datos.player, stats, clubId: club.id });
  try {
    const temporada = await temporadaRepository.create({
      playerId: player.id,
      anioInicio: datos.anioInicio,
      modo: datos.modo,
      ovrInicio: player.ovr,
    });
    await historialRepository.crearEtapaInicial(player.id, club.id, datos.anioInicio);
    await generarFixtureTemporada(temporada, club);
    return { player, temporada };
  } catch (error) {
    // Compensación: la carrera quedó a medias, se descarta al jugador.
    await playerRepository.deleteAll();
    throw error;
  }
}

/** Estado de la carrera para el Splash: jugador + temporada activa. */
export async function obtenerEstadoCarrera(): Promise<{
  player: Player | null;
  temporada: Temporada | null;
}> {
  const player = await playerRepository.findActivo();
  if (!player) return { player: null, temporada: null };
  const temporada = await temporadaRepository.findActiva(player.id);
  return { player, temporada };
}

/** Dev/Sprint 1: borra todo (jugador, temporadas, historial) — reset total. */
export async function resetCarrera(): Promise<void> {
  await playerRepository.deleteAll();
  // Nota: temporadas/historial huérfanos quedan en BD pero sin jugador activo
  // nunca se consultan; se purgan en la migración de limpieza (Sprint 6).
}

// ---------------------------------------------------------------
// Sprint 7 — resumen de retiro (pantalla 15, flujo estilo Copero)
// ---------------------------------------------------------------

export interface ResumenRetiro {
  player: Player;
  clubes: { nombre: string; prestigio: number; anioInicio: number; anioFin: number | null }[];
  totalPj: number;
  totalGoles: number;
  totalAsistencias: number;
  trofeos: Trofeo[];
  mejorOvr: number;
}

/** Junta historial + trofeos + temporadas para la tarjeta final de carrera. */
export async function obtenerResumenRetiro(playerId: number): Promise<ResumenRetiro> {
  const player = await playerRepository.findById(playerId);
  if (!player) throw new Error('Jugador inexistente');

  const [etapas, trofeos, temporadas] = await Promise.all([
    historialRepository.findByPlayer(playerId),
    trofeoRepository.findByPlayer(playerId),
    temporadaRepository.findAllByPlayer(playerId),
  ]);

  const totalPj = etapas.reduce((acc, e) => acc + e.pj, 0);
  const totalGoles = etapas.reduce((acc, e) => acc + e.goles, 0);
  const totalAsistencias = etapas.reduce((acc, e) => acc + e.asistencias, 0);
  const mejorOvr = Math.max(player.ovr, ...temporadas.map((t) => t.ovrFin ?? player.ovr));

  const clubes = await Promise.all(
    etapas.map(async (e) => {
      const club = await clubRepository.findById(e.clubId);
      return {
        nombre: club?.nombre ?? 'Club',
        prestigio: club?.prestigio ?? 0,
        anioInicio: e.anioInicio,
        anioFin: e.anioFin,
      };
    }),
  );

  return {
    player,
clubes,
    totalPj,
    totalGoles,
    totalAsistencias,
    trofeos,
    mejorOvr,
  };
}

/** Retira al jugador (estado = retirado) y devuelve el resumen final. */
export async function retirarJugador(playerId: number): Promise<ResumenRetiro> {
  await playerRepository.retirar(playerId);
  return obtenerResumenRetiro(playerId);
}

export type { PlayerRepository, TemporadaRepository };
