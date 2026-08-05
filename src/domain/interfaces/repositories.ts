import type { Club } from '../entities/club';
import type { Entrenamiento } from '../entities/entrenamiento';
import type { EventoLog } from '../entities/evento-log';
import type { HistorialEtapa } from '../entities/historial-carrera';
import type { NuevoPlayer, Player } from '../entities/player';
import type { NuevoPartido, Partido } from '../entities/partido';
import type { NuevaTemporada, Temporada } from '../entities/temporada';
import type { NivelTrofeo, Trofeo } from '../entities/trofeo';

/**
 * Contratos de persistencia (principio O/D del plan §1):
 * `services` depende de ESTAS interfaces, nunca de expo-sqlite.
 * Si mañana SQLite cambia por otra cosa, solo se toca `data/`.
 * Repositorios pequeños y específicos (principio I).
 */

export interface PlayerRepository {
  create(data: NuevoPlayer): Promise<Player>;
  findById(id: number): Promise<Player | null>;
  /** Jugador con carrera activa (uno solo por instalación). */
  findActivo(): Promise<Player | null>;
  updateOvr(id: number, ovr: number): Promise<void>;
  setClub(id: number, clubId: number | null): Promise<void>;
  /** Cambia la posición del jugador (solo vía flujo de cambio de club, D6). */
  setPosicion(id: number, posicion: string): Promise<void>;
  /** Avanza el contador de temporada del jugador (Sprint 6). */
  setTemporadaActual(id: number, temporada: number): Promise<void>;
  /** Marca estado = 'retirado' (Sprint 7). */
  retirar(id: number): Promise<void>;
  /** Persiste energía tras un gasto (sistema de energía, §4.2). */
  setEnergia(id: number, energia: number, energiaActualizadaTs: number): Promise<void>;
  /** Dev: borra todos los jugadores (reset de carrera). */
  deleteAll(): Promise<void>;
}

export interface ClubRepository {
  findAll(): Promise<Club[]>;
  findById(id: number): Promise<Club | null>;
  /** Ofertas de inicio: clubes del país del jugador (Sprint 2). */
  findByPais(pais: string): Promise<Club[]>;
  /** Clubes de una división del país (rivales reales de liga, §4.1). */
  findByPaisYLiga(pais: string, liga: string): Promise<Club[]>;
}

export interface TemporadaRepository {
  create(data: NuevaTemporada): Promise<Temporada>;
  findActiva(playerId: number): Promise<Temporada | null>;
  /** Todas las temporadas del jugador (resumen de carrera, Sprint 7). */
  findAllByPlayer(playerId: number): Promise<Temporada[]>;
  /** Acumula stats de un partido jugado (Sprint 5). */
  sumarStats(id: number, pj: number, goles: number, asistencias: number): Promise<void>;
  /** Marca la temporada actual como cerrada (Sprint 6). */
  cerrar(id: number, ovrFin: number): Promise<void>;
}

export interface HistorialRepository {
  /** Crea la primera etapa de carrera (club inicial, Sprint 2). */
  crearEtapaInicial(playerId: number, clubId: number, anioInicio: number): Promise<void>;
  /** Suma stats de la temporada a la etapa vigente (Sprint 6). */
  sumarStats(
    playerId: number,
    clubId: number,
    pj: number,
    goles: number,
    asistencias: number,
  ): Promise<void>;
  /** Cierra la etapa del club actual (anio_fin) al cambiar de club/retirarse. */
  cerrarEtapa(playerId: number, clubId: number, anioFin: number): Promise<void>;
  /** Abre una etapa nueva tras cambiar de club. */
  abrirEtapa(
    playerId: number,
    clubId: number,
    anioInicio: number,
    pj?: number,
    goles?: number,
    asistencias?: number,
  ): Promise<void>;
  /** Etapas de la carrera ordenadas por año (pantalla 8, Sprint 3). */
  findByPlayer(playerId: number): Promise<HistorialEtapa[]>;
}

export interface PartidoRepository {
  /** Inserta el fixture completo de la temporada (Sprint 3). */
  createMany(partidos: NuevoPartido[]): Promise<void>;
  /** Todos los partidos de una temporada, ordenados por fecha. */
  findByTemporada(temporadaId: number): Promise<Partido[]>;
  /** Próximos partidos NO jugados, desde una fecha dada. */
  findProximos(temporadaId: number, desdeTs: number, limite?: number): Promise<Partido[]>;
  /** Marca el partido como jugado con su resultado y eventos (Sprint 5). */
  marcarJugado(
    id: number,
    resultado: string,
    goles: number,
    asistencias: number,
    eventosJson: string | null,
  ): Promise<void>;
  /** Persiste la timeline del replay (design D1: se guarda al INICIAR el partido). */
  guardarTimeline(id: number, eventosJson: string): Promise<void>;
  /** Guarda la fase del checkpoint para reanudación (PR2). */
  guardarCheckpoint(id: number, fase: 'primer_tiempo' | 'entretiempo_o_segundo'): Promise<void>;
  /** Limpia el checkpoint al finalizar el partido (PR2). */
  limpiarCheckpoint(id: number): Promise<void>;
  /** Encuentra el partido en curso (con timeline persistida y no jugado) (PR2). */
  findPartidoEnCurso(temporadaId: number): Promise<Partido | null>;
  /** Encuentra partidos abandonados con checkpoint para auto-resolver 3-0 (PR2). */
  findVencidosConCheckpoint(temporadaId: number, ahoraTs: number): Promise<Partido[]>;
  /** Marca suspendido un partido que el jugador se pierde (lesión/roja). */
  marcarSuspendido(id: number, motivo: string): Promise<void>;
  /** Omite definitivamente un partido suspendido (no suma stats). */
  omitir(id: number): Promise<void>;
}

export interface EntrenamientoRepository {
  /** Crea una sesión de entrenamiento (Sprint 4). */
  create(data: {
    playerId: number;
    tipo: Entrenamiento['tipo'];
    inicioTs: number;
    duracionHoras: number;
    finEstimadaTs: number;
  }): Promise<Entrenamiento>;
  /** Entrenamiento en curso (no completado) del jugador, si existe. */
  findPendiente(playerId: number): Promise<Entrenamiento | null>;
  /** Marca como completado aplicando el delta de OVR. */
  completar(id: number, ovrDelta: number, completado: boolean): Promise<void>;
}

export interface EventoLogRepository {
  /** Registra un evento narrativo (Sprint 5). */
  crear(data: {
    playerId: number;
    tipo: EventoLog['tipo'];
    descripcion: string;
    impactoJson: string | null;
  }): Promise<EventoLog>;
  /** Historial de eventos recientes (pantalla de eventos). */
  findRecientes(playerId: number, limite?: number): Promise<EventoLog[]>;
}

export interface TrofeoRepository {
  /** Registra un trofeo ganado (Sprint 6). */
  crear(data: {
    playerId: number;
    nombre: string;
    competencia: string;
    anio: number;
    nivel: NivelTrofeo;
  }): Promise<Trofeo>;
  /** Trofeos del jugador, ordenados por año desc. */
  findByPlayer(playerId: number): Promise<Trofeo[]>;
}