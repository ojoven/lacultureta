import { db, storeEvents } from '../db';
import type { mergeImports } from './merge';
export interface ImportRun { source:string; status:string; count:number; error?:string; runId?:number|bigint }
export function persistSnapshot(merged:ReturnType<typeof mergeImports>,results:ImportRun[],started:string,today:string) {
  const database=db();
  database.transaction(()=>{
    storeEvents(merged.events);
    const originStatement=database.prepare(`INSERT INTO event_origins(source,origin_key,event_id,url,last_seen_at,active,cancelled) VALUES (@source,@originKey,@eventId,@url,@now,1,@cancelled)
      ON CONFLICT(source,origin_key) DO UPDATE SET event_id=excluded.event_id,url=excluded.url,last_seen_at=excluded.last_seen_at,active=1,cancelled=excluded.cancelled`);
    const now=new Date().toISOString();
    for(const origin of merged.origins)originStatement.run({...origin,cancelled:+origin.cancelled,now});
    for(const result of results) {
      if(result.status==='success')database.prepare('UPDATE event_origins SET active=0 WHERE source=? AND last_seen_at<?').run(result.source,started);
      if(result.runId!==undefined)database.prepare('UPDATE scraper_runs SET finished_at=?,status=?,event_count=?,error=? WHERE id=?').run(now,result.status,result.count,result.error||null,result.runId);
    }
    // A source failure leaves its previous records active. A successful full snapshot can retire them.
    database.prepare(`UPDATE events SET end_date=date(?,'-1 day') WHERE end_date>=? AND EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id)
      AND NOT EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id AND o.active=1)`).run(today,today);
    database.prepare(`UPDATE events SET end_date=date(?,'-1 day') WHERE end_date>=?
      AND EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id AND o.source<>'kulturklik' AND o.active=0)
      AND NOT EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id AND o.source<>'kulturklik' AND o.active=1)`).run(today,today);
    // Retain explicit cancellation tombstones even if a fallback feed still lists the event.
    database.prepare(`UPDATE events SET end_date=date(?,'-1 day') WHERE end_date>=? AND EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id AND o.source<>'kulturklik' AND o.cancelled=1)`).run(today,today);
    if(results.some(r=>r.source==='kulturklik'&&r.status==='success'))database.prepare(`UPDATE events SET end_date=date(?,'-1 day') WHERE id LIKE 'kk-%' AND last_seen_at<? AND end_date>=?
      AND NOT EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=events.id AND o.active=1)`).run(today,started,today);
  })();
}
