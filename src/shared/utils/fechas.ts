const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/** "12 Jul" para fixtures. */
export function formatearFechaCorta(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

/** "Julio 2026" para el selector de mes del calendario. */
export function formatearMesAnio(ts: number): string {
  const d = new Date(ts);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 de julio de 2026" para resúmenes (retiro, trofeos). */
export function formatearFechaLarga(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Formatea valor de mercado: € 150K / € 2.5M. */
export function formatearValor(valor: number): string {
  if (valor >= 1_000_000) return `€ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (valor >= 1_000) return `€ ${Math.round(valor / 1_000)}K`;
  return `€ ${valor}`;
}