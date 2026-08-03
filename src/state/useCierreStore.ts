import { create } from 'zustand';

import type { ResultadoCierreTemporada } from '@/services/seasonService';

/**
 * Resultado del cierre de temporada (Sprint 6) para la pantalla de resumen.
 * Solo memoria: la pantalla season-summary lo lee y al continuar se limpia.
 */
interface CierreStoreState {
  resumen: ResultadoCierreTemporada | null;
  fijar: (resumen: ResultadoCierreTemporada) => void;
  limpiar: () => void;
}

export const useCierreStore = create<CierreStoreState>((set) => ({
  resumen: null,
  fijar: (resumen) => set({ resumen }),
  limpiar: () => set({ resumen: null }),
}));