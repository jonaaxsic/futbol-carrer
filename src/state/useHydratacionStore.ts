import { create } from 'zustand';

/**
 * Ciclo de vida de la persistencia en el arranque.
 * `idle` → `cargando` → `lista` | `error`, una sola pasada por sesión.
 */
export type EstadoHidratacion = 'idle' | 'cargando' | 'lista' | 'error';

interface HydratacionState {
  estado: EstadoHidratacion;
  error: string | null;
  setEstado: (estado: EstadoHidratacion, error?: string | null) => void;
}

export const useHydratacionStore = create<HydratacionState>()((set) => ({
  estado: 'idle',
  error: null,
  setEstado: (estado, error = null) => set({ estado, error }),
}));