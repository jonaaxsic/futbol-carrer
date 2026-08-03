import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useCierreStore } from '@/state/useCierreStore';
import { useEventoVistaStore } from '@/state/useEventoVistaStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/atoms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * RESUMEN DE TEMPORADA (§4.5 — Sprint 6, flujo estilo Copero).
 * Overlay sin tab bar: muestra stats de la temporada cerrada, trofeos ganados,
 * convocatoria a selección y posible cambio de club. Si el motor decidió un
 * evento narrativo, se navega a la pantalla de decisión antes de continuar.
 */
export default function SeasonSummaryScreen() {
  const resumen = useCierreStore((s) => s.resumen);
  const limpiar = useCierreStore((s) => s.limpiar);
  const fijarEvento = useEventoVistaStore((s) => s.fijar);

  function continuar() {
    limpiar();
    router.back();
  }

  function tomarDecision() {
    if (!resumen?.decision) return;
    fijarEvento(resumen.decision);
    limpiar();
    router.push('/event');
  }

  function finDeCarrera() {
    limpiar();
    router.replace('/retirement');
  }

  if (!resumen) {
    return (
      <ScreenContainer
        title="Temporada"
        footer={<PrimaryButton label="Volver" onPress={continuar} />}>
        <View style={styles.centro}>
          <AppText variant="body" color="textSecondary">
            No hay un cierre de temporada pendiente.
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  const t = resumen.temporadaCerrada;

  return (
    <ScreenContainer
      title="Temporada finalizada"
      footer={
        resumen.retiro?.seRetira ? (
          <PrimaryButton label="Ver fin de carrera" onPress={finDeCarrera} />
        ) : resumen.decision ? (
          <PrimaryButton label="Tomar decisión" onPress={tomarDecision} />
        ) : (
          <PrimaryButton label="Continuar" onPress={continuar} />
        )
      }>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="label" uppercase color="textSecondary" style={styles.centrado}>
          Temporada {t.anioInicio} · {t.modo === 'rapido' ? 'modo rápido' : 'modo normal'}
        </AppText>
        <AppText variant="title" style={styles.centrado}>
          ¡Temporada completada!
        </AppText>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Chip label="Partidos" valor={t.pj} />
          <Chip label="Goles" valor={t.goles} />
          <Chip label="Asistencias" valor={t.asistencias} />
          <Chip label="Nuevo OVR" valor={resumen.player.ovr} />
        </View>

        {/* Trofeos */}
        <View style={styles.card}>
          <AppText variant="label" uppercase color="textSecondary">
            Trofeos
          </AppText>
          {resumen.trofeos.length === 0 ? (
            <AppText variant="body" color="textMuted">
              Sin títulos esta temporada. ¡El año que viene!
            </AppText>
          ) : (
            resumen.trofeos.map((trofeo) => (
              <View key={trofeo.id} style={styles.fila}>
                <Ionicons name="trophy" size={20} color={colors.warning} />
                <View style={styles.filaTexto}>
                  <AppText variant="body">{trofeo.nombre}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {trofeo.competencia} · {trofeo.anio}
                  </AppText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Convocatoria */}
        {resumen.convocadoSeleccion && (
          <View style={styles.card}>
            <AppText variant="label" uppercase color="textSecondary">
              Selección nacional
            </AppText>
            <AppText variant="body">
              Hoy entrás en el radar de la selección. Sigue rindiendo para ganar
              convocatorias y títulos internacionales.
            </AppText>
          </View>
        )}

        {/* Decisión de fin de temporada */}
        {resumen.retiro?.seRetira && (
          <View style={[styles.card, styles.cardRetiro]}>
            <AppText variant="label" uppercase color="textSecondary">
              Fin de la carrera
            </AppText>
            <AppText variant="body">
              {resumen.retiro.motivo === 'edad'
                ? 'Llegaste a la edad tope del fútbol profesional.'
                : resumen.retiro.motivo === 'sin-ofertas'
                  ? 'Sin ofertas para continuar, llega el momento de colgar los botines.'
                  : 'Decidís retirarte tras una gran trayectoria.'}
            </AppText>
            <AppText variant="caption" color="textMuted">
              Tu tarjeta final de carrera te espera.
            </AppText>
          </View>
        )}

        {resumen.decision && !resumen.retiro?.seRetira && (
          <View style={[styles.card, styles.cardDecision]}>
            <AppText variant="label" uppercase color="textSecondary">
              Decisión de temporada
            </AppText>
            <AppText variant="body">{resumen.decision.titulo}</AppText>
            <AppText variant="caption" color="textMuted">
              {resumen.decision.descripcion}
            </AppText>
          </View>
        )}

        {/* Cambio de club */}
        {resumen.clubNuevo ? (
          <View style={[styles.card, styles.cardOferta]}>
            <AppText variant="label" uppercase color="textSecondary">
              Nueva oferta
            </AppText>
            <AppText variant="body" style={styles.centrado}>
              {resumen.clubActual.nombre} → {resumen.clubNuevo.nombre}
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.centrado}>
              Tu rendimiento abrió puertas. La próxima temporada jugarás en un club
              de mayor prestigio.
            </AppText>
          </View>
        ) : (
          <View style={styles.card}>
            <AppText variant="body" color="textMuted">
              Sigues en {resumen.clubActual.nombre} para la temporada{' '}
              {resumen.nuevaTemporada.anioInicio}.
            </AppText>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function Chip({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={styles.chip}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="heading">{valor}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  centrado: { textAlign: 'center' },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardOferta: {
    borderColor: colors.success,
  },
  cardDecision: {
    borderColor: colors.warning,
  },
  cardRetiro: {
    borderColor: colors.danger,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filaTexto: {
    flex: 1,
  },
});