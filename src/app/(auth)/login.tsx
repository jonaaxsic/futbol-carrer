import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { obtenerJugadorActivo } from '@/services/playerService';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 2. LOGIN / INICIAR SESIÓN (wireframe #3)
 * Solo "Continuar como invitado" es funcional (juego offline).
 * Google/Facebook: UI presente pero inactiva ("PRÓXIMAMENTE") hasta definir backend.
 * Sprint 2: consulta la tabla player → con carrera va a /menu; nuevo → /country.
 */
export default function LoginScreen() {
  const [cargando, setCargando] = useState(false);

  const entrarComoInvitado = async () => {
    setCargando(true);
    try {
      const jugador = await obtenerJugadorActivo();
      router.replace(jugador ? '/menu' : '/country');
    } finally {
      setCargando(false);
    }
  };
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <AppText variant="title" uppercase style={styles.title}>
          Iniciar sesión
        </AppText>

        <View style={styles.actions}>
          <SecondaryButton label="Continuar con Google" disabled>
            <Ionicons name="logo-google" size={18} color={colors.textSecondary} />
          </SecondaryButton>
          <SecondaryButton label="Continuar con Facebook" disabled>
            <Ionicons name="logo-facebook" size={18} color={colors.textSecondary} />
          </SecondaryButton>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AppText variant="caption">o</AppText>
            <View style={styles.dividerLine} />
          </View>

          <PrimaryButton
            label="Continuar como invitado"
            disabled={cargando}
            onPress={entrarComoInvitado}
          />

          <Pressable onPress={() => router.push('/country')}>
            <AppText variant="caption" style={styles.link} color="textSecondary">
              ¿No tienes cuenta? Crea una nueva
            </AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.footerActions}>
        <Pressable onPress={() => router.push('/credits')}>
          <AppText variant="caption" style={styles.link}>
            Créditos
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  linkText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: spacing.sm,
  },
  footerActions: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  link: {
    textDecorationLine: 'underline',
  },
});