import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import type { SeasonMode } from '@/shared/types';

/**
 * AJUSTES — pantalla secundaria del Menú Principal.
 * Sprint 1+: persiste preferencias en useSettingsStore (SQLite).
 */
export default function SettingsScreen() {
  const [descanso, setDescanso] = useState<2 | 3 | 4>(2);
  const [modo, setModo] = useState<SeasonMode>('normal');

  return (
    <ScreenContainer title="Ajustes">
      <ScrollView contentContainerStyle={styles.content}>
        <Fila label="Idioma" valor="Español" />

        <View style={styles.group}>
          <AppText variant="label" uppercase color="textSecondary">
            Descanso obligatorio antes de jugar (§4.2)
          </AppText>
          <View style={styles.chips}>
            {([2, 3, 4] as const).map((d) => (
              <Chip
                key={d}
                label={`${d} días`}
                active={descanso === d}
                onPress={() => setDescanso(d)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <AppText variant="label" uppercase color="textSecondary">
            Modo de temporada (§4.5)
          </AppText>
          <View style={styles.chips}>
            <Chip
              label="Normal (1 año)"
              active={modo === 'normal'}
              onPress={() => setModo('normal')}
            />
            <Chip
              label="Rápido (2 años)"
              active={modo === 'rapido'}
              onPress={() => setModo('rapido')}
            />
          </View>
        </View>

        <Fila label="Acerca de" valor="v1.0.0" />
      </ScrollView>
    </ScreenContainer>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <AppText variant="body">{label}</AppText>
      <AppText variant="body" color="textSecondary">
        {valor}
      </AppText>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="caption"
        color={active ? 'onAccent' : 'textSecondary'}
        style={styles.chipText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontWeight: '800',
  },
  pressed: { opacity: 0.7 },
});