import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formacionPorNombre } from '@/domain/value-objects/formacion';
import { POSICIONES, type Posicion } from '@/domain/value-objects/posicion';
import { useOnboardingStore } from '@/state/useOnboardingStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ProgressStepBar } from '@/presentation/components/atoms/progress-step-bar';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { FormationPitch } from '@/presentation/components/organisms/formation-pitch';
import { colors, radius, spacing } from '@/presentation/theme';

const descripcionDe = (id: Posicion) =>
  POSICIONES.find((p) => p.id === id)?.descripcion ?? '';

// 4-2-3-1 contiene las 9 posiciones seleccionables (design D5).
const FORMACION_ONBOARDING = formacionPorNombre('4-2-3-1');

/**
 * 6. SELECCIONAR POSICIÓN (wireframe #6) — onboarding paso 3 de 4.
 * Cancha táctica (FormationPitch) con posiciones tocables.
 * Las descripciones vienen del value-object del dominio (una sola fuente).
 * Sprint 2: la posición se guarda en el borrador del jugador.
 */
export default function PositionScreen() {
  const posicionGuardada = useOnboardingStore((s) => s.posicion);
  const setPosicion = useOnboardingStore((s) => s.setPosicion);
  const [seleccion, setSeleccion] = useState<Posicion | null>(posicionGuardada);

  const continuar = () => {
    if (seleccion) {
      setPosicion(seleccion);
      router.push('/club');
    }
  };

  return (
    <ScreenContainer
      footer={
        <>
          <SecondaryButton label="Volver" onPress={() => router.back()} />
          <PrimaryButton
            label="Elegir club"
            disabled={seleccion == null}
            onPress={continuar}
          />
        </>
      }>
      <View style={styles.content}>
        <ProgressStepBar current={3} total={4} />
        <AppText variant="title" uppercase>
          Elige tu posición
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Paso 3 de 4 · Toca la posición en la cancha
        </AppText>

        <FormationPitch
          formacion={FORMACION_ONBOARDING}
          seleccion={seleccion}
          onSeleccionar={setSeleccion}
        />

        <View style={styles.descripcionBox}>
          <AppText variant="body" color={seleccion ? 'textPrimary' : 'textMuted'}>
            {seleccion ? descripcionDe(seleccion) : 'Selecciona una posición para ver su descripción'}
          </AppText>
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
  descripcionBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 72,
  },
});
