import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import type {
  ResultadoSimulacion,
  SituacionPartido,
  EventoTimeline,
} from '@/domain/rules/partido';
import { resultadoDesdeLineaTiempo } from '@/domain/rules/partido';
import { clubRepository } from '@/data/repositories/club-repository';
import { partidoRepository } from '@/data/repositories/partido-repository';
import {
  obtenerProximosPartidos,
  omitirPartido,
  obtenerCalendarioTemporada,
  resolverPendientesVencidos,
} from '@/services/calendarService';
import { proponerCierre, finalizarCierre } from '@/services/seasonService';
import { iniciarPartido, reanudarPartido } from '@/services/partidoService';
import {
  energiaActual,
  proximaBarraEn,
  ENERGIA_PARTIDO,
} from '@/services/energiaService';
import { formatearFechaCorta } from '@/shared/utils/fechas';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useCierreStore } from '@/state/useCierreStore';
import { usePartidoEnCursoStore } from '@/state/usePartidoEnCursoStore';
import { usePartidoVistaStore } from '@/state/usePartidoVistaStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton, SecondaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { MatchAlertBanner } from '@/presentation/components/molecules/match-alert-banner';
import { PausedMatchBanner } from '@/presentation/components/organisms/paused-match-banner';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 8. HOME / DASHBOARD — partido por partido con energía.
 * Regla §4.2: jugar cuesta ENERGIA_PARTIDO barras; se regenera 1 barra/2h
 * por reloj real (timestamp). El botón de jugar se bloquea sin energía; los
 * partidos suspendidos (lesión/expulsión) se omiten sin sumar stats.
 */
