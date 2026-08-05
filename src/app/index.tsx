import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/state/usePlayerStore';
import { useHydrateApp } from '@/state/useHydrateApp';
import { resetCarrera } from '@/services/careerService';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * PANTALLA UNIFICADA: Splash + Login + Menú
 * Responsive: web usa layout horizontal, mobile vertical.
 */
export default function IndexScreen() {
  const { estado, error } = useHydrateApp();
  const player = usePlayerStore((s) => s.player);
  const limpiar = usePlayerStore((s) => s.limpiar);
  const tieneCarrera = player != null;
  const { width: screenWidth } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isWide = screenWidth > 600;

  useEffect(() => {
    if (estado === 'lista' && player) {
      router.replace('/(main)');
    }
  }, [estado, player]);

  const nuevaCarrera = () => {
    if (tieneCarrera) {
      Alert.alert(
        '¿Empezar de nuevo?',
        'Hay una carrera guardada. Al crear una nueva, se borrará por completo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Empezar de nuevo',
            style: 'destructive',
            onPress: async () => {
              await resetCarrera();
              limpiar();
              router.push('/country');
            },
          },
        ],
      );
    } else {
      router.push('/country');
    }
  };

  const estaCargando = estado === 'cargando';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.main, isWide && styles.mainWide]}>
        {/* Hero / Branding */}
        <View style={[styles.hero, isWide && styles.heroWide]}>
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

        {/* Acciones principales */}
        <View style={[styles.actions, isWide && styles.actionsWide]}>
          {tieneCarrera && (
            <View style={styles.playerInfo}>
              <View style={styles.avatar}>
                <AppText variant="heading" color="onAccent">
                  {player.nombre.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.playerDetails}>
                <AppText variant="body">{player.nombre}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {player.edad} años · OVR {player.ovr} · {player.posicion}
                </AppText>
              </View>
            </View>
          )}

          {/* Botones principales */}
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            {tieneCarrera ? (
              <PrimaryButton
                label="Continuar"
                disabled={estaCargando}
                onPress={() => router.replace('/(main)')}
              />
            ) : (
              <PrimaryButton
                label="Nueva carrera"
                disabled={estaCargando || estado === 'error'}
                onPress={() => router.push('/country')}
              />
            )}
          </View>

          {/* Links secundarios */}
          <View style={[styles.footerLinks, isWide && styles.footerLinksWide]}>
            {tieneCarrera && (
              <SecondaryButton label="Nueva carrera" onPress={nuevaCarrera} />
            )}
            <SecondaryButton
              label="Ajustes"
              onPress={() => router.push('/settings')}
            />
            <SecondaryButton
              label="Créditos"
              onPress={() => router.push('/credits')}
            />
          </View>
        </View>
      </View>

      <AppText variant="caption" style={styles.version}>
        v1.0.0
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  mainWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroWide: {
    marginBottom: spacing.xxl,
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
  error: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  actionsWide: {
    gap: spacing.lg,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  buttonRow: {
    gap: spacing.sm,
  },
  buttonRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerLinks: {
    gap: spacing.sm,
  },
  footerLinksWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  version: {
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
});
