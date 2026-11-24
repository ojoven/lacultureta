import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixtures from './fixtures/events.json';
import { parseItem, safeUrl, cleanText } from '../src/lib/scrapers/kulturklik';
import { dateWindow, madridToday } from '../src/lib/dates';
import { calendar } from '../src/lib/calendar';
import {db,storeEvents} from '../src/lib/db';
import {listEvents,querySchema,getEvent} from '../src/lib/events';
const folder=mkdtempSync(join(tmpdir(),'lacultureta-test-'));
process.env.DATABASE_PATH=join(folder,'test.sqlite');
after(()=>{db().close();rmSync(folder,{recursive:true,force:true})});

test('both live organiser formats keep Spanish and Basque under the same stable event',()=>{
  const dk=parseItem(fixtures[0]),tab=parseItem(fixtures[1]);
  assert.equal(dk.source,'donostia-kultura');assert.equal(tab.source,'tabakalera');
  for(const event of [dk,tab]){assert.ok(event.translations.es.title);assert.ok(event.translations.eu.title);assert.match(event.id,/^kk-\d+$/);assert.match(event.startDate,/^\d{4}-\d{2}-\d{2}$/)}
});
test('HTML from the feed is plain text and executable URLs are rejected',()=>{
  assert.equal(cleanText('<p>Kaixo &amp; hola</p><script>alert(1)</script>'),'Kaixo & hola');
  assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('data:text/html,hello'),'');
  assert.throws(()=>parseItem({...fixtures[0],startDate:'2026-02-30T00:00:00Z'}));
  assert.throws(()=>parseItem({...fixtures[0],municipalityNoraCode:'69'}));
});
test('dates use Madrid time and weekend filters include Saturday and Sunday correctly',()=>{
  assert.equal(madridToday(new Date('2026-11-23T23:30:00Z')),'2026-11-24');
  assert.deepEqual(dateWindow('weekend','2026-11-28'),['2026-11-28','2026-11-29']);
  assert.deepEqual(dateWindow('weekend','2026-11-29'),['2026-11-29','2026-11-29']);
  assert.deepEqual(dateWindow('weekend','2026-11-30'),['2026-12-04','2026-12-06']);
});
test('repeated imports update existing data and keep both translations without duplicates',()=>{
  const event=parseItem(fixtures[0]);event.startDate='2099-01-01';event.endDate='2099-01-03';
  storeEvents([event]);event.translations.es.title='Updated title';event.translations.eu.title='Izenburu berria';storeEvents([event]);
  assert.equal((db().prepare('SELECT COUNT(*) AS n FROM events').get() as {n:number}).n,1);
  assert.equal(getEvent(event.id,'es')?.title,'Updated title');assert.equal(getEvent(event.id,'eu')?.title,'Izenburu berria');
});
test('searches are parameterised and literal SQL wildcards do not match all events',()=>{
  assert.equal(listEvents(querySchema.parse({q:"' OR 1=1 --"})).total,0);
  assert.equal(listEvents(querySchema.parse({q:'%'})).total,0);
  assert.equal(listEvents(querySchema.parse({q:'Updated'})).total,1);
  assert.equal(listEvents(querySchema.parse({ids:''})).total,0);
  assert.equal(listEvents(querySchema.parse({ids:parseItem(fixtures[0]).id})).total,1);
});
test('price, source and overlapping date filters work in the database',()=>{
  const event=parseItem(fixtures[1]);event.startDate='2099-01-01';event.endDate='2099-02-01';event.translations.es.price='Gratis (inscripción)';storeEvents([event]);
  const page=listEvents(querySchema.parse({source:'tabakalera',free:'1'}));
  assert.equal(page.total,1);assert.equal(page.events[0].isFree,true);
  assert.equal(listEvents(querySchema.parse({lang:'eu',source:'tabakalera'})).events[0].title,event.translations.eu.title);
  assert.equal(querySchema.safeParse({page:-1}).success,false);assert.equal(querySchema.safeParse({limit:1000}).success,false);
});
test('calendar uses Madrid local time and exclusive all-day end dates',()=>{
  const event=getEvent(parseItem(fixtures[0]).id,'es')!;
  const timed=calendar({...event,startDate:'2099-01-01',endDate:'2099-01-01',hours:'19:30'},'es');
  assert.match(timed,/DTSTART;TZID=Europe\/Madrid:20990101T193000/);
  const allDay=calendar({...event,startDate:'2099-01-01',endDate:'2099-01-03',hours:''},'eu');
  assert.match(allDay,/DTEND;VALUE=DATE:20990104/);
  for(const line of allDay.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
