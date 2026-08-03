import type { Club } from '@/domain/entities/club';
import type { Player } from '@/domain/entities/player';
import type { Temporada } from '@/domain/entities/temporada';
import type { Trofeo, NivelTrofeo } from '@/domain/entities/trofeo';
import {
  decidirTrofeos,
  esConvocado,
  hayOfertaMejorClub,
  trofeoSeleccion,
  type DatosCierre,
} from '@/domain/rules/temporada';
import { checkRetirementConditions, type DecisionRetiro } from '@/domain/rules/retiro';
import type { Country } from '@/shared/constants/game';
import type { SeasonMode } from '@/shared/types';
import { OVR_MAX } from '@/shared/constants/game';

import { playerRepository } from '@/data/repositories/player-repository';
import { temporadaRepository } from '@/data/repositories/temporada-repository';
import { clubRepository } from '@/data/repositories/club-repository';
import { historialRepository } from '@/data/repositories/historial-repository';
import { trofeoRepository } from '@/data/repositories/trofeo-repository';
import { eventoLogRepository } from '@/data/repositories/evento-log-repository';
import { generarFixtureTemporada, obtenerProximosPartidos } from '@/services/calendarService';
import { jugarPartido } from '@/services/partidoService';
import { elegirEvento, type EventoNarrativo } from '@/domain/rules/eventos';
import type { Partido } from '@/domain/entities/partido';

/**
 * Caso de uso: cierre de temporada (§4.5 del plan).
 * Resumen → trofeos → convocatoria → oferta de mejor club → apertura de la
 * nueva temporada (modo normal avanza 1 año, rápido avanza 2).
 */

export interface ResultadoCierreTemporada {
  temporadaCerrada: Temporada;
  nuevaTemporada: Temporada;
  player: Player;
  clubActual: Club;
  clubNuevo: Club | null;
  trofeos: Trofeo[];
  convocadoSeleccion: boolean;
  ofertaRecibida: boolean;
  /** Decisión narrativa de fin de temporada (flujo Copero) o null. */
  decision: EventoNarrativo | null;
  /** Condiciones de retiro evaluadas (§4.6): si seRetira, la carrera termina. */
  retiro: DecisionRetiro;
}

/** Edad base al cerrar (16 + años transcurridos). */
function calcularEdadNueva(player: Player, temporada: Temporada, modo: SeasonMode): number {
  return player.edad + (modo === 'rapido' ? 2 : 1);
}

/** OVR se ajusta con la edad: pico 27-34, declive después (regla §4.3). */
function ajustarOvrPorEdad(ovr: number, edadNueva: number, temporada: Temporada): number {
  let delta = 0;
  if (edadNueva <= 25) delta += 1; // en crecimiento
  else if (edadNueva >= 27 && edadNueva <= 34) delta += 0; // pico
  else if (edadNueva > 34) delta -= 1; // declive
  // Si el jugador no jugó casi nada, no sube por edad.
  if (temporada.pj < 5) delta = Math.min(delta, 0);
  return Math.min(OVR_MAX, Math.max(50, ovr + delta));
}

/**
 * Ejecuta el cierre completo. Se llama cuando no quedan partidos por jugar.
 * Ordena: decide trofeos → convocatoria → oferta → suma stats al historial →
 * cierra temporada → abre la siguiente → genera nuevo fixture → (opcional)
 * cambia de club si acepta la oferta.
 */
