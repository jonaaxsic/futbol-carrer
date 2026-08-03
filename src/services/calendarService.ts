import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import type { Temporada } from '@/domain/entities/temporada';
import { generarFixture } from '@/domain/rules/fixture';

import { clubRepository } from '@/data/repositories/club-repository';
import { partidoRepository } from '@/data/repositories/partido-repository';

/**
 * Calendario de temporada.
 * Orquesta: consulta los clubes de la MISMA división → genera fixture
 * (regla pura, anclado a HOY) → persiste. El club del jugador se pasa
 * explícitamente (lo conoce careerService al crear la carrera).
 */

/** Genera e inserta el fixture completo de una temporada. */
export async function generarFixtureTemporada(
  temporada: Temporada,
  club: Club,
): Promise<void> {
  // Rivales = clubes de la misma división que el club del jugador.
  const clubesDivision = await clubRepository.findByPaisYLiga(club.pais, club.liga);
  const rivales = clubesDivision.filter((c) => c.id !== club.id).map((c) => c.id);

  const fixture = generarFixture({
    clubId: club.id,
    rivalesIds: rivales,
    prestigio: club.prestigio,
    liga: club.liga,
    copa: `Copa ${club.pais}`,
    inicioTs: Date.now(),
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

/** Partido suspendido (lesión/expulsión): se omite sin sumar stats. */
export async function omitirPartido(partidoId: number): Promise<void> {
  await partidoRepository.omitir(partidoId);
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