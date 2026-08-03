import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { inicializarBase } from '@/data/db/inicializar';
import { colors } from '@/presentation/theme';

/**
 * Layout raíz: Stack principal + tema oscuro forzado (el wireframe es dark-only).
 * Al montar arranca la persistencia (abre BD, migra y siembra clubes) —
 * fire-and-forget: el Splash espera con `useHydrateApp`.
 * Los grupos (auth), (onboarding) y (main) y las pantallas overlay
 * (training, penalty, event, trophies, retirement, settings, credits)
 * se registran automáticamente por convención de archivos de expo-router.
 */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export default function RootLayout() {
  useEffect(() => {
    void inicializarBase();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </ThemeProvider>
  );
}