import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { z } from 'zod';
import { cleanText, safeUrl } from './kulturklik';
import { madridToday } from '../dates';
import type { Category, EventTranslation, ImportedEvent, Language, Source } from '../types';
import type { SourceFetcher } from './http';

export interface DirectEvent extends ImportedEvent {
  originKey: string;
  originUrl: string;
  cancelled: boolean;
  descriptionIsSummary?: boolean;
  translatedLanguages: Language[];
}
interface LocalRecord {
  key: string; matchKey: string; language: Language; translation: EventTranslation;
  category: Category; startDate: string; endDate: string; image: string; eventLanguage: string; cancelled: boolean;
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 24);
export function normaliseUrl(value: string): string {
  try {
    const url = new URL(value);
    for (const key of ['lang', 'language', 'idioma', 'utm_source', 'utm_medium', 'utm_campaign']) url.searchParams.delete(key);
    url.searchParams.sort();
    return url.hostname.replace(/^www\./, '') + decodeURIComponent(url.pathname).replace(/\/$/, '') + url.search;
  } catch { return value; }
}
function day(value: unknown): string {
  const date = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Invalid source date: ' + String(value));
  return date;
}
export function categoryFor(value: string): Category {
  const name = value.toLowerCase();
  if (/taller|tailer|formaci/.test(name)) return 'workshops';
  if (/proyecci|cine|cinema|zinema|audiovisual/.test(name)) return 'cinema';
  if (/concierto|musica|música|musika|kontzertu/.test(name)) return 'music';
  if (/teatro|danza|performan|antzerki|dantza|representaci/.test(name)) return 'theatre';
  if (/literatura|libro|liburu|bertsolari/.test(name)) return 'literature';
  if (/exposici|erakusketa|instalaci|arte|fotograf/.test(name)) return 'art';
  if (/conferencia|encuentro|hitzaldi|pensamiento|debate/.test(name)) return 'talks';
  return 'other';
}
/** Some source JSON-LD embeds raw newlines inside strings. Repair controls only. */
export function parseJsonLd(raw: string): unknown {
  let output = '', quoted = false, escaped = false;
  for (const char of raw) {
    if (quoted && char.charCodeAt(0) < 32) { output += JSON.stringify(char).slice(1, -1); continue; }
    if (char === '"' && !escaped) quoted = !quoted;
    output += char;
    escaped = char === '\\' && !escaped;
  }
  return JSON.parse(output);
}
const schemaEvent = z.object({
  '@type': z.union([z.string(), z.array(z.string())]), name: z.string().min(1), startDate: z.string(), endDate: z.string().optional(),
  url: z.string().optional(), description: z.string().optional(), image: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.object({ name: z.string().optional() }).passthrough().optional(),
  offers: z.union([z.object({}).passthrough(), z.array(z.object({}).passthrough())]).optional(),
}).passthrough();

