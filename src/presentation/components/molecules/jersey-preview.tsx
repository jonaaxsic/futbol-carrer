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
 * Molecule: camiseta de fútbol SVG (Sprint A, plan punto 3).
 * Silueta vectorial pintada por código con los colores del país
 * (torso = primario; cuello/mangas/franjas = secundario) y el
 * nombre + número superpuestos (legibles sobre el primario).
 */
export interface JerseyPreviewProps {
  /** Apellido/apodo mostrado sobre el torso. */
  nombre?: string;
  /** Número de camiseta (1-99). */
  numero?: string;
  /** País → colores automáticos; null → fallback neutral. */
  pais?: Country | null;
  /** Ancho en px (alto proporcional al viewBox). */
  tamaño?: number;
  /** Sobrescribir colores manualmente (tests o escudos). */
  colores?: ColoresNacionales;
}

/** Silueta de torso + mangas cortas (viewBox 120x138, centro x=60). */
const TORSO =
  'M60 22 C48 22 43 28 41 36 L33 42 L31 64 L31 112 C31 122 39 128 50 128 L70 128 C81 128 89 122 89 112 L89 64 L87 42 L79 36 C77 28 72 22 60 22 Z';

/** Cuello redondeado (banda del secundario). */
const COLLAR = 'M45 17 Q60 6 75 17 L75 21 Q60 11 45 21 Z';

/** Franjas verticales del patrón 'franjas' (dentro del clip del torso). */
const FRANJAS: readonly { x: number; w: number }[] = [
  { x: 33, w: 7 },
  { x: 45, w: 7 },
  { x: 57, w: 7 },
  { x: 69, w: 7 },
  { x: 81, w: 7 },
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
  const alto = Math.round(tamaño * (138 / 120));

  return (
    <View style={{ width: tamaño, height: alto }}>
      <Svg width={tamaño} height={alto} viewBox="0 0 120 138">
        <Defs>
          <ClipPath id="torso-clip">
            <Path d={TORSO} />
          </ClipPath>
        </Defs>

        {/* Mangas (secundario) */}
        <Rect
          x="8"
          y="34"
          width="36"
          height="32"
          rx="12"
          fill={colores.secundario}
          transform="rotate(-16 26 50)"
        />
        <Rect
          x="76"
          y="34"
          width="36"
          height="32"
          rx="12"
          fill={colores.secundario}
          transform="rotate(16 94 50)"
        />

        {/* Torso (primario) */}
        <Path d={TORSO} fill={colores.primario} />

        {/* Patrón + dobladillo, recortados a la silueta */}
        <G clipPath="url(#torso-clip)">
          {colores.patron === 'franjas' &&
            FRANJAS.map((f) => (
              <Rect key={f.x} x={f.x} y="30" width={f.w} height="100" fill={colores.secundario} />
            ))}
          {colores.patron === 'bicolor' && (
            <Rect x="31" y="30" width="29" height="100" fill={colores.secundario} />
          )}
          {/* Dobladillo inferior */}
          <Rect x="31" y="118" width="58" height="10" fill={colores.secundario} />
        </G>

        {/* Cuello */}
        <Path d={COLLAR} fill={colores.secundario} />
      </Svg>

      {/* Nombre + número superpuestos (texto RN, no SVG) */}
      <View style={styles.texto} pointerEvents="none">
        <AppText
          variant="caption"
          style={[styles.nombre, { color: texto, fontSize: Math.max(10, tamaño * 0.055) }]}>
          {(nombre ?? 'CAMISETA').toUpperCase()}
        </AppText>
        <AppText style={[styles.numero, { color: texto, fontSize: Math.max(28, tamaño * 0.32) }]}>
          {numero ?? '10'}
        </AppText>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 6,
  },
  nombre: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  numero: {
    fontWeight: '800',
  },
});
