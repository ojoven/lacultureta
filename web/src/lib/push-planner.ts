import { createHash } from 'node:crypto';
import { db } from './db';
import { addDays, dateWindow, madridToday } from './dates';
import { matchesProfile } from './profiles';
import { notificationPreferencesSchema, type NotificationPreferences } from './notification-preferences';
import type { PushSubscriber } from './push-store';
import type { CultureEvent } from './types';

export interface PushPayload { title: string; body: string; url: string; tag: string }
export interface PushPlan {
  key: string; kind: 'changes' | 'reminders' | 'weekend' | 'new'; payload: PushPayload;
  newCheck?: string; savedState?: { id: string; fingerprint: string }[];
}
type SavedEvent = Omit<CultureEvent, 'status'> & { status: 'active' | 'cancelled' | 'withdrawn'; fingerprint: string; esTitle: string; esHours: string; esPlace: string };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const eventSelect = `SELECT e.id,e.category,e.start_date AS startDate,e.end_date AS endDate,t.title,t.description,t.hours,t.place,
  es.title AS esTitle,es.description AS esDescription,es.hours AS esHours,es.place AS esPlace FROM events e
  JOIN event_translations t ON t.event_id=e.id AND t.language=?
  JOIN event_translations es ON es.event_id=e.id AND es.language='es'`;
