import { db } from '@/lib/db';
import { madridToday } from '@/lib/dates';
export const dynamic='force-dynamic';
export function GET(){
  try {
    const last=db().prepare("SELECT finished_at AS updatedAt,event_count AS count FROM scraper_runs WHERE status='success' ORDER BY id DESC LIMIT 1").get() as {updatedAt:string;count:number}|undefined;
    const {count}=db().prepare('SELECT COUNT(*) AS count FROM events WHERE end_date>=?').get(madridToday()) as {count:number};
    const fresh=!!last&&Date.now()-Date.parse(last.updatedAt)<36*60*60*1000;
    const sources=db().prepare(`SELECT r.source,r.status,r.event_count AS events,r.finished_at AS updatedAt FROM scraper_runs r
      WHERE r.id=(SELECT MAX(s.id) FROM scraper_runs s WHERE s.source=r.source AND s.status<>'running') ORDER BY r.source`).all();
    return Response.json({status:fresh&&count>0?'ok':'degraded',events:count,lastImport:last||null,sources},{status:fresh&&count>0?200:503,headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({status:'error'},{status:503})}
}
