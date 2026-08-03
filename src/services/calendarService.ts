import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import type { Temporada } from '@/domain/entities/temporada';
import { generarFixture } from '@/domain/rules/fixture';
import { LIGAS_POR_PAIS, type Country } from '@/shared/constants/game';

import { clubRepository } from '@/data/repositories/club-repository';
import { partidoRepository } from '@/data/repositories/partido-repository';

/**
 * Calendario de temporada (Sprint 3).
 * Orquesta: consulta rivales del país → genera fixture (regla pura) → persiste.
 * El club del jugador se pasa explícitamente (lo conoce careerService al crear
 * la carrera); este service NO resuelve el jugador (O/D: no mezcla dominios).
 */

/** Genera e inserta el fixture completo de una temporada. */
export async function generarFixtureTemporada(
  temporada: Temporada,
  club: Club,
  pais: Country,
): Promise<void> {
  // Rivales = otros clubes del mismo país, excluyendo el propio.
  const clubesPais = await clubRepository.findByPais(pais);
  const rivales = clubesPais.filter((c) => c.id !== club.id).map((c) => c.id);

  const fixture = generarFixture({
    clubId: club.id,
    rivalesIds: rivales,
    prestigio: club.prestigio,
    liga: LIGAS_POR_PAIS[pais],
    copa: `Copa ${pais}`,
    anioInicio: temporada.anioInicio,
  });

  await partidoRepository.createMany(
    fixture.map((f) => ({
      temporadaId: temporada.id,
      fechaTs: f.fechaTs,
      rivalClubId: f.rivalClubId,
      competencia: f.competencia,
      local: f.local,
    })),
  );
}

/** Próximos partidos de la temporada activa (no jugados). */
export async function obtenerProximosPartidos(
  temporadaId: number,
  desdeTs = Date.now(),
  limite = 5,
): Promise<Partido[]> {
  return partidoRepository.findProximos(temporadaId, desdeTs, limite);
}

/** Todos los partidos de la temporada (para el calendario). */
export async function obtenerCalendarioTemporada(temporadaId: number): Promise<Partido[]> {
  return partidoRepository.findByTemporada(temporadaId);
}