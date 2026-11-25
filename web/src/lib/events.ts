import { z } from 'zod';
import { db } from './db';
import { categories, type CultureEvent, type EventPage, type Language, type EventMapPage, type MapVenue, type MapEvent } from './types';
import { dateWindow, madridToday, validCalendarDate } from './dates';
import { familyAudienceSql } from './audience-sql';
import { mapTiles } from './map-config';
import { profileIds, profiles } from './profiles';

export const querySchema = z.object({
  lang: z.enum(['es', 'eu']).default('es'), q: z.string().trim().max(160).default(''),
  category: z.enum(categories).default('all'),
  profile: z.enum(profileIds).default('all'),
  period: z.enum(['all', 'today', 'tomorrow', 'weekend', 'week','custom']).default('all'),
  from:z.string().max(10).default(''),to:z.string().max(10).default(''),
  neighbourhood:z.string().max(80).default(''),
  place: z.string().max(240).default(''), source: z.enum(['', 'donostia-kultura', 'tabakalera', 'kulturklik']).default(''),
  free: z.enum(['0', '1']).default('0'), page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  ids: z.string().max(4000).optional(),
}).superRefine((query,context)=>{
  if(query.period!=='custom')return;
  if(!validCalendarDate(query.from))context.addIssue({code:'custom',path:['from'],message:'Choose a valid start date'});
  if(!validCalendarDate(query.to))context.addIssue({code:'custom',path:['to'],message:'Choose a valid end date'});
  if(validCalendarDate(query.from)&&validCalendarDate(query.to)&&query.from>query.to)context.addIssue({code:'custom',path:['to'],message:'End date must be on or after start date'});
});
export type EventQuery = z.infer<typeof querySchema>;
const select = `SELECT e.id,e.source,e.category,e.start_date AS startDate,e.end_date AS endDate,
  e.image,e.event_language AS eventLanguage,e.is_free AS isFree,
  t.title,t.description,t.place,t.price,t.hours,t.url,t.ticket_url AS ticketUrl
  FROM events e JOIN event_translations t ON t.event_id=e.id`;
const activeEvent=`NOT EXISTS(SELECT 1 FROM event_origins active_origin WHERE active_origin.event_id=e.id AND active_origin.source<>'kulturklik' AND active_origin.cancelled=1)
  AND (NOT EXISTS(SELECT 1 FROM event_origins direct_origin WHERE direct_origin.event_id=e.id AND direct_origin.source<>'kulturklik')
    OR EXISTS(SELECT 1 FROM event_origins live_origin WHERE live_origin.event_id=e.id AND live_origin.source<>'kulturklik' AND live_origin.active=1))`;
