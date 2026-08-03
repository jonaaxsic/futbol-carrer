import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { ENERGIA_PARTIDO, ENERGIA_ENTRENAMIENTO } from '@/services/energiaService';
import type { SeasonMode } from '@/shared/types';

/**
 * AJUSTES — pantalla secundaria del Menú Principal.
 * El descanso obligatorio ya no existe: fue reemplazado por el sistema de
 * energía (§4.2): jugar cuesta barras, se regenera 1 cada 2 h en tiempo real.
 * El modo de temporada se define al iniciar la carrera (Sprint 1, sin
 * selector funcional aquí) — se elimina el chip decorativo sin efecto.
 */
export default function SettingsScreen() {
  return (
    <ScreenContainer title="Ajustes">
      <ScrollView contentContainerStyle={styles.content}>
        <Fila etiqueta="Idioma" valor="Español" />

        <View style={styles.group}>
          <AppText variant="label" uppercase color="textSecondary">
            Energía (§4.2)
          </AppText>
          <View style={styles.infoCard}>
            <Ionicons name="flash" size={18} color={colors.warning} />
            <AppText variant="caption" color="textSecondary" style={styles.infoTexto}>
              Cada jugador empieza con 10 barras. Jugar un partido cuesta{' '}
              {ENERGIA_PARTIDO} y entrenar cuesta {ENERGIA_ENTRENAMIENTO}. Las barras se
              regeneran solas en tiempo real: 1 cada 2 horas.
            </AppText>
          </View>
        </View>

        <Fila etiqueta="Acerca de" valor="v1.0.0" />
      </ScrollView>
    </ScreenContainer>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <AppText variant="body">{etiqueta}</AppText>
      <AppText variant="body" color="textSecondary">
        {valor}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoTexto: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontWeight: '800',
  },
  pressed: { opacity: 0.7 },
});