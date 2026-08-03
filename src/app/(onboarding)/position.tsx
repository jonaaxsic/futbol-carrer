import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { POSICIONES, type Posicion } from '@/domain/value-objects/posicion';
import { useOnboardingStore } from '@/state/useOnboardingStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/presentation/components/atoms/button';
import { ProgressStepBar } from '@/presentation/components/atoms/progress-step-bar';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

const descripcionDe = (id: Posicion) =>
  POSICIONES.find((p) => p.id === id)?.descripcion ?? '';

/**
 * 6. SELECCIONAR POSICIÓN (wireframe #6) — onboarding paso 3 de 4.
 * Cancha táctica (PositionPitch) con posiciones tocables.
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

        <PositionPitch seleccion={seleccion} onSeleccionar={setSeleccion} />

        <View style={styles.descripcionBox}>
          <AppText variant="body" color={seleccion ? 'textPrimary' : 'textMuted'}>
            {seleccion ? descripcionDe(seleccion) : 'Selecciona una posición para ver su descripción'}
          </AppText>
        </View>
      </View>
    </ScreenContainer>
  );
}

/**
 * Cancha táctica simplificada (4-3-3 como en el wireframe).
 * Organismo temporal: en Sprint 2 se refina como componente propio.
 */
function PositionPitch({
  seleccion,
  onSeleccionar,
}: {
  seleccion: Posicion | null;
  onSeleccionar: (id: Posicion) => void;
}) {
  const filas: { ids: Posicion[]; justify: 'center' | 'space-between' | 'space-evenly' }[] = [
    { ids: ['POR'], justify: 'center' },
    { ids: ['LI', 'DFC', 'DFC', 'LD'], justify: 'space-between' },
    { ids: ['MC', 'MC'], justify: 'space-evenly' },
    { ids: ['MCO'], justify: 'center' },
    { ids: ['EI', 'ED'], justify: 'space-between' },
    { ids: ['DC'], justify: 'center' },
  ];

  return (
    <View style={styles.pitch}>
      <View style={styles.pitchLine} />
      <View style={styles.pitchCircle} />
      {filas.map((fila, i) => (
        <View key={i} style={[styles.pitchRow, { justifyContent: fila.justify }]}>
          {fila.ids.map((id, j) => (
            <Pressable
              key={`${id}-${j}`}
              onPress={() => onSeleccionar(id)}
              style={[
                styles.positionChip,
                seleccion === id && styles.positionChipActive,
              ]}>
              <AppText
                variant="caption"
                color={seleccion === id ? 'onAccent' : 'textPrimary'}
                style={styles.positionText}>
                {id}
              </AppText>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
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
  pitch: {
    aspectRatio: 0.75,
    backgroundColor: colors.pitch,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.pitchLine,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pitchLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: colors.pitchLine,
  },
  pitchCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 72,
    height: 72,
    marginLeft: -36,
    marginTop: -36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.pitchLine,
  },
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionChip: {
    width: 52,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: colors.pitchLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  positionText: {
    fontWeight: '800',
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
