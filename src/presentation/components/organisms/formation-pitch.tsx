import { useEffect } from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
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
import { colors, radius } from '@/presentation/theme';

const canchaImg = require('@/assets/images/cancha.png');

/**
 * Organismo: cancha táctica con imagen real de fondo.
 * - Fondo: imagen top-down de cancha (cancha.png) con líneas reales.
 * - Modo `seleccionar` (cuando onSeleccionar existe): el once propio
 *   bottom-up, slots tocables en píldoras, la selección resaltada.
 * - Modo `ver` (sin onSeleccionar): once propio + opcional rival
 *   (flip vertical: top-down), destacando la posición del jugador.
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

/** Píldora de posición (SVG-texto de la propuesta; aquí AppText sobre pill RN). */
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
    <ImageBackground
      source={canchaImg}
      style={styles.pitch}
      imageStyle={styles.pitchImage}
      resizeMode="cover">
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  pitch: {
    aspectRatio: 0.75,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  pitchImage: {
    borderRadius: radius.lg,
  },
  slot: {
    position: 'absolute',
    width: 52,
    height: 28,
    marginLeft: -26,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    width: '100%',
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(13,13,13,0.55)',
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
    width: 60,
    height: 36,
    marginLeft: -30,
    marginTop: -18,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
