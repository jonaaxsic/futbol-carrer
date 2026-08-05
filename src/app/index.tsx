import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
 * Un solo entry point que muestra:
 * - Branding del juego
 * - Si hay carrera: saludo + "Continuar"
 * - Si no hay carrera: "Nueva carrera"
 * - Links a Ajustes y Créditos
 */
export default function IndexScreen() {
  const { estado, error } = useHydrateApp();
  const player = usePlayerStore((s) => s.player);
  const limpiar = usePlayerStore((s) => s.limpiar);
  const tieneCarrera = player != null;

  // Si ya hidrató y hay carrera, ir directo al dashboard
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
      {/* Hero / Branding */}
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

      {/* Acciones principales */}
      <View style={styles.actions}>
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

        {!tieneCarrera && estado !== 'error' && (
          <AppText variant="caption" style={styles.hint}>
            Creá tu jugador y empezá a competir
          </AppText>
        )}
      </View>

      {/* Links secundarios */}
      <View style={styles.footer}>
        <SecondaryButton
          label="Nueva carrera"
          onPress={nuevaCarrera}
          style={tieneCarrera ? undefined : styles.hidden}
        />
        <SecondaryButton
          label="Ajustes"
          onPress={() => router.push('/settings')}
        />
        <SecondaryButton
          label="Créditos"
          onPress={() => router.push('/credits')}
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
  error: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
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
  hint: {
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  hidden: {
    display: 'none',
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
