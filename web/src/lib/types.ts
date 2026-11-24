export const languages = ['es', 'eu'] as const;
export type Language = typeof languages[number];
export const EVENT_ID_PATTERN = /^(?:kk-\d{1,30}|dk-[a-f0-9]{24}|tb-\d+-\d+)$/;
export const categories = ['all', 'music', 'cinema', 'theatre', 'art', 'literature', 'talks', 'workshops', 'other'] as const;
export type Category = typeof categories[number];
export type Source = 'donostia-kultura' | 'tabakalera' | 'kulturklik';
export interface EventTranslation { title: string; description: string; place: string; price: string; hours: string; url: string; ticketUrl: string }
export interface ImportedEvent {
  id: string; source: Source; externalId: string; category: Category;
  startDate: string; endDate: string; image: string; eventLanguage: string;
  translations: Record<Language, EventTranslation>;
}
export interface CultureEvent extends EventTranslation {
  id: string; source: Source; category: Category; startDate: string;
  endDate: string; image: string; eventLanguage: string; isFree: boolean;
  status?: 'cancelled' | 'withdrawn';
}
export interface EventPage { events: CultureEvent[]; total: number; page: number; pages: number; places: string[]; updatedAt: string | null }