export async function cerrarTemporada(
  player: Player,
  temporada: Temporada,
  clubActual: Club,
  pais: Country,
): Promise<ResultadoCierreTemporada> {
  const datosCierre: DatosCierre = {
    ovr: player.ovr,
    edad: player.edad,
    pj: temporada.pj,
    goles: temporada.goles,
    asistencias: temporada.asistencias,
    prestigioClub: clubActual.prestigio,
  };

  // 1) Trofeos de club + individuales.
  const trofeosGanados = decidirTrofeos(datosCierre).map(async (t) =>
    trofeoRepository.crear({
      playerId: player.id,
      nombre: t.nombre,
      competencia: t.competencia,
      anio: temporada.anioInicio,
      nivel: t.nivel as NivelTrofeo,
    }),
  );

  // 2) Convocatoria a selección nacional.
  const convocado = esConvocado(datosCierre);
  if (convocado) {
    const sel = trofeoSeleccion(datosCierre);
    if (sel) {
      trofeosGanados.push(
        trofeoRepository.crear({
          playerId: player.id,
          nombre: sel.nombre,
          competencia: sel.competencia,
          anio: temporada.anioInicio,
          nivel: sel.nivel as NivelTrofeo,
        }),
      );
    }
    await eventoLogRepository.crear({
      playerId: player.id,
      tipo: 'decision',
      descripcion: `Convocado a la selección de ${pais} tras la temporada ${temporada.anioInicio}`,
      impactoJson: null,
    });
  }

  // 3) Oferta de mejor club (solo si el jugador rindió bien).
  const oferta = hayOfertaMejorClub(datosCierre);
  let clubNuevo: Club | null = null;
  if (oferta) {
    const mejores = (await clubRepository.findByPais(pais)).filter(
      (c) => c.prestigio > clubActual.prestigio,
    );
    if (mejores.length > 0) {
      // El club con mayor prestigio entre las ofertas.
      clubNuevo = mejores.sort((a, b) => b.prestigio - a.prestigio)[0];
    }
  }

  // 4) Sumar stats de la temporada al historial de carrera.
  await historialRepository.sumarStats(
    player.id,
    clubActual.id,
    temporada.pj,
    temporada.goles,
    temporada.asistencias,
  );

  // 5) Cerrar temporada y abrir la siguiente.
  const ovrFin = ajustarOvrPorEdad(player.ovr, player.edad + (temporada.modo === 'rapido' ? 2 : 1), temporada);
  await temporadaRepository.cerrar(temporada.id, ovrFin);

  // Edad nueva y posible cambio de club.
  const edadNueva = calcularEdadNueva(player, temporada, temporada.modo);
  const clubFinal = clubNuevo ?? clubActual;

  // Si cambia de club: cierra etapa anterior y abre la nueva.
  if (clubNuevo && clubNuevo.id !== clubActual.id) {
    await historialRepository.cerrarEtapa(player.id, clubActual.id, temporada.anioInicio);
    await historialRepository.abrirEtapa(
      player.id,
      clubNuevo.id,
      temporada.anioInicio + (temporada.modo === 'rapido' ? 2 : 1),
    );
    await playerRepository.setClub(player.id, clubNuevo.id);
  }

  // Actualizar jugador: edad, OVR ajustado y temporada actual.
  await playerRepository.updateOvr(player.id, ovrFin);
  await playerRepository.setClub(player.id, clubFinal.id);
  await playerRepository.setTemporadaActual(player.id, player.temporadaActual + 1);

  const playerActualizado: Player = {
    ...player,
    edad: edadNueva,
    ovr: ovrFin,
    clubId: clubFinal.id,
    temporadaActual: player.temporadaActual + 1,
  };

  const nuevaTemporada = await temporadaRepository.create({
    playerId: player.id,
    anioInicio: temporada.anioInicio + (temporada.modo === 'rapido' ? 2 : 1),
    modo: temporada.modo,
    ovrInicio: ovrFin,
  });

  await generarFixtureTemporada(nuevaTemporada, clubFinal);

  // Evaluar retiro con la edad nueva y la oferta del cierre (§4.6).
  const retiro = checkRetirementConditions({
    edad: edadNueva,
    ovr: ovrFin,
    temporadasCompletadas: player.temporadaActual,
    tieneOferta: oferta && clubNuevo != null,
  });

  // 1 decisión narrativa por temporada (si el motor la decide).
  const decision =
    Math.random() < 0.8
      ? elegirEvento({
          ovr: ovrFin,
          posicion: player.posicion,
          edad: edadNueva,
          temporada: temporada.anioInicio,
        })
      : null;

  return {
    temporadaCerrada: temporada,
    nuevaTemporada,
    player: playerActualizado,
    clubActual,
    clubNuevo,
    trofeos: await Promise.all(trofeosGanados),
    convocadoSeleccion: convocado,
    ofertaRecibida: oferta && clubNuevo != null,
    decision,
    retiro,
  };
}

export interface ResumenTemporadaSimulada {
  partidosJugados: number;
  partidos: Partido[];
  /** Stats finales de la temporada (suma de todo el fixture). */
  goles: number;
  asistencias: number;
  victorias: number;
  derrotas: number;
}

/**
 * Simula TODA la temporada de un toque (estilo Copero): juega cada partido
 * del fixture pendiente con el motor puro y persiste resultados/stats.
 * Devuelve el resumen para que la UI muestre qué pasó.
 */
export async function simularTemporadaCompleta(
  player: Player,
  temporada: Temporada,
  club: Club,
): Promise<ResumenTemporadaSimulada> {
  const pendientes = await obtenerProximosPartidos(temporada.id, 0, 100);

  let goles = 0;
  let asistencias = 0;
  let victorias = 0;
  let derrotas = 0;
  let ovrActual = player.ovr;
  const jugados: Partido[] = [];

  for (const partido of pendientes) {
    const rival = await clubRepository.findById(partido.rivalClubId);
    if (!rival) continue;
    // Simular UNA temporada completa: sin eventos por partido (se resuelven
    // en el cierre, una vez por temporada — flujo tipo Copero).
    const playerActual = { ...player, ovr: ovrActual };
    const resultado = await jugarPartido(playerActual, temporada, partido, rival, {
      conEvento: false,
      consumirEnergia: false,
    });

    if (resultado.simulacion.victoria) victorias += 1;
    if (resultado.simulacion.derrota) derrotas += 1;
    goles += resultado.simulacion.golesJugador;
    asistencias += resultado.simulacion.asistenciasJugador;
    jugados.push(resultado.partidoActualizado);
    // La temporada acumula de a un partido en BD; el OVR se ajusta en cierre.
    ovrActual = playerActual.ovr;
  }

  return { partidosJugados: jugados.length, goles, asistencias, victorias, derrotas, partidos: jugados };
}

export type { Player, Temporada, Trofeo, NivelTrofeo };