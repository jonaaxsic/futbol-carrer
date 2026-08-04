import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Club } from '@/domain/entities/club';
import type { Posicion } from '@/domain/value-objects/posicion';
import { POSICIONES } from '@/domain/value-objects/posicion';
import {
  formacionBaseDeClub,
  posicionesDeFormacion,
} from '@/domain/value-objects/formacion';
import { finalizarCierre, type DecisionCierre } from '@/services/seasonService';
import { useCierreStore } from '@/state/useCierreStore';
import { usePlayerStore } from '@/state/usePlayerStore';
import { AppText } from '@/presentation/components/atoms/app-text';
import { PrimaryButton } from '@/presentation/components/atoms/button';
import { ScreenContainer } from '@/presentation/components/organisms/screen-container';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * OFERTA DE TRASPASO (spec club-transfer R1-R5, design D6).
 * El usuario decide el destino tras una temporada completa: aceptar una de
 * las 2-3 ofertas (eligiendo posición SOLO dentro de la formación base del
 * club aceptado) o quedarse. Nada se persiste hasta confirmar la decisión
 * (finalizarCierre). Sin propuesta en el store → vuelve al dashboard.
 */

type Paso = 'oferta' | 'posicion';

const ETIQUETA_POSICION: Record<Posicion, string> = POSICIONES.reduce(
  (acc, p) => {
    acc[p.id] = p.etiqueta;
    return acc;
  },
  {} as Record<Posicion, string>,
);

