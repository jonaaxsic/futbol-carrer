import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Login screen - DEPRECATED
 * Redirige a la pantalla unificada (index).
 * Mantenido por compatibilidad con links externos.
 */
export default function LoginScreen() {
  useEffect(() => {
    router.replace('/');
  }, []);

  return null;
}
