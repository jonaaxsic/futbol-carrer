import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Menu screen - DEPRECATED
 * Redirige a la pantalla unificada (index).
 * Mantenido por compatibilidad con links externos.
 */
export default function MenuScreen() {
  useEffect(() => {
    router.replace('/');
  }, []);

  return null;
}
