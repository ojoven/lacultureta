import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDonostiaAgenda, parseTabakaleraAgenda, fetchDonostiaEvents, fetchTabakaleraEvents, type DirectEvent } from '../src/lib/scrapers/direct';
import { SourceFetcher, allowedUrl } from '../src/lib/scrapers/http';
import { mergeImports } from '../src/lib/scrapers/merge';
import { persistSnapshot } from '../src/lib/scrapers/import-store';
import { db, storedUpcomingEvents } from '../src/lib/db';
import { getEvent } from '../src/lib/events';
import { GET as downloadCalendar } from '../src/app/api/events/[id]/calendar/route';
import type { ImportedEvent } from '../src/lib/types';

const directory=mkdtempSync(join(tmpdir(),'cultureta-direct-test-'));
process.env.DATABASE_PATH=join(directory,'test.sqlite');
mock.timers.enable({apis:['Date'],now:new Date('2026-11-24T12:00:00Z')});
after(()=>{db().close();rmSync(directory,{recursive:true,force:true});mock.timers.reset()});
const html=(lang:string)=>readFileSync(new URL(`./fixtures/direct/dk-${lang}.html`,import.meta.url),'utf8');
const tab=(lang:string)=>JSON.parse(readFileSync(new URL(`./fixtures/direct/tab-${lang}.json`,import.meta.url),'utf8'));
const today='2026-11-24';
const fixtureClient={get:async(url:string)=>({body:url.includes('donostiakultura')?html(url.includes('/eu/')?'eu':'es'):JSON.stringify(tab(url.includes('/eu/')?'eu':'es'))})} as unknown as SourceFetcher;

async function events(){return [...await fetchDonostiaEvents(fixtureClient),...await fetchTabakaleraEvents(fixtureClient)]}

