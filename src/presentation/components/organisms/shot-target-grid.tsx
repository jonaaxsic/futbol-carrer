import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import type { ResultadoSituacion, ZonaDisparo } from '@/domain/rules/partido';
import { AppText } from '@/presentation/components/atoms/app-text';
import { colors, radius, spacing } from '@/presentation/theme';

/**
 * Organismo: grid de disparo 3×2 para situaciones interactivas
 * (spec interactive-situations R8/R9, PR3b).
 * - SVG de arco de fútbol con seis zonas tocables (arriba/abajo × izq/centro/der).
 * - El padre (match.tsx) resuelve la situación con el resolver puro del
 *   dominio y pasa `feedback`; el grid muestra el feedback 0.6–0.8 s.
 * - Fase elegir: `onElegir(zona)` por toque; fase feedback: solo visual.
 */
export interface ShotTargetGridProps {
  /** Zona cubierta por el arquero (se revela solo durante el feedback). */
  ladoArquero?: ZonaDisparo;
  /** Zona de la barrera del tiro libre (solo feedback). */
  ladoDefensor?: ZonaDisparo;
  /** Feedback activo: zona elegida + resultado (ya resuelto por el dominio). */
  feedback?: { zona: ZonaDisparo; resultado: ResultadoSituacion } | null;
  /** Callback con la zona elegida (fase elegir). */
  onElegir: (zona: ZonaDisparo) => void;
}

/** Orden visual de las filas del grid (arriba = primera fila). */
const ZONAS_GRID: ZonaDisparo[][] = [
  ['arriba-izquierda', 'arriba-centro', 'arriba-derecha'],
  ['abajo-izquierda', 'abajo-centro', 'abajo-derecha'],
];

const COLOR_RESULTADO: Record<ResultadoSituacion, string> = {
  gol: colors.success,
  atajado: colors.warning,
  palo: colors.warning,
  afuera: colors.danger,
  rebote: colors.info,
};

const ICONO_RESULTADO: Record<ResultadoSituacion, string> = {
  gol: 'GOAL',
  atajado: 'SAVE',
  palo: 'POST',
  afuera: 'WIDE',
  rebote: 'BLOCK',
};

/** Centro (x,y) en el viewBox 300×200 para una zona del grid. */
function centroZona(zona: ZonaDisparo): { x: number; y: number } {
  const fila = zona.startsWith('arriba') ? 0 : 1;
  const col = zona.endsWith('izquierda') ? 0 : zona.endsWith('centro') ? 1 : 2;
  return { x: 60 + col * 90, y: 55 + fila * 75 };
}

export function ShotTargetGrid({
  ladoArquero,
  ladoDefensor,
  feedback = null,
  onElegir,
}: ShotTargetGridProps) {
  const eligiendo = feedback == null;

  return (
    <View style={styles.wrap}>
      <View style={styles.svgWrap}>
        <Svg viewBox="0 0 300 200" width="100%" height={200}>
          {/* Fondo del arco */}
          <Rect x={10} y={10} width={280} height={180} rx={radius.md} fill={colors.surface} />
          <Rect
            x={10}
            y={10}
            width={280}
            height={180}
            rx={radius.md}
            fill="none"
            stroke={colors.borderStrong}
            strokeWidth={2}
          />
          {/* Travesaño y postes */}
          <Line x1={25} y1={20} x2={275} y2={20} stroke={colors.textPrimary} strokeWidth={5} />
          <Line x1={25} y1={20} x2={25} y2={180} stroke={colors.textPrimary} strokeWidth={5} />
          <Line x1={275} y1={20} x2={275} y2={180} stroke={colors.textPrimary} strokeWidth={5} />
          {/* Línea de meta */}
          <Line x1={25} y1={180} x2={275} y2={180} stroke={colors.border} strokeWidth={2} />

          {/* Silueta del arquero en su zona (solo feedback) */}
          {feedback && ladoArquero && (
            <Circle
              cx={centroZona(ladoArquero).x}
              cy={centroZona(ladoArquero).y - 10}
              r={16}
              fill={colors.warning}
              opacity={0.9}
            />
          )}
          {/* Barrera del tiro libre (solo feedback) */}
          {feedback && ladoDefensor && (
            <Rect
              x={centroZona(ladoDefensor).x - 26}
              y={centroZona(ladoDefensor).y - 10}
              width={52}
              height={20}
              rx={4}
              fill={colors.info}
              opacity={0.85}
            />
          )}

          {/* Zonas: rejilla de 6; la elegida se pinta con el color del resultado */}
          {ZONAS_GRID.flatMap((fila) =>
            fila.map((zona) => {
              const c = centroZona(zona);
              const activa = feedback?.zona === zona;
              const trazo = activa && feedback ? COLOR_RESULTADO[feedback.resultado] : colors.border;
              const relleno = activa && feedback ? `${COLOR_RESULTADO[feedback.resultado]}26` : 'transparent';
              return (
                <Rect
                  key={zona}
                  x={c.x - 40}
                  y={c.y - 30}
                  width={80}
                  height={60}
                  rx={radius.sm}
                  fill={relleno}
                  stroke={trazo}
                  strokeWidth={activa ? 2.5 : 1}
                  strokeDasharray={eligiendo ? '4 3' : undefined}
                />
              );
            }),
          )}

          {/* Balón viajando a la zona elegida (feedback) */}
          {feedback && (
            <Circle cx={centroZona(feedback.zona).x} cy={centroZona(feedback.zona).y} r={8} fill={colors.accent} />
          )}
        </Svg>

        {/* Zonas tappables encima del SVG (solo fase elegir) */}
        {eligiendo &&
          ZONAS_GRID.flatMap((fila) =>
            fila.map((zona) => {
              const c = centroZona(zona);
              return (
                <Pressable
                  key={zona}
                  onPress={() => onElegir(zona)}
                  style={[styles.zona, { left: `${(c.x - 40) / 3}%`, top: `${(c.y - 30) / 2}%` }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Zona ${zona}`}>
                  <View style={styles.zonaInner} />
                </Pressable>
              );
            }),
          )}
      </View>

      {/* Resultado con color e icono (feedback) */}
      {feedback && (
        <View style={[styles.resultado, { borderColor: COLOR_RESULTADO[feedback.resultado] }]}>
          <AppText variant="title" style={{ color: COLOR_RESULTADO[feedback.resultado] }}>
            {ICONO_RESULTADO[feedback.resultado]}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  svgWrap: {
    width: '100%',
    position: 'relative',
  },
  zona: {
    position: 'absolute',
    width: '26.6%',
    height: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonaInner: {
    width: '100%',
    height: '100%',
  },
  resultado: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
});