export function parseDonostiaAgenda(html: string, language: Language, today = madridToday()): LocalRecord[] {
  const $ = load(html);
  const annotations = new Map<string, { title: string; category: Category; language: string }>();
  $('.tarjeta').each((_, card) => {
    const url = $(card).find('.tarjeta__titulo a').attr('href');
    if (url) annotations.set(normaliseUrl(new URL(url, 'https://www.donostiakultura.eus').href), {
      title: cleanText($(card).find('.tarjeta__titulo').text()), category: categoryFor($(card).find('.tarjeta__tipologia').text()), language: '',
    });
  });
  const items: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, script) => {
    const raw = $(script).text();
    try {
      const document = parseJsonLd(raw) as Record<string, unknown>;
      if (Array.isArray(document.itemListElement)) {
        for (const element of document.itemListElement as { item?: unknown }[]) if (element.item) items.push(element.item);
      }
    } catch (error) { throw new Error('Donostia Kultura JSON-LD changed: ' + (error as Error).message); }
  });
  if (!items.length) throw new Error('Donostia Kultura returned no structured agenda; refusing an empty import');
  const records: LocalRecord[] = [];
  for (const input of items) {
    const event = schemaEvent.parse(input);
    if (!(Array.isArray(event['@type']) ? event['@type'].includes('Event') : event['@type'] === 'Event')) continue;
    const startDate = day(event.startDate), endDate = day(event.endDate || event.startDate);
    if (endDate < startDate) throw new Error('Donostia Kultura returned a reversed date range');
    if (endDate < today) continue;
    const url = safeUrl(event.url);
    if (!url) throw new Error('Donostia Kultura event is missing its source URL');
    const image = safeUrl(Array.isArray(event.image) ? event.image[0] : event.image);
    const offer = (Array.isArray(event.offers) ? event.offers[0] : event.offers) || {};
    const category = annotations.get(normaliseUrl(url))?.category || categoryFor(cleanText(event.genre || event.eventType || event.name));
    const time = event.startDate.match(/T(\d{2}:\d{2})/)?.[1] || '';
    // 01:00 is a placeholder used by DK for sessions with multiple actual times.
    const hours = time === '00:00' || time === '01:00' ? '' : time;
    const amount = typeof offer.price === 'number' || typeof offer.price === 'string' ? String(offer.price) : '';
    const price = amount ? `${amount.replace('.', ',')} ${cleanText(offer.priceCurrency) === 'EUR' ? '€' : cleanText(offer.priceCurrency)}`.trim() : event.isAccessibleForFree === true ? '0 €' : '';
    const key = hash(normaliseUrl(url) + '|' + event.startDate + '|' + (event.endDate || event.startDate));
    // Image + exact dates/times is shared between the language variants; avoid ordering assumptions.
    const matchKey = image ? normaliseUrl(image) + '|' + event.startDate + '|' + (event.endDate || event.startDate) : normaliseUrl(safeUrl(offer.url)) + '|' + event.startDate;
    records.push({ key, matchKey, language, category, startDate, endDate, image, eventLanguage: cleanText(event.inLanguage),
      cancelled: /EventCancelled/i.test(String(event.eventStatus)),
      translation: { title: annotations.get(normaliseUrl(url))?.title || cleanText(event.name), description: cleanText(event.description), place: cleanText(event.location?.name) || 'Donostia', price, hours, url, ticketUrl: safeUrl(offer.url) },
    });
  }
  if (records.length < items.length * .5) throw new Error('Donostia Kultura agenda looks stale or incomplete');
  return records;
}
function combine(source: Source, es: LocalRecord[], eu: LocalRecord[], summary = false): DirectEvent[] {
  const languages = new Map<string, LocalRecord[]>();
  for (const record of eu) languages.set(record.matchKey, [...(languages.get(record.matchKey) || []), record]);
  return es.map(record => {
    const candidates = languages.get(record.matchKey) || [];
    const translated = candidates.length === 1 ? candidates[0] : candidates.find(candidate => normaliseUrl(candidate.translation.ticketUrl) && normaliseUrl(candidate.translation.ticketUrl) === normaliseUrl(record.translation.ticketUrl));
    const id = (source === 'tabakalera' ? 'tb-' : 'dk-') + record.key;
    return { id, externalId: id, originKey: record.key, originUrl: record.translation.url, source, category: record.category,
      startDate: record.startDate, endDate: record.endDate, image: record.image, eventLanguage: record.eventLanguage,
      translations: { es: record.translation, eu: translated?.translation || record.translation },
      cancelled: record.cancelled, descriptionIsSummary: summary, translatedLanguages: translated ? ['es', 'eu'] : ['es'],
    };
  });
}
export async function fetchDonostiaEvents(client: SourceFetcher): Promise<DirectEvent[]> {
  const es = await client.get('https://www.donostiakultura.eus/es/agenda');
  const eu = await client.get('https://www.donostiakultura.eus/eu/agenda');
  // The agenda embeds its complete ItemList, including events beyond the 24 visible cards.
  return combine('donostia-kultura', parseDonostiaAgenda(es.body, 'es'), parseDonostiaAgenda(eu.body, 'eu'));
}

