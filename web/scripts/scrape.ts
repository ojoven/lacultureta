import { db, storedUpcomingEvents } from '../src/lib/db';
import { fetchEvents } from '../src/lib/scrapers/kulturklik';
import { fetchDonostiaEvents, fetchTabakaleraEvents, type DirectEvent } from '../src/lib/scrapers/direct';
import { mergeImports, type ExistingOrigin } from '../src/lib/scrapers/merge';
import { SourceFetcher } from '../src/lib/scrapers/http';
import { madridToday } from '../src/lib/dates';
import { persistSnapshot, type ImportRun } from '../src/lib/scrapers/import-store';
import { venueCoverage } from '../src/lib/venues';
import type { ImportedEvent } from '../src/lib/types';

async function main() {
  const database = db(), started = new Date().toISOString(), today=madridToday();
  const client=new SourceFetcher();
  const dryRun=process.argv.includes('--dry-run'),directOnly=process.argv.includes('--direct-only');
  const selected=process.argv.find(argument=>argument.startsWith('--source='))?.split('=')[1];
  const results: ImportRun[]=[];
  const direct:DirectEvent[]=[];
  let fallback:ImportedEvent[]=[];
  try {
    for(const [source,fetcher] of [['donostia-kultura',fetchDonostiaEvents],['tabakalera',fetchTabakaleraEvents]] as const) {
      if(selected&&selected!==source)continue;
      const runId=dryRun?undefined:database.prepare("INSERT INTO scraper_runs(source,started_at,status) VALUES (?,?,'running')").run(source,started).lastInsertRowid;
      try {
        const events=await fetcher(client);
        if(!events.length)throw new Error('Empty direct agenda; keeping previous records');
        const previous=database.prepare("SELECT event_count AS count FROM scraper_runs WHERE source=? AND status='success' ORDER BY id DESC LIMIT 1").get(source) as {count:number}|undefined;
        if(previous&&previous.count>20&&events.length<previous.count/2)throw new Error('Unexpected loss of over half the direct agenda; keeping previous records');
        direct.push(...events);
        results.push({source,status:'success',count:events.length,runId});
        console.log(JSON.stringify({source,status:'fetched',events:events.length,cancelled:events.filter(e=>e.cancelled).length}));
      } catch(error) {
        const message=error instanceof Error?error.message:String(error);
        results.push({source,status:'failed',count:0,error:message,runId});
        console.error(JSON.stringify({source,status:'failed',error:message}));
      }
    }
    if(!directOnly&&!selected) {
      const runId=dryRun?undefined:database.prepare("INSERT INTO scraper_runs(source,started_at,status) VALUES ('kulturklik',?,'running')").run(started).lastInsertRowid;
      try { fallback=await fetchEvents();results.push({source:'kulturklik',status:'success',count:fallback.length,runId}); }
      catch(error){results.push({source:'kulturklik',status:'failed',count:0,error:(error as Error).message,runId});}
    }
    const stored=storedUpcomingEvents(today);
    const origins=database.prepare('SELECT source,origin_key,event_id FROM event_origins').all() as ExistingOrigin[];
    const merged=mergeImports(fallback,direct,stored,origins);
    if(!dryRun)persistSnapshot(merged,results,started,today);
    console.log(JSON.stringify({status:results.every(r=>r.status==='success')?'success':'partial',dryRun,venues:dryRun?undefined:venueCoverage(database),events:merged.events.length,directEvents:direct.length,matchedExisting:merged.matched,newDirect:merged.newDirect,fetching:client.metrics,sources:results.map(({runId,...result})=>result)}));
    if(!results.some(result=>result.status==='success'))process.exitCode=1;
  } finally {await client.close();database.close();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1});