export default function ClubOfertaScreen() {
  const propuesta = useCierreStore((s) => s.propuesta);
  const fijarCierre = useCierreStore((s) => s.fijar);
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);

  const [paso, setPaso] = useState<Paso>('oferta');
  const [clubElegido, setClubElegido] = useState<Club | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!propuesta) {
    // Entrada directa o propuesta ya consumida: nada que decidir.
    router.replace('/');
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.textPrimary} style={styles.carga} />
      </ScreenContainer>
    );
  }

  // Constante acotada para que los closures (hoisted) vean el tipo no-nulo.
  const propuestaActiva = propuesta;

  const { player, clubActual, candidatos, trofeosGanados, convocadoSeleccion } = propuestaActiva;

  async function confirmar(decision: DecisionCierre) {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      const cierre = await finalizarCierre(propuestaActiva, decision);
      fijarCierre(cierre);
      setPlayer(cierre.player);
      setTemporadaActiva(cierre.nuevaTemporada);
      router.replace('/season-summary');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo finalizar el traspaso');
      setOcupado(false);
    }
  }

  function aceptarOferta() {
    if (!clubElegido) return;
    // Spec R2: solo posiciones de la formación base del club aceptado.
    setPosicion(posicionesDeFormacion(formacionBaseDeClub(clubElegido.id)).includes(player.posicion)
      ? player.posicion
      : null);
    setPaso('posicion');
  }

  return (
    <ScreenContainer
      title={paso === 'oferta' ? 'Oferta de traspaso' : 'Elegí tu posición'}
      footer={
        paso === 'posicion' ? (
          <PrimaryButton
            label="Confirmar traspaso"
            onPress={() =>
              clubElegido && posicion &&
              confirmar({ tipo: 'cambio', clubId: clubElegido.id, posicion })
            }
            disabled={!posicion || ocupado}
          />
        ) : (
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => confirmar({ tipo: 'quedarse' })}
              disabled={ocupado}
              style={({ pressed }) => [styles.footerVolver, pressed && styles.pressed]}>
              <AppText variant="body" color="textSecondary">
                Quedarme en {clubActual.nombre}
              </AppText>
            </Pressable>
            <PrimaryButton
              label="Aceptar oferta"
              onPress={aceptarOferta}
              disabled={!clubElegido || ocupado}
            />
          </View>
        )
      }>
      <ScrollView contentContainerStyle={styles.content}>
        {error && <AppText variant="caption" color="danger">{error}</AppText>}

        {paso === 'oferta' ? (
          <>
            <AppText variant="label" uppercase color="textSecondary" style={styles.centrado}>
              Temporada {propuesta.temporada.anioInicio} completada
            </AppText>
            <AppText variant="title" style={styles.centrado}>
              ¡Te buscan clubes más grandes!
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.centrado}>
              Tu rendimiento abrió puertas. Elegí tu destino para la próxima
              temporada o seguí en {clubActual.nombre}.
            </AppText>

            {/* Contexto del cierre */}
            {(trofeosGanados.length > 0 || convocadoSeleccion) && (
              <View style={styles.card}>
                {trofeosGanados.map((t, i) => (
                  <View key={i} style={styles.fila}>
                    <Ionicons name="trophy" size={18} color={colors.warning} />
                    <AppText variant="body">{t.nombre}</AppText>
                  </View>
                ))}
                {convocadoSeleccion && (
                  <View style={styles.fila}>
                    <Ionicons name="flag" size={18} color={colors.accent} />
                    <AppText variant="body">Convocado a la selección nacional</AppText>
                  </View>
                )}
              </View>
            )}

            {/* Candidatos (spec R1: 2-3, nunca automático) */}
            <AppText variant="label" uppercase color="textSecondary">
              Ofertas ({candidatos.length})
            </AppText>
            {candidatos.map((c) => {
              const seleccionado = clubElegido?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setClubElegido(seleccionado ? null : c)}
                  disabled={ocupado}
                  style={({ pressed }) => [
                    styles.card,
                    styles.candidato,
                    seleccionado && styles.candidatoSel,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.fila}>
                    <Ionicons name="shield" size={20} color={colors.textSecondary} />
                    <View style={styles.filaTexto}>
                      <AppText variant="body">{c.nombre}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {c.liga} · prestigio {c.prestigio}
                      </AppText>
                    </View>
                    {seleccionado && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    )}
                  </View>
                </Pressable>
              );
            })}

            <AppText variant="caption" color="textMuted">
              Si aceptás, vas a elegir tu posición dentro del esquema del nuevo club.
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="label" uppercase color="textSecondary" style={styles.centrado}>
              {clubElegido?.nombre} · {clubElegido?.liga}
            </AppText>
            <AppText variant="title" style={styles.centrado}>
              ¿Dónde vas a jugar?
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.centrado}>
              Tu posición queda limitada al esquema del club (
              {clubElegido ? formacionBaseDeClub(clubElegido.id).nombre : '—'}).
            </AppText>

            <View style={styles.posGrid}>
              {clubElegido &&
                posicionesDeFormacion(formacionBaseDeClub(clubElegido.id)).map((p) => {
                  const seleccionada = posicion === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPosicion(p)}
                      disabled={ocupado}
                      style={({ pressed }) => [
                        styles.posChip,
                        seleccionada && styles.posChipSel,
                        pressed && styles.pressed,
                      ]}>
                      <AppText
                        variant="body"
                        color={seleccionada ? 'onAccent' : 'textPrimary'}>
                        {ETIQUETA_POSICION[p]}
                      </AppText>
                    </Pressable>
                  );
                })}
            </View>

            <Pressable
              onPress={() => setPaso('oferta')}
              disabled={ocupado}
              style={({ pressed }) => pressed && styles.pressed}>
              <AppText variant="caption" color="textSecondary" style={styles.centrado}>
                ← Volver a las ofertas
              </AppText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  carga: { marginTop: spacing.xl },
  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  centrado: { textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  candidato: {
    borderColor: colors.border,
  },
  candidatoSel: {
    borderColor: colors.success,
    backgroundColor: colors.surface,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  footerVolver: {
    flexShrink: 1,
    paddingVertical: spacing.sm,
  },
  posGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  posChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  posChipSel: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: { opacity: 0.7 },
});
