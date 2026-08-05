import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  resultadoDesdeLineaTiempo,
  resolverInaccion,
  resolverPenalConEleccion,
  resolverTiroLibreConEleccion,
  type EventoTimeline,
  type ResultadoSituacion,
  type TipoEvento,
  type ZonaDisparo,
} from '@/domain/rules/partido';
import {
  DURACION_1T,
  DURACION_2T,
  DURACION_TOTAL_MS,
  PENAL_TIMEOUT_MS,
  minutoAOffsetMs,
} from '@/shared/constants/partido';
import { finalizarPartido, guardarLineaTiempo } from '@/services/partidoService';
import { partidoRepository } from '@/data/repositories/partido-repository';
import { usePartidoEnCursoStore } from '@/state/usePartidoEnCursoStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ClubCrest } from '@/presentation/components/atoms/club-crest';
import { GoalBanner } from '@/presentation/components/organisms/goal-banner';
import { ShotTargetGrid } from '@/presentation/components/organisms/shot-target-grid';
import { colors, fontSize, radius, spacing } from '@/presentation/theme';

/** Pausa narrada entre 1T y 2T (real, no suma al reloj de partido). */
const DESCANSO_MS = 2_500;

type Fase = 'jugando' | 'descanso' | 'penal' | 'final';

/** Feedback breve del grid antes de continuar (spec R9: 600–800 ms). */
const FEEDBACK_MS = 700;

const ICONO_EVENTO: Record<TipoEvento, keyof typeof Ionicons.glyphMap> = {
  gol: 'football',
  penal: 'trophy',
  'tiro-libre-interactivo': 'arrow-up',
  falta: 'refresh',
  amarilla: 'warning',
  roja: 'close-circle',
  lesion: 'bandage',
};

/**
 * REPLAY DE PARTIDO (spec matchday-experience + penalty-minigame, PR3).
 * Overlay fuera de (main): un reloj JS (100 ms) sobre una shared value
 * Reanimated; React state solo en cruces de eventos y 1 Hz del minuto (D3).
 * Fases: jugando (1T/2T/agregado) → descanso → penal (≤1, timeout 8 s) → final.
 * Al final: scorecard con goles+minuto; Continuar → finalizarPartido → dashboard.
 */
