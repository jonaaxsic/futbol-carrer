import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, spacing } from '@/presentation/theme';

/**
 * Organismo: banner de gol (Sprint C, plan punto 7).
 * Overlay casi a pantalla completa, breve (600-800 ms): texto grande
 * "¡GOOL!/¡GOOOOL!/¡GOLAZO!", nombre del jugador y minuto.
 * Animación Reanimated: escala 0.4 → 1.12 → 1 con fade del fondo oscuro.
 */
export interface GoalBannerProps {
  visible: boolean;
  /** Variante del texto: '¡GOL!' | '¡GOOOOL!' | '¡GOLAZO!' */
  texto: string;
  nombre: string;
  minuto: number;
}

export function GoalBanner({ visible, texto, nombre, minuto }: GoalBannerProps) {
  const opacidad = useSharedValue(0);
  const escala = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      opacidad.value = 0;
      escala.value = 0.4;
      opacidad.value = withTiming(1, { duration: 140 });
      escala.value = withSequence(
        withTiming(1.12, { duration: 190, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 12, stiffness: 220 }),
      );
    } else {
      opacidad.value = withTiming(0, { duration: 220 });
    }
  }, [visible, opacidad, escala]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacidad.value,
  }));
  const textoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      <Animated.View style={[styles.caja, textoStyle]}>
        <AppText variant="title" uppercase style={styles.gol}>
          {texto}
        </AppText>
        <AppText variant="body" style={styles.nombre}>
          {nombre.toUpperCase()}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {`Minuto ${minuto}'`}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caja: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  gol: {
    fontSize: 44,
    lineHeight: 52,
    color: colors.success,
    letterSpacing: 2,
  },
  nombre: {
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
});
