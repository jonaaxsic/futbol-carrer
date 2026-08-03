import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Entrenamiento, TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import { TIPOS_ENTRENAMIENTO } from '@/domain/rules/progresion';
import {
  formatearCountdown,
  useCountdownTraining,
} from '@/presentation/hooks/use-countdown-training';
import {
  iniciarEntrenamiento,
  obtenerEntrenamientoPendiente,
  resolverEntrenamiento,
  estaCompletado,
} from '@/services/trainingService';
import { energiaActual, ENERGIA_ENTRENAMIENTO } from '@/services/energiaService';
import { obtenerJugadorActivo } from '@/services/playerService';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

const RIESGO_COLOR: Record<TipoEntrenamiento, string> = {
  basico: colors.success,
  normal: colors.warning,
  extremo: colors.danger,
};

/**
 * 13. ENTRENAMIENTO (wireframe #13) — Sprint 4 completo.
 * Estados:
 * 1) Sesión pendiente sin vencer → countdown real (persiste aunque cierres la app).
 * 2) Sesión vencida → se resuelve sola al abrir (aplica delta OVR).
 * 3) Sin sesión → elegir tipo e iniciar (bloquea el botón si hay pendiente).
 */
export default function TrainingScreen() {
  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [pendiente, setPendiente] = useState<Entrenamiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [elegido, setElegido] = useState<TipoEntrenamiento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ ovrDelta: number; lesion: boolean } | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // Carga inicial SOLO cuando cambia el jugador. El primer setState ocurre
  // en el callback de una promesa (patrón que evita renders en cascada).
  useEffect(() => {
    if (!player) return;
    obtenerEntrenamientoPendiente(player.id)
      .then((p) => {
        if (p && estaCompletado(p)) {
          return resolverEntrenamiento(player.id).then((resuelto) => {
            if (resuelto) {
              setResultado(resuelto.resultado);
              setPendiente(null);
              return obtenerJugadorActivo().then((actualizado) => {
                if (actualizado) setPlayer(actualizado);
              });
            }
            setPendiente(p);
            return undefined;
          });
        }
        setPendiente(p);
        return undefined;
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar el entrenamiento'))
      .finally(() => setCargando(false));
  }, [player, setPlayer]);

  const { restanteMs, terminado } = useCountdownTraining(pendiente?.finEstimadaTs ?? null);

  const energia = player ? energiaActual(player) : 0;
  const puedeEntrenar = energia >= ENERGIA_ENTRENAMIENTO;

  // El countdown terminó: resolver la sesión vencida (setState en .then).
  useEffect(() => {
    if (!player || !pendiente || !terminado) return;
    resolverEntrenamiento(player.id)
      .then((resuelto) => {
        if (resuelto) {
          setResultado(resuelto.resultado);
          setPendiente(null);
          return obtenerJugadorActivo().then((actualizado) => {
            if (actualizado) setPlayer(actualizado);
          });
        }
        return undefined;
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al resolver el entrenamiento'));
  }, [terminado, pendiente, player, setPlayer]);

  const confirmar = async () => {
    if (!player || !elegido) return;
    setIniciando(true);
    setError(null);
    try {
      await iniciarEntrenamiento(player.id, elegido);
      const p = await obtenerEntrenamientoPendiente(player.id);
      setPendiente(p);
      setElegido(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el entrenamiento');
    } finally {
      setIniciando(false);
    }
  };

  return (
    <ScreenContainer
      title="Entrenamiento"
      footer={
        <>
          <PrimaryButton
            label={resultado ? 'Listo' : 'Confirmar entrenamiento'}
            disabled={
              elegido == null || cargando || iniciando || Boolean(pendiente) || !puedeEntrenar
            }
            onPress={() => {
              if (resultado) {
                router.back();
                return;
              }
              void confirmar();
            }}
          />
        </>
      }>
      <View style={styles.content}>
        {error && (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        )}

        {cargando ? (
          <ActivityIndicator color={colors.textPrimary} style={styles.carga} />
        ) : resultado ? (
          <View style={styles.resultadoBox}>
            <AppText variant="heading">Entrenamiento completado</AppText>
            <AppText
              variant="heading"
              color={resultado.ovrDelta >= 0 ? 'success' : 'danger'}>
              {resultado.ovrDelta >= 0 ? '+' : ''}
              {resultado.ovrDelta} OVR
            </AppText>
            {resultado.lesion && (
              <AppText variant="body" color="danger">
                Te lesionaste durante la sesión.
              </AppText>
            )}
          </View>
        ) : pendiente ? (
          <View style={styles.countdownBox}>
            <AppText variant="label" uppercase color="textSecondary">
              Entrenamiento en curso
            </AppText>
            <AppText variant="title" style={styles.countdown}>
              {formatearCountdown(restanteMs)}
            </AppText>
            <AppText variant="caption" color="textMuted">
              {TIPOS_ENTRENAMIENTO[pendiente.tipo].etiqueta} · no podés iniciar otro hasta terminar
            </AppText>
          </View>
        ) : (
          <>
            <AppText variant="body" color="textSecondary" style={styles.intro}>
              Elige el tipo de entrenamiento. El tiempo avanza de verdad: aunque cierres la app,
              el conteo continúa.
            </AppText>

            <View style={styles.energiaCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="flash" size={16} color={colors.warning} />
                <AppText variant="label" uppercase color="textSecondary">
                  Energía disponible
                </AppText>
              </View>
              <AppText variant="heading">
                {Math.floor(energia)} / 10
              </AppText>
              <AppText variant="caption" color={puedeEntrenar ? 'textSecondary' : 'danger'}>
                Entrenar cuesta {ENERGIA_ENTRENAMIENTO} barras · se regenera 1 cada 2 h
              </AppText>
            </View>

            <View style={styles.opciones}>
              {(Object.keys(TIPOS_ENTRENAMIENTO) as TipoEntrenamiento[]).map((id) => {
                const cfg = TIPOS_ENTRENAMIENTO[id];
                const isSelected = elegido === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setElegido(id)}
                    disabled={!puedeEntrenar}
                    style={({ pressed }) => [
                      styles.opcionCard,
                      isSelected && styles.opcionCardSelected,
                      pressed && styles.pressed,
                      !puedeEntrenar && styles.opcionCardBloqueada,
                    ]}>
                    <View style={styles.opcionHeader}>
                      <AppText variant="heading" color={isSelected ? 'textPrimary' : 'textSecondary'}>
                        {cfg.etiqueta}
                      </AppText>
                      <AppText variant="label" uppercase style={{ color: RIESGO_COLOR[id] }}>
                        {cfg.duracionHoras} h
                      </AppText>
                    </View>
                    <AppText variant="caption">{cfg.descripcion}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.decisionBox}>
          <AppText variant="label" uppercase color="textSecondary">
            Decisión actual
          </AppText>
          <AppText variant="body" color={elegido ? 'textPrimary' : 'textMuted'}>
            {elegido ? TIPOS_ENTRENAMIENTO[elegido].etiqueta : 'Sin cambios'}
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  carga: { marginTop: spacing.xl },
  intro: { marginBottom: spacing.sm },
  opciones: { gap: spacing.md },
  energiaCard: {
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
  opcionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  opcionCardBloqueada: {
    opacity: 0.4,
  },
  opcionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
  },
  opcionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.7 },
  decisionBox: {
    marginTop: 'auto',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  countdownBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  countdown: {
    fontSize: 44,
    letterSpacing: 2,
  },
  resultadoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});