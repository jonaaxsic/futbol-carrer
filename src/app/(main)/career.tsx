import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import type { HistorialEtapa } from '@/domain/entities/historial-carrera';
import { clubRepository } from '@/data/repositories/club-repository';
import { historialRepository } from '@/data/repositories/historial-repository';
import { usePlayerStore } from '@/state/usePlayerStore';
import { lineaCarreraConActiva, type LineaCarreraEtapa } from '@/domain/rules/career';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton, SecondaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 9. LÍNEA DE TIEMPO / MI CARRERA (wireframe #9)
 * Timeline vertical con etapas reales desde `historial_carrera` (Sprint 3).
 * Live Stats R3/R4: combina historial cerrado + temporada activa en curso (anioFin === null)
 * y recarga al volver del /match vía useFocusEffect.
 */
export default function CareerScreen() {
  const player = usePlayerStore((s) => s.player);
  const temporadaActiva = usePlayerStore((s) => s.temporadaActiva);
  const [etapas, setEtapas] = useState<LineaCarreraEtapa[]>([]);
  const [clubes, setClubes] = useState<Record<number, Club>>({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!player) return;
    try {
      const filas = await historialRepository.findByPlayer(player.id);
      const ids = [...new Set(filas.map((e) => e.clubId))];
      const entradas = await Promise.all(ids.map((id) => clubRepository.findById(id)));
      const combinadas = lineaCarreraConActiva(filas, temporadaActiva);
      setEtapas(combinadas);
      setClubes(
        Object.fromEntries(entradas.filter((c) => c != null).map((c) => [c.id, c])),
      );
    } finally {
      setCargando(false);
    }
  }, [player, temporadaActiva]);

  // Carga inicial + recarga al volver del /match (Live Stats R4).
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  return (
    <ScreenContainer title="Mi carrera">
      <View style={styles.content}>
        {cargando ? (
          <ActivityIndicator color={colors.textPrimary} style={styles.carga} />
        ) : etapas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag" size={40} color={colors.textMuted} />
            </View>
            <AppText variant="heading" color="textSecondary" style={styles.emptyText}>
              Aún no hay etapas en tu carrera
            </AppText>
            <AppText variant="caption" style={styles.emptyText}>
              Tu historia comenzará cuando firmes tu primer contrato
            </AppText>
          </View>
        ) : (
          <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
            {etapas.map((etapa, i) => {
              const club = clubes[etapa.clubId];
              const esUltima = i === etapas.length - 1;
              return (
                <View key={etapa.id} style={styles.etapaRow}>
                  <View style={styles.rail}>
                    <View style={[styles.node, esUltima && etapa.enVivo && styles.nodeActual]} />
                    {!esUltima && <View style={styles.line} />}
                  </View>
                  <View style={[styles.etapaCard, esUltima && styles.etapaCardActual]}>
                    <View style={styles.etapaHeader}>
                      <View style={styles.shield}>
                        <Ionicons
                          name="shield"
                          size={20}
                          color={esUltima ? colors.onAccent : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.etapaInfo}>
                        <AppText variant="heading">{club?.nombre ?? 'Club'}</AppText>
                        <AppText variant="caption">
                          {etapa.anioInicio}
                          {etapa.anioFin ? ` – ${etapa.anioFin}` : ' – presente'}
                        </AppText>
                      </View>
                      <View style={styles.stars}>
                        {Array.from({ length: 5 }, (_, s) => (
                          <Ionicons
                            key={s}
                            name={s < (club?.prestigio ?? 0) ? 'star' : 'star-outline'}
                            size={12}
                            color={s < (club?.prestigio ?? 0) ? colors.warning : colors.textMuted}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={styles.statsRow}>
                      <Stat label="PJ" valor={etapa.pj} />
                      <Stat label="Goles" valor={etapa.goles} />
                      <Stat label="Asist." valor={etapa.asistencias} />
                    </View>
                    {etapa.enVivo && (
                      <AppText variant="caption" color="success" style={styles.liveBadge}>
                        En vivo
                      </AppText>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <PrimaryButton label="Ver trofeos" onPress={() => router.push('/trophies')} />
          <SecondaryButton
            label="Ver estadísticas"
            onPress={() => router.push('/profile')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function Stat({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label" uppercase color="textSecondary">
        {label}
      </AppText>
      <AppText variant="heading">{valor}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: spacing.md },
  carga: { marginTop: spacing.xl },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { textAlign: 'center' },
  timeline: { flex: 1 },
  timelineContent: { paddingBottom: spacing.lg },
  etapaRow: { flexDirection: 'row', gap: spacing.sm },
  rail: { alignItems: 'center', width: 16 },
  node: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.textMuted,
    marginTop: spacing.lg,
  },
  nodeActual: {
    backgroundColor: colors.accent,
    width: 14,
    height: 14,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  etapaCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  etapaCardActual: {
    borderColor: colors.accent,
  },
  etapaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shield: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etapaInfo: { flex: 1 },
  stars: { flexDirection: 'row', gap: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  actions: { gap: spacing.md, paddingBottom: spacing.md },
  liveBadge: { marginTop: spacing.xs, textAlign: 'right' },
});