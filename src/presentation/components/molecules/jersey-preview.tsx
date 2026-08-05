import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect, Line } from 'react-native-svg';

import type { Country } from '@/shared/constants/game';
import {
  coloresDePais,
  colorTextoDe,
  type ColoresNacionales,
} from '@/shared/constants/national-colors';
import { AppText } from '@/presentation/components/atoms/app-text';

/**
 * Molecule: camiseta de fútbol SVG realista.
 * Forma anatómica: hombros anchos, cintura estrecha, mangas con ribete.
 * Colores del país: torso primario, detalles secundario.
 */
export interface JerseyPreviewProps {
  nombre?: string;
  numero?: string;
  pais?: Country | null;
  tamaño?: number;
  colores?: ColoresNacionales;
}

/** Torso + mangas (forma anatómica con cintura) */
const TORSO_PATH =
  'M70 26 C58 26 50 32 47 42 L32 52 L24 72 L24 80 L28 82 L32 110 L32 142 C32 152 42 158 58 158 L82 158 C98 158 108 152 108 142 L108 110 L112 82 L116 80 L116 72 L108 52 L93 42 C90 32 82 26 70 26 Z';

/** Manga izquierda completa */
const SLEEVE_LEFT =
  'M47 42 L32 52 L24 72 L24 80 L28 82 L32 78 L42 68 C45 66 47 62 47 58 Z';

/** Manga derecha completa */
const SLEEVE_RIGHT =
  'M93 42 L108 52 L116 72 L116 80 L112 82 L108 78 L98 68 C95 66 93 62 93 58 Z';

/** Cuello en V con banda */
const COLLAR_V =
  'M52 24 L62 18 L70 30 L78 18 L88 24 L85 28 L70 38 L55 28 Z';

/** Banda del cuello (Detalle) */
const COLLAR_BAND =
  'M54 22 L70 34 L86 22';

/** Líneas de costura del torso (detalles sutiles) */
const SEAM_LINES = [
  'M70 38 L70 155', // costura central
  'M42 55 L42 145', // costura lateral izquierda
  'M98 55 L98 145', // costura lateral derecha
];

/** Franjas verticales del patrón 'franjas' */
const FRANJAS: readonly { x: number; w: number }[] = [
  { x: 36, w: 7 },
  { x: 50, w: 7 },
  { x: 64, w: 7 },
  { x: 78, w: 7 },
  { x: 92, w: 7 },
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
            <Path d={TORSO_PATH} />
          </ClipPath>
          {/* Sombra sutil para efecto 3D */}
          <linearGradient id="sombra" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.08" />
          </linearGradient>
        </Defs>

        {/* === CAPA 1: MANGAS (secundario) === */}
        <Path d={SLEEVE_LEFT} fill={colores.secundario} />
        <Path d={SLEEVE_RIGHT} fill={colores.secundario} />

        {/* Ribetes de manga (línea fina) */}
        <Line x1="24" y1="78" x2="32" y2="74" stroke={colores.primario} strokeWidth="1.5" />
        <Line x1="116" y1="78" x2="108" y2="74" stroke={colores.primario} strokeWidth="1.5" />

        {/* === CAPA 2: TORSO (primario) === */}
        <Path d={TORSO_PATH} fill={colores.primario} />

        {/* === CAPA 3: PATRÓN DENTRO DEL TORSO === */}
        <G clipPath="url(#torso-clip)">
          {/* Franjas verticales */}
          {colores.patron === 'franjas' &&
            FRANJAS.map((f) => (
              <Rect key={f.x} x={f.x} y="35" width={f.w} height="125" fill={colores.secundario} />
            ))}

          {/* Bicolor (mitad izquierda) */}
          {colores.patron === 'bicolor' && (
            <Rect x="36" y="35" width="34" height="125" fill={colores.secundario} />
          )}

          {/* Dobladillo inferior */}
          <Rect x="36" y="150" width="68" height="10" fill={colores.secundario} />

          {/* Costuras sutiles */}
          {SEAM_LINES.map((d, i) => (
            <Path key={i} d={d} stroke={colores.secundario} strokeWidth="0.5" opacity={0.3} fill="none" />
          ))}

          {/* Sombra lateral para efecto 3D */}
          <Rect x="36" y="35" width="68" height="125" fill="url(#sombra)" />
        </G>

        {/* === CAPA 4: CUELLO === */}
        <Path d={COLLAR_V} fill={colores.secundario} />
        <Path d={COLLAR_BAND} fill="none" stroke={colores.primario} strokeWidth="2" />

        {/* === CAPA 5: DETALLES FINALES === */}
        {/* Línea de hombro */}
        <Line x1="35" y1="42" x2="105" y2="42" stroke={colores.secundario} strokeWidth="1" opacity={0.5} />
      </Svg>

      {/* === TEXTO: NOMBRE + NÚMERO === */}
      <View style={styles.texto} pointerEvents="none">
        {/* Nombre: parte superior del torso */}
        <View style={styles.nombreContainer}>
          <AppText
            variant="caption"
            style={[styles.nombre, { color: texto, fontSize: Math.max(10, tamaño * 0.06) }]}>
            {(nombre ?? 'CAMISETA').toUpperCase()}
          </AppText>
        </View>

        {/* Número: centro del torso */}
        <View style={styles.numeroContainer}>
          <AppText style={[styles.numero, { color: texto, fontSize: Math.max(32, tamaño * 0.36) }]}>
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
    textTransform: 'uppercase',
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
