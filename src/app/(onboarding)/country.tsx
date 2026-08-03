import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useOnboardingStore } from '@/state/useOnboardingStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ProgressStepBar } from '@/presentation/components/atoms/progress-step-bar';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { COUNTRIES, type Country } from '@/shared/constants/game';

/**
 * 4. SELECCIONAR PAÍS (wireframe #4) — onboarding paso 1 de 4.
 * Define la nacionalidad (clave para convocatorias a selección en temporadas).
 * Sprint 2: se guarda en el borrador del jugador (useOnboardingStore).
 */
export default function CountryScreen() {
  const [search, setSearch] = useState('');
  const paisGuardado = useOnboardingStore((s) => s.pais);
  const setPais = useOnboardingStore((s) => s.setPais);
  const [selected, setSelected] = useState<Country | null>(paisGuardado);

  const filtered = COUNTRIES.filter((c) =>
    c.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')),
  );

  const continuar = () => {
    if (selected) {
      setPais(selected);
      router.push('/identity');
    }
  };

  return (
    <ScreenContainer
      footer={
        <>
          <SecondaryButton label="Volver" onPress={() => router.back()} />
          <PrimaryButton
            label="Continuar"
            disabled={selected == null}
            onPress={continuar}
          />
        </>
      }>
      <View style={styles.content}>
        <ProgressStepBar current={1} total={4} />
        <AppText variant="title" uppercase>
          Seleccionar país
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Paso 1 de 4 · Tu nacionalidad define tu selección nacional
        </AppText>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar país…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selected === item;
            return (
              <Pressable
                onPress={() => setSelected(item)}
                style={({ pressed }) => [
                  styles.countryRow,
                  isSelected && styles.countryRowSelected,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.flagPlaceholder}>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={18} color={colors.onAccent} />
                  ) : (
                    <AppText variant="caption" color="textSecondary">
                      {item.slice(0, 2).toUpperCase()}
                    </AppText>
                  )}
                </View>
                <AppText variant="body" style={styles.countryName} color={isSelected ? 'textPrimary' : 'textSecondary'}>
                  {item}
                </AppText>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            );
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  countryRowSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
  },
  flagPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryName: {
    flex: 1,
  },
  pressed: { opacity: 0.7 },
});