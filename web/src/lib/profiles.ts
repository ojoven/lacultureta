import { isFamilyAudience } from './audience';
import type { Category, CultureEvent, Language } from './types';

export const profileIds = ['all', 'family', 'music', 'cinema', 'curious', 'stage'] as const;
export type ProfileId = typeof profileIds[number];
export const profiles: Record<ProfileId, { categories: readonly Category[]; es: [string, string]; eu: [string, string] }> = {
  all: { categories: [], es: ['A mi aire', 'Toda la agenda, sin un perfil concreto.'], eu: ['Nire erara', 'Agenda osoa, profil jakinik gabe.'] },
  family: { categories: [], es: ['En familia', 'Planes infantiles. El fin de semana como fecha inicial.'], eu: ['Familian', 'Haurrentzako planak. Hasierako data: asteburua.'] },
  music: { categories: ['music'], es: ['Amante de la música', 'Conciertos y música en directo.'], eu: ['Musikazale', 'Kontzertuak eta zuzeneko musika.'] },
  cinema: { categories: ['cinema'], es: ['Pasión por el cine', 'Películas, ciclos y proyecciones.'], eu: ['Zinemazale', 'Filmak, zikloak eta emanaldiak.'] },
  curious: { categories: ['art', 'literature', 'talks', 'workshops'], es: ['Arte e ideas', 'Exposiciones, libros, charlas y talleres.'], eu: ['Artea eta ideiak', 'Erakusketak, liburuak, hitzaldiak eta tailerrak.'] },
  stage: { categories: ['theatre'], es: ['A escena', 'Teatro, danza y artes escénicas.'], eu: ['Oholtzara', 'Antzerkia, dantza eta arte eszenikoak.'] },
};
export function profileLabel(profile: ProfileId, language: Language) { return profiles[profile][language][0]; }
export function matchesProfile(event: Pick<CultureEvent, 'title' | 'description' | 'category'>, profile: ProfileId) {
  if (profile === 'all') return true;
  if (profile === 'family') return isFamilyAudience(event.title,event.description);
  return profiles[profile].categories.includes(event.category);
}
