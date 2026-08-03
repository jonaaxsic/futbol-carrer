import type { TipoEvento } from '@/domain/entities/evento-log';

/**
 * Motor de eventos aleatorios (§4.4 del plan).
 * Puro: los eventos se definen como datos (fácil de ampliar sin tocar UI)
 * y la selección es ponderada por contexto (OVR, lesión reciente, etc.).
 */

export interface EfectoEvento {
  /** Campo de impacto visible en la pantalla de evento. */
  etiqueta: string;
  /** true = sube, false = baja, null = neutro. */
  direccion: 'up' | 'down' | 'neutral';
  /** Delta de OVR aplicado (si el efecto afecta el nivel). */
  ovrDelta?: number;
}

export interface OpcionEvento {
  id: string;
  texto: string;
  /** Efectos por cada indicador afectado. */
  efectos: EfectoEvento[];
  /** Descripción corta de lo que pasa al elegir (se muestra tras decidir). */
  resultado?: string;
  /** Ruta interna a la que navegar tras resolver (ej. 'penalty'). */
  navegarA?: string;
}

export interface EventoNarrativo {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  descripcion: string;
  opciones: OpcionEvento[];
}

export interface ContextoEvento {
  ovr: number;
  posicion: string;
  edad: number;
  /** temporada ≥ 2: los eventos "de oferta" se habilitan. */
  temporada: number;
  random?: () => number;
}

/**
 * Catálogo de eventos. Se amplía agregando entradas aquí:
 * el motor y las pantallas no cambian.
 */
const EVENTOS: readonly EventoNarrativo[] = [
  {
    id: 'prensa-buena',
    tipo: 'prensa',
    titulo: '¡Portada del diario!',
    descripcion:
      'El diario local te destaca como la gran promesa del club. La afición está ilusionada.',
    opciones: [
      {
        id: 'agradecer',
        texto: 'Agradecer y mantener la humildad',
        efectos: [{ etiqueta: 'Rendimiento', direccion: 'up', ovrDelta: 1 }],
        resultado: 'El vestuario valora tu actitud profesional.',
      },
      {
        id: 'exigir',
        texto: 'Exigir más oportunidades',
        efectos: [
          { etiqueta: 'Relación DT', direccion: 'down' },
          { etiqueta: 'Oportunidades', direccion: 'up' },
        ],
        resultado: 'El DT no tomó bien tu reclamo público.',
      },
    ],
  },
  {
    id: 'dt-banca',
    tipo: 'banca',
    titulo: 'El DT te deja en la banca',
    descripcion:
      'Para el próximo partido, el entrenador prefiere dar descanso a los titulares.',
    opciones: [
      {
        id: 'aceptar',
        texto: 'Aceptar y entrenar más fuerte',
        efectos: [{ etiqueta: 'Rendimiento', direccion: 'up', ovrDelta: 1 }],
        resultado: 'Respondiste con trabajo en los entrenamientos.',
      },
      {
        id: 'reclamar',
        texto: 'Reclamar un lugar en el once',
        efectos: [
          { etiqueta: 'Relación DT', direccion: 'down' },
          { etiqueta: 'Oportunidades', direccion: 'up' },
        ],
        resultado: 'El DT reconsiderará, pero no te lo olvidará.',
      },
    ],
  },
  {
    id: 'oferta-club',
    tipo: 'oferta',
    titulo: 'Oferta de otro club',
    descripcion:
      'Un club de mayor prestigio se fija en vos y presenta una oferta por tu pase.',
    opciones: [
      {
        id: 'quedarse',
        texto: 'Quedarse en el club',
        efectos: [{ etiqueta: 'Relación afición', direccion: 'up' }],
        resultado: 'La afición valora tu lealtad.',
      },
      {
        id: 'escuchar',
        texto: 'Escuchar la oferta',
        efectos: [{ etiqueta: 'Oportunidades', direccion: 'up' }],
        resultado: 'Tu representante inicia las negociaciones.',
      },
    ],
  },
  {
    id: 'lesion-leve',
    tipo: 'lesion',
    titulo: 'Molestia muscular',
    descripcion:
      'Sentís una molestia en el isquiotibial. El cuerpo médico recomienda precaución.',
    opciones: [
      {
        id: 'descansar',
        texto: 'Descansar y recuperarse',
        efectos: [{ etiqueta: 'Rendimiento', direccion: 'neutral' }],
        resultado: 'Te perdés el próximo partido pero llegás sano al siguiente.',
      },
      {
        id: 'forzar',
        texto: 'Forzar la recuperación',
        efectos: [
          { etiqueta: 'Rendimiento', direccion: 'down', ovrDelta: -1 },
          { etiqueta: 'Riesgo de lesión grave', direccion: 'up' },
        ],
        resultado: 'Jugás, pero con molestias que afectan tu nivel.',
      },
    ],
  },
  {
    id: 'alimentacion',
    tipo: 'decision',
    titulo: 'Cambio de alimentación',
    descripcion:
      'Un nutricionista de élite te ofrece un plan estricto para mejorar tu rendimiento.',
    opciones: [
      {
        id: 'aceptar',
        texto: 'Aceptar el plan',
        efectos: [{ etiqueta: 'Rendimiento', direccion: 'up', ovrDelta: 1 }],
        resultado: 'Te sentís más ligero y explosivo.',
      },
      {
        id: 'rechazar',
        texto: 'Seguir igual',
        efectos: [{ etiqueta: 'Rendimiento', direccion: 'neutral' }],
        resultado: 'Preferís no cambiar tus hábitos.',
      },
    ],
  },
  {
    id: 'penal-decision',
    tipo: 'penal',
    titulo: '¡Hay penal!',
    descripcion:
      'El árbitro marca penal a favor de tu equipo en el minuto final. El DT te da la pelota.',
    opciones: [
      {
        id: 'patear',
        texto: 'Patear yo mismo',
        efectos: [{ etiqueta: 'Oportunidad', direccion: 'up' }],
        resultado: 'Todo el estadio te mira. El destino se decide en tu pie (pantalla de penal).',
        navegarA: 'penalty',
      },
      {
        id: 'ceder',
        texto: 'Dejar que lo patee un compañero',
        efectos: [{ etiqueta: 'Oportunidad', direccion: 'neutral' }],
        resultado: 'Cedés la responsabilidad. El compañero convierte y te lo agradece.',
      },
    ],
  },
];

