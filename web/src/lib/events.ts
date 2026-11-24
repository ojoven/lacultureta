import { z } from 'zod';
import { db } from './db';
import { categories, type CultureEvent, type EventPage, type Language } from './types';
import { dateWindow, madridToday } from './dates';
import { familyTerms, profileIds, profiles } from './profiles';

export const querySchema = z.object({
  lang: z.enum(['es', 'eu']).default('es'), q: z.string().trim().max(160).default(''),
  category: z.enum(categories).default('all'),
  profile: z.enum(profileIds).default('all'),
  period: z.enum(['all', 'today', 'tomorrow', 'weekend', 'week']).default('all'),
  place: z.string().max(240).default(''), source: z.enum(['', 'donostia-kultura', 'tabakalera', 'kulturklik']).default(''),
  free: z.enum(['0', '1']).default('0'), page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  ids: z.string().max(4000).optional(),
});
export type EventQuery = z.infer<typeof querySchema>;
const select = `SELECT e.id,e.source,e.category,e.start_date AS startDate,e.end_date AS endDate,
  e.image,e.event_language AS eventLanguage,e.is_free AS isFree,
  t.title,t.description,t.place,t.price,t.hours,t.url,t.ticket_url AS ticketUrl
  FROM events e JOIN event_translations t ON t.event_id=e.id`;
export function listEvents(query: EventQuery): EventPage {
  const database = db();
  const [from, to] = dateWindow(query.period);
  const where = ['t.language = ?', 'e.end_date >= ?'];
  const values: (string | number)[] = [query.lang, from];
  if (to) { where.push('e.start_date <= ?'); values.push(to); }
  if (query.category !== 'all') { where.push('e.category = ?'); values.push(query.category); }
  if (query.profile === 'family') {
    where.push(`EXISTS(SELECT 1 FROM event_translations family WHERE family.event_id=e.id AND (${familyTerms.map(() => "instr(lower(family.title || ' ' || family.description), ?) > 0").join(' OR ')}))`);
    values.push(...familyTerms);
  } else if (query.profile !== 'all') {
    const selected = profiles[query.profile].categories;
    where.push(`e.category IN (${selected.map(() => '?').join(',')})`); values.push(...selected);
  }
  if (query.source==='kulturklik') { where.push('e.source = ?'); values.push(query.source); }
  else if (query.source) { where.push('(e.source = ? OR EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=e.id AND o.source=? AND o.active=1))'); values.push(query.source,query.source); }
  if (query.place) { where.push('t.place = ?'); values.push(query.place); }
  if (query.free === '1') where.push('e.is_free = 1');
  if (query.q) {
    where.push("(t.title LIKE ? ESCAPE '\\' OR t.place LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\')");
    const search = '%' + query.q.replace(/[\\%_]/g, '\\$&') + '%';
    values.push(search, search, search);
  }
  if (query.ids !== undefined) {
    const ids = query.ids.split(',').filter(id => /^[a-zA-Z0-9_-]{1,80}$/.test(id)).slice(0, 100);
    where.push(ids.length ? `e.id IN (${ids.map(() => '?').join(',')})` : '0');
    values.push(...ids);
  }
  const clause = where.join(' AND ');
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM events e JOIN event_translations t ON t.event_id=e.id WHERE ${clause}`).get(...values) as {count: number}).count;
  const events = database.prepare(`${select} WHERE ${clause}
    ORDER BY CASE WHEN julianday(e.end_date)-julianday(e.start_date)>14 THEN 1 ELSE 0 END,
    MAX(e.start_date, ?), CASE WHEN e.image = '' THEN 1 ELSE 0 END, t.hours, e.id LIMIT ? OFFSET ?`)
    .all(...values, madridToday(), query.limit, (query.page - 1) * query.limit) as CultureEvent[];
  const places = database.prepare(`SELECT DISTINCT t.place FROM event_translations t JOIN events e ON e.id=t.event_id
    WHERE t.language=? AND e.end_date>=? AND t.place<>'' ORDER BY t.place`).all(query.lang, madridToday()) as {place:string}[];
  const run = database.prepare("SELECT MAX(finished_at) AS updatedAt FROM scraper_runs WHERE status='success'").get() as {updatedAt: string | null};
  return { events: events.map(e=>({...e,isFree:!!e.isFree})), total, page: query.page, pages: Math.ceil(total / query.limit), places: places.map(p=>p.place), updatedAt: run.updatedAt };
}
export function getEvent(id: string, language: Language): CultureEvent | undefined {
  const event = db().prepare(`${select} WHERE e.id=? AND t.language=?`).get(id, language) as CultureEvent | undefined;
  if(!event)return;
  const origins=db().prepare("SELECT active,cancelled FROM event_origins WHERE event_id=? AND source<>'kulturklik'").all(id) as {active:number;cancelled:number}[];
  const status=origins.some(origin=>origin.cancelled)?'cancelled':origins.length&&!origins.some(origin=>origin.active)?'withdrawn':undefined;
  return {...event,isFree:!!event.isFree,status};
}
