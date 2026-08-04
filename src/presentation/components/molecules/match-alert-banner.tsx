import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

type Props = {
  /** Acción de jugar el próximo partido (spec matchday R6). */
  onJugar: () => void;
  /** Cierre manual; el banner NO se descarta solo (spec R6). */
  onOcultar: () => void;
};

/**
 * Banner de aviso de partido jugable (spec matchday R6/R7).
 * Persistente (sin auto-dismiss), con CTA Jugar y cierre manual.
 * Entrada animada con Reanimated; sin dependencias de notificaciones.
 */
export function MatchAlertBanner({ onJugar, onOcultar }: Props) {
  const entrada = useSharedValue(0);

  useEffect(() => {
    entrada.value = withTiming(1, { duration: 350 });
  }, [entrada]);

  const estiloEntrada = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ translateY: (1 - entrada.value) * -12 }],
  }));

  return (
    <Animated.View style={[styles.banner, estiloEntrada]}>
      <View style={styles.icono}>
        <Ionicons name="football" size={20} color={colors.onAccent} />
      </View>

      <View style={styles.info}>
        <AppText variant="label" uppercase color="textSecondary">
          Partido listo
        </AppText>
        <AppText variant="body">Tenés un partido por jugar. ¡Dale!</AppText>
      </View>

      <Pressable
        onPress={onJugar}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
        <AppText variant="label" uppercase color="onAccent">
          Jugar
        </AppText>
      </Pressable>

      <Pressable onPress={onOcultar} hitSlop={10} style={styles.cerrar}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
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
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
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
  cerrar: {
    padding: spacing.xs,
  },
  pressed: { opacity: 0.7 },
});
