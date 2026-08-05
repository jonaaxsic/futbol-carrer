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
 * Molecule: camiseta de fútbol SVG rediseñada.
 * Silueta realista con: torso, mangas, cuello en V, franjas/bicolor según país.
 * Nombre arriba al centro, número grande en el centro del torso.
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

/** Silueta de torso + mangas cortas (viewBox 140 160). */
const TORSO =
  'M70 28 C55 28 48 35 45 45 L35 52 L30 75 L30 140 C30 150 40 155 55 155 L85 155 C100 155 110 150 110 140 L110 75 L105 52 L95 45 C92 35 85 28 70 28 Z';

/** Cuello en V */
const COLLAR_V = 'M52 25 L70 40 L88 25 L85 20 Q70 30 55 20 Z';

/** Franjas verticales del patrón 'franjas' */
const FRANJAS: readonly { x: number; w: number }[] = [
  { x: 35, w: 8 },
  { x: 51, w: 8 },
  { x: 67, w: 8 },
  { x: 83, w: 8 },
  { x: 99, w: 8 },
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
        <Rect
          x="5"
          y="38"
          width="40"
          height="36"
          rx="14"
          fill={colores.secundario}
          transform="rotate(-18 25 56)"
        />
        <Rect
          x="95"
          y="38"
          width="40"
          height="36"
          rx="14"
          fill={colores.secundario}
          transform="rotate(18 115 56)"
        />

        {/* Banda de hombro (secundario) */}
        <Rect x="35" y="30" width="70" height="6" rx="3" fill={colores.secundario} />

        {/* Torso (primario) */}
        <Path d={TORSO} fill={colores.primario} />

        {/* Patrón + dobladillo, recortados a la silueta */}
        <G clipPath="url(#torso-clip)">
          {colores.patron === 'franjas' &&
            FRANJAS.map((f) => (
              <Rect key={f.x} x={f.x} y="35" width={f.w} height="120" fill={colores.secundario} />
            ))}
          {colores.patron === 'bicolor' && (
            <Rect x="35" y="35" width="35" height="120" fill={colores.secundario} />
          )}
          {/* Dobladillo inferior */}
          <Rect x="35" y="148" width="70" height="12" fill={colores.secundario} />
        </G>

        {/* Cuello en V */}
        <Path d={COLLAR_V} fill={colores.secundario} />

        {/* Detalle del cuello (linea fina) */}
        <Path d="M52 25 L70 40 L88 25" fill="none" stroke={colores.primario} strokeWidth="1.5" />
      </Svg>

      {/* Nombre + número superpuestos */}
      <View style={styles.texto} pointerEvents="none">
        {/* Nombre: parte superior de la camiseta */}
        <View style={styles.nombreContainer}>
          <AppText
            variant="caption"
            style={[styles.nombre, { color: texto, fontSize: Math.max(10, tamaño * 0.06) }]}>
            {(nombre ?? 'CAMISETA').toUpperCase()}
          </AppText>
        </View>

        {/* Número: centro del torso */}
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
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nombre: {
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  numeroContainer: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  numero: {
    fontWeight: '900',
  },
});
