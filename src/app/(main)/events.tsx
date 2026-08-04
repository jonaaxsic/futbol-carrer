import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import type { EventoLog } from '@/domain/entities/evento-log';
import { eventoLogRepository } from '@/data/repositories/evento-log-repository';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { formatearFechaLarga } from '@/shared/utils/fechas';

/**
 * TAB EVENTOS — historial real de eventos del jugador (evento_log).
 * Sprint 5: se puebla con el motor ponderado (partidos, entrenamientos).
 */
const ICONO_POR_TIPO: Record<EventoLog['tipo'], keyof typeof Ionicons.glyphMap> = {
  lesion: 'bandage',
  prensa: 'newspaper',
  oferta: 'briefcase',
  decision: 'git-compare',
  banca: 'basket',
  penal: 'football',
  otro: 'alert-circle',
};

export default function EventsScreen() {
  const player = usePlayerStore((s) => s.player);
  const [eventos, setEventos] = useState<EventoLog[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!player) return;
    try {
      const lista = await eventoLogRepository.findRecientes(player.id, 50);
      setEventos(lista);
    } finally {
      setCargando(false);
    }
  }, [player]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!player) {
    return (
      <ScreenContainer title="Eventos">
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay una carrera activa.
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Eventos">
      {cargando ? null : eventos.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="newspaper" size={40} color={colors.textMuted} />
          </View>
          <AppText variant="heading" color="textSecondary" style={styles.center}>
            Sin eventos todavía
          </AppText>
          <AppText variant="caption" style={styles.center}>
            Jugá partidos y entrená: lesiones, prensa, ofertas y decisiones aparecerán acá.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.evento}>
              <View style={styles.icono}>
                <Ionicons
                  name={ICONO_POR_TIPO[item.tipo] ?? 'alert-circle'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
              <View style={styles.info}>
                <AppText variant="body">{item.descripcion}</AppText>
                <AppText variant="caption" color="textMuted">
                  {formatearFechaLarga(item.fechaTs)}
                </AppText>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  lista: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  evento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
});