/** Probabilidad base de que ocurra un evento tras un partido. */
export const PROBABILIDAD_EVENTO = 0.35;

/** Pesos por tipo según contexto (los eventos "buenos" suben con OVR). */
function pesoDe(evento: EventoNarrativo, ctx: ContextoEvento): number {
  switch (evento.tipo) {
    case 'prensa':
      return ctx.ovr >= 70 ? 2 : 1;
    case 'banca':
      return ctx.ovr < 60 ? 1.5 : 0.8;
    case 'oferta':
      return ctx.temporada >= 2 ? 2 : 0;
    case 'lesion':
      return 1;
    case 'decision':
      return 0.8;
    default:
      return 1;
  }
}

/**
 * Selecciona un evento aleatorio ponderado, o null si no ocurre nada
 * (la probabilidad base se decide afuera: PROBABILIDAD_EVENTO).
 */
export function elegirEvento(ctx: ContextoEvento): EventoNarrativo | null {
  const rnd = ctx.random ?? Math.random;
  const candidatos = EVENTOS.map((e) => ({ e, peso: pesoDe(e, ctx) })).filter(
    (c) => c.peso > 0,
  );
  const total = candidatos.reduce((acc, c) => acc + c.peso, 0);
  let roll = rnd() * total;
  for (const c of candidatos) {
    roll -= c.peso;
    if (roll <= 0) return c.e;
  }
  return candidatos[0]?.e ?? null;
}

/** Penal: el jugador patea y el arquero se lanza (probabilístico por OVR). */
export interface PenalParams {
  ovr: number;
  posicion: string;
  random?: () => number;
}

export function patearPenal(params: PenalParams): { gol: boolean; atajado: boolean } {
  const rnd = params.random ?? Math.random;
  // POR/DFC patean peor; delanteros mejor. Base 0.72 + OVR/200.
  const penalidadPosicion = params.posicion === 'POR' || params.posicion === 'DFC' ? 0.1 : 0;
  const probGol = Math.min(0.92, 0.72 + params.ovr / 200 - penalidadPosicion);
  const gol = rnd() < probGol;
  return { gol, atajado: !gol };
}