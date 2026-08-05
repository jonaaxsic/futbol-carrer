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
 * Molecule: camiseta de fútbol SVG - vista ESPALDA.
 * Forma anatómica: hombros, cintura, mangas.
 * Nombre + número centrados.
 */
export interface JerseyPreviewProps {
  nombre?: string;
  numero?: string;
  pais?: Country | null;
  tamaño?: number;
  colores?: ColoresNacionales;
}

/** Espalda: torso con forma anatómica */
const TORSO_BACK =
  'M70 30 C55 30 46 38 43 48 L28 58 L22 78 L22 85 L26 87 L30 115 L30 145 C30 155 42 160 58 160 L82 160 C98 160 110 155 110 145 L110 115 L114 87 L118 85 L118 78 L112 58 L97 48 C94 38 85 30 70 30 Z';

/** Mangas (más anchas, estilo retro) */
const SLEEVE_LEFT = 'M43 48 L28 58 L22 78 L26 80 L32 75 L40 65 C43 62 44 58 43 54 Z';
const SLEEVE_RIGHT = 'M97 48 L112 58 L118 78 L114 80 L108 75 L100 65 C97 62 96 58 97 54 Z';

/** Cuello redondo (vista espalda) */
const COLLAR_BACK = 'M52 28 Q70 18 88 28 L86 32 Q70 24 54 32 Z';

/** Franjas verticales */
const FRANJAS: readonly { x: number; w: number }[] = [
  { x: 32, w: 7 },
  { x: 46, w: 7 },
  { x: 60, w: 7 },
  { x: 74, w: 7 },
  { x: 88, w: 7 },
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
      <Svg width={tamaño} height={alto} viewBox="0 0 140 165">
        <Defs>
          <ClipPath id="torso-clip">
            <Path d={TORSO_BACK} />
          </ClipPath>
        </Defs>

        {/* Mangas */}
        <Path d={SLEEVE_LEFT} fill={colores.secundario} />
        <Path d={SLEEVE_RIGHT} fill={colores.secundario} />

        {/* Torso */}
        <Path d={TORSO_BACK} fill={colores.primario} />

        {/* Patrón */}
        <G clipPath="url(#torso-clip)">
          {colores.patron === 'franjas' &&
            FRANJAS.map((f) => (
              <Rect key={f.x} x={f.x} y="38" width={f.w} height="125" fill={colores.secundario} />
            ))}
          {colores.patron === 'bicolor' && (
            <Rect x="32" y="38" width="38" height="125" fill={colores.secundario} />
          )}
          <Rect x="32" y="153" width="76" height="12" fill={colores.secundario} />
        </G>

        {/* Cuello redondo (espalda) */}
        <Path d={COLLAR_BACK} fill={colores.secundario} />
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
          <AppText style={[styles.numero, { color: texto, fontSize: Math.max(36, tamaño * 0.38) }]}>
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
