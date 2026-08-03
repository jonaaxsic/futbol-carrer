import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Trofeo } from '@/domain/entities/trofeo';
import { trofeoRepository } from '@/data/repositories/trofeo-repository';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton, SecondaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * TAB PERFIL — resumen real del jugador: identidad, stats de temporada activa
 * y acceso a trofeos (Sprint 6). El fin de carrera se dispara desde aquí (§4.6).
 */
export default function ProfileScreen() {
  const player = usePlayerStore((s) => s.player);
  const temporadaActiva = usePlayerStore((s) => s.temporadaActiva);
  const [trofeos, setTrofeos] = useState<Trofeo[]>([]);

  useEffect(() => {
    let activo = true;
    if (player) {
      trofeoRepository.findByPlayer(player.id).then((lista) => {
        if (activo) setTrofeos(lista);
      });
    }
    return () => {
      activo = false;
    };
  }, [player]);

  if (!player) {
    return (
      <ScreenContainer title="Perfil">
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay una carrera activa.
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Perfil">
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.onAccent} />
          </View>
          <View style={styles.info}>
            <AppText variant="heading">{player.nombre}</AppText>
            <AppText variant="caption">
              {player.edad} años · {player.pais} · Pierna {player.pierna}
            </AppText>
          </View>
          <View style={styles.ovrBadge}>
            <AppText variant="caption" color="onAccent">
              OVR
            </AppText>
            <AppText variant="heading" color="onAccent">
              {player.ovr}
            </AppText>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <AppText variant="heading">{player.posicion}</AppText>
            <AppText variant="caption">Posición</AppText>
          </View>
          <View style={styles.statCell}>
            <AppText variant="heading">{player.temporadaActual}</AppText>
            <AppText variant="caption">Temporada</AppText>
          </View>
          <View style={styles.statCell}>
            <AppText variant="heading">{temporadaActiva?.goles ?? 0}</AppText>
            <AppText variant="caption">Goles</AppText>
          </View>
          <View style={styles.statCell}>
            <AppText variant="heading">{temporadaActiva?.asistencias ?? 0}</AppText>
            <AppText variant="caption">Asistencias</AppText>
          </View>
          <View style={styles.statCell}>
            <AppText variant="heading">
              {trofeos.length}
              <Ionicons name="trophy" size={14} color={colors.warning} />
            </AppText>
            <AppText variant="caption">Trofeos</AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Ver trofeos" onPress={() => router.push('/trophies')} />
          <SecondaryButton label="Ver historial" onPress={() => router.push('/career')} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  ovrBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
});