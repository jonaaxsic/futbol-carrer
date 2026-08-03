import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/presentation/theme';

type ProgressStepBarProps = {
  /** Paso actual (1-based). */
  current: number;
  /** Total de pasos del flujo (onboarding = 4). */
  total: number;
};

/**
 * Barrita de progreso del onboarding (wireframe: arriba de la pantalla).
 * Muestra pasos completados, el actual resaltado y los restantes apagados.
 */
export function ProgressStepBar({ current, total }: ProgressStepBarProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <View
            key={step}
            style={[
              styles.segment,
              active && styles.segmentActive,
              done && styles.segmentDone,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentDone: {
    backgroundColor: colors.textSecondary,
  },
});