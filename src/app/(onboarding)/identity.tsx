import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useOnboardingStore } from '@/state/useOnboardingStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ProgressStepBar } from '@/presentation/components/atoms/progress-step-bar';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

type Pierna = 'izquierda' | 'derecha';

/**
 * 5. INTRODUCIR DATOS / IDENTIDAD (wireframe #5) — onboarding paso 2 de 4.
 * Apodo + número + pierna hábil, con JerseyPreview en vivo.
 * Sprint 2: al confirmar, se guarda en el borrador del jugador.
 */
export default function IdentityScreen() {
  const identidad = useOnboardingStore((s) => ({
    nombre: s.nombre,
    numero: s.numero,
    pierna: s.pierna,
  }));
  const setIdentidad = useOnboardingStore((s) => s.setIdentidad);

  const [nombre, setNombre] = useState(identidad.nombre);
  const [numero, setNumero] = useState(identidad.numero === 10 ? '' : String(identidad.numero));
  const [pierna, setPierna] = useState<Pierna>(identidad.pierna);

  const numeroValido = /^\d{1,2}$/.test(numero) && Number(numero) >= 1 && Number(numero) <= 99;
  const habilitado = nombre.trim().length > 0 && numeroValido;

  const numeroMostrado = numeroValido ? numero : '10';

  const continuar = () => {
    setIdentidad({
      nombre: nombre.trim(),
      numero: Number(numero),
      pierna,
    });
    router.push('/position');
  };

  return (
    <ScreenContainer
      footer={
        <>
          <SecondaryButton label="Volver" onPress={() => router.back()} />
          <PrimaryButton
            label="Continuar"
            disabled={!habilitado}
            onPress={continuar}
          />
        </>
      }>
      <View style={styles.content}>
        <ProgressStepBar current={2} total={4} />
        <AppText variant="title" uppercase>
          Introduce tus datos
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Paso 2 de 4 · Así lucirá tu camiseta
        </AppText>

        {/* Vista previa de camiseta (JerseyPreview en vivo) */}
        <View style={styles.jersey}>
          <AppText variant="label" uppercase color="textSecondary">
            {(nombre.trim() || 'APELLIDO').toUpperCase()}
          </AppText>
          <AppText variant="title" style={styles.jerseyNumber}>
            {numeroMostrado}
          </AppText>
          <View style={styles.jerseySleeves} />
        </View>

        <AppText variant="label" uppercase>
          Apellido / Apodo
        </AppText>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. El Mago"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={20}
          autoCapitalize="characters"
        />

        <AppText variant="label" uppercase>
          Número (1-99)
        </AppText>
        <TextInput
          value={numero}
          onChangeText={(t) => setNumero(t.replace(/[^0-9]/g, ''))}
          placeholder="10"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={2}
        />

        <AppText variant="label" uppercase>
          Pierna hábil
        </AppText>
        <View style={styles.piernaRow}>
          {(['izquierda', 'derecha'] as const).map((p) => {
            const active = pierna === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPierna(p)}
                style={[
                  styles.piernaOption,
                  active && styles.piernaOptionActive,
                ]}>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <AppText variant="body" color={active ? 'textPrimary' : 'textSecondary'}>
                  {p === 'izquierda' ? 'Izquierda' : 'Derecha'}
                </AppText>
              </Pressable>
            );
          })}
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
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  jersey: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  jerseySleeves: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    height: 3,
    backgroundColor: colors.border,
  },
  jerseyNumber: {
    fontSize: 64,
    lineHeight: 68,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  piernaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  piernaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  piernaOptionActive: {
    borderColor: colors.accent,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});