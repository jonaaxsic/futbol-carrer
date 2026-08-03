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

/** Equipos REALES de Chile (temporada 2026) en sus tres divisiones.
 *  `liga` diferencia la división → el fixture usa los clubes de la MISMA
 *  división que el club del jugador (regla §4.1). */
const CLUBES_CHILENOS: readonly Omit<Club, 'id' | 'escudoKey'>[] = [
  // ---- Primera División (16 equipos) ----
  { nombre: 'Colo-Colo', pais: 'Chile', liga: 'Primera División', prestigio: 5 },
  { nombre: 'Universidad de Chile', pais: 'Chile', liga: 'Primera División', prestigio: 5 },
  { nombre: 'Universidad Católica', pais: 'Chile', liga: 'Primera División', prestigio: 5 },
  { nombre: 'Cobresal', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Coquimbo Unido', pais: 'Chile', liga: 'Primera División', prestigio: 4 },
  { nombre: 'Everton', pais: 'Chile', liga: 'Primera División', prestigio: 4 },
  { nombre: 'Huachipato', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Ñublense', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'O\'Higgins', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Palestino', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Unión Española', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Audax Italiano', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Deportes Iquique', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Unión La Calera', pais: 'Chile', liga: 'Primera División', prestigio: 3 },
  { nombre: 'Deportes Limache', pais: 'Chile', liga: 'Primera División', prestigio: 2 },
  { nombre: 'Universidad de Concepción', pais: 'Chile', liga: 'Primera División', prestigio: 2 },

  // ---- Primera B / Liga de Ascenso (16 equipos) ----
  { nombre: 'Rangers', pais: 'Chile', liga: 'Primera B', prestigio: 3 },
  { nombre: 'Deportes Concepción', pais: 'Chile', liga: 'Primera B', prestigio: 3 },
  { nombre: 'Santiago Wanderers', pais: 'Chile', liga: 'Primera B', prestigio: 3 },
  { nombre: 'Magallanes', pais: 'Chile', liga: 'Primera B', prestigio: 3 },
  { nombre: 'Cobreloa', pais: 'Chile', liga: 'Primera B', prestigio: 3 },
  { nombre: 'Curicó Unido', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'San Luis', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Deportes Temuco', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Deportes Santa Cruz', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Deportes Antofagasta', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'San Marcos de Arica', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Barnechea', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Unión San Felipe', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Fernández Vial', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Real San Joaquín', pais: 'Chile', liga: 'Primera B', prestigio: 2 },
  { nombre: 'Deportes Melipilla', pais: 'Chile', liga: 'Primera B', prestigio: 2 },

  // ---- Segunda División Profesional (13 equipos reales) ----
  { nombre: 'Provincial Ovalle', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Lautaro de Buin', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Deportes Valdivia', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Concón National', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Deportes Rengo', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Provincial Osorno', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Deportes Linares', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Trasandino de Los Andes', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'General Velásquez', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Colchagua CD', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Brujas de Salamanca', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'Santiago City', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
  { nombre: 'San Antonio Unido', pais: 'Chile', liga: 'Segunda División Profesional', prestigio: 1 },
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