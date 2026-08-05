import type { HistorialEtapa } from '@/domain/entities/historial-carrera';
import type { Temporada } from '@/domain/entities/temporada';

/**
 * Entrada de línea de carrera combinada (settled + in-flight).
 * Se usa en la tarjeta de club del career screen para mostrar números
 * en vivo durante una temporada activa (anioFin === null).
 */
export interface LineaCarreraEtapa {
  id: number;
  clubId: number;
  anioInicio: number;
  anioFin: number | null;
  pj: number;
  goles: number;
  asistencias: number;
  /** True si esta etapa incluye stats de la temporada en curso (anioFin === null). */
  enVivo: boolean;
}

/**
 * Combina el historial cerrado (historial_carrera) con la temporada activa
 * en curso para producir la línea de carrera visible.
 *
 * Reglas (Option A, Live Stats R3):
 * - Para etapas con `anioFin !== null` (cerradas): se usan los valores
 *   tal cual vienen de `historial_carrera` (ya settled).
 * - Para la etapa actual con `anioFin === null` (en curso): se suman
 *   los valores de `historial_carrera` + `temporadaActiva` (in-flight),
 *   SIN doble-contar temporadas ya cerradas.
 * - Si no hay `temporadaActiva`, se devuelve el historial tal cual.
 */
export function lineaCarreraConActiva(
  etapas: HistorialEtapa[],
  activa: Temporada | null,
): LineaCarreraEtapa[] {
  if (!activa || etapas.length === 0) {
    return etapas.map((e) => ({ ...e, enVivo: false }));
  }

  // Buscar la etapa en curso (anioFin === null) que coincida con la temporada activa.
  // La temporada activa tiene anioInicio; la etapa en curso debe tener el mismo anioInicio.
  const indiceEnCurso = etapas.findIndex(
    (e) => e.anioFin === null && e.anioInicio === activa.anioInicio,
  );

  if (indiceEnCurso === -1) {
    // No hay etapa en curso que coincida → devolver historial tal cual.
    return etapas.map((e) => ({ ...e, enVivo: false }));
  }

  return etapas.map((etapa, i) => {
    if (i === indiceEnCurso) {
      // Etapa en curso: combinar settled (historial) + in-flight (temporadaActiva).
      // Nota: historialRepository.sumarStats ya acumula en la fila de anioFin=null
      // cada vez que se juega un partido. Pero para live stats mostramos la suma
      // explícita: historial (lo que ya estaba antes de esta temporada) + activa.
      // Como sumarStats actualiza la misma fila, el historial YA incluye los stats
      // de la temporada actual. Para evitar doble-conteo, usamos SOLO la temporada
      // activa como fuente de verdad para la etapa en curso.
      return {
        ...etapa,
        pj: activa.pj,
        goles: activa.goles,
        asistencias: activa.asistencias,
        enVivo: true,
      };
    }
    // Etapas cerradas: valores settled, sin cambios.
    return { ...etapa, enVivo: false };
  });
}