function eventConditions(query:EventQuery) {
  const today=madridToday();
  const [from, to] = dateWindow(query.period,today,{from:query.from,to:query.to});
  const where = ['t.language = ?', 'e.end_date >= ?',activeEvent];
  const values: (string | number)[] = [query.lang, from<today?today:from];
  if(to&&to<today)where.push('0');
  if (to) { where.push('e.start_date <= ?'); values.push(to); }
  if (query.category !== 'all') { where.push('e.category = ?'); values.push(query.category); }
  if (query.profile === 'family') {
    where.push(familyAudienceSql);
  } else if (query.profile !== 'all') {
    const selected = profiles[query.profile].categories;
    where.push(`e.category IN (${selected.map(() => '?').join(',')})`); values.push(...selected);
  }
  if (query.source==='kulturklik') { where.push('e.source = ?'); values.push(query.source); }
  else if (query.source) { where.push('(e.source = ? OR EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=e.id AND o.source=? AND o.active=1))'); values.push(query.source,query.source); }
  if(query.neighbourhood){where.push('EXISTS(SELECT 1 FROM event_venues ev JOIN venues v ON v.id=ev.venue_id WHERE ev.event_id=e.id AND v.neighbourhood=?)');values.push(query.neighbourhood);}
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
  return {clause:where.join(' AND '),values};
}
function eventFacets(query:EventQuery) {
  const database=db();
  const places=database.prepare(`SELECT DISTINCT t.place FROM event_translations t JOIN events e ON e.id=t.event_id
    WHERE t.language=? AND e.end_date>=? AND t.place<>'' AND ${activeEvent} ${query.neighbourhood?'AND EXISTS(SELECT 1 FROM event_venues ev JOIN venues v ON v.id=ev.venue_id WHERE ev.event_id=e.id AND v.neighbourhood=?)':''} ORDER BY t.place`).all(query.lang,madridToday(),...(query.neighbourhood?[query.neighbourhood]:[])) as {place:string}[];
  const neighbourhoods=database.prepare(`SELECT DISTINCT v.neighbourhood FROM venues v JOIN event_venues ev ON ev.venue_id=v.id JOIN events e ON e.id=ev.event_id WHERE e.end_date>=? AND ${activeEvent} AND v.neighbourhood IS NOT NULL ORDER BY v.neighbourhood`).all(madridToday()) as {neighbourhood:string}[];
  const run=database.prepare("SELECT MAX(finished_at) AS updatedAt FROM scraper_runs WHERE status='success'").get() as {updatedAt:string|null};
  return {places:places.map(row=>row.place),neighbourhoods:neighbourhoods.map(row=>row.neighbourhood),updatedAt:run.updatedAt};
}
export function listEvents(query: EventQuery): EventPage {
  const database=db(),{clause,values}=eventConditions(query);
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM events e JOIN event_translations t ON t.event_id=e.id WHERE ${clause}`).get(...values) as {count: number}).count;
  const events = database.prepare(`${select} WHERE ${clause}
    ORDER BY CASE WHEN julianday(e.end_date)-julianday(e.start_date)>14 THEN 1 ELSE 0 END,
    MAX(e.start_date, ?), CASE WHEN e.image = '' THEN 1 ELSE 0 END, t.hours, e.id LIMIT ? OFFSET ?`)
    .all(...values, madridToday(), query.limit, (query.page - 1) * query.limit) as CultureEvent[];
  return {events:events.map(e=>({...e,isFree:!!e.isFree})),total,page:query.page,pages:Math.ceil(total/query.limit),...eventFacets(query)};
}
/** A complete, compact map snapshot. Card pagination never limits its venue counts. */
export function listMapEvents(query:EventQuery):EventMapPage {
  const database=db(),{clause,values}=eventConditions(query);
  const total=(database.prepare(`SELECT COUNT(*) AS count FROM events e JOIN event_translations t ON t.event_id=e.id WHERE ${clause}`).get(...values) as {count:number}).count;
  const rows=database.prepare(`SELECT v.id AS venueId,CASE WHEN ?='eu' THEN v.name_eu ELSE v.name_es END AS venueName,
      CASE WHEN ?='eu' THEN v.address_eu ELSE v.address_es END AS address,v.neighbourhood,v.latitude,v.longitude,
      e.id,e.source,e.category,e.start_date AS startDate,e.end_date AS endDate,e.image,e.is_free AS isFree,t.title,t.hours,t.price
    FROM events e JOIN event_translations t ON t.event_id=e.id JOIN event_venues ev ON ev.event_id=e.id JOIN venues v ON v.id=ev.venue_id
    WHERE ${clause} AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL
      AND v.latitude BETWEEN -90 AND 90 AND v.longitude BETWEEN -180 AND 180
    ORDER BY CASE WHEN julianday(e.end_date)-julianday(e.start_date)>14 THEN 1 ELSE 0 END,MAX(e.start_date,?),t.hours,e.id,v.id`).all(query.lang,query.lang,...values,madridToday()) as (MapEvent&{venueId:string;venueName:string;address:string|null;neighbourhood:string|null;latitude:number;longitude:number})[];
  const venues=new Map<string,MapVenue>(),mapped=new Set<string>();
  for(const row of rows){
    let venue=venues.get(row.venueId);
    if(!venue){venue={id:row.venueId,name:row.venueName,address:row.address||'',neighbourhood:row.neighbourhood,latitude:row.latitude,longitude:row.longitude,events:[]};venues.set(row.venueId,venue);}
    if(!venue.events.some(event=>event.id===row.id))venue.events.push({id:row.id,source:row.source,category:row.category,title:row.title,startDate:row.startDate,endDate:row.endDate,hours:row.hours,image:row.image,price:row.price,isFree:!!row.isFree});
    mapped.add(row.id);
  }
  return {venues:[...venues.values()],total,mapped:mapped.size,missingLocations:total-mapped.size,...eventFacets(query),tiles:mapTiles()};

}
export function getEvent(id: string, language: Language): CultureEvent | undefined {
  const event = db().prepare(`${select} WHERE e.id=? AND t.language=?`).get(id, language) as CultureEvent | undefined;
  if(!event)return;
  const origins=db().prepare("SELECT active,cancelled FROM event_origins WHERE event_id=? AND source<>'kulturklik'").all(id) as {active:number;cancelled:number}[];
  const status=origins.some(origin=>origin.cancelled)?'cancelled':origins.length&&!origins.some(origin=>origin.active)?'withdrawn':undefined;
  return {...event,isFree:!!event.isFree,status};
}
