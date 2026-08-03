import type { Country } from '@/shared/constants/game';
import type { Prestigio } from '@/shared/types';

/** Entidad Club (tabla `club`). Los nombres son ficticios (decisión de alcance). */
export interface Club {
  id: number;
  nombre: string;
  pais: Country;
  liga: string;
  prestigio: Prestigio;
  escudoKey: string | null;
}