import type { Country } from '@/shared/constants/game';

/**
 * Colores de camiseta por país (Sprint A, plan punto 3).
 * `primario` pinta el torso, `secundario` cuello/mangas/franjas.
 * `patron`: 'solido' | 'franjas' (verticales) | 'bicolor' (mitad y mitad).
 */
export interface ColoresNacionales {
  primario: string;
  secundario: string;
  patron: 'solido' | 'franjas' | 'bicolor';
}

/** Fallback neutral (sin país): blanco con detalles grises. */
export const COLORES_NEUTRALES: ColoresNacionales = {
  primario: '#1C1C1C',
  secundario: '#6E6E6E',
  patron: 'solido',
};

export const NATIONAL_COLORS: Record<Country, ColoresNacionales> = {
  Chile: { primario: '#D92332', secundario: '#FFFFFF', patron: 'solido' },
  Argentina: { primario: '#75AADB', secundario: '#FFFFFF', patron: 'franjas' },
  Brasil: { primario: '#FFCB05', secundario: '#009B3A', patron: 'solido' },
  Uruguay: { primario: '#7EC8E3', secundario: '#FFFFFF', patron: 'solido' },
  Colombia: { primario: '#FCD116', secundario: '#003893', patron: 'bicolor' },
  México: { primario: '#006847', secundario: '#CE1126', patron: 'solido' },
  Perú: { primario: '#FFFFFF', secundario: '#D91023', patron: 'solido' },
  Paraguay: { primario: '#D52B1E', secundario: '#0038A8', patron: 'solido' },
  Ecuador: { primario: '#FFD100', secundario: '#00539F', patron: 'solido' },
  España: { primario: '#C60B1E', secundario: '#FFC400', patron: 'solido' },
  Portugal: { primario: '#A50021', secundario: '#006600', patron: 'solido' },
  Inglaterra: { primario: '#FFFFFF', secundario: '#CE1124', patron: 'solido' },
  Alemania: { primario: '#FFFFFF', secundario: '#000000', patron: 'solido' },
  Italia: { primario: '#0064AA', secundario: '#FFFFFF', patron: 'solido' },
  Francia: { primario: '#1B2F5E', secundario: '#FFFFFF', patron: 'solido' },
};

/** Devuelve los colores del país o el fallback neutral. */
export function coloresDePais(pais: Country | null | undefined): ColoresNacionales {
  if (!pais) return COLORES_NEUTRALES;
  return NATIONAL_COLORS[pais] ?? COLORES_NEUTRALES;
}

/** Texto legible sobre el primario (blanco o negro según luminancia). */
export function colorTextoDe(colores: ColoresNacionales): string {
  const hex = colores.primario.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Luminancia relativa (rec. 709): > 0.6 → fondo claro → texto oscuro.
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 150 ? '#0D0D0D' : '#FFFFFF';
}