function relevant(event: CultureEvent & { esTitle?: string; esDescription?: string }, preferences: NotificationPreferences) {
  return (!preferences.categories.length || preferences.categories.some(category=>category===event.category)) &&
    matchesProfile({...event,title:event.esTitle||event.title,description:event.esDescription||event.description},preferences.profile);
}
export function madridClock(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
  return {day:madridToday(now),hour:Number(parts.find(part=>part.type==='hour')?.value)};
}
export function notificationTtl(now = new Date()) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const value=(kind:string)=>Number(parts.find(part=>part.type===kind)?.value);
  const hour=value('hour');
  return hour<9||hour>=21?0:Math.min(7200,Math.max(0,(21-hour)*3600-value('minute')*60-value('second')));
}
export function savedSnapshot(subscriber: Pick<PushSubscriber, 'id'>, preferences: NotificationPreferences): SavedEvent[] {
  const database=db();
  if(!preferences.savedIds.length) { database.prepare('DELETE FROM push_saved_state WHERE subscription_id=?').run(subscriber.id);return []; }
  const marks=preferences.savedIds.map(()=>'?').join(',');
  database.prepare(`DELETE FROM push_saved_state WHERE subscription_id=? AND event_id NOT IN (${marks})`).run(subscriber.id,...preferences.savedIds);
  const rows=database.prepare(`${eventSelect} WHERE e.id IN (${marks})`).all(preferences.language,...preferences.savedIds) as SavedEvent[];
  for(const event of rows) {
    const origins=database.prepare("SELECT active,cancelled FROM event_origins WHERE event_id=? AND source<>'kulturklik'").all(event.id) as {active:number;cancelled:number}[];
    event.status=origins.some(origin=>origin.cancelled)?'cancelled':origins.length&&!origins.some(origin=>origin.active)?'withdrawn':'active';
    const previous=database.prepare('SELECT fingerprint FROM push_saved_state WHERE subscription_id=? AND event_id=?').get(subscriber.id,event.id) as {fingerprint:string}|undefined;
    const previousEnd=previous?.fingerprint.match(/^(\d{4}-\d{2}-\d{2})\|/)?.[1];
    const expectedEnd=event.status==='active'?event.endDate:previousEnd||event.endDate;
    // Keep the last scheduled end date when a source expires a cancelled or withdrawn record.
    event.fingerprint=expectedEnd+'|'+hash(JSON.stringify([event.esTitle,event.startDate,event.status==='active'?event.endDate:event.status,event.esHours,event.esPlace,event.status]));
    database.prepare('INSERT OR IGNORE INTO push_saved_state VALUES (?,?,?)').run(subscriber.id,event.id,event.fingerprint);
  }
  return rows;
}
export function commitPlan(subscriberId: string, plan: PushPlan, now: Date) {
  const database=db();
  database.transaction(()=>{
    database.prepare('INSERT OR IGNORE INTO push_deliveries VALUES (?,?,?,?)').run(subscriberId,plan.key,plan.kind,now.toISOString());
    if(plan.newCheck)database.prepare('UPDATE push_subscriptions SET last_new_check=? WHERE id=?').run(plan.newCheck,subscriberId);
    for(const event of plan.savedState||[])database.prepare('UPDATE push_saved_state SET fingerprint=? WHERE subscription_id=? AND event_id=?').run(event.fingerprint,subscriberId,event.id);
  })();
}
export function planForSubscriber(subscriber: PushSubscriber, now = new Date()): PushPlan | undefined {
  const preferences=notificationPreferencesSchema.parse(JSON.parse(subscriber.preferences)), database=db();
  const {day,hour}=madridClock(now);
  const saved=savedSnapshot(subscriber,preferences);
  const changes=saved.filter(event=>{
    const previous=database.prepare('SELECT fingerprint FROM push_saved_state WHERE subscription_id=? AND event_id=?').get(subscriber.id,event.id) as {fingerprint:string};
    // An organiser removing an event after its scheduled end is normal expiry, not a change alert.
    if(event.fingerprint.slice(0,10)<day&&event.startDate<day) {
      database.prepare('UPDATE push_saved_state SET fingerprint=? WHERE subscription_id=? AND event_id=?').run(event.fingerprint,subscriber.id,event.id);return false;
    }
    if(/^[a-f0-9]{64}$/.test(previous.fingerprint)&&event.fingerprint.endsWith(previous.fingerprint)) {
      database.prepare('UPDATE push_saved_state SET fingerprint=? WHERE subscription_id=? AND event_id=?').run(event.fingerprint,subscriber.id,event.id);return false;
    }
    return previous.fingerprint!==event.fingerprint;
  });
  if(!preferences.changes)for(const event of changes)database.prepare('UPDATE push_saved_state SET fingerprint=? WHERE subscription_id=? AND event_id=?').run(event.fingerprint,subscriber.id,event.id);
  if(hour<9||hour>=21)return;
  const dayStart = new Date(now); // Compare days in Madrid, including both DST transitions.
  dayStart.setTime(now.getTime()-26*3600000);
  const delivered=database.prepare('SELECT delivery_key,sent_at FROM push_deliveries WHERE subscription_id=? AND sent_at>=? ORDER BY sent_at DESC').all(subscriber.id,dayStart.toISOString()) as {delivery_key:string;sent_at:string}[];
  if(delivered.filter(row=>madridToday(new Date(row.sent_at))===day).length>=2)return;
  if(delivered[0]&&now.getTime()-Date.parse(delivered[0].sent_at)<30*60000)return;
  const seen=(key:string)=>!!database.prepare('SELECT 1 FROM push_deliveries WHERE subscription_id=? AND delivery_key=?').get(subscriber.id,key);
  const language=preferences.language,eu=language==='eu';
  const base=`/${language}`,browse=new URLSearchParams({profile:preferences.profile});
  if(preferences.categories.length===1)browse.set('category',preferences.categories[0]);
  const make=(key:string,kind:PushPlan['kind'],title:string,body:string,url:string):PushPlan=>({key,kind,payload:{title,body:body.slice(0,230),url,tag:hash(key).slice(0,24)}});
  if(preferences.changes&&changes.length) {
    const key='changes:'+hash(changes.map(event=>event.id+event.fingerprint).sort().join('|'));
    if(!seen(key))return {...make(key,'changes',eu?'Zure planen aldaketak':'Cambios en tus planes',`${changes[0].title}. ${eu?'Ikusi eguneratutako data, ordutegia eta egoera.':'Consulta la fecha, el horario y el estado actualizados.'}`,`${base}/eventos/${changes[0].id}`),savedState:changes.map(event=>({id:event.id,fingerprint:event.fingerprint}))};
  }
  if(preferences.reminders&&hour>=18) {
    const tomorrow=addDays(day,1),events=saved.filter(event=>event.startDate===tomorrow&&event.endDate>=tomorrow&&event.status==='active');
    const key='reminders:'+tomorrow;
    if(events.length&&!seen(key))return make(key,'reminders',eu?'Bihar plan bat duzu':'Mañana tienes un plan',events.map(event=>event.title+(event.hours?' · '+event.hours:'')).slice(0,2).join(' / '),base+'?saved=1');
  }
  if(preferences.weekend&&hour>=17&&new Date(day+'T12:00:00Z').getUTCDay()===5) {
    const [from,to]=dateWindow('weekend',day),key='weekend:'+day;
    const events=(database.prepare(`${eventSelect} WHERE e.end_date>=? AND e.start_date<=? ORDER BY e.start_date,t.hours`).all(language,from,to) as CultureEvent[]).filter(event=>relevant(event,preferences));
    if(events.length&&!seen(key)) {browse.set('period','weekend');return make(key,'weekend',eu?'Zure asteburuko kultura':'Tu fin de semana cultural',events.slice(0,2).map(event=>event.title).join(' / '),base+'?'+browse);}
  }
  if(preferences.newEvents&&hour>=18) {
    const key='new:'+day;
    if(seen(key))return;
    const events=(database.prepare(`${eventSelect} JOIN event_first_seen f ON f.event_id=e.id WHERE e.end_date>=? AND f.first_seen_at>? AND f.first_seen_at<=? ORDER BY e.start_date,t.hours`).all(language,day,subscriber.last_new_check,now.toISOString()) as CultureEvent[]).filter(event=>relevant(event,preferences));
    if(events.length)return {...make(key,'new',eu?'Plan berriak zuretzat':'Nuevos planes para ti',`${events.length} ${eu?'plan berri':events.length===1?'plan nuevo':'planes nuevos'}: ${events.slice(0,2).map(event=>event.title).join(' / ')}`,base+'?'+browse),newCheck:now.toISOString()};
    database.prepare('UPDATE push_subscriptions SET last_new_check=? WHERE id=?').run(now.toISOString(),subscriber.id);
  }
}
