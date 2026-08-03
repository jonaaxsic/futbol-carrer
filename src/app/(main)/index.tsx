import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import { clubRepository } from '@/data/repositories/club-repository';
import { playerRepository } from '@/data/repositories/player-repository';
import { obtenerProximosPartidos } from '@/services/calendarService';
import { cerrarTemporada, simularTemporadaCompleta } from '@/services/seasonService';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useCierreStore } from '@/state/useCierreStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * 8. HOME / DASHBOARD (flujo estilo Copero).
 * Simple: 1 toque = simular TODA la temporada (motor puro, fixture completo).
 * El resultado se muestra acá; al terminar, se cierra la temporada y el
 * resumen decide trofeos, selección y ofertas. Sin mercado, sin micro-gestión.
 */
export default function DashboardScreen() {
  const player = usePlayerStore((s) => s.player);
  const temporadaActiva = usePlayerStore((s) => s.temporadaActiva);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);
  const fijarCierre = useCierreStore((s) => s.fijar);

  const [club, setClub] = useState<Club | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const [resumen, setResumen] = useState<{
    victorias: number;
    derrotas: number;
    goles: number;
    asistencias: number;
  } | null>(null);

  const cargar = useCallback(async () => {
    if (!player || !temporadaActiva) return;
    try {
      const [clubData, partidos] = await Promise.all([
        player.clubId ? clubRepository.findById(player.clubId) : Promise.resolve(null),
        obtenerProximosPartidos(temporadaActiva.id, Date.now(), 100),
      ]);
      setClub(clubData);
      setPendientes(partidos.length);
    } finally {
      setCargando(false);
    }
  }, [player, temporadaActiva]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!player || !temporadaActiva) {
    return (
      <ScreenContainer>
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay una carrera activa. Volvé al menú y creá una.
          </AppText>
          <PrimaryButton label="Ir al menú" onPress={() => router.replace('/menu')} />
        </View>
      </ScreenContainer>
    );
  }

  async function simular() {
    if (!player || !temporadaActiva || !club || ocupado) return;
    setOcupado(true);
    try {
      const resultado = await simularTemporadaCompleta(player, temporadaActiva, club);
      setResumen({
        victorias: resultado.victorias,
        derrotas: resultado.derrotas,
        goles: resultado.goles,
        asistencias: resultado.asistencias,
      });
      setPendientes(0);
      // Releer jugador (pudo ajustarse OVR por rendimiento).
      const jugadorActualizado = await playerRepository.findById(player.id);
      if (jugadorActualizado) setPlayer(jugadorActualizado);
    } finally {
      setOcupado(false);
    }
  }

  async function cerrar() {
    if (!player || !temporadaActiva || !club || ocupado) return;
    setOcupado(true);
    try {
      const cierre = await cerrarTemporada(player, temporadaActiva, club, player.pais);
      fijarCierre(cierre);
      setPlayer(cierre.player);
      setTemporadaActiva(cierre.nuevaTemporada);
      setResumen(null);
      router.push('/season-summary');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        {cargando && <ActivityIndicator color={colors.textPrimary} style={styles.carga} />}

        {/* Identidad */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.onAccent} />
          </View>
          <View style={styles.identityInfo}>
            <AppText variant="heading">{player.nombre}</AppText>
            <AppText variant="caption">
              {player.edad} años · {player.pais} · {player.posicion}
            </AppText>
          </View>
          <View style={styles.ovrBadge}>
            <AppText variant="caption" color="onAccent">
              OVR
            </AppText>
            <AppText variant="heading" color="onAccent">
              {player.ovr}
            </AppText>
          </View>
        </View>

        {/* Club */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield" size={18} color={colors.textSecondary} />
            <AppText variant="label" uppercase color="textSecondary">
              Club
            </AppText>
          </View>
          <AppText variant="body">{club?.nombre ?? '—'}</AppText>
          <AppText variant="caption" color="textMuted">
            Temporada {temporadaActiva.anioInicio} · {temporadaActiva.modo === 'rapido' ? 'rápido' : 'normal'}
          </AppText>
        </View>

        {/* Resultado de la simulación */}
        {resumen ? (
          <View style={styles.card}>
            <AppText variant="label" uppercase color="textSecondary">
              Temporada completa
            </AppText>
            <View style={styles.statsRow}>
              <MiniStat label="Victorias" valor={resumen.victorias} />
              <MiniStat label="Derrotas" valor={resumen.derrotas} />
              <MiniStat label="Goles" valor={resumen.goles} />
              <MiniStat label="Asistencias" valor={resumen.asistencias} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <AppText variant="label" uppercase color="textSecondary">
              Temporada {temporadaActiva.anioInicio}
            </AppText>
            <AppText variant="body">
              {pendientes > 0
                ? `${pendientes} partidos esperando. Tocá SIMULAR para jugarlos todos de una vez.`
                : 'Temporada jugada. Cerrá para conocer tu destino.'}
            </AppText>
          </View>
        )}

        <View style={styles.actions}>
          {pendientes > 0 ? (
            <PrimaryButton label="Simular temporada" onPress={simular} disabled={ocupado} />
          ) : (
            <PrimaryButton label="Cerrar temporada" onPress={cerrar} disabled={ocupado} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

function MiniStat({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={styles.miniStat}>
      <AppText variant="heading">{valor}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  carga: { marginTop: spacing.lg },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1 },
  ovrBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
  },
  actions: { marginTop: 'auto', gap: spacing.md },
});