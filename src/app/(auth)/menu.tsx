import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { resetCarrera } from '@/services/careerService';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 3. MENÚ PRINCIPAL (wireframe #2)
 * Hub central una vez identificado el usuario.
 * Sprint 2: "Continuar" se habilita si existe carrera guardada en SQLite;
 * "Nueva carrera" confirma antes de sobrescribir la actual.
 */
export default function MenuScreen() {
  const player = usePlayerStore((s) => s.player);
  const limpiar = usePlayerStore((s) => s.limpiar);
  const tieneCarrera = player != null;

  const nuevaCarrera = () => {
    const ir = () => router.push('/country');
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
              ir();
            },
          },
        ],
      );
    } else {
      ir();
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <AppText variant="heading" color="onAccent">
              {(player?.nombre ?? 'J').charAt(0).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.userInfo}>
            <AppText variant="heading">¡Hola, {player?.nombre ?? 'jugador'}!</AppText>
            <AppText variant="caption">
              {tieneCarrera
                ? `${player.edad} años · OVR ${player.ovr}`
                : 'Sin carrera guardada todavía'}
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Continuar"
            disabled={!tieneCarrera}
            onPress={() => router.replace('/(main)')}
          />
          {!tieneCarrera && (
            <AppText variant="caption" style={styles.hint}>
              Empezá una carrera nueva para desbloquear
            </AppText>
          )}

          <SecondaryButton label="Nueva carrera" onPress={nuevaCarrera} />
          <SecondaryButton label="Ajustes" onPress={() => router.push('/settings')} />
          <SecondaryButton label="Créditos" onPress={() => router.push('/credits')} />
          <SecondaryButton
            label="Salir"
            onPress={() => router.replace('/login')}
            style={styles.exit}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  iconButton: {
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
  actions: {
    gap: spacing.md,
  },
  hint: {
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  exit: {
    marginTop: spacing.sm,
    borderColor: colors.danger,
  },
});