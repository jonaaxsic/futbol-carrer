import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { Formacion, SlotFormacion } from '@/domain/value-objects/formacion';
import { posicionEnFormacion } from '@/domain/value-objects/formacion';
import type { Posicion } from '@/domain/value-objects/posicion';
import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * Organismo: cancha táctica reutilizable (spec formations R3/R5).
 * - Modo `seleccionar` (cuando onSeleccionar existe): el once propio
 *   bottom-up, slots tocables, la selección resaltada.
 * - Modo `ver` (sin onSeleccionar): dibuja el once propio y opcionalmente
 *   el rival (flip vertical: top-down), destacando la posición del jugador.
 *
 * Coordenadas del slot: x ∈ [0,1] izquierda→derecha, y ∈ [0,1] propio arco→rival.
 */
export interface FormationPitchProps {
  /** Once del equipo del jugador. */
  formacion: Formacion;
  /** Once del rival (solo modo ver). */
  rival?: Formacion | null;
  /** Posición real del jugador; se destaca en ambos modos. */
  posicionJugador?: Posicion | null;
  /** Modo seleccionar: slot tocable y resaltado; ausente → modo ver. */
  seleccion?: Posicion | null;
  onSeleccionar?: (p: Posicion) => void;
}

const marcaLeft = (x: number): `${number}%` => `${x * 100}%`;
const marcaTop = (y: number): `${number}%` => `${(1 - y) * 100}%`;

function Chip({ slot, activo, onPress }: { slot: SlotFormacion; activo: boolean; onPress?: () => void }) {
  const contenido = (
    <View style={[styles.chip, activo && styles.chipActivo]}>
      <AppText
        variant="caption"
        color={activo ? 'onAccent' : 'textSecondary'}
        style={styles.chipText}>
        {slot.posicion}
      </AppText>
    </View>
  );

  const posicion = { left: marcaLeft(slot.x), top: marcaTop(slot.y) };

  if (!onPress) {
    return (
      <View style={[styles.slot, posicion]} pointerEvents="none">
        {contenido}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.slot, posicion]} hitSlop={4}>
      {contenido}
    </Pressable>
  );
}

/** Un once sobre la cancha; `invertirY` voltea el equipo (rival top-down). */
function renderOnce({
  formacion,
  invertirY,
  destacada,
  onSeleccionar,
}: {
  formacion: Formacion;
  invertirY: boolean;
  destacada: Posicion | null;
  onSeleccionar?: (p: Posicion) => void;
}) {
  return formacion.slots.map((s, i) => {
    const slot: SlotFormacion = invertirY ? { ...s, y: 1 - s.y } : s;
    const activo = destacada != null && s.posicion === destacada;
    return (
      <Chip
        key={`${formacion.nombre}-${i}`}
        slot={slot}
        activo={activo}
        onPress={onSeleccionar ? () => onSeleccionar(s.posicion) : undefined}
      />
    );
  });
}

export function FormationPitch({
  formacion,
  rival = null,
  posicionJugador = null,
  seleccion = null,
  onSeleccionar,
}: FormationPitchProps) {
  const modoSeleccionar = onSeleccionar != null;

  // Posición efectiva (con fallback MCO→MC) dentro del once propio.
  const destacada = posicionJugador ? posicionEnFormacion(formacion, posicionJugador) : null;
  // En modo seleccionar, la "destacada" es la selección actual.
  const resaltada = modoSeleccionar ? seleccion : destacada;

  // En modo ver, el rival voltea y su destacada es la posición real del jugador.
  const destacadaRival = posicionJugador ? posicionEnFormacion(rival ?? formacion, posicionJugador) : null;

  // Marker animado (Reanimated): aparece sobre la posición resaltada.
  const opacidadMarker = useSharedValue(0);
  const markerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacidadMarker.value, { duration: 220 }),
    transform: [
      { scale: withSpring(opacidadMarker.value === 1 ? 1 : 0.8, { damping: 14 }) },
    ],
  }));

  useEffect(() => {
    opacidadMarker.value = resaltada != null ? 1 : 0;
  }, [resaltada, opacidadMarker]);

  const slotResaltado = resaltada
    ? formacion.slots.find((s) => s.posicion === resaltada)
    : null;

  return (
    <View style={styles.pitch}>
      <View style={styles.pitchLine} />
      <View style={styles.pitchCircle} />

      {/* Rival (modo ver): arriba del once, invertido */}
      {rival && !modoSeleccionar && (
        <View style={StyleSheet.absoluteFill}>
          {renderOnce({ formacion: rival, invertirY: true, destacada: destacadaRival })}
        </View>
      )}

      {/* Once propio: abajo (bottom-up); modo seleccionar → tocable */}
      {renderOnce({
        formacion,
        invertirY: false,
        destacada: resaltada,
        onSeleccionar,
      })}

      {/* Marker animado sobre la posición destacada/seleccionada */}
      {slotResaltado && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.marker,
            { left: marcaLeft(slotResaltado.x), top: marcaTop(slotResaltado.y) },
            markerStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    aspectRatio: 0.75,
    backgroundColor: colors.pitch,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.pitchLine,
    padding: spacing.md,
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
  slot: {
    position: 'absolute',
    width: 46,
    height: 32,
    marginLeft: -23,
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    width: '100%',
    height: '100%',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: colors.pitchLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActivo: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontWeight: '800',
  },
  marker: {
    position: 'absolute',
    width: 58,
    height: 42,
    marginLeft: -29,
    marginTop: -21,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});