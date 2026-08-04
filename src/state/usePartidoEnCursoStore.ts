import { create } from 'zustand';

import type { EventoTimeline } from '@/domain/rules/partido';
import type { PartidoEnCurso } from '@/services/partidoService';

/**
 * Sesión transitoria del partido EN CURSO (design D3, PR3).
 * Solo memoria: `iniciarPartido` la fija desde el dashboard; `/match` la
 * lee para el replayer y la actualiza tras el mini-juego de penal.
 * Al finalizar (Continuar) se limpia.
 */
interface PartidoEnCursoState {
  sesion: PartidoEnCurso | null;
  fijar: (sesion: PartidoEnCurso) => void;
  actualizarLineaTiempo: (lineaTiempo: EventoTimeline[]) => void;
  limpiar: () => void;
}

export const usePartidoEnCursoStore = create<PartidoEnCursoState>()((set) => ({
  sesion: null,
  fijar: (sesion) => set({ sesion }),
  actualizarLineaTiempo: (lineaTiempo) =>
    set((s) => (s.sesion ? { sesion: { ...s.sesion, lineaTiempo } } : s)),
  limpiar: () => set({ sesion: null }),
}));