const sessionSchema = z.object({
  pid: z.number(), fecha: z.string().nullable().optional(), fechaFin: z.string().nullable().optional(),
  estado: z.string().nullable().optional(), tipoAcceso: z.string().nullable().optional(),
  hora: z.object({ time: z.string() }).nullable().optional(), horaFin: z.object({ time: z.string() }).nullable().optional(),
  textoHora: z.string().nullable().optional(), fechaOriginal: z.string().nullable().optional(), fechaFinOriginal: z.string().nullable().optional(),
  relationships: z.object({ lugar: z.object({ name: z.string() }).nullable().optional(), idioma: z.array(z.object({ name: z.string() })).optional() }).passthrough(),
}).passthrough();
const tabNodeSchema = z.object({
  nid: z.number(), langcode: z.string(), title: z.string(), status: z.boolean(), tipoEvento: z.string(),
  path: z.object({ alias: z.string(), langcode: z.string().optional() }),
  descripcionCorta: z.object({ processed: z.string() }).nullable().optional(), urlTicketing: z.string().nullable().optional(),
  relationships: z.object({ convocatorias: z.array(sessionSchema), tipoActividad: z.array(z.object({ name: z.string() })).nullable().optional(),
    tematica: z.object({ name: z.string() }).nullable().optional(), imagenListado: z.unknown().optional(),
  }).passthrough(),
}).passthrough();
const tabPageSchema = z.object({ result: z.object({ data: z.object({ agendas: z.object({ nodes: z.array(z.unknown()) }) }), pageContext: z.object({ today: z.string().optional() }).passthrough().optional() }) });

export function parseTabakaleraAgenda(input: unknown, language: Language, today = madridToday()): LocalRecord[] {
  const page = tabPageSchema.parse(input);
  if (page.result.pageContext?.today && page.result.pageContext.today < new Date(Date.parse(today) - 7 * 86400000).toISOString().slice(0, 10)) throw new Error('Tabakalera page data is over seven days old');
  const records: LocalRecord[] = [];
  for (const input of page.result.data.agendas.nodes) {
    const node = tabNodeSchema.parse(input);
    if (!node.status || node.langcode !== language || !['actividad', 'exposicion'].includes(node.tipoEvento)) continue;
    const imageNode = node.relationships.imagenListado as { relationships?: { imgSrc?: { uri?: { url?: string } } } } | null;
    const imagePath = imageNode?.relationships?.imgSrc?.uri?.url;
    const image = imagePath ? safeUrl(new URL(imagePath, 'https://cms.tabakalera.eus').href) : '';
    const url = safeUrl(`https://www.tabakalera.eus/${language}${node.path.alias.startsWith('/') ? '' : '/'}${node.path.alias}`);
    for (const session of node.relationships.convocatorias) {
      const rawStart = session.fecha || session.fechaOriginal, rawEnd = session.fechaFin || session.fechaFinOriginal || rawStart;
      if (!rawStart || !rawEnd || rawEnd.slice(0, 10) < today) continue;
      const startDate = day(rawStart), endDate = day(rawEnd);
      if (endDate < startDate) throw new Error('Tabakalera session has a reversed date range');
      const free = /^(Gratuito|Libre|Doan|Librea)$/i.test(session.tipoAcceso || '');
      const hours = cleanText(session.textoHora) || [session.hora?.time, session.horaFin?.time].filter(Boolean).join('–');
      const key = `${node.nid}-${session.pid}`;
      records.push({ key, matchKey: key, language, startDate, endDate, image,
        category: categoryFor((node.relationships.tipoActividad || []).map(type => type.name).join(' ') || node.relationships.tematica?.name || node.tipoEvento),
        eventLanguage: (session.relationships.idioma || []).map(item => item.name).join(', '),
        cancelled: /cancel|anulad|bertan behera/i.test(session.estado || ''),
        translation: { title: cleanText(node.title), description: cleanText(node.descripcionCorta?.processed), place: cleanText(session.relationships.lugar?.name) || 'Tabakalera',
          price: free ? '0 €' : '', hours, url, ticketUrl: safeUrl(node.urlTicketing) },
      });
    }
  }
  if (!records.length) throw new Error('Tabakalera returned no upcoming sessions');
  return records;
}
export async function fetchTabakaleraEvents(client: SourceFetcher): Promise<DirectEvent[]> {
  // Gatsby's public page data is the dataset used by the agenda and its "Ver más" button.
  // Two requests cover all sessions, rather than crawling thousands of detail pages.
  const es = await client.get('https://www.tabakalera.eus/page-data/es/agenda-cultural-san-sebastian/page-data.json');
  const esRecords = parseTabakaleraAgenda(JSON.parse(es.body), 'es');
  const eu = await client.get('https://www.tabakalera.eus/page-data/eu/agenda-kulturala-donostia/page-data.json');
  return combine('tabakalera', esRecords, parseTabakaleraAgenda(JSON.parse(eu.body), 'eu'), true);
}
