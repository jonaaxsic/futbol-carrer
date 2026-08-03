import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/state/usePlayerStore';
import { useHydrateApp } from '@/state/useHydrateApp';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 1. INICIO / SPLASH (wireframe #1)
 * Marca del juego + botón único "INICIAR SESIÓN".
 * Sprint 1: verifica carrera en SQLite al montar; si existe, salta directo
 * a /menu (sesión por invitado ya asumida), si no, espera el login.
 */
export default function SplashScreen() {
  const { estado, error } = useHydrateApp();
  const player = usePlayerStore((s) => s.player);

  useEffect(() => {
    if (estado === 'lista' && player) {
      router.replace('/menu');
    }
  }, [estado, player]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Ionicons name="football" size={64} color={colors.textPrimary} />
        </View>
        <AppText variant="title" uppercase color="textPrimary" style={styles.title}>
          Modo Carrera
        </AppText>
        <AppText variant="heading" uppercase color="textSecondary" style={styles.subtitle}>
          Ser una leyenda
        </AppText>
        {estado === 'error' && (
          <AppText variant="caption" color="danger" style={styles.error}>
            No se pudo cargar tu carrera ({error})
          </AppText>
        )}
      </View>

      <View style={styles.footerArea}>
        <PrimaryButton
          label="Iniciar sesión"
          disabled={estado === 'cargando' || estado === 'error'}
          onPress={() => router.push('/login')}
        />
        <AppText variant="caption" style={styles.version}>
          v1.0.0
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  logoBadge: {
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  footerArea: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  version: {
    alignSelf: 'center',
  },
  error: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});