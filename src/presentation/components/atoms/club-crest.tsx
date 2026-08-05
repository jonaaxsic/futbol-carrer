import { StyleSheet, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import type { Club } from '@/domain/entities/club';
import { coloresDeClub } from '@/domain/rules/club-colors';
import { colorTextoDeHex } from '@/presentation/theme/use-accent';
import { radius } from '@/presentation/theme';

type Props = {
  /** Club del que se dibuja el escudo (null → escudo neutro). */
  club: Club | null | undefined;
  /** Tamaño del escudo en píxeles (cuadrado). */
  size?: number;
};

/**
 * ESCUDO PROCEDURAL (PR5, task 5.3): escudo SVG + iniciales del club
 * con los colores primario/secundario de `coloresDeClub`. Sin assets
 * externos: cada club del seed obtiene identidad visual determinística.
 * Forma: shield clásico (2 picos arriba, punta abajo) con banda inferior
 * en secundario y las iniciales centradas en contraste sobre el primario.
 */
export function ClubCrest({ club, size = 40 }: Props) {
  const { primario, secundario } = coloresDeClub(club);
  const iniciales = inicialesDe(nombreDe(club));
  const textoColor = colorTextoDeHex(primario);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Cuerpo del escudo */}
        <Path
          d="M 15 12 L 85 12 L 85 58 Q 85 82 50 94 Q 15 82 15 58 Z"
          fill={primario}
          stroke={secundario}
          strokeWidth={5}
        />
        {/* Banda inferior en secundario */}
        <Path
          d="M 15 58 Q 15 82 50 94 Q 85 82 85 58 L 85 50 Q 85 72 50 84 Q 15 72 15 50 Z"
          fill={secundario}
        />
        {/* Iniciales en contraste */}
        <SvgText
          x={50}
          y={42}
          fontSize={iniciales.length > 2 ? 26 : 34}
          fontWeight="bold"
          fill={textoColor}
          textAnchor="middle">
          {iniciales}
        </SvgText>
      </Svg>
    </View>
  );
}

/** Nombre del club (fallback neutro). */
function nombreDe(club: Club | null | undefined): string {
  return club?.nombre ?? '—';
}

/** Iniciales: primeras letras de hasta 2 palabras significativas. */
function inicialesDe(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((p) => /^[A-ZÁÉÍÓÚÑ]/i.test(p) && p.toLowerCase() !== 'de' && p.toLowerCase() !== 'fc');
  if (palabras.length === 0) return '?';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});