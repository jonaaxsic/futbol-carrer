import type { Club } from '@/domain/entities/club';
import { coloresDePais, type ColoresNacionales } from '@/shared/constants/national-colors';

/**
 * Colores de identidad por club (PR5, task 5.1).
 * `primario` y `secundario` siguen los colores de camiseta/escudo reales
 * de los clubes sembrados en `seed-clubes.ts`. La clave es el NOMBRE del
 * club (único en la BD; `escudoKey` se queda en null por decisión de alcance).
 * NO toca `seed-clubes.ts`. Para clubes sin entrada, `coloresDeClub` cae
 * en los colores del país (bandera), siempre con valor válido.
 */
export interface ColoresClub {
  primario: string;
  secundario: string;
}

export const CLUB_COLORS: Record<string, ColoresClub> = {
  // Chile
  'Colo-Colo': { primario: '#FFFFFF', secundario: '#0D0D0D' },
  'Universidad de Chile': { primario: '#0348A6', secundario: '#C8102E' },
  'Universidad Católica': { primario: '#1F3B73', secundario: '#C8102E' },
  'Everton de Viña del Mar': { primario: '#FFCB05', secundario: '#0D0D0D' },
  Huachipato: { primario: '#0348A6', secundario: '#C8102E' },
  'Unión Española': { primario: '#C8102E', secundario: '#FFCB05' },
  Palestino: { primario: '#FFFFFF', secundario: '#C8102E' },
  'Universidad de Concepción': { primario: '#0348A6', secundario: '#FFCB05' },

  // Argentina
  'River Plate': { primario: '#FFFFFF', secundario: '#E2231A' },
  'Boca Juniors': { primario: '#0348A6', secundario: '#FFCB05' },
  Independiente: { primario: '#C8102E', secundario: '#0D0D0D' },
  'Racing Club': { primario: '#69A6D9', secundario: '#FFFFFF' },
  'San Lorenzo': { primario: '#1F3B73', secundario: '#C8102E' },
  'Vélez Sarsfield': { primario: '#0348A6', secundario: '#FFFFFF' },
  'Estudiantes de La Plata': { primario: '#C8102E', secundario: '#0D0D0D' },
  'Rosario Central': { primario: '#0348A6', secundario: '#FFCB05' },
  'Newell\'s Old Boys': { primario: '#C8102E', secundario: '#0D0D0D' },
  Belgrano: { primario: '#FFFFFF', secundario: '#00843D' },
  Lanús: { primario: '#8A1538', secundario: '#FFFFFF' },
  Huracán: { primario: '#FFFFFF', secundario: '#C8102E' },
  'Argentinos Juniors': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Talleres de Córdoba': { primario: '#0348A6', secundario: '#FFFFFF' },
  'Instituto de Córdoba': { primario: '#C8102E', secundario: '#FFFFFF' },

  // Brasil
  Flamengo: { primario: '#C8102E', secundario: '#0D0D0D' },
  Palmeiras: { primario: '#00843D', secundario: '#FFFFFF' },
  Corinthians: { primario: '#0D0D0D', secundario: '#FFFFFF' },
  'São Paulo': { primario: '#FFFFFF', secundario: '#C8102E' },
  Santos: { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Cruzeiro: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Atlético Mineiro': { primario: '#0D0D0D', secundario: '#FFFFFF' },
  Botafogo: { primario: '#0D0D0D', secundario: '#FFFFFF' },
  Fluminense: { primario: '#8A1538', secundario: '#00843D' },
  'Vasco da Gama': { primario: '#0D0D0D', secundario: '#FFFFFF' },
  Internacional: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Grêmio': { primario: '#0F52BA', secundario: '#0D0D0D' },
  Bahia: { primario: '#0348A6', secundario: '#C8102E' },
  Fortaleza: { primario: '#0348A6', secundario: '#C8102E' },
  'Red Bull Bragantino': { primario: '#E2231A', secundario: '#FFFFFF' },

  // Uruguay
  Peñarol: { primario: '#FFCB05', secundario: '#0D0D0D' },
  Nacional: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Defensor Sporting': { primario: '#6A0DAD', secundario: '#FFFFFF' },
  'Liverpool (Montevideo)': { primario: '#0D0D0D', secundario: '#00A3E0' },
  Danubio: { primario: '#00843D', secundario: '#C8102E' },
  'Montevideo Wanderers': { primario: '#0D0D0D', secundario: '#FFFFFF' },
  'Rampla Juniors': { primario: '#00843D', secundario: '#C8102E' },

  // España
  'Real Madrid': { primario: '#FFFFFF', secundario: '#E8B800' },
  'FC Barcelona': { primario: '#0348A6', secundario: '#A50044' },
  'Atlético de Madrid': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Athletic Club': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Real Sociedad': { primario: '#0348A6', secundario: '#FFFFFF' },
  'Real Betis': { primario: '#00843D', secundario: '#FFFFFF' },
  Villarreal: { primario: '#F5D700', secundario: '#0D4F8B' },
  Valencia: { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Sevilla: { primario: '#FFFFFF', secundario: '#C8102E' },
  'Celta de Vigo': { primario: '#69A6D9', secundario: '#FFFFFF' },
  Girona: { primario: '#C8102E', secundario: '#FFFFFF' },
  Osasuna: { primario: '#C8102E', secundario: '#0348A6' },
  Mallorca: { primario: '#C8102E', secundario: '#0D0D0D' },
  'Rayo Vallecano': { primario: '#FFFFFF', secundario: '#C8102E' },
  Espanyol: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Las Palmas': { primario: '#FFCB05', secundario: '#0348A6' },

  // Inglaterra
  'Manchester City': { primario: '#69A6D9', secundario: '#FFFFFF' },
  Arsenal: { primario: '#C8102E', secundario: '#FFFFFF' },
  Liverpool: { primario: '#C8102E', secundario: '#FFFFFF' },
  Chelsea: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Manchester United': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Tottenham Hotspur': { primario: '#FFFFFF', secundario: '#0348A6' },
  'Newcastle United': { primario: '#0D0D0D', secundario: '#FFFFFF' },
  'Aston Villa': { primario: '#8A1538', secundario: '#0348A6' },
  'West Ham United': { primario: '#8A1538', secundario: '#5E9BFF' },
  Everton: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Crystal Palace': { primario: '#0348A6', secundario: '#C8102E' },
  Wolverhampton: { primario: '#E8B800', secundario: '#0D0D0D' },
  Fulham: { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Bournemouth: { primario: '#C8102E', secundario: '#0D0D0D' },
  'Nottingham Forest': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Leicester City': { primario: '#0348A6', secundario: '#FFFFFF' },
  Brighton: { primario: '#0348A6', secundario: '#FFFFFF' },
  Brentford: { primario: '#C8102E', secundario: '#FFFFFF' },
  Southampton: { primario: '#C8102E', secundario: '#FFFFFF' },
  Ipswich: { primario: '#0348A6', secundario: '#FFFFFF' },

  // Alemania
  'Bayern Múnich': { primario: '#DC052D', secundario: '#FFFFFF' },
  'Borussia Dortmund': { primario: '#FFCB05', secundario: '#0D0D0D' },
  'Bayer Leverkusen': { primario: '#C8102E', secundario: '#0D0D0D' },
  'RB Leipzig': { primario: '#C8102E', secundario: '#FFFFFF' },
  'VfB Stuttgart': { primario: '#FFFFFF', secundario: '#C8102E' },
  'Eintracht Frankfurt': { primario: '#E2231A', secundario: '#0D0D0D' },
  'Werder Bremen': { primario: '#00843D', secundario: '#FFFFFF' },
  'SC Friburgo': { primario: '#C8102E', secundario: '#0D0D0D' },
  'VfL Wolfsburgo': { primario: '#00843D', secundario: '#FFFFFF' },
  'Borussia Mönchengladbach': { primario: '#0D0D0D', secundario: '#FFFFFF' },
  'Unión Berlín': { primario: '#C8102E', secundario: '#FFFFFF' },
  'St. Pauli': { primario: '#5C3317', secundario: '#FFFFFF' },
  'VfL Bochum': { primario: '#0348A6', secundario: '#FFFFFF' },

  // Italia
  'Inter de Milán': { primario: '#0348A6', secundario: '#0D0D0D' },
  'AC Milan': { primario: '#C8102E', secundario: '#0D0D0D' },
  Juventus: { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Napoli: { primario: '#69A6D9', secundario: '#FFFFFF' },
  Atalanta: { primario: '#0348A6', secundario: '#0D0D0D' },
  Roma: { primario: '#8A1538', secundario: '#E8B800' },
  Lazio: { primario: '#7EC8E3', secundario: '#FFFFFF' },
  Fiorentina: { primario: '#6A0DAD', secundario: '#FFFFFF' },
  Bologna: { primario: '#C8102E', secundario: '#0348A6' },
  Torino: { primario: '#8A1538', secundario: '#FFFFFF' },
  Udinese: { primario: '#0D0D0D', secundario: '#FFFFFF' },
  Genoa: { primario: '#C8102E', secundario: '#0348A6' },
  Como: { primario: '#0348A6', secundario: '#FFFFFF' },

  // Francia
  'Paris Saint-Germain': { primario: '#0348A6', secundario: '#C8102E' },
  'Olympique de Marsella': { primario: '#7EC8E3', secundario: '#FFFFFF' },
  'AS Mónaco': { primario: '#C8102E', secundario: '#FFFFFF' },
  'LOSC Lille': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Olympique de Lyon': { primario: '#FFFFFF', secundario: '#C8102E' },
  'OGC Niza': { primario: '#C8102E', secundario: '#0D0D0D' },
  'RC Lens': { primario: '#C8102E', secundario: '#E8B800' },
  Rennes: { primario: '#C8102E', secundario: '#0D0D0D' },
  'RC Estrasburgo': { primario: '#0348A6', secundario: '#FFFFFF' },
  Toulouse: { primario: '#6A0DAD', secundario: '#FFFFFF' },
  Brest: { primario: '#C8102E', secundario: '#FFFFFF' },
  Nantes: { primario: '#FFCB05', secundario: '#00843D' },
  Montpellier: { primario: '#0348A6', secundario: '#FF7F00' },
  'Saint-Étienne': { primario: '#00843D', secundario: '#FFFFFF' },

  // Portugal
  Benfica: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Sporting CP': { primario: '#00843D', secundario: '#FFFFFF' },
  'FC Porto': { primario: '#0348A6', secundario: '#FFFFFF' },
  Braga: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Vitória Guimarães': { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Boavista: { primario: '#0D0D0D', secundario: '#FFFFFF' },

  // Colombia
  'Atlético Nacional': { primario: '#00843D', secundario: '#FFFFFF' },
  Millonarios: { primario: '#0348A6', secundario: '#FFFFFF' },
  'América de Cali': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Deportivo Cali': { primario: '#00843D', secundario: '#FFFFFF' },
  'Independiente Santa Fe': { primario: '#C8102E', secundario: '#FFFFFF' },
  Junior: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Independiente Medellín': { primario: '#C8102E', secundario: '#0348A6' },
  'Once Caldas': { primario: '#FFFFFF', secundario: '#0D0D0D' },
  'Deportes Tolima': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Deportivo Pasto': { primario: '#C8102E', secundario: '#FFFFFF' },

  // México
  América: { primario: '#FFD700', secundario: '#1F3B73' },
  Guadalajara: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Cruz Azul': { primario: '#0348A6', secundario: '#FFFFFF' },
  'Pumas UNAM': { primario: '#0348A6', secundario: '#E8B800' },
  Monterrey: { primario: '#0348A6', secundario: '#FFFFFF' },
  Tigres: { primario: '#FFCB05', secundario: '#0348A6' },
  León: { primario: '#00843D', secundario: '#FFFFFF' },
  Pachuca: { primario: '#FFFFFF', secundario: '#0348A6' },
  Atlas: { primario: '#C8102E', secundario: '#0D0D0D' },
  Toluca: { primario: '#C8102E', secundario: '#FFFFFF' },
  'Santos Laguna': { primario: '#00843D', secundario: '#FFFFFF' },
  Puebla: { primario: '#0348A6', secundario: '#FFFFFF' },
  Querétaro: { primario: '#0348A6', secundario: '#0D0D0D' },
  'Club Tijuana': { primario: '#C8102E', secundario: '#0D0D0D' },
  Necaxa: { primario: '#C8102E', secundario: '#FFFFFF' },
  'San Luis': { primario: '#0348A6', secundario: '#C8102E' },
  Juárez: { primario: '#E8B800', secundario: '#0D0D0D' },

  // Perú
  'Alianza Lima': { primario: '#0348A6', secundario: '#FFFFFF' },
  Universitario: { primario: '#F5F0E0', secundario: '#C8102E' },
  'Sporting Cristal': { primario: '#7EC8E3', secundario: '#FFFFFF' },
  'FBC Melgar': { primario: '#C8102E', secundario: '#0D0D0D' },
  Cienciano: { primario: '#0348A6', secundario: '#C8102E' },
  'Sport Boys': { primario: '#E75480', secundario: '#FFFFFF' },
  'Deportivo Municipal': { primario: '#FFFFFF', secundario: '#0348A6' },
  'Cusco FC': { primario: '#0348A6', secundario: '#C8102E' },
  'Atlético Grau': { primario: '#C8102E', secundario: '#0D0D0D' },
  'Sport Huancayo': { primario: '#C8102E', secundario: '#0348A6' },

  // Ecuador
  'LDU Quito': { primario: '#FFFFFF', secundario: '#C8102E' },
  'Barcelona SC': { primario: '#FFCB05', secundario: '#0D0D0D' },
  'Independiente del Valle': { primario: '#0348A6', secundario: '#C8102E' },
  Emelec: { primario: '#0348A6', secundario: '#FFFFFF' },
  'Universidad Católica de Quito': { primario: '#0348A6', secundario: '#C8102E' },
  'El Nacional': { primario: '#C8102E', secundario: '#FFFFFF' },
  Aucas: { primario: '#FFCB05', secundario: '#0D0D0D' },
  'Deportivo Cuenca': { primario: '#C8102E', secundario: '#FFFFFF' },
  'Mushuc Runa': { primario: '#C8102E', secundario: '#00843D' },
  'Técnico Universitario': { primario: '#FFCB05', secundario: '#0D0D0D' },
  'Guayaquil City': { primario: '#FF7F00', secundario: '#0D0D0D' },
  Delfín: { primario: '#0348A6', secundario: '#00843D' },
  Imbabura: { primario: '#0348A6', secundario: '#C8102E' },
  'Libertad FC': { primario: '#FFFFFF', secundario: '#C8102E' },

  // Paraguay
  'Cerro Porteño': { primario: '#0348A6', secundario: '#C8102E' },
  Olimpia: { primario: '#0D0D0D', secundario: '#FFFFFF' },
  Libertad: { primario: '#FFFFFF', secundario: '#0D0D0D' },
  Guaraní: { primario: '#FFCB05', secundario: '#0D0D0D' },
  'Nacional (Asunción)': { primario: '#0348A6', secundario: '#C8102E' },
  'Sportivo Luqueño': { primario: '#0348A6', secundario: '#FFCB05' },
  'General Caballero': { primario: '#C8102E', secundario: '#0D0D0D' },
  'Sportivo Ameliano': { primario: '#0348A6', secundario: '#FFFFFF' },
};

/** Devuelve los colores del club, cayendo en la bandera del país si no está mapeado. */
export function coloresDeClub(club: Club | null | undefined): ColoresClub {
  if (!club) return { primario: '#FFFFFF', secundario: '#6E6E6E' };
  const mapeado = CLUB_COLORS[club.nombre];
  if (mapeado) return mapeado;
  const pais: ColoresNacionales = coloresDePais(club.pais);
  return { primario: pais.primario, secundario: pais.secundario };
}