export default function MatchScreen() {
  const sesion = usePartidoEnCursoStore((s) => s.sesion);
  const actualizarLineaTiempo = usePartidoEnCursoStore((s) => s.actualizarLineaTiempo);
  const limpiarSesion = usePartidoEnCursoStore((s) => s.limpiar);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);

  const [fase, setFase] = useState<Fase>('jugando');
  const [minuto, setMinuto] = useState(1);
  const [visibles, setVisibles] = useState<EventoTimeline[]>([]);
  const [penalActivo, setPenalActivo] = useState<EventoTimeline | null>(null);
  const [feedback, setFeedback] = useState<{ zona: ZonaDisparo; resultado: ResultadoSituacion } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ texto: string; nombre: string; minuto: number } | null>(null);

  const relojRef = useRef(0);
  const indiceRef = useRef(0);
  const minutoRef = useRef(0);
  const golesAnunciadosRef = useRef(0);
  const descansoHechoRef = useRef(false);
  const faseRef = useRef<Fase>('jugando');
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const descansoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const penalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolverPenalRef = useRef<(eleccion: ZonaDisparo | null) => void>(() => {});
  const reanudarRef = useRef<() => void>(() => {});
  const partidoIdRef = useRef<number | null>(null);
  const checkpointInicialHechoRef = useRef(false);

  const relojSv = useSharedValue(0);

  const barraEstilo = useAnimatedStyle(() => ({
    width: `${(relojSv.value / DURACION_TOTAL_MS) * 100}%`,
  }));

  const lineaTiempo = sesion?.lineaTiempo ?? [];

  /** Congela el reloj (blur, background, penal). */
  const pausar = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, []);

  /** Arranca (o reanuda) el reloj de 100 ms si la fase es 'jugando'. */
  const reanudar = useCallback(() => {
    if (intervaloRef.current || faseRef.current !== 'jugando') return;
    intervaloRef.current = setInterval(() => {
      const t = relojRef.current + 100;
      relojRef.current = t;
      relojSv.value = t;

      const m = minutoDeReloj(t);
      if (m !== minutoRef.current) {
        minutoRef.current = m;
        setMinuto(m);
      }

      // Cruces de eventos: avanzar índice y materializar los visibles.
      let idx = indiceRef.current;
      while (idx < lineaTiempo.length && minutoAOffsetMs(lineaTiempo[idx].minuto) <= t) {
        idx += 1;
      }
      if (idx !== indiceRef.current) {
        indiceRef.current = idx;
        const nuevos = lineaTiempo.slice(0, idx);
        setVisibles(nuevos);

        // Situación interactiva pendiente → pausa y prompt (≤2 por partido, R6).
        const penal = nuevos.find(
          (e) =>
            (e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') &&
            e.situacion?.interactivo &&
            !e.situacion.resultado,
        );
        if (penal) {
          pausar();
          setPenalActivo(penal);
          setFase('penal');
          faseRef.current = 'penal';
          penalTimeoutRef.current = setTimeout(() => {
            resolverPenalRef.current(null);
          }, PENAL_TIMEOUT_MS);
        }
      }

      // Transición 1T → descanso (una vez) + checkpoint del 2T (PR2).
      if (t >= DURACION_1T && !descansoHechoRef.current) {
        descansoHechoRef.current = true;
        if (partidoIdRef.current != null) {
          void partidoRepository.guardarCheckpoint(partidoIdRef.current, 'entretiempo_o_segundo');
        }
        pausar();
        setFase('descanso');
        faseRef.current = 'descanso';
        descansoTimeoutRef.current = setTimeout(() => {
          relojRef.current = DURACION_1T;
          setFase('jugando');
          faseRef.current = 'jugando';
          reanudarRef.current();
        }, DESCANSO_MS);
        return;
      }

      // Fin del partido (2T + agregado completos).
      if (t >= DURACION_TOTAL_MS) {
        pausar();
        setFase('final');
        faseRef.current = 'final';
      }
    }, 100);
  }, [lineaTiempo, pausar, relojSv]);

    /**
   * Resuelve la situación interactiva con la zona elegida: aplica el resolver
   * puro del dominio, muestra el feedback 0.6–0.8 s (spec R9) y reanuda.
   */
  const resolverPenal = useCallback(
    (eleccion: ZonaDisparo | null) => {
      if (penalTimeoutRef.current) {
        clearTimeout(penalTimeoutRef.current);
        penalTimeoutRef.current = null;
      }
      if (!sesion || !penalActivo) return;
      const esTiroLibre = penalActivo.tipo === 'tiro-libre-interactivo';
      const nueva =
        eleccion == null
          ? resolverInaccion(lineaTiempo)
          : esTiroLibre
            ? resolverTiroLibreConEleccion(lineaTiempo, penalActivo.minuto, eleccion)
            : resolverPenalConEleccion(lineaTiempo, penalActivo.minuto, eleccion);
      const resuelta = nueva.find((e) => e.minuto === penalActivo.minuto && e.tipo === penalActivo.tipo);
      const resultado = resuelta?.situacion?.resultado ?? 'afuera';
      setPenalActivo(null);

      if (eleccion == null) {
        // Timeout: resolver y continuar de inmediato (spec R5).
        actualizarLineaTiempo(nueva);
        void guardarLineaTiempo(sesion.partido.id, nueva); // D1: sobrevive al fondo
        setFase('jugando');
        faseRef.current = 'jugando';
        reanudar();
        return;
      }

      // Feedback breve con la zona elegida y el resultado ya resuelto.
      setFeedback({ zona: eleccion, resultado });
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        actualizarLineaTiempo(nueva);
        void guardarLineaTiempo(sesion.partido.id, nueva);
        setFase('jugando');
        faseRef.current = 'jugando';
        reanudar();
      }, FEEDBACK_MS);
    },
    [sesion, penalActivo, lineaTiempo, actualizarLineaTiempo, reanudar],
  );

  // Mantiene las referencias estables para los timeouts del intervalo.
  useEffect(() => {
    resolverPenalRef.current = resolverPenal;
    reanudarRef.current = reanudar;
  }, [resolverPenal, reanudar]);

  // Arranque: sin sesión → volver al dashboard (nunca al menú, spec R5).
  useEffect(() => {
    if (!sesion) {
      router.replace('/(main)');
    }
  }, [sesion]);

  // PR2 checkpoint: al arrancar el replay se persiste la fase (1T); al reanudar
  // desde el entretiempo se inicializa el reloj en el 2T con el resumen del 1T.
  useEffect(() => {
    if (!sesion || checkpointInicialHechoRef.current) return;
    checkpointInicialHechoRef.current = true;
    partidoIdRef.current = sesion.partido.id;
    if (sesion.checkpointFase !== 'entretiempo_o_segundo') {
      void partidoRepository.guardarCheckpoint(sesion.partido.id, 'primer_tiempo');
      return;
    }
    // Reanudación del 2T: reloj al inicio del 2T, sin re-disparar el cruce.
    relojRef.current = DURACION_1T;
    relojSv.set(DURACION_1T);
    descansoHechoRef.current = true;
    minutoRef.current = 45;
    const idx = sesion.lineaTiempo.filter((e) => minutoAOffsetMs(e.minuto) <= DURACION_1T).length;
    indiceRef.current = idx;
    const previos = sesion.lineaTiempo.slice(0, idx);
    golesAnunciadosRef.current = contarGoles(previos, 'nosotros');
    const aplicar = setTimeout(() => {
      setMinuto(45);
      setVisibles(previos);
      setFase('descanso');
      faseRef.current = 'descanso';
      descansoTimeoutRef.current = setTimeout(() => {
        relojRef.current = DURACION_1T;
        setFase('jugando');
        faseRef.current = 'jugando';
        reanudarRef.current();
      }, DESCANSO_MS);
    }, 0);
    return () => clearTimeout(aplicar);
  }, [sesion, relojSv]);

  // Reloj: arranca con foco, pausa con blur/unmount.
  useFocusEffect(
    useCallback(() => {
      if (sesion && faseRef.current === 'jugando') reanudar();
      return () => {
        pausar();
        if (descansoTimeoutRef.current) clearTimeout(descansoTimeoutRef.current);
        if (penalTimeoutRef.current) clearTimeout(penalTimeoutRef.current);
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      };
    }, [sesion, reanudar, pausar]),
  );

  // Banner de gol (Sprint C): anuncia cada gol nuestro al materializarse.
  useEffect(() => {
    if (fase === 'final' || !sesion) return;
    const nuestros = visibles.filter((e) => e.tipo === 'gol' && e.equipo === 'nosotros');
    if (nuestros.length > golesAnunciadosRef.current) {
      golesAnunciadosRef.current = nuestros.length;
      const variantes = ['¡GOL!', '¡GOOOOL!', '¡GOLAZO!'] as const;
      const gol = nuestros[nuestros.length - 1];
      setBanner({
        texto: variantes[(nuestros.length - 1) % variantes.length],
        nombre: sesion.jugador.nombre,
        minuto: gol.minuto,
      });
      setTimeout(() => setBanner(null), 800);
    }
  }, [visibles, fase, sesion]);

  // Pausa segura al backgroundar la app (spec R1: no corrompe timeline).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') pausar();
      else if (sesion && faseRef.current === 'jugando') reanudar();
    });
    return () => sub.remove();
  }, [sesion, reanudar, pausar]);

  async function continuar() {
    if (!sesion || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const resuelta = resolverInaccion(lineaTiempo); // nunca debería haber pendientes aquí
      const resultado = await finalizarPartido(
        sesion.jugador,
        sesion.temporada,
        sesion.partido,
        sesion.clubRival,
        resuelta,
        { conEvento: false },
      );
      setPlayer(resultado.jugadorActualizado);
      setTemporadaActiva(resultado.temporadaActualizada);
      limpiarSesion();
      router.replace('/(main)'); // spec R5: siempre al dashboard
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el partido');
      setGuardando(false);
    }
  }

  if (!sesion) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    );
  }

  const { partido, clubRival, temporada } = sesion;
  const resultado = fase === 'final' ? resultadoDesdeLineaTiempo(lineaTiempo) : null;
  const golesFavorLive = contarGoles(visibles, 'nosotros');
  const golesContraLive = contarGoles(visibles, 'rival');
  const etiquetaFase =
    fase === 'descanso' ? 'DESCANSO' : fase === 'penal' ? 'PENAL' : fase === 'final' ? 'FINAL' : 'EN VIVO';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header: rival + competencia + marcador en vivo */}
        <View style={styles.header}>
          <ClubCrest club={clubRival} size={32} />
          <View style={styles.headerInfo}>
            <AppText variant="heading" numberOfLines={1}>
              {clubRival.nombre}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {partido.competencia} · Temporada {temporada.anioInicio} ·{' '}
              {partido.local ? 'Local' : 'Visitante'}
            </AppText>
          </View>
          <View style={styles.marcador}>
            <AppText variant="title" color="onAccent">
              {golesFavorLive} - {golesContraLive}
            </AppText>
          </View>
        </View>

        {/* Barra de progreso del reloj */}
        <View style={styles.barraTrack}>
          <Animated.View style={[styles.barraFill, barraEstilo]} />
        </View>

        {/* Minuto central + fase */}
        <View style={styles.minutoBox}>
          <AppText variant="caption" uppercase color="textSecondary">
            {etiquetaFase}
          </AppText>
          <AppText variant="title" style={styles.minutoTexto}>
            {fase === 'final' ? '90+' : `${minuto}'`}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {fase === 'final' ? 'Partido terminado' : 'Minuto de partido'}
          </AppText>
        </View>

        {/* Feed de eventos materializados (oculto en el scorecard final) */}
        {fase !== 'final' && (
          <View style={styles.feed}>
            {visibles.slice(-4).map((e, i) => (
              <View key={`${e.minuto}-${i}`} style={styles.evento}>
                <Ionicons
                  name={ICONO_EVENTO[e.tipo]}
                  size={14}
                  color={e.equipo === 'nosotros' ? colors.success : colors.danger}
                />
                <AppText variant="caption" style={styles.eventoTexto} numberOfLines={2}>
                  {`${e.minuto}' · ${e.descripcion}`}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {error && <AppText variant="caption" color="danger">{error}</AppText>}

        {/* Overlay de descanso */}
        {fase === 'descanso' && (
          <View style={styles.overlay}>
            <AppText variant="heading" uppercase>Descanso</AppText>
            <AppText variant="body" color="textSecondary">
              {`${minuto}' · ${golesFavorLive} - ${golesContraLive}`}
            </AppText>
          </View>
        )}

        {/* Situación interactiva: penal o tiro libre (spec R1-R9, PR3b) */}
        {fase === 'penal' && penalActivo && (
          <View style={styles.overlay}>
            <AppText variant="heading" uppercase>
              {penalActivo.tipo === 'tiro-libre-interactivo' ? '¡Tiro libre!' : '¡Penal!'}
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.penalTexto}>
              {penalActivo.descripcion}
            </AppText>
            <ShotTargetGrid
              ladoArquero={penalActivo.situacion?.ladoArquero}
              ladoDefensor={
                penalActivo.tipo === 'tiro-libre-interactivo'
                  ? penalActivo.situacion?.ladoDefensor
                  : undefined
              }
              feedback={feedback}
              onElegir={(zona) => resolverPenal(zona)}
            />
            <AppText variant="caption" color="textMuted">
              {`Tenés ${PENAL_TIMEOUT_MS / 1000} s para decidir.`}
            </AppText>
          </View>
        )}

        {/* Scorecard final (spec R3/R4): scroll por si el contenido excede la pantalla */}
        {fase === 'final' && resultado && (
          <ScrollView
            style={styles.scorecardWrap}
            contentContainerStyle={styles.scorecard}
            showsVerticalScrollIndicator={false}>
            <AppText variant="heading" uppercase>
              {resultado.victoria ? 'Victoria' : resultado.empate ? 'Empate' : 'Derrota'}
            </AppText>
            <AppText variant="title">
              {`${resultado.golesFavor} - ${resultado.golesContra}`}
            </AppText>

            <View style={styles.golesColumna}>
              <AppText variant="label" uppercase color="success">Nuestros goles</AppText>
              {golesDe(lineaTiempo, 'nosotros').map((g, i) => (
                <View key={i} style={styles.golRow}>
                  <Ionicons name="football" size={14} color={colors.success} />
                  <AppText variant="caption" color="textSecondary">
                    {`${g.minuto}' · ${g.descripcion}`}
                  </AppText>
                </View>
              ))}
              {golesDe(lineaTiempo, 'nosotros').length === 0 && (
                <AppText variant="caption" color="textMuted">Sin goles</AppText>
              )}
            </View>

            <View style={styles.golesColumna}>
              <AppText variant="label" uppercase color="danger">Goles del rival</AppText>
              {golesDe(lineaTiempo, 'rival').map((g, i) => (
                <View key={i} style={styles.golRow}>
                  <Ionicons name="football" size={14} color={colors.danger} />
                  <AppText variant="caption" color="textSecondary">
                    {`${g.minuto}' · ${g.descripcion}`}
                  </AppText>
                </View>
              ))}
              {golesDe(lineaTiempo, 'rival').length === 0 && (
                <AppText variant="caption" color="textMuted">Sin goles</AppText>
              )}
            </View>

            <PrimaryButton
              label="Continuar"
              onPress={continuar}
              disabled={guardando}
            />
          </ScrollView>
        )}
      </View>

      {/* Banner de gol (Sprint C) — overlay breve, no bloquea el flujo */}
      <GoalBanner
        visible={banner != null}
        texto={banner?.texto ?? '¡GOL!'}
        nombre={banner?.nombre ?? ''}
        minuto={banner?.minuto ?? 0}
      />
    </SafeAreaView>
  );
}

/** Minuto de partido derivado del reloj del replay (1-90). */
function minutoDeReloj(ms: number): number {
  if (ms < DURACION_1T) return Math.max(1, Math.min(45, 1 + Math.floor((ms / DURACION_1T) * 45)));
  if (ms < DURACION_1T + DURACION_2T) {
    return Math.max(46, Math.min(90, 46 + Math.floor(((ms - DURACION_1T) / DURACION_2T) * 45)));
  }
  return 90;
}

/** Cuenta goles de un equipo en una subtimeline (goles + situaciones convertidas). */
function contarGoles(linea: EventoTimeline[], equipo: EventoTimeline['equipo']): number {
  return linea.filter(
    (e) =>
      (e.tipo === 'gol' ||
        ((e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') &&
          e.situacion?.resultado === 'gol')) &&
      e.equipo === equipo,
  ).length;
}

/** Goles (con situación convertida) de un equipo para el scorecard. */
function golesDe(linea: EventoTimeline[], equipo: EventoTimeline['equipo']): EventoTimeline[] {
  return linea.filter(
    (e) =>
      (e.tipo === 'gol' ||
        ((e.tipo === 'penal' || e.tipo === 'tiro-libre-interactivo') &&
          e.situacion?.resultado === 'gol')) &&
      e.equipo === equipo,
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerInfo: { flex: 1, gap: 2 },
  marcador: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 96,
    alignItems: 'center',
  },
  barraTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barraFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  minutoBox: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
  },
  minutoTexto: {
    fontSize: fontSize.xxl,
  },
  feed: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  evento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  eventoTexto: { flex: 1 },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  penalTexto: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
  scorecardWrap: {
    flex: 1,
  },
  scorecard: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  golesColumna: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  golRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
