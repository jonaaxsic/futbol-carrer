/** Entidad de log de eventos narrativos (tabla `evento_log`, §4.4). */
export type TipoEvento =
  | 'lesion'
  | 'prensa'
  | 'oferta'
  | 'decision'
  | 'banca'
  | 'penal'
  | 'otro';

export interface EventoLog {
  id: number;
  playerId: number;
  /** Epoch ms. */
  fechaTs: number;
  tipo: TipoEvento;
  descripcion: string;
  /** JSON con el impacto aplicado (OVR/moral del club...). */
  impactoJson: string | null;
}