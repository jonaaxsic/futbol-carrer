import { create } from 'zustand';

import type { PropuestaCierre, ResultadoCierreTemporada } from '@/services/seasonService';

/**
 * Estado del cierre de temporada (Sprint 6 + club-transfer D6).
 * `propuesta` es transitorio: el dashboard la fija y la pantalla /club-oferta
 * la consume para la decisión del usuario. `resumen` alimenta season-summary.
 * Solo memoria: al continuar se limpia todo.
 */
interface CierreStoreState {
  resumen: ResultadoCierreTemporada | null;
  propuesta: PropuestaCierre | null;
  fijar: (resumen: ResultadoCierreTemporada) => void;
  fijarPropuesta: (propuesta: PropuestaCierre) => void;
  limpiar: () => void;
}

export const useCierreStore = create<CierreStoreState>((set) => ({
  resumen: null,
  propuesta: null,
  fijar: (resumen) => set({ resumen }),
  fijarPropuesta: (propuesta) => set({ propuesta }),
  limpiar: () => set({ resumen: null, propuesta: null }),
}));
