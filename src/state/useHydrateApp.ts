import { useCallback, useEffect } from 'react';

import { obtenerEstadoCarrera } from '@/services/careerService';

import { useHydratacionStore } from './useHydratacionStore';
import { usePlayerStore } from './usePlayerStore';

/**
 * Hook de arranque: abre la BD, hidrata stores desde SQLite
 * y expone el estado del ciclo. El Splash decide a dónde navegar:
 * - error  → pantalla de reintento
 * - lista  → Menú (si hay carrera activa) u onboarding.
 *
 * Se ejecuta UNA vez (guarda con state) — la store arranca en 'idle'
 * y solo una llamada la saca de ese estado.
 */
export function useHydrateApp() {
  const { estado, error, setEstado } = useHydratacionStore();
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const setTemporadaActiva = usePlayerStore((s) => s.setTemporadaActiva);

  const hidratar = useCallback(async () => {
    setEstado('cargando');
    try {
      const { player, temporada } = await obtenerEstadoCarrera();
      setPlayer(player);
      setTemporadaActiva(temporada);
      setEstado('lista');
    } catch (e) {
      setEstado('error', e instanceof Error ? e.message : 'Error al cargar carrera');
    }
  }, [setEstado, setPlayer, setTemporadaActiva]);

  useEffect(() => {
    void hidratar();
  }, [hidratar]);

  return { estado, error, reintentar: hidratar };
}