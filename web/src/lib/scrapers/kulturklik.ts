import { load } from 'cheerio';
import { z } from 'zod';
import type { Category, ImportedEvent, Language, Source } from '../types';

const itemSchema = z.object({
  id: z.string(), type: z.number(), nameEs: z.string().min(1), nameEu: z.string().optional(),
  startDate: z.string(), endDate: z.string().optional(), provinceNoraCode: z.string(), municipalityNoraCode: z.string(),
  images: z.array(z.object({imageUrl: z.string()})).default([]),
}).catchall(z.unknown());
const pageSchema = z.object({ totalItems: z.number(), totalPages: z.number(), currentPage: z.number(), items: z.array(itemSchema) });
type Item = z.infer<typeof itemSchema>;
export function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  const $ = load(value.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?\s*>/gi, '\n'));
  $('script,style,iframe').remove();
  return $.root().text().replace(/[^\S\n]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}
export function safeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function sourceFor(item: Item): Source {
  const origin = `${item.sourceNameEs} ${item.sourceUrlEs} ${item.sourceNameEu}`.toLowerCase();
  if (/tabakalera/.test(origin)) return 'tabakalera';
  if (/donostia kultura|donostiakultura|santelmomuseoa|victoriaeugenia/.test(origin)) return 'donostia-kultura';
  return 'kulturklik';
}
const categoryMap: Record<number, Category> = {1:'music',2:'theatre',3:'art',4:'theatre',6:'talks',7:'literature',9:'cinema',11:'workshops'};
export function parseItem(input: unknown): ImportedEvent {
  const item = itemSchema.parse(input);
  if (item.provinceNoraCode !== '20' || item.municipalityNoraCode !== '82') throw new Error(`Event ${item.id} is outside Donostia`);
  const startDate = item.startDate.slice(0, 10);
  const endDate = (item.endDate || item.startDate).slice(0, 10);
  for (const date of [startDate, endDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error(`Invalid event date: ${date}`);
  }
  if (endDate < startDate) throw new Error(`Invalid date range for ${item.id}`);
  const source = sourceFor(item);
  const translation = (language: Language) => {
    const suffix = language === 'eu' ? 'Eu' : 'Es';
    const text = (key: string) => cleanText(item[key + suffix] || item[key + 'Es']);
    return {
      title: text('name'), description: text('description'),
      place: text('establishment') || text('place') || (source === 'tabakalera' ? 'Tabakalera' : 'Donostia'),
      price: text('price'), hours: text('openingHours'),
      url: safeUrl(item['sourceUrl' + suffix] || item.sourceUrlEs) || safeUrl(item['urlEvent' + suffix]),
      ticketUrl: safeUrl(item['purchaseUrl' + suffix] || item.purchaseUrlEs),
    };
  };
  let category=categoryMap[item.type] || 'other';
  if(item.type===13&&/cine|film|zine/i.test(item.nameEs))category='cinema';
  if(item.type===6&&/literari|libro|liburu|tertulia/i.test(item.nameEs))category='literature';
  return { id: `kk-${item.id}`, externalId: item.id, source,
    category, startDate, endDate,
    image: safeUrl(item.images[0]?.imageUrl), eventLanguage: cleanText(item.language),
    translations: { es: translation('es'), eu: translation('eu') },
  };
}
async function requestPage(page: number) {
  const url = new URL('https://api.euskadi.eus/culture/events/v1.0/events/upcoming');
  url.search = new URLSearchParams({provinceNoraCode:'20',municipalityNoraCode:'82',_elements:'100',_page:String(page)}).toString();
  let lastError: unknown;
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response = await fetch(url, {headers:{'Accept':'application/json','User-Agent':'LaCultureta/2.0 (+https://lacultureta.com)'}, signal:AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error(`Kulturklik returned ${response.status}`);
      return pageSchema.parse(await response.json());
    } catch (error) { lastError = error; if(attempt<2) await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1))); }
  }
  throw lastError;
}
export async function fetchEvents() {
  const first = await requestPage(1);
  if (first.totalPages > 100) throw new Error('Unexpected page count; refusing incomplete import');
  const items = [...first.items];
  for (let page=2; page<=first.totalPages; page++) items.push(...(await requestPage(page)).items);
  const unique = new Map(items.map(item=>[item.id,parseItem(item)]));
  if (unique.size < first.totalItems) throw new Error('Incomplete feed; keeping previous events');
  return [...unique.values()];
}
