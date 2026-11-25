import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixtures from './fixtures/events.json';
import { db,storeEvents } from '../src/lib/db';
import { parseItem } from '../src/lib/scrapers/kulturklik';
import { listEvents,listMapEvents,querySchema } from '../src/lib/events';
import { madridToday,addDays } from '../src/lib/dates';
import type { Category } from '../src/lib/types';

const folder=mkdtempSync(join(tmpdir(),'lacultureta-map-'));
process.env.DATABASE_PATH=join(folder,'map.sqlite');
after(()=>{db().close();rmSync(folder,{recursive:true,force:true});});
const today=madridToday();
function event(n:number,place:string,category:Category='music',startDate=today,endDate=startDate) {
  const item=parseItem(fixtures[0]);item.id=`kk-880${n}`;item.externalId=`880${n}`;item.source='kulturklik';item.category=category;item.startDate=startDate;item.endDate=endDate;
  for(const language of ['es','eu'] as const)item.translations[language]={...item.translations[language],title:`${language} Plan ${n}`,description:'Cultura',place,price:'Gratis',hours:'19:00'};
  return item;
}
const catalogue=[...Array.from({length:120},(_,n)=>event(n,'Tabakalera','music',addDays(today,1))),
  event(121,'Kursaal','art',addDays(today,-2),addDays(today,3)),event(122,'Centro Cultural Aiete','theatre'),
  event(123,'Dabadaba'),event(124,'Unknown venue'),event(125,'Tabakalera','music',addDays(today,-2),addDays(today,-1)),
  event(126,'Kursaal'),event(127,'Kursaal')];
catalogue.find(item=>item.id==='kk-880122')!.translations.es.description='Teatro infantil para toda la familia';
storeEvents(catalogue);
for(const [id,cancelled,active] of [['kk-880126',1,1],['kk-880127',0,0]] as const)db().prepare('INSERT INTO event_origins(source,origin_key,event_id,url,last_seen_at,active,cancelled) VALUES (?,?,?,?,?,?,?)').run('donostia-kultura',id,id,'https://example.test/'+id,new Date().toISOString(),active,cancelled);

test('map includes every active matching event beyond card pagination and groups venue pins',()=>{
  const page=listMapEvents(querySchema.parse({limit:1,page:5}));
  assert.equal(page.total,124);assert.equal(page.mapped,122);assert.equal(page.missingLocations,2);assert.equal(page.venues.length,3);
  assert.equal(page.venues.find(venue=>venue.name==='TABAKALERA')?.events.length,120);
  assert.ok(page.venues.every(venue=>Number.isFinite(venue.latitude)&&venue.events.length>0));
  assert.ok(!('description' in page.venues[0].events[0]));
  assert.equal(listEvents(querySchema.parse({})).total,page.total);
});
test('neighbourhood filter is language-independent and applies equally to cards and map',()=>{
  for(const lang of ['es','eu']){
    const query=querySchema.parse({neighbourhood:'EGIA',lang,limit:100});
    const cards=listEvents(query),map=listMapEvents(query);
    assert.equal(cards.total,121);assert.equal(map.total,121);assert.equal(map.mapped,120);assert.equal(map.missingLocations,1);
    assert.ok(map.venues.every(venue=>venue.neighbourhood==='EGIA'));
    assert.match(map.venues[0].events[0].title,new RegExp('^'+lang));
    assert.ok(cards.neighbourhoods.includes('AIETE'));assert.ok(cards.places.includes('Dabadaba'));assert.ok(!cards.places.includes('Kursaal'));
  }
  assert.equal(listEvents(querySchema.parse({neighbourhood:"EGIA' OR 1=1 --"})).total,0);
});
test('map excludes expired, cancelled and withdrawn plans while keeping ongoing plans',()=>{
  const map=listMapEvents(querySchema.parse({period:'today'}));
  assert.equal(map.total,4);assert.equal(map.mapped,2);
  assert.ok(map.venues.some(venue=>venue.events.some(event=>event.id==='kk-880121')));
  assert.ok(!map.venues.some(venue=>venue.events.some(event=>['kk-880125','kk-880126','kk-880127'].includes(event.id))));
});
test('map combines category, profile, date, price and neighbourhood filters',()=>{
  assert.equal(listMapEvents(querySchema.parse({profile:'music',period:'tomorrow',neighbourhood:'EGIA',free:'1'})).mapped,120);
  const family=listMapEvents(querySchema.parse({profile:'family',period:'today',neighbourhood:'AIETE'}));
  assert.equal(family.total,1);assert.equal(family.mapped,1);assert.equal(family.venues[0].events[0].category,'theatre');
  assert.equal(listMapEvents(querySchema.parse({category:'art',neighbourhood:'EGIA'})).total,0);
});
test('a neighbourhood with only address-level locations returns useful coverage instead of invented pins',()=>{
  const map=listMapEvents(querySchema.parse({place:'Dabadaba',neighbourhood:'EGIA'}));
  assert.equal(map.total,1);assert.equal(map.mapped,0);assert.equal(map.missingLocations,1);assert.deepEqual(map.venues,[]);
});
