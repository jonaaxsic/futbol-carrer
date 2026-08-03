import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { resolverPenal } from '@/services/eventService';
import { usePlayerStore } from '@/state/usePlayerStore';

type Direccion = 'izquierda' | 'centro' | 'derecha';

const DIRECCIONES: readonly { id: Direccion; icono: 'arrow-back' | 'remove' | 'arrow-forward' }[] = [
  { id: 'izquierda', icono: 'arrow-back' },
  { id: 'centro', icono: 'remove' },
  { id: 'derecha', icono: 'arrow-forward' },
];

/**
 * 12. DEFINIR PENAL (wireframe #12) — Sprint 5 real.
 * Input izquierda/centro/derecha → resultado probabilístico por OVR y
 * posición (regla pura patearPenal). El resultado se registra en evento_log.
 */
export default function PenaltyScreen() {
  const player = usePlayerStore((s) => s.player);
  const [direccion, setDireccion] = useState<Direccion | null>(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [resultado, setResultado] = useState<{ gol: boolean; mensaje: string } | null>(null);

  async function patear() {
    if (!player || !direccion || resolviendo) return;
    setResolviendo(true);
    try {
      const r = await resolverPenal(player, direccion);
      setResultado({ gol: r.gol, mensaje: r.mensaje });
    } finally {
      setResolviendo(false);
    }
  }

  return (
    <ScreenContainer
      title="Penal"
      footer={
        resultado != null ? (
          <PrimaryButton label="Continuar" onPress={() => router.back()} />
        ) : (
          <PrimaryButton
            label="Patear"
            disabled={direccion == null || resolviendo}
            onPress={patear}
          />
        )
      }>
      <View style={styles.content}>
        <AppText variant="heading" uppercase style={styles.subtitle}>
          ¡Tienes un penal! ¿Dónde patear?
        </AppText>

        <View style={styles.goal}>
          {resultado != null ? (
            <Ionicons
              name={resultado.gol ? 'trophy' : 'hand-left'}
              size={48}
              color={resultado.gol ? colors.success : colors.danger}
            />
          ) : (
            <Ionicons name="football" size={48} color={colors.textPrimary} />
          )}
          <AppText variant="caption">
            {resultado == null
              ? `Arco · tu OVR ${player?.ovr ?? '—'} define la probabilidad`
              : resultado.mensaje}
          </AppText>
        </View>

        <View style={styles.directions}>
          {DIRECCIONES.map((dir) => {
            const activa = direccion === dir.id;
            return (
              <Pressable
                key={dir.id}
                onPress={() => {
                  setDireccion(dir.id);
                  setResultado(null);
                }}
                style={({ pressed }) => [
                  styles.directionButton,
                  activa && styles.directionButtonActive,
                  pressed && styles.pressed,
                ]}>
                <Ionicons
                  name={dir.icono}
                  size={22}
                  color={activa ? colors.onAccent : colors.textPrimary}
                />
                <AppText variant="label" uppercase color={activa ? 'onAccent' : 'textPrimary'}>
                  {dir.id}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {resultado != null && (
          <View
            style={[
              styles.resultado,
              { borderColor: resultado.gol ? colors.success : colors.danger },
            ]}>
            <AppText
              variant="label"
              uppercase
              color={resultado.gol ? 'success' : 'danger'}>
              {resultado.gol ? 'GOL' : 'ATAJADO'}
            </AppText>
            <AppText variant="body" color="textSecondary">
              {resultado.mensaje}
            </AppText>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
  },
  goal: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  directions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  directionButton: {
    flex: 1,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  directionButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: { opacity: 0.75 },
  resultado: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
});