test('the real DK agenda JSON-LD yields dates, prices and descriptions despite raw newlines',()=>{
  const parsed=parseDonostiaAgenda(html('es'),'es',today);
  assert.equal(parsed.length,3);assert.equal(parsed[0].startDate,'2026-11-24');
  assert.match(parsed[0].translation.description,/Visita guiada/);
  assert.equal(parsed[0].translation.hours,'');assert.equal(parsed[1].translation.hours,'17:30');
  assert.equal(parsed[1].translation.price,'0 €');
  assert.throws(()=>parseDonostiaAgenda('<html>Just a moment...</html>','es',today));
});
test('language matching uses source identity rather than array position',async()=>{
  const es=parseDonostiaAgenda(html('es'),'es',today),eu=parseDonostiaAgenda(html('eu'),'eu',today);
  assert.equal(es[0].matchKey,eu[0].matchKey);
  const direct=await fetchDonostiaEvents(fixtureClient);
  assert.match(direct[0].translations.es.description,/Visita guiada/);
  assert.match(direct[0].translations.eu.description,/bisita gidatua/i);
  assert.deepEqual(direct[0].translatedLanguages,['es','eu']);
});
test('Tabakalera page data produces future occurrences with stable bilingual session IDs',async()=>{
  const records=parseTabakaleraAgenda(tab('es'),'es',today);
  const workshop=records.find(record=>record.translation.title.startsWith('Atlas'))!;
  assert.equal(workshop.key,'14164-427091');assert.equal(workshop.category,'workshops');
  assert.equal(workshop.translation.place,'Medialab');assert.equal(workshop.translation.hours,'18:00–20:00');assert.equal(workshop.translation.price,'0 €');
  const direct=await fetchTabakaleraEvents(fixtureClient);
  assert.ok(direct.every(event=>event.translatedLanguages.includes('eu')));
  assert.ok(direct.every(event=>event.endDate>=today));
});
test('explicit cancellations are parsed and expired rather than published',async()=>{
  const document=tab('es');document.result.data.agendas.nodes.find((node:any)=>node.nid===14164).relationships.convocatorias[0].estado='Cancelado';
  assert.equal(parseTabakaleraAgenda(document,'es',today).find(record=>record.key==='14164-427091')?.cancelled,true);
  const event=(await events())[0];
  persistSnapshot(mergeImports([], [{...event,cancelled:true}]),[{source:event.source,status:'success',count:1}],new Date().toISOString(),today);
  assert.ok(getEvent(event.id,'es')!.endDate<today);
});
test('direct time corrections preserve the existing favourite ID and do not add a duplicate',async()=>{
  const event=(await events())[1];
  const fallback:ImportedEvent={...event,id:'kk-123456',externalId:'123456',translations:{es:{...event.translations.es,hours:'16:30'},eu:{...event.translations.eu,hours:'16:30'}}};
  const merged=mergeImports([fallback],[event],[fallback]);
  assert.equal(merged.events.length,1);assert.equal(merged.events[0].id,'kk-123456');
  assert.equal(merged.events[0].translations.es.hours,event.translations.es.hours);
});
test('a later fallback outage cannot replace verified direct information or retire its events',async()=>{
  const event=(await events())[2];
  const started=new Date().toISOString();
  const first=mergeImports([],[event]);persistSnapshot(first,[{source:event.source,status:'success',count:1}],started,today);
  const oldFallback={...event,id:'kk-8888',externalId:'8888',translations:{es:{...event.translations.es,hours:'08:00'},eu:{...event.translations.eu,hours:'08:00'}}};
  const origins=db().prepare('SELECT source,origin_key,event_id FROM event_origins').all() as any[];
  const second=mergeImports([oldFallback],[],storedUpcomingEvents(today),origins);
  assert.equal(second.events[0].id,event.id);assert.equal(second.events[0].translations.es.hours,event.translations.es.hours);
  persistSnapshot(second,[{source:event.source,status:'failed',count:0},{source:'kulturklik',status:'success',count:1}],new Date().toISOString(),today);
  assert.equal(getEvent(event.id,'es')?.endDate,event.endDate);
});
test('new direct-source IDs work in calendar downloads',async()=>{
  const event=(await events()).find(event=>event.source==='tabakalera')!;
  persistSnapshot(mergeImports([],[event]),[{source:event.source,status:'success',count:1}],new Date().toISOString(),today);
  const response=await downloadCalendar(new Request(`https://lacultureta.com/api/events/${event.id}/calendar`),{params:Promise.resolve({id:event.id})});
  assert.equal(response.status,200);assert.match(await response.text(),/BEGIN:VCALENDAR/);
});
test('joint DK and Tabakalera screenings keep one existing ID and both source origins',async()=>{
  const event=(await events())[1];
  const fallback:ImportedEvent={...event,id:'kk-777777',externalId:'777777',translations:{es:{...event.translations.es,place:'Tabakalera'},eu:{...event.translations.eu,place:'Tabakalera'}}};
  const tabEvent:DirectEvent={...event,id:'tb-1-2',externalId:'tb-1-2',originKey:'1-2',source:'tabakalera',translations:{es:{...event.translations.es,url:'https://www.tabakalera.eus/es/shared-film'},eu:{...event.translations.eu,url:'https://www.tabakalera.eus/eu/shared-film'}}};
  const merged=mergeImports([fallback],[event,tabEvent],[fallback]);
  assert.equal(merged.events.length,1);assert.equal(merged.events[0].id,fallback.id);
  assert.ok(merged.origins.some(origin=>origin.source==='donostia-kultura'));assert.ok(merged.origins.some(origin=>origin.source==='tabakalera'));
});
test('a withdrawn direct event cannot remain active through the stale fallback feed',async()=>{
  const original=(await events())[1];
  const event:DirectEvent={...original,id:'dk-'+ 'b'.repeat(24),externalId:'dk-'+ 'b'.repeat(24),originKey:'withdrawal-fixture',translations:{es:{...original.translations.es,url:'https://www.donostiakultura.eus/es/agenda/withdrawal-fixture'},eu:{...original.translations.eu,url:'https://www.donostiakultura.eus/eu/agenda/withdrawal-fixture'}}};
  const fallback={...event,id:'kk-999999',externalId:'999999'};
  const first=mergeImports([fallback],[event]);persistSnapshot(first,[{source:'donostia-kultura',status:'success',count:1},{source:'kulturklik',status:'success',count:1}],new Date().toISOString(),today);
  const old='2020-01-01T00:00:00Z';db().prepare("UPDATE event_origins SET last_seen_at=? WHERE source='donostia-kultura' AND origin_key=?").run(old,event.originKey);
  persistSnapshot(mergeImports([fallback],[]),[{source:'donostia-kultura',status:'success',count:50},{source:'kulturklik',status:'success',count:1}],new Date().toISOString(),today);
  assert.ok(getEvent(fallback.id,'es')!.endDate<today);
});
test('robots exclusions and a rate-limit cooldown apply to every alternate transport',async()=>{
  const nativeFetch=globalThis.fetch;let requests=0;
  const cacheDirectory=join(directory,'http-cache');
  globalThis.fetch=async(input)=>{requests++;return new Response(String(input).endsWith('/robots.txt')?'User-agent: *\nAllow: /\nDisallow: /private':'slow down',{status:String(input).endsWith('/robots.txt')?200:429,headers:{'Retry-After':'3600'}})};
  const first=new SourceFetcher({cacheDirectory,intervalMs:1000});
  try{
    await assert.rejects(first.get('https://www.tabakalera.eus/private'),/robots.txt disallows/);
    assert.equal(requests,1);
    await assert.rejects(first.get('https://www.tabakalera.eus/es/agenda-cultural-san-sebastian/'),/no alternate transport/);
    assert.equal(first.metrics.methods['chrome-http'],0);assert.equal(first.metrics.methods.chromium,0);
    const restarted=new SourceFetcher({cacheDirectory,intervalMs:1000});
    await assert.rejects(restarted.get('https://www.tabakalera.eus/es/another-page'),/cooling down/);
    assert.equal(requests,2);await restarted.close();
    assert.throws(()=>allowedUrl('https://127.0.0.1/private'),/allowlist/);
  }finally{globalThis.fetch=nativeFetch;await first.close()}
});
