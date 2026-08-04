import { StyleSheet, View } from 'react-native';

import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * CRÉDITOS — pantalla secundaria del Menú Principal / Login.
 */
export default function CreditsScreen() {
  return (
    <ScreenContainer title="Créditos">
      <View style={styles.content}>
        <View style={styles.card}>
          <AppText variant="label" uppercase color="textSecondary">
            Ser una leyenda
          </AppText>
          <AppText variant="heading">MODO CARRERA</AppText>
          <AppText variant="caption">
            Simulador de carrera de futbolista · 16 → 40 años · Offline-first
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText variant="label" uppercase color="textSecondary">
            Stack técnico
          </AppText>
          <AppText variant="body">React Native · Expo SDK 57 · expo-router · Zustand · SQLite</AppText>
        </View>

        <AppText variant="caption" style={styles.version}>
          v1.0.0 (Sprint 0 — esqueleto de navegación)
        </AppText>
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  version: {
    marginTop: 'auto',
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
});