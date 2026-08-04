import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Trofeo } from '@/domain/entities/trofeo';
import { trofeoRepository } from '@/data/repositories/trofeo-repository';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

type TabCategoria = 'club' | 'seleccion' | 'individual';

const TABS: { id: TabCategoria; label: string }[] = [
  { id: 'club', label: 'Club' },
  { id: 'seleccion', label: 'Selección' },
  { id: 'individual', label: 'Individual' },
];

/**
 * 14. TROFEOS (wireframe #14) — Sprint 6 real.
 * Lista desde la tabla `trofeo` con filtros por categoría.
 */
export default function TrophiesScreen() {
  const player = usePlayerStore((s) => s.player);
  const [tab, setTab] = useState<TabCategoria>('club');
  const [trofeos, setTrofeos] = useState<Trofeo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    if (player) {
      trofeoRepository.findByPlayer(player.id).then((lista) => {
        if (!activo) return;
        setTrofeos(lista);
        setCargando(false);
      });
    }
    return () => {
      activo = false;
    };
  }, [player]);

  const filtrados = trofeos.filter((t) => t.nivel === tab);

  return (
    <ScreenContainer title="Trofeos">
      <View style={styles.content}>
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, active && styles.tabActive]}>
                <AppText variant="label" uppercase color={active ? 'onAccent' : 'textSecondary'}>
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {!cargando && player == null ? (
          <View style={styles.centro}>
            <AppText variant="body" color="textSecondary">
              No hay una carrera activa.
            </AppText>
          </View>
        ) : filtrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy" size={44} color={colors.textMuted} />
            <AppText variant="body" color="textSecondary" style={styles.emptyText}>
              Aún no tienes trofeos en{' '}
              {TABS.find((t) => t.id === tab)?.label.toLowerCase()}. Ganá ligas, copas y
              convocatorias para llenar esta vitrina.
            </AppText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {filtrados.map((trofeo) => (
              <View key={trofeo.id} style={styles.trofeo}>
                <View style={styles.iconoTrofeo}>
                  <Ionicons name="trophy" size={24} color={colors.warning} />
                </View>
                <View style={styles.info}>
                  <AppText variant="body">{trofeo.nombre}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {trofeo.competencia} · {trofeo.anio}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  listContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
  },
  trofeo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconoTrofeo: {
    width: 44,
    height: 44,
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