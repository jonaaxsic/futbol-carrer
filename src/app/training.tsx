import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Entrenamiento, TipoEntrenamiento } from '@/domain/entities/entrenamiento';
import { TIPOS_ENTRENAMIENTO } from '@/domain/rules/progresion';
import { STAT_LABELS, type StatName } from '@/domain/entities/stats';
import {
  entrenamientosParaPosicion,
  NIVEL_ETIQUETA,
  NIVEL_COLOR,
  type EntrenamientoPosicion,
} from '@/domain/rules/entrenamientos-por-posicion';
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
import { PrimaryButton, SecondaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 13. ENTRENAMIENTO (wireframe #13) — Sprint 4 completo + §13b por posición.
 * Estados:
 * 1) Sesión pendiente sin vencer → countdown real (persiste aunque cierres la app).
 * 2) Sesión vencida → se resuelve sola al abrir (aplica delta stats).
 * 3) Sin sesión → elegir tipo e iniciar (bloquea el botón si hay pendiente).
 */
export default function TrainingScreen() {
  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);

  const [pendiente, setPendiente] = useState<Entrenamiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [elegido, setElegido] = useState<EntrenamientoPosicion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ statsDelta: Partial<Record<StatName, number>>; ovrDelta: number; lesion: boolean } | null>(null);
  const [iniciando, setIniciando] = useState(false);

  // Entrenamientos disponibles para la posición del jugador
  const entrenamientosDisponibles = player ? entrenamientosParaPosicion(player.posicion) : [];

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
      await iniciarEntrenamiento(player.id, elegido.id as TipoEntrenamiento);
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
            {Object.entries(resultado.statsDelta).map(([stat, delta]) => {
              if (delta == null || delta === 0) return null;
              return (
                <AppText key={stat} variant="body" color={delta > 0 ? 'success' : 'danger'}>
                  {STAT_LABELS[stat as StatName]}: {delta > 0 ? '+' : ''}{delta}
                </AppText>
              );
            })}
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
              {TIPOS_ENTRENAMIENTO[pendiente.tipo]?.etiqueta ?? pendiente.tipo} · no podés iniciar otro hasta terminar
            </AppText>
            <SecondaryButton
              label="Volver al dashboard"
              onPress={() => router.replace('/(main)')}
              style={styles.volverBtn}
            />
          </View>
        ) : (
          <>
            <AppText variant="body" color="textSecondary" style={styles.intro}>
              Elegí el entrenamiento para tu posición. El tiempo avanza de verdad:
              aunque cierres la app, el conteo continúa.
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
              {entrenamientosDisponibles.map((ent) => {
                const isSelected = elegido?.id === ent.id;
                return (
                  <Pressable
                    key={ent.id}
                    onPress={() => setElegido(ent)}
                    disabled={!puedeEntrenar}
                    style={({ pressed }) => [
                      styles.opcionCard,
                      isSelected && styles.opcionCardSelected,
                      pressed && styles.pressed,
                      !puedeEntrenar && styles.opcionCardBloqueada,
                    ]}>
                    <View style={styles.opcionHeader}>
                      <AppText variant="heading" color={isSelected ? 'textPrimary' : 'textSecondary'}>
                        {ent.nombre}
                      </AppText>
                      <View style={[styles.nivelBadge, { backgroundColor: NIVEL_COLOR[ent.nivel] }]}>
                        <AppText variant="caption" style={{ color: '#fff' }}>
                          {NIVEL_ETIQUETA[ent.nivel]}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="caption">{ent.descripcion}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {ent.duracionHoras} h · {ent.distanciaKm} km
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      Stats: {ent.statsObjetivo.map(s => STAT_LABELS[s]).join(', ')}
                    </AppText>
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
            {elegido ? `${elegido.nombre} (${NIVEL_ETIQUETA[elegido.nivel]})` : 'Sin cambios'}
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
  nivelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
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
  volverBtn: {
    marginTop: spacing.md,
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