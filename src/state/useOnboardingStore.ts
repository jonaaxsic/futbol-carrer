import { create } from 'zustand';

import type { Posicion } from '@/domain/value-objects/posicion';
import type { Country } from '@/shared/constants/game';

/**
 * Borrador del jugador durante el onboarding (Sprint 2).
 * Los pasos 4-7 van poblando este objeto; en el paso 7 (club)
 * se persiste de una vez con `iniciarCarrera()`.
 * NO es persistente: al cerrar la app se descarta (flujo del wireframe).
 */
interface OnboardingState {
  pais: Country | null;
  nombre: string;
  numero: number;
  pierna: 'izquierda' | 'derecha';
  posicion: Posicion | null;
  setPais: (pais: Country) => void;
  setIdentidad: (datos: { nombre: string; numero: number; pierna: 'izquierda' | 'derecha' }) => void;
  setPosicion: (posicion: Posicion) => void;
  limpiar: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  pais: null,
  nombre: '',
  numero: 10,
  pierna: 'derecha',
  posicion: null,
  setPais: (pais) => set({ pais }),
  setIdentidad: ({ nombre, numero, pierna }) => set({ nombre, numero, pierna }),
  setPosicion: (posicion) => set({ posicion }),
  limpiar: () =>
    set({ pais: null, nombre: '', numero: 10, pierna: 'derecha', posicion: null }),
}));