export default function DashboardScreen() {
  const player = usePlayerStore((s) => s.player);
  const temporadaActiva = usePlayerStore((s) => s.temporadaActiva);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);
  const fijarCierre = useCierreStore((s) => s.fijar);
  const fijarPropuesta = useCierreStore((s) => s.fijarPropuesta);
  const fijarSesion = usePartidoEnCursoStore((s) => s.fijar);
  const bannerOculto = usePartidoVistaStore((s) => s.bannerOculto);
  const ocultarBanner = usePartidoVistaStore((s) => s.ocultarBanner);

  const [club, setClub] = useState<Club | null>(null);
  const [pendientes, setPendientes] = useState<Partido[]>([]);
  const [rivales, setRivales] = useState<Record<number, Club>>({});
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<
    { partido: Partido; simulacion: ResultadoSimulacion; rivalNombre: string }[]
  >([]);
  // PR2: partido pausado (con checkpoint) → banner de reanudación.
  const [enCurso, setEnCurso] = useState<{ partido: Partido; clubRival: Club } | null>(null);
  // Tick para re-renderizar la energía (regen por tiempo) sin timers de juego.
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = useCallback(async () => {
    if (!player || !temporadaActiva) return;
    try {
      // PR2: reconcilia partidos abandonados (3-0) ANTES de leer el fixture.
      await resolverPendientesVencidos(temporadaActiva.id);
      const [clubData, partidos, calendario] = await Promise.all([
        player.clubId ? clubRepository.findById(player.clubId) : Promise.resolve(null),
        obtenerProximosPartidos(temporadaActiva.id, 0, 100),
        obtenerCalendarioTemporada(temporadaActiva.id),
      ]);
      setClub(clubData);
      setPendientes(partidos);
      const mapa: Record<number, Club> = {};
      await Promise.all(
        partidos.map(async (p) => {
          if (mapa[p.rivalClubId]) return;
          const c = await clubRepository.findById(p.rivalClubId);
          if (c) mapa[p.rivalClubId] = c;
        }),
      );
      setRivales(mapa);

      // PR2: partido pausado → banner de reanudación en lugar del CTA Jugar.
      const enCursoPartido = await partidoRepository.findPartidoEnCurso(temporadaActiva.id);
      if (enCursoPartido) {
        const rivalEnCurso = await clubRepository.findById(enCursoPartido.rivalClubId);
        setEnCurso(rivalEnCurso ? { partido: enCursoPartido, clubRival: rivalEnCurso } : null);
      } else {
        setEnCurso(null);
      }

      // Último partido jugado → tarjeta de resultado (al volver del /match).
      const jugados = calendario
        .filter((p) => p.jugo && p.eventosJson)
        .sort((a, b) => b.fechaTs - a.fechaTs);
      const ultimo = jugados[0];
      if (ultimo) {
        const linea = lineaDesdeEventosJson(ultimo.eventosJson);
        if (linea.length > 0) {
          const c = await clubRepository.findById(ultimo.rivalClubId);
          setResultados([
            {
              partido: ultimo,
              simulacion: resultadoDesdeLineaTiempo(linea),
              rivalNombre: c?.nombre ?? '—',
            },
          ]);
        }
      } else {
        setResultados([]);
      }
    } finally {
      setCargando(false);
    }
  }, [player, temporadaActiva]);

  // Carga inicial + recarga al volver del /match (spec R5: dashboard siempre).
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const energia = player ? energiaActual(player) : 0;
  const primerPartido = pendientes[0];

  if (!player || !temporadaActiva) {
    return (
      <ScreenContainer>
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay una carrera activa. Volvé al menú y creá una.
          </AppText>
          <PrimaryButton label="Ir al menú" onPress={() => router.replace('/menu')} />
        </View>
      </ScreenContainer>
    );
  }

  async function jugar(p: Partido) {
    if (!player || !temporadaActiva || !club || ocupado) return;
    const rival = rivales[p.rivalClubId];
    if (!rival) return;
    setOcupado(true);
    setError(null);
    try {
      // PR3: inicia (energía + timeline persistida) y abre el replayer /match.
      const sesion = await iniciarPartido(player, temporadaActiva, p, rival, {
        consumirEnergia: true,
      });
      fijarSesion(sesion);
      router.push('/match');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el partido');
    } finally {
      setOcupado(false);
    }
  }

  async function reanudar() {
    if (!player || !temporadaActiva || !enCurso || ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      // PR2: reconstruye la sesión desde la timeline persistida; NO recarga energía.
      const sesion = await reanudarPartido(
        player,
        temporadaActiva,
        enCurso.partido,
        enCurso.clubRival,
        enCurso.partido.checkpointFase,
      );
      fijarSesion(sesion);
      router.push('/match');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reanudar el partido');
    } finally {
      setOcupado(false);
    }
  }

  async function omitir(p: Partido) {
    if (ocupado) return;
    setOcupado(true);
    try {
      await omitirPartido(p.id);
      await cargar();
    } finally {
      setOcupado(false);
    }
  }

  async function cerrar() {
    if (!player || !temporadaActiva || !club || ocupado) return;
    // Live Stats R5: temporadaActiva ya está fresca en el store tras continuar();
    // ya no hace falta el re-read manual de BD (Bug C workaround).
    // Mantenemos la validación pj === 0 usando el store directamente.
    if (temporadaActiva.pj === 0) {
      setError('Aún no jugaste ningún partido. Jugá antes de cerrar la temporada.');
      return;
    }
    setOcupado(true);
    try {
      // D6: primero se propone (solo calcula, no persiste); la decisión de
      // club es del usuario. Sin oferta → se finaliza directo (flujo previo).
      const propuesta = await proponerCierre(player, temporadaActiva, club, player.pais);
      if (propuesta.candidatos.length === 0) {
        const cierre = await finalizarCierre(propuesta, { tipo: 'quedarse' });
        fijarCierre(cierre);
        setPlayer(cierre.player);
        setTemporadaActiva(cierre.nuevaTemporada);
        setResultados([]);
        router.push('/season-summary');
      } else {
        // Hay oferta: el usuario elige en /club-oferta (spec club-transfer R1).
        fijarPropuesta(propuesta);
        router.push('/club-oferta');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la temporada');
    } finally {
      setOcupado(false);
    }
  }

  const puedeJugarAhora = energia >= ENERGIA_PARTIDO;
  const proxima = proximaBarraEn(player);

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.content}>
        {cargando && <ActivityIndicator color={colors.textPrimary} style={styles.carga} />}

        {/* Identidad */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.onAccent} />
          </View>
          <View style={styles.identityInfo}>
            <AppText variant="heading">{player.nombre}</AppText>
            <AppText variant="caption">
              {player.edad} años · {player.pais} · {player.posicion}
            </AppText>
          </View>
          <View style={styles.ovrBadge}>
            <AppText variant="caption" color="onAccent">OVR</AppText>
            <AppText variant="heading" color="onAccent">{player.ovr}</AppText>
          </View>
        </View>

        {/* Club */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield" size={18} color={colors.textSecondary} />
            <AppText variant="label" uppercase color="textSecondary">Club</AppText>
          </View>
          <AppText variant="body">{club?.nombre ?? '—'}</AppText>
          <AppText variant="caption" color="textMuted">
            Temporada {temporadaActiva.anioInicio} · {club?.liga ?? ''} ·{' '}
            {temporadaActiva.modo === 'rapido' ? 'rápido' : 'normal'}
          </AppText>
        </View>

        {/* Energía (§4.2) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={18} color={colors.warning} />
            <AppText variant="label" uppercase color="textSecondary">Energía</AppText>
          </View>
          <View style={styles.barras}>
            {Array.from({ length: player.energiaMax }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.barra,
                  i < Math.floor(energia) && styles.barraLlena,
                  i < Math.floor(energia) && energia < ENERGIA_PARTIDO && styles.barraBaja,
                ]}
              />
            ))}
          </View>
          <AppText variant="caption" color="textSecondary">
            {Math.floor(energia)} / {player.energiaMax} · jugar cuesta {ENERGIA_PARTIDO}
            {proxima != null
              ? ` · próxima barra en ~${formatearCorto(proxima)}`
              : ' · energía al máximo'}
          </AppText>
          {!puedeJugarAhora && (
            <AppText variant="caption" color="danger">
              Energía insuficiente para jugar (se regenera cada 2 h).
            </AppText>
          )}
        </View>

        {error && (
          <AppText variant="caption" color="danger">{error}</AppText>
        )}

        {/* Banner de partido pausado (spec paused-match R3/R4): reemplaza el CTA Jugar */}
        {enCurso != null && (
          <PausedMatchBanner
            partido={enCurso.partido}
            clubRival={enCurso.clubRival}
            fase={enCurso.partido.checkpointFase}
            onReanudar={reanudar}
          />
        )}

        {/* Banner de match-day: partido jugable, sin auto-dismiss (spec R6) */}
        {enCurso == null &&
          primerPartido != null &&
          !primerPartido.suspendido &&
          puedeJugarAhora &&
          !bannerOculto && (
            <MatchAlertBanner
              onJugar={() => jugar(primerPartido)}
              onOcultar={ocultarBanner}
            />
          )}

        {/* Próximos partidos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={18} color={colors.textSecondary} />
            <AppText variant="label" uppercase color="textSecondary">
              Próximos partidos
            </AppText>
          </View>
          {pendientes.length === 0 ? (
            <AppText variant="body" color="textSecondary">
              Temporada jugada al 100%. Cerrá la temporada para conocer tu destino.
            </AppText>
          ) : (
            pendientes.slice(0, 6).map((p) => {
              const rival = rivales[p.rivalClubId];
              const esPrimero = p.id === primerPartido.id;
              return (
                <View key={p.id} style={styles.partidoRow}>
                  <View style={styles.partidoInfo}>
                    <AppText variant="body" color={esPrimero ? 'textPrimary' : 'textMuted'}>
                      {rival?.nombre ?? '—'}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {formatearFechaCorta(p.fechaTs)} · {p.competencia} ·{' '}
                      {p.local ? 'Local' : 'Visitante'}
                    </AppText>
                  </View>
                  <View style={styles.partidoAccion}>
                    {!esPrimero ? (
                      <AppText variant="caption" color="textMuted">Espera</AppText>
                    ) : p.suspendido ? (
                      <Pressable
                        onPress={() => omitir(p)}
                        disabled={ocupado}
                        style={({ pressed }) => [
                          styles.chipAccion,
                          pressed && styles.pressed,
                        ]}>
                        <AppText variant="caption" color="onAccent">Omitir</AppText>
                      </Pressable>
                    ) : enCurso != null ? (
                      // PR2: hay partido pausado → el fixture no se juega desde acá.
                      <View style={[styles.chipAccion, styles.chipBloqueado]}>
                        <AppText variant="caption" color="textMuted">En pausa</AppText>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => jugar(p)}
                        disabled={ocupado || !puedeJugarAhora}
                        style={({ pressed }) => [
                          styles.chipAccion,
                          !puedeJugarAhora && styles.chipBloqueado,
                          pressed && styles.pressed,
                        ]}>
                        <AppText
                          variant="caption"
                          color={puedeJugarAhora ? 'onAccent' : 'textMuted'}>
                          Jugar
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Último resultado con situaciones */}
        {resultados.length > 0 && (
          <View style={styles.card}>
            <AppText variant="label" uppercase color="textSecondary">
              Último partido
            </AppText>
{resultados.map((r) => (
              <ResumenPartido key={r.partido.id} resultado={r} />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <SecondaryButton label="Entrenar" onPress={() => router.push('/training')} />
          {pendientes.length === 0 ? (
            <PrimaryButton label="Cerrar temporada" onPress={cerrar} disabled={ocupado} />
          ) : (
            <AppText variant="caption" color="textMuted" style={styles.hint}>
              Jugá partido por partido; la energía se regenera con el tiempo.
            </AppText>
          )}
        </View>
    </ScreenContainer>
  );
}

const ICONO_SITUACION: Record<SituacionPartido['tipo'], keyof typeof Ionicons.glyphMap> = {
  penal: 'football',
  expulsion: 'close-circle',
  'tiro-libre': 'refresh',
  lesion: 'bandage',
  'oportunidad-clara': 'telescope',
};

const ETIQUETA_SITUACION: Record<SituacionPartido['tipo'], string> = {
  penal: 'Penal',
  expulsion: 'Expulsión',
  'tiro-libre': 'Tiro libre',
  lesion: 'Lesión',
  'oportunidad-clara': 'Ocasión clara',
};

function ResumenPartido({
  resultado,
}: {
  resultado: { partido: Partido; simulacion: ResultadoSimulacion; rivalNombre: string };
}) {
  const { partido, simulacion, rivalNombre } = resultado;
  return (
    <View style={styles.resultado}>
      <AppText variant="heading">
        {rivalNombre} {partido.resultado}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {simulacion.golesJugador} goles · {simulacion.asistenciasJugador} asist.
        {simulacion.amarilla ? ' · amarilla' : ''}
        {simulacion.roja ? ' · roja' : ''}
        {simulacion.lesion ? ' · lesion' : ''}
      </AppText>
      {simulacion.situaciones.map((sit, i) => (
        <View key={i} style={styles.situacion}>
          <Ionicons
            name={ICONO_SITUACION[sit.tipo]}
            size={14}
            color={colors.textSecondary}
          />
          <AppText variant="caption" style={styles.situacionTexto}>
            {sit.minuto}{"'"}&nbsp;· {sit.descripcion}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function formatearCorto(ms: number): string {
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

/** Recupera la timeline desde eventos_json persistido ({ lineaTiempo }). */
function lineaDesdeEventosJson(json: string | null): EventoTimeline[] {
  try {
    const data = json ? (JSON.parse(json) as { lineaTiempo?: EventoTimeline[] }) : undefined;
    return data?.lineaTiempo ?? [];
  } catch {
    return [];
  }
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  carga: { marginTop: spacing.lg },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1 },
  ovrBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barras: {
    flexDirection: 'row',
    gap: 4,
  },
  barra: {
    flex: 1,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  barraLlena: {
    backgroundColor: colors.success,
  },
  barraBaja: {
    backgroundColor: colors.warning,
  },
  partidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  partidoInfo: { flex: 1, gap: 2 },
  partidoAccion: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  chipAccion: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipBloqueado: {
    backgroundColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  resultado: { gap: spacing.xs, paddingVertical: spacing.sm },
  situacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  situacionTexto: { flex: 1 },
  actions: { marginTop: 'auto', gap: spacing.md },
  hint: { textAlign: 'center' },
});