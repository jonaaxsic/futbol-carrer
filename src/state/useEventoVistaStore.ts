import { create } from 'zustand';

import type { EventoNarrativo } from '@/domain/rules/eventos';

/**
 * Evento pendiente de resolver (pantalla 11).
 * Lo fija el dashboard/partido cuando el motor decide que ocurre un evento;
 * la pantalla `/event` lo consume y lo limpia al resolver. En memoria, no en BD.
 */
interface EventoVistaState {
  pendiente: EventoNarrativo | null;
  fijar: (evento: EventoNarrativo) => void;
  limpiar: () => void;
}

export const useEventoVistaStore = create<EventoVistaState>((set) => ({
  pendiente: null,
  fijar: (evento) => set({ pendiente: evento }),
  limpiar: () => set({ pendiente: null }),
}));