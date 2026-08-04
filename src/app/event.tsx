import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton, SecondaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';
import { aplicarOpcionEvento } from '@/services/eventService';
import { useEventoVistaStore } from '@/state/useEventoVistaStore';
import { usePlayerStore } from '@/state/usePlayerStore';

/**
 * 11. EVENTO / DECISIÓN (wireframe #11)
 * Pantalla genérica de eventos narrativos (Sprint 5).
 * El evento viene del motor ponderado (eventos.ts) vía store en memoria.
 * Al elegir una opción se aplican los efectos (OVR/etc.) y se loguea en evento_log.
 */
export default function EventScreen() {
  const player = usePlayerStore((s) => s.player);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const pendiente = useEventoVistaStore((s) => s.pendiente);
  const limpiar = useEventoVistaStore((s) => s.limpiar);

  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<{
    mensaje: string;
    ovrDelta: number;
    ovrNuevo: number | null;
  } | null>(null);

  async function elegir(opcionIndex: number) {
    if (!player || !pendiente || aplicando) return;
    setAplicando(true);
    try {
      const opcion = pendiente.opciones[opcionIndex];
      const aplicado = await aplicarOpcionEvento(player, pendiente, opcion);
      setResultado({
        mensaje: aplicado.mensaje,
        ovrDelta: aplicado.ovrNuevo != null ? aplicado.ovrNuevo - player.ovr : 0,
        ovrNuevo: aplicado.ovrNuevo,
      });
      // Sincronizar store con el nuevo OVR (si cambió).
      if (aplicado.ovrNuevo != null) {
        setPlayer({ ...player, ovr: aplicado.ovrNuevo });
      }
      // Algunas opciones encadenan un sub-evento (ej. penal → /penalty).
      if (opcion.navegarA === 'penalty') {
        limpiar();
        router.push('/penalty');
      }
    } finally {
      setAplicando(false);
    }
  }

  function cerrar() {
    limpiar();
    router.back();
  }

  return (
    <ScreenContainer
      title="Evento"
      footer={
        resultado != null ? (
          <PrimaryButton label="Continuar" onPress={cerrar} />
        ) : (
          pendiente && (
            <SecondaryButton label="Ignorar evento" onPress={cerrar} />
          )
        )
      }>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.alertIcon}>
          <Ionicons name="warning" size={40} color={colors.warning} />
        </View>

        <AppText variant="label" uppercase color="textSecondary" style={styles.center}>
          {pendiente?.tipo ?? 'Evento'}
        </AppText>

        <AppText variant="heading" style={styles.center}>
          {resultado != null ? 'Decisión tomada' : pendiente?.titulo ?? 'Sin evento'}
        </AppText>

        {resultado == null ? (
          <>
            <AppText variant="body" color="textSecondary" style={styles.center}>
              {pendiente?.descripcion ?? 'No hay un evento pendiente por resolver.'}
            </AppText>

            {pendiente != null && (
              <View style={styles.opciones}>
                {pendiente.opciones.map((opcion, i) => (
                  <View key={opcion.id} style={styles.opcion}>
                    <PrimaryButton
                      label={opcion.texto}
                      onPress={() => elegir(i)}
                      disabled={aplicando}
                      style={styles.opcionBoton}
                    />
                    <View style={styles.efectos}>
                      {opcion.efectos.map((efecto) => (
                        <AppText
                          key={efecto.etiqueta}
                          variant="caption"
                          color={efecto.direccion === 'up' ? 'success' : 'danger'}>
                          {efecto.etiqueta} · {efecto.direccion === 'up' ? '▲' : '▼'}
                        </AppText>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.resultado}>
            {aplicando ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <AppText variant="body" style={styles.center}>
                  {resultado.mensaje}
                </AppText>
                {resultado.ovrNuevo != null && (
                  <AppText
                    variant="label"
                    uppercase
                    color={resultado.ovrDelta >= 0 ? 'success' : 'danger'}
                    style={styles.center}>
                    OVR {resultado.ovrDelta >= 0 ? '+' : ''}
                    {resultado.ovrDelta} → ahora {resultado.ovrNuevo}
                  </AppText>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
  alertIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  opciones: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  opcion: {
    gap: spacing.xs,
  },
  opcionBoton: {
    alignSelf: 'stretch',
  },
  efectos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultado: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
});