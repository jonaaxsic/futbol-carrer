import { create } from 'zustand';

import type { Player } from '@/domain/entities/player';
import type { Temporada } from '@/domain/entities/temporada';

/**
 * Estado en memoria del jugador + temporada activa.
 * Se hidrata desde SQLite en el arranque (Splash) vía `useHydrateApp`.
 * Solo UI lee este store; las mutaciones pasan por services/repos.
 */
interface PlayerState {
  player: Player | null;
  temporadaActiva: Temporada | null;
  setPlayer: (player: Player | null) => void;
  setTemporadaActiva: (temporada: Temporada | null) => void;
  limpiar: () => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  player: null,
  temporadaActiva: null,
  setPlayer: (player) => set({ player }),
  setTemporadaActiva: (temporadaActiva) => set({ temporadaActiva }),
  limpiar: () => set({ player: null, temporadaActiva: null }),
}));