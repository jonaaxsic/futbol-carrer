import { getDb } from './client';
import { sembrarClubes } from './seed-clubes';

let inicializado = false;
let inicializando: Promise<void> | null = null;

/**
 * Bootstrap de persistencia (una sola vez por sesión):
 * abre BD + aplica migraciones + siembra clubes base.
 * Se llama desde el layout raíz (persistencia real desde el día 1).
 */
export function inicializarBase(): Promise<void> {
  if (!inicializando) {
    inicializando = (async () => {
      await getDb();
      await sembrarClubes();
      inicializado = true;
    })();
  }
  return inicializando;
}

export function baseInicializada(): boolean {
  return inicializado;
}