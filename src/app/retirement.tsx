import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { obtenerResumenRetiro, retirarJugador, resetCarrera, type ResumenRetiro } from '@/services/careerService';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 15. FIN DE CARRERA (wireframe #15) — Sprint 7 real.
 * Tarjeta final estilo Copero: clubes, goles, asistencias, trofeos y mejor OVR
 * desde career_history + trophy + temporada. Al entrar, el jugador queda
 * RETIRADO en BD (estado='retirado', bug fix); al continuar, nueva carrera.
 */
export default function RetirementScreen() {
  const player = usePlayerStore((s) => s.player);
  const [resumen, setResumen] = useState<ResumenRetiro | null>(null);
  const [retirando, setRetirando] = useState(() => !player);

  useEffect(() => {
    let activo = true;
    if (player) {
      // Persiste el retiro (estado = 'retirado') y junta el resumen final.
      retirarJugador(player.id)
        .then((r) => {
          if (activo) setResumen(r);
        })
        .finally(() => {
          if (activo) setRetirando(false);
        });
    }
    return () => {
      activo = false;
    };
  }, [player]);

  return (
    <ScreenContainer
      title=""
      footer={
        <PrimaryButton
          label="Nueva carrera"
          onPress={() => {
            usePlayerStore.getState().limpiar();
            router.replace('/country');
          }}
        />
      }>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.trophy}>
          <Ionicons name="trophy" size={56} color={colors.warning} />
        </View>

        <AppText variant="title" uppercase style={styles.center}>
          Fin de tu carrera
        </AppText>
        <AppText variant="caption" style={styles.center}>
          {resumen ? `${resumen.player.nombre} · ${resumen.player.posicion}` : 'La leyenda se retira'}
        </AppText>

        {resumen && (
          <>
            <View style={styles.grid}>
              <StatCell label="Partidos" valor={resumen.totalPj} />
              <StatCell label="Goles" valor={resumen.totalGoles} />
              <StatCell label="Asist." valor={resumen.totalAsistencias} />
              <StatCell label="Clubes" valor={resumen.clubes.length} />
              <StatCell label="Trofeos" valor={resumen.trofeos.length} />
              <StatCell label="Mejor OVR" valor={resumen.mejorOvr} />
            </View>

            <View style={styles.card}>
              <AppText variant="label" uppercase color="textSecondary">
                Clubes
              </AppText>
              {resumen.clubes.map((c, i) => (
                <View key={i} style={styles.clubRow}>
                  <Ionicons name="shield" size={16} color={colors.textSecondary} />
                  <View style={styles.clubInfo}>
                    <AppText variant="body">{c.nombre}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {c.anioInicio}
                      {c.anioFin ? ` – ${c.anioFin}` : ' – presente'}
                    </AppText>
                  </View>
                  <View style={styles.stars}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Ionicons
                        key={s}
                        name={s < c.prestigio ? 'star' : 'star-outline'}
                        size={12}
                        color={s < c.prestigio ? colors.warning : colors.textMuted}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {resumen.trofeos.length > 0 && (
              <View style={styles.card}>
                <AppText variant="label" uppercase color="textSecondary">
                  Trofeos
                </AppText>
                {resumen.trofeos.map((t) => (
                  <View key={t.id} style={styles.clubRow}>
                    <Ionicons name="trophy" size={16} color={colors.warning} />
                    <View style={styles.clubInfo}>
                      <AppText variant="body">{t.nombre}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {t.competencia} · {t.anio}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCell({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={styles.statCell}>
      <AppText variant="heading">{valor}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
  trophy: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  statCell: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clubInfo: {
    flex: 1,
  },
  stars: { flexDirection: 'row', gap: 1 },
});