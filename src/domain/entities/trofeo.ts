/** Entidad Trofeo (tabla `trofeo`, pantalla 14). */
export type NivelTrofeo = 'club' | 'seleccion' | 'individual';

export interface Trofeo {
  id: number;
  playerId: number;
  nombre: string;
  competencia: string;
  anio: number;
  nivel: NivelTrofeo;
}