import type { Club } from '@/domain/entities/club';
import type { Prestigio } from '@/shared/types';
import { COUNTRIES, LIGAS_POR_PAIS } from '@/shared/constants/game';

import { getDb } from './client';

/**
 * Clubes ficticios de ejemplo (decisión de alcance: sin reales/IP).
 * Hay clubes para TODOS los países del juego para que las ofertas
 * del onboarding (Sprint 2) siempre tengan opciones para elegir.
 * Se siembran una sola vez (INSERT OR IGNORE) vía `inicializarBase()`.
 */

/** Plantillas de nombres genéricos — se evitan marcas reales a propósito. */
const PLANTILLAS_NOMBRES = [
  'Atlético {pais}',
  'Deportivo {pais}',
  'Real {pais}',
  'Unión {pais}',
  'Ferrocarril {pais}',
] as const;

/** Prestigios rotativos (2-4) para que haya variedad sin clubes dominantes. */
const PRESTIGIOS: readonly Prestigio[] = [2, 3, 4, 2, 3];

/** Clubes con sabor local (Chile) que reemplazan a los genéricos. */
const CLUBES_CHILENOS: readonly Omit<Club, 'id' | 'escudoKey'>[] = [
  { nombre: 'Estrella Roja del Sur', pais: 'Chile', liga: 'Liga Nacional', prestigio: 3 },
  { nombre: 'Deportivo Aurora', pais: 'Chile', liga: 'Liga Nacional', prestigio: 2 },
  { nombre: 'Atlético Centenario', pais: 'Chile', liga: 'Liga Nacional', prestigio: 1 },
  { nombre: 'Real Porteño', pais: 'Chile', liga: 'Liga Nacional', prestigio: 4 },
  { nombre: 'Universidad del Norte', pais: 'Chile', liga: 'Liga Nacional', prestigio: 2 },
  { nombre: 'Fénix de Viña', pais: 'Chile', liga: 'Liga Nacional', prestigio: 3 },
  { nombre: 'Unión Metropolitana', pais: 'Chile', liga: 'Liga Nacional', prestigio: 2 },
  { nombre: 'Colo Portero FC', pais: 'Chile', liga: 'Liga Nacional', prestigio: 5 },
];

/** Idempotente: inserta los clubes que falten (nombres UNIQUE). */
export async function sembrarClubes(): Promise<void> {
  const db = await getDb();

  for (const club of CLUBES_CHILENOS) {
    await insertar(db, club);
  }

  for (const pais of COUNTRIES) {
    if (pais === 'Chile') continue; // ya sembrado con sabor local
    await Promise.all(
      PLANTILLAS_NOMBRES.map((plantilla, i) =>
        insertar(db, {
          nombre: plantilla.replace('{pais}', pais),
          pais,
          liga: LIGAS_POR_PAIS[pais],
          prestigio: PRESTIGIOS[i],
        }),
      ),
    );
  }
}

type Db = Awaited<ReturnType<typeof getDb>>;

async function insertar(
  db: Db,
  club: Omit<Club, 'id' | 'escudoKey'>,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO club (nombre, pais, liga, prestigio)
     VALUES (?, ?, ?, ?)`,
    [club.nombre, club.pais, club.liga, club.prestigio],
  );
}