import type { Club } from '@/domain/entities/club';
import type { Country } from '@/shared/constants/game';
import { COUNTRIES, LIGAS_POR_PAIS } from '@/shared/constants/game';

import { getDb } from './client';

/**
 * Equipos reales de la temporada 2025-2026, solo primera división de cada país.
 * `liga` coincide EXACTAMENTE con `LIGAS_POR_PAIS` (fixture y ofertas agrupan
 * por ese valor). El `prestigio` es 1-5 (grandes 4-5, resto 2-3, modestos 1-2).
 * Se siembran una sola vez (INSERT OR IGNORE) vía `inicializarBase()`.
 */

type SemillaClub = Omit<Club, 'id' | 'escudoKey'>;

/** Primera División de Chile (16 equipos). */
const CLUBES_CHILE: readonly SemillaClub[] = [
  { nombre: 'Colo-Colo', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 5 },
  { nombre: 'Universidad de Chile', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 5 },
  { nombre: 'Universidad Católica', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 5 },
  { nombre: 'Cobresal', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Coquimbo Unido', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Everton de Viña del Mar', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Huachipato', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Ñublense', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'O\'Higgins', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Palestino', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Unión Española', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Audax Italiano', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 3 },
  { nombre: 'Deportes Iquique', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 2 },
  { nombre: 'Unión La Calera', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 2 },
  { nombre: 'Deportes Limache', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 2 },
  { nombre: 'Universidad de Concepción', pais: 'Chile', liga: LIGAS_POR_PAIS.Chile, prestigio: 2 },
];

/** Liga Profesional de Argentina (primera división). */
const CLUBES_ARGENTINA: readonly SemillaClub[] = [
  { nombre: 'River Plate', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 5 },
  { nombre: 'Boca Juniors', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 5 },
  { nombre: 'Independiente', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 4 },
  { nombre: 'Racing Club', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 4 },
  { nombre: 'San Lorenzo', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 4 },
  { nombre: 'Vélez Sarsfield', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 4 },
  { nombre: 'Estudiantes de La Plata', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 4 },
  { nombre: 'Rosario Central', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Newell\'s Old Boys', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Talleres de Córdoba', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Huracán', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Lanús', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Belgrano', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 3 },
  { nombre: 'Banfield', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Defensa y Justicia', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Godoy Cruz', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Argentinos Juniors', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Unión de Santa Fe', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Central Córdoba', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
  { nombre: 'Instituto de Córdoba', pais: 'Argentina', liga: LIGAS_POR_PAIS.Argentina, prestigio: 2 },
];

/** Serie A (Campeonato Brasileiro) de Brasil. */
const CLUBES_BRASIL: readonly SemillaClub[] = [
  { nombre: 'Flamengo', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 5 },
  { nombre: 'Palmeiras', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 5 },
  { nombre: 'Corinthians', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'São Paulo', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Santos', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Cruzeiro', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Atlético Mineiro', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Botafogo', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Fluminense', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Vasco da Gama', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Internacional', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Grêmio', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 4 },
  { nombre: 'Bahia', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Fortaleza', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Ceará', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 2 },
  { nombre: 'Red Bull Bragantino', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 3 },
  { nombre: 'Vitória', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 2 },
  { nombre: 'Juventude', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 2 },
  { nombre: 'Mirassol', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 1 },
  { nombre: 'Sport Recife', pais: 'Brasil', liga: LIGAS_POR_PAIS.Brasil, prestigio: 2 },
];

/** Primera División de Uruguay. */
const CLUBES_URUGUAY: readonly SemillaClub[] = [
  { nombre: 'Peñarol', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 5 },
  { nombre: 'Nacional', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 5 },
  { nombre: 'Defensor Sporting', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 4 },
  { nombre: 'Liverpool (Montevideo)', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 3 },
  { nombre: 'Danubio', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 3 },
  { nombre: 'Montevideo City Torque', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Montevideo Wanderers', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'River Plate (Montevideo)', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Racing (Montevideo)', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Plaza Colonia', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Fénix', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Progreso', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Rampla Juniors', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Cerro', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 1 },
  { nombre: 'Juventud', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
  { nombre: 'Boston River', pais: 'Uruguay', liga: LIGAS_POR_PAIS.Uruguay, prestigio: 2 },
];

/** La Liga de España. */
const CLUBES_ESPANA: readonly SemillaClub[] = [
  { nombre: 'Real Madrid', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 5 },
  { nombre: 'FC Barcelona', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 5 },
  { nombre: 'Atlético de Madrid', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 5 },
  { nombre: 'Athletic Club', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 4 },
  { nombre: 'Real Sociedad', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 4 },
  { nombre: 'Real Betis', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 4 },
  { nombre: 'Villarreal', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 4 },
  { nombre: 'Valencia', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 3 },
  { nombre: 'Sevilla', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 3 },
  { nombre: 'Celta de Vigo', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 3 },
  { nombre: 'Girona', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 3 },
  { nombre: 'Getafe', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Osasuna', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Mallorca', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Rayo Vallecano', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Espanyol', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Deportivo Alavés', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Las Palmas', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
  { nombre: 'Real Valladolid', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 1 },
  { nombre: 'Leganés', pais: 'España', liga: LIGAS_POR_PAIS.España, prestigio: 2 },
];

/** Premier League de Inglaterra. */
const CLUBES_INGLATERRA: readonly SemillaClub[] = [
  { nombre: 'Manchester City', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 5 },
  { nombre: 'Arsenal', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 5 },
  { nombre: 'Liverpool', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 5 },
  { nombre: 'Chelsea', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 4 },
  { nombre: 'Manchester United', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 4 },
  { nombre: 'Tottenham Hotspur', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 4 },
  { nombre: 'Newcastle United', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 4 },
  { nombre: 'Aston Villa', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 4 },
  { nombre: 'Brighton', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'West Ham United', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Fulham', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Brentford', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Crystal Palace', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Wolverhampton', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Bournemouth', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Nottingham Forest', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 3 },
  { nombre: 'Everton', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 2 },
  { nombre: 'Leicester City', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 2 },
  { nombre: 'Southampton', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 1 },
  { nombre: 'Ipswich Town', pais: 'Inglaterra', liga: LIGAS_POR_PAIS.Inglaterra, prestigio: 1 },
];

/** Bundesliga de Alemania. */
const CLUBES_ALEMANIA: readonly SemillaClub[] = [
  { nombre: 'Bayern Múnich', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 5 },
  { nombre: 'Borussia Dortmund', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 4 },
  { nombre: 'Bayer Leverkusen', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 4 },
  { nombre: 'RB Leipzig', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 4 },
  { nombre: 'VfB Stuttgart', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 3 },
  { nombre: 'Eintracht Frankfurt', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 3 },
  { nombre: 'Werder Bremen', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 3 },
  { nombre: 'SC Friburgo', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 3 },
  { nombre: 'TSG Hoffenheim', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'Mainz 05', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 3 },
  { nombre: 'VfL Wolfsburgo', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'Borussia Mönchengladbach', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'Unión Berlín', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'FC Augsburgo', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'St. Pauli', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: '1. FC Heidenheim', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 2 },
  { nombre: 'Holstein Kiel', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 1 },
  { nombre: 'VfL Bochum', pais: 'Alemania', liga: LIGAS_POR_PAIS.Alemania, prestigio: 1 },
];

/** Serie A de Italia. */
const CLUBES_ITALIA: readonly SemillaClub[] = [
  { nombre: 'Inter de Milán', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 5 },
  { nombre: 'AC Milan', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 5 },
  { nombre: 'Juventus', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 4 },
  { nombre: 'Napoli', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 4 },
  { nombre: 'Atalanta', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 4 },
  { nombre: 'Roma', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 4 },
  { nombre: 'Lazio', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 3 },
  { nombre: 'Fiorentina', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 3 },
  { nombre: 'Bologna', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 3 },
  { nombre: 'Torino', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Udinese', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Cagliari', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Genoa', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Hellas Verona', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Monza', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Parma', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Como', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Empoli', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 2 },
  { nombre: 'Lecce', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 1 },
  { nombre: 'Venezia', pais: 'Italia', liga: LIGAS_POR_PAIS.Italia, prestigio: 1 },
];

/** Ligue 1 de Francia. */
const CLUBES_FRANCIA: readonly SemillaClub[] = [
  { nombre: 'Paris Saint-Germain', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 5 },
  { nombre: 'Olympique de Marsella', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 4 },
  { nombre: 'AS Mónaco', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 4 },
  { nombre: 'LOSC Lille', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 4 },
  { nombre: 'Olympique de Lyon', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 4 },
  { nombre: 'OGC Niza', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 3 },
  { nombre: 'RC Lens', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 3 },
  { nombre: 'Rennes', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 3 },
  { nombre: 'RC Estrasburgo', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 3 },
  { nombre: 'Toulouse', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
  { nombre: 'Reims', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
  { nombre: 'Brest', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 3 },
  { nombre: 'Nantes', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
  { nombre: 'Montpellier', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
  { nombre: 'Auxerre', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
  { nombre: 'Le Havre', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 1 },
  { nombre: 'Angers', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 1 },
  { nombre: 'Saint-Étienne', pais: 'Francia', liga: LIGAS_POR_PAIS.Francia, prestigio: 2 },
];

/** Primeira Liga de Portugal. */
const CLUBES_PORTUGAL: readonly SemillaClub[] = [
  { nombre: 'Benfica', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 5 },
  { nombre: 'Sporting CP', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 5 },
  { nombre: 'FC Porto', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 5 },
  { nombre: 'Braga', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 4 },
  { nombre: 'Vitória Guimarães', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 3 },
  { nombre: 'Boavista', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Famalicão', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Gil Vicente', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Casa Pia', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Arouca', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Estoril Praia', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Rio Ave', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Moreirense', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Santa Clara', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Estrela', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
  { nombre: 'Nacional de Madeira', pais: 'Portugal', liga: LIGAS_POR_PAIS.Portugal, prestigio: 2 },
];

/** Categoría Primera A de Colombia (16 equipos). */
const CLUBES_COLOMBIA: readonly SemillaClub[] = [
  { nombre: 'Atlético Nacional', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 5 },
  { nombre: 'Millonarios', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 4 },
  { nombre: 'América de Cali', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 4 },
  { nombre: 'Deportivo Cali', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 4 },
  { nombre: 'Independiente Santa Fe', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 4 },
  { nombre: 'Junior', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 3 },
  { nombre: 'Deportes Tolima', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 3 },
  { nombre: 'Once Caldas', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 3 },
  { nombre: 'Deportivo Pasto', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
  { nombre: 'Independiente Medellín', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 3 },
  { nombre: 'La Equidad', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
  { nombre: 'Envigado', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 1 },
  { nombre: 'Jaguares', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
  { nombre: 'Alianza FC', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
  { nombre: 'Atlético Bucaramanga', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
  { nombre: 'Águilas Doradas', pais: 'Colombia', liga: LIGAS_POR_PAIS.Colombia, prestigio: 2 },
];

/** Liga MX de México (18 equipos). */
const CLUBES_MEXICO: readonly SemillaClub[] = [
  { nombre: 'América', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 5 },
  { nombre: 'Guadalajara', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 4 },
  { nombre: 'Cruz Azul', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 4 },
  { nombre: 'Pumas UNAM', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 4 },
  { nombre: 'Monterrey', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 4 },
  { nombre: 'Tigres', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 4 },
  { nombre: 'León', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 3 },
  { nombre: 'Pachuca', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 3 },
  { nombre: 'Atlas', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Club Tijuana', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Necaxa', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Puebla', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Querétaro', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Toluca', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 3 },
  { nombre: 'Santos Laguna', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Mazatlán', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'San Luis', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 2 },
  { nombre: 'Juárez', pais: 'México', liga: LIGAS_POR_PAIS.México, prestigio: 1 },
];

/** Liga 1 de Perú (16 equipos). */
const CLUBES_PERU: readonly SemillaClub[] = [
  { nombre: 'Alianza Lima', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 5 },
  { nombre: 'Universitario', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 5 },
  { nombre: 'Sporting Cristal', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 4 },
  { nombre: 'FBC Melgar', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 4 },
  { nombre: 'Cienciano', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 3 },
  { nombre: 'Sport Boys', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 3 },
  { nombre: 'Universidad César Vallejo', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Deportivo Municipal', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Cusco FC', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Alianza Atlético', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'ADT', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'UTC', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Deportivo Garcilaso', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Atlético Grau', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 2 },
  { nombre: 'Sport Huancayo', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 3 },
  { nombre: 'Comerciantes Unidos', pais: 'Perú', liga: LIGAS_POR_PAIS.Perú, prestigio: 1 },
];

/** LigaPro Serie A de Ecuador (16 equipos). */
const CLUBES_ECUADOR: readonly SemillaClub[] = [
  { nombre: 'LDU Quito', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 5 },
  { nombre: 'Barcelona SC', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 5 },
  { nombre: 'Independiente del Valle', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 4 },
  { nombre: 'Emelec', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 4 },
  { nombre: 'Universidad Católica de Quito', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 3 },
  { nombre: 'El Nacional', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 3 },
  { nombre: 'Deportivo Cuenca', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Aucas', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Delfín', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 3 },
  { nombre: 'Orense', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Mushuc Runa', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Técnico Universitario', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Macará', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Guayaquil City', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 1 },
  { nombre: 'Libertad FC', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 2 },
  { nombre: 'Imbabura', pais: 'Ecuador', liga: LIGAS_POR_PAIS.Ecuador, prestigio: 1 },
];

/** Primera División de Paraguay (16 equipos). */
const CLUBES_PARAGUAY: readonly SemillaClub[] = [
  { nombre: 'Cerro Porteño', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 5 },
  { nombre: 'Olimpia', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 4 },
  { nombre: 'Libertad', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 4 },
  { nombre: 'Guaraní', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 3 },
  { nombre: 'Nacional (Asunción)', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 3 },
  { nombre: 'Sportivo Luqueño', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Sol de América', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Tacuary', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Sportivo Trinidense', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'General Caballero', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Deportivo 2 de Mayo', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Sportivo Ameliano', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 2 },
  { nombre: 'Guaireña', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 1 },
  { nombre: 'Independiente (Campo Grande)', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 1 },
  { nombre: 'Deportivo Recoleta', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 1 },
  { nombre: 'River Plate (Asunción)', pais: 'Paraguay', liga: LIGAS_POR_PAIS.Paraguay, prestigio: 1 },
];

/** Clubes reales por país (solo primera división). */
const CLUBES_POR_PAIS: Record<Country, readonly SemillaClub[]> = {
  Chile: CLUBES_CHILE,
  Argentina: CLUBES_ARGENTINA,
  Brasil: CLUBES_BRASIL,
  Uruguay: CLUBES_URUGUAY,
  Colombia: CLUBES_COLOMBIA,
  México: CLUBES_MEXICO,
  Perú: CLUBES_PERU,
  Paraguay: CLUBES_PARAGUAY,
  Ecuador: CLUBES_ECUADOR,
  España: CLUBES_ESPANA,
  Portugal: CLUBES_PORTUGAL,
  Inglaterra: CLUBES_INGLATERRA,
  Alemania: CLUBES_ALEMANIA,
  Italia: CLUBES_ITALIA,
  Francia: CLUBES_FRANCIA,
};

/** Idempotente: inserta los clubes que falten (nombres UNIQUE). */
export async function sembrarClubes(): Promise<void> {
  const db = await getDb();

  for (const pais of COUNTRIES) {
    for (const club of CLUBES_POR_PAIS[pais]) {
      await insertar(db, club);
    }
  }
}

type Db = Awaited<ReturnType<typeof getDb>>;

async function insertar(
  db: Db,
  club: SemillaClub,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO club (nombre, pais, liga, prestigio)
     VALUES (?, ?, ?, ?)`,
    [club.nombre, club.pais, club.liga, club.prestigio],
  );
}