import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import type { Country } from '@/shared/constants/game';
import {
  coloresDePais,
  colorTextoDe,
  type ColoresNacionales,
} from '@/shared/constants/national-colors';
import { AppText } from '@/presentation/components/atoms/app-text';

/**
 * Molecule: camiseta de fútbol SVG simple.
 * Forma básica: torso + mangas + cuello.
 * Colores del país, nombre y número.
 */
export interface JerseyPreviewProps {
  nombre?: string;
  numero?: string;
  pais?: Country | null;
  tamaño?: number;
  colores?: ColoresNacionales;
}

/** Torso + mangas (forma simple) */
const TORSO =
  'M70 28 C56 28 48 36 45 46 L30 55 L25 75 L25 142 C25 152 38 158 55 158 L85 158 C102 158 115 152 115 142 L115 75 L110 55 L95 46 C92 36 84 28 70 28 Z';

/** Cuello en V simple */
const COLLAR = 'M54 25 L70 38 L86 25 L83 22 L70 32 L57 22 Z';

/** Franjas verticales */
const FRANJAS: readonly { x: number; w: number }[] = [
  { x: 30, w: 8 },
  { x: 46, w: 8 },
  { x: 62, w: 8 },
  { x: 78, w: 8 },
  { x: 94, w: 8 },
];

export function JerseyPreview({
  nombre,
  numero,
  pais = null,
  tamaño = 160,
  colores: coloresOverride,
}: JerseyPreviewProps) {
  const colores = coloresOverride ?? coloresDePais(pais);
  const texto = colorTextoDe(colores);
  const alto = Math.round(tamaño * (160 / 140));

  return (
    <View style={{ width: tamaño, height: alto }}>
      <Svg width={tamaño} height={alto} viewBox="0 0 140 160">
        <Defs>
          <ClipPath id="torso-clip">
            <Path d={TORSO} />
          </ClipPath>
        </Defs>

        {/* Mangas (secundario) */}
        <Rect x="8" y="40" width="35" height="34" rx="12" fill={colores.secundario} transform="rotate(-16 25 57)" />
        <Rect x="97" y="40" width="35" height="34" rx="12" fill={colores.secundario} transform="rotate(16 115 57)" />

        {/* Torso (primario) */}
        <Path d={TORSO} fill={colores.primario} />

        {/* Patrón */}
        <G clipPath="url(#torso-clip)">
          {colores.patron === 'franjas' &&
            FRANJAS.map((f) => (
              <Rect key={f.x} x={f.x} y="35" width={f.w} height="125" fill={colores.secundario} />
            ))}
          {colores.patron === 'bicolor' && (
            <Rect x="30" y="35" width="40" height="125" fill={colores.secundario} />
          )}
          <Rect x="30" y="150" width="80" height="10" fill={colores.secundario} />
        </G>

        {/* Cuello */}
        <Path d={COLLAR} fill={colores.secundario} />
      </Svg>

      {/* Nombre + número */}
      <View style={styles.texto} pointerEvents="none">
        <View style={styles.nombreContainer}>
          <AppText
            variant="caption"
            style={[styles.nombre, { color: texto, fontSize: Math.max(10, tamaño * 0.06) }]}>
            {(nombre ?? 'CAMISETA').toUpperCase()}
          </AppText>
        </View>
        <View style={styles.numeroContainer}>
          <AppText style={[styles.numero, { color: texto, fontSize: Math.max(32, tamaño * 0.35) }]}>
            {numero ?? '10'}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  texto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nombreContainer: {
    position: 'absolute',
    top: '24%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nombre: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  numeroContainer: {
    position: 'absolute',
    top: '44%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  numero: {
    fontWeight: '900',
  },
});
