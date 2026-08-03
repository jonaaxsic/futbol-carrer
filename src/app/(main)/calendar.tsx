import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import type { Partido } from '@/domain/entities/partido';
import { clubRepository } from '@/data/repositories/club-repository';
import { obtenerCalendarioTemporada } from '@/services/calendarService';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { formatearFechaCorta, formatearMesAnio } from '@/shared/utils/fechas';

/**
 * 10. CALENDARIO / TEMPORADA (wireframe #10)
 * Fixture REAL de la temporada activa, navegable por mes (Sprint 3).
 */
export default function CalendarScreen() {
  const temporadaActiva = usePlayerStore((s) => s.temporadaActiva);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [clubes, setClubes] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [mesIndex, setMesIndex] = useState(0);

  useEffect(() => {
    let activo = true;
    (async () => {
      if (!temporadaActiva) return;
      try {
        const todos = await obtenerCalendarioTemporada(temporadaActiva.id);
        const ids = [...new Set(todos.map((p) => p.rivalClubId))];
        const entradas = await Promise.all(ids.map((id) => clubRepository.findById(id)));
        if (activo) {
          setPartidos(todos);
          setClubes(
            Object.fromEntries(
              entradas.filter((c): c is Club => c != null).map((c) => [c.id, c.nombre]),
            ),
          );
          // Arrancar en el mes del próximo partido no jugado.
          const prox = todos.find((p) => !p.jugo);
          if (prox) setMesIndex(nuevoIndexDe(todos, prox.fechaTs));
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [temporadaActiva]);

  const meses = useMemo(() => {
    const map = new Map<string, Partido[]>();
    for (const p of partidos) {
      const clave = formatearMesAnio(p.fechaTs);
      const arr = map.get(clave) ?? [];
      arr.push(p);
      map.set(clave, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [partidos]);

  if (!temporadaActiva) {
    return (
      <ScreenContainer title="Calendario">
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay una temporada activa.
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  const mesActual = meses[mesIndex] ?? meses[0];

  return (
    <ScreenContainer title="Calendario">
      <View style={styles.content}>
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setMesIndex((i) => Math.max(0, i - 1))}
            disabled={mesIndex === 0}
            hitSlop={10}
            style={({ pressed }) => [
              styles.monthArrow,
              mesIndex === 0 && styles.monthArrowDisabled,
              pressed && styles.pressed,
            ]}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <AppText variant="heading" style={styles.monthTitle}>
            {mesActual?.[0] ?? '—'}
          </AppText>
          <Pressable
            onPress={() => setMesIndex((i) => Math.min(meses.length - 1, i + 1))}
            disabled={mesIndex >= meses.length - 1}
            hitSlop={10}
            style={({ pressed }) => [
              styles.monthArrow,
              mesIndex >= meses.length - 1 && styles.monthArrowDisabled,
              pressed && styles.pressed,
            ]}>
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {cargando ? (
          <ActivityIndicator color={colors.textPrimary} style={styles.carga} />
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {(mesActual?.[1] ?? []).map((p) => (
              <View key={p.id} style={[styles.matchRow, p.jugo && styles.matchRowJugado]}>
                <View style={styles.matchDate}>
                  <AppText variant="label" uppercase>
                    {formatearFechaCorta(p.fechaTs)}
                  </AppText>
                </View>
                <View style={styles.matchInfo}>
                  <AppText
                    variant="body"
                    color={p.jugo ? 'textMuted' : 'textPrimary'}>
                    {p.local ? 'vs ' : 'en casa de '}
                    {clubes[p.rivalClubId] ?? '—'}
                  </AppText>
                  <AppText variant="caption">{p.competencia}</AppText>
                </View>
                {p.jugo ? (
                  <AppText variant="label" color={resultadoColor(p)}>
                    {p.resultado}
                  </AppText>
                ) : (
                  <Ionicons
                    name={p.local ? 'home' : 'arrow-up-circle'}
                    size={20}
                    color={p.local ? colors.success : colors.info}
                  />
                )}
              </View>
            ))}
            {mesActual && mesActual[1].length === 0 && (
              <AppText variant="body" color="textMuted" style={styles.sinPartidos}>
                Sin partidos este mes
              </AppText>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}

/** Índice del mes (en el mapa ordenado) que contiene la fecha dada. */
function nuevoIndexDe(partidos: Partido[], fechaTs: number): number {
  const mapa = new Map<string, Partido[]>();
  for (const p of partidos) {
    const clave = formatearMesAnio(p.fechaTs);
    const arr = mapa.get(clave) ?? [];
    arr.push(p);
    mapa.set(clave, arr);
  }
  const claves = [...mapa.keys()].sort((a, b) => a.localeCompare(b));
  const claveObjetivo = formatearMesAnio(fechaTs);
  return Math.max(0, claves.indexOf(claveObjetivo));
}

function resultadoColor(p: Partido): keyof typeof colors {
  const [goles, recibidos] = p.resultado?.split('-').map(Number) ?? [0, 0];
  if (goles > recibidos) return 'success';
  if (goles < recibidos) return 'danger';
  return 'textSecondary';
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: spacing.sm },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  monthTitle: { minWidth: 140, textAlign: 'center' },
  carga: { marginTop: spacing.xl },
  list: { flex: 1 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.lg },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  matchRowJugado: { opacity: 0.75 },
  matchDate: { width: 64 },
  matchInfo: { flex: 1 },
  sinPartidos: { textAlign: 'center', marginTop: spacing.lg },
});