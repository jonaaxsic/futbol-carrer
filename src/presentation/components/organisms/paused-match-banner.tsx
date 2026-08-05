import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Club } from '@/domain/entities/club';
import type { FaseCheckpoint, Partido } from '@/domain/entities/partido';
import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

type Props = {
  /** Partido pausado (con checkpoint) a reanudar (spec paused-match, PR2). */
  partido: Partido;
  /** Club rival del partido pausado. */
  clubRival: Club;
  /** Fase del checkpoint: 'primer_tiempo' | 'entretiempo_o_segundo' | null. */
  fase: FaseCheckpoint;
  /** Acción de reanudar (reconstruye la sesión desde eventos_json). */
  onReanudar: () => void;
};

/**
 * Banner de partido en pausa (spec paused-match R3/R4, PR2).
 * Reemplaza el CTA "Jugar" del dashboard mientras exista un partido con
 * checkpoint: "Reanudar" (primer tiempo/null) o "Comenzar 2º Tiempo"
 * (entretiempo). Entrada animada con Reanimated.
 */
export function PausedMatchBanner({ partido, clubRival, fase, onReanudar }: Props) {
  const entrada = useSharedValue(0);

  useEffect(() => {
    entrada.value = withTiming(1, { duration: 350 });
  }, [entrada]);

  const estiloEntrada = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ translateY: (1 - entrada.value) * -12 }],
  }));

  const enSegundo = fase === 'entretiempo_o_segundo';

  return (
    <Animated.View style={[styles.banner, estiloEntrada]}>
      <View style={styles.icono}>
        <Ionicons name="pause" size={20} color={colors.onAccent} />
      </View>

      <View style={styles.info}>
        <AppText variant="label" uppercase color="textSecondary">
          Partido en pausa
        </AppText>
        <AppText variant="body">vs. {clubRival.nombre}</AppText>
        <AppText variant="caption" color="textMuted">
          {partido.competencia} · {partido.local ? 'Local' : 'Visitante'}
        </AppText>
      </View>

      <Pressable
        onPress={onReanudar}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
        <AppText variant="label" uppercase color="onAccent">
          {enSegundo ? 'Comenzar 2º Tiempo' : 'Reanudar'}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
});
