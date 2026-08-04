import { create } from 'zustand';

/**
 * Vista transitoria del dashboard de partidos (design D: banner).
 * `bannerOculto` se limpia al re-montar la app: el banner de match-day
 * reaparece en cada sesión (spec matchday R6/R7 — aviso in-app persistente,
 * pero el cierre manual solo dura la sesión actual).
 */
interface PartidoVistaState {
  bannerOculto: boolean;
  ocultarBanner: () => void;
}

export const usePartidoVistaStore = create<PartidoVistaState>()((set) => ({
  bannerOculto: false,
  ocultarBanner: () => set({ bannerOculto: true }),
}));
