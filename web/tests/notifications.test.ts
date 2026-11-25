import { test, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { generateVAPIDKeys, generateRequestDetails } from 'web-push';
import { db, storeEvents } from '../src/lib/db';
import { querySchema, listEvents, getEvent } from '../src/lib/events';
import { calendar } from '../src/lib/calendar';
import { beginSession, emptyInvitationState, notificationPreferencesSchema, shouldInvite } from '../src/lib/notification-preferences';
import { saveSubscription, subscriptionSchema, pushRequestSchema, tokenHash, validPushEndpoint, type PushSubscriber } from '../src/lib/push-store';
import { planForSubscriber, commitPlan, notificationTtl } from '../src/lib/push-planner';
import { dispatchNotifications } from '../src/lib/push-dispatcher';
import { POST, PATCH, DELETE } from '../src/app/api/notifications/route';
import type { ImportedEvent } from '../src/lib/types';

const directory=mkdtempSync(join(tmpdir(),'cultureta-push-'));
process.env.DATABASE_PATH=join(directory,'test.sqlite');process.env.APP_ORIGIN='https://lacultureta.test';
const vapid=generateVAPIDKeys();process.env.VAPID_PUBLIC_KEY=vapid.publicKey;process.env.VAPID_PRIVATE_KEY=vapid.privateKey;
mock.timers.enable({apis:['Date'],now:new Date('2026-11-24T12:00:00Z')});
const token='a'.repeat(43),otherToken='b'.repeat(43);
const encryption=createECDH('prime256v1');encryption.generateKeys();
const keys={p256dh:encryption.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')};
const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/test-device-123456789',keys};
const prefs=(patch:Record<string,unknown>={})=>notificationPreferencesSchema.parse({newEvents:false,weekend:false,reminders:false,changes:false,...patch});
function event(id='kk-100',title='Concierto de jazz',category:ImportedEvent['category']='music',date='2026-11-25'):ImportedEvent {
  const translation={title,description:'Un encuentro cultural en Donostia.',place:'Tabakalera',price:'0 €',hours:'19:00',url:'https://www.tabakalera.eus/es/test/'+id,ticketUrl:''};
  return {id,externalId:id,source:'tabakalera',category,startDate:date,endDate:date,image:'',eventLanguage:'',translations:{es:translation,eu:{...translation,title:'Jazz kontzertua'}}};
}
function subscriber(patch:Record<string,unknown>={},endpoint=subscription.endpoint,deviceToken=token) {
  const id=saveSubscription(pushRequestSchema.parse({subscription:{endpoint,keys},preferences:prefs(patch)}),deviceToken,'test');
  return db().prepare('SELECT * FROM push_subscriptions WHERE id=?').get(id) as PushSubscriber;
}
function request(method:string,body?:unknown,deviceToken=token,origin='https://lacultureta.test') {
  return new Request('https://lacultureta.test/api/notifications',{method,headers:{Origin:origin,Authorization:'Bearer '+deviceToken,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
beforeEach(()=>{db().exec('DELETE FROM push_subscriptions; DELETE FROM events; DELETE FROM push_provider_cooldowns;');});
after(()=>{db().close();mock.timers.reset();rmSync(directory,{recursive:true,force:true});});

test('profile filters select category groups and child-oriented weekend events',()=>{
  const adult=event('kk-3','Teatro para adultos','theatre','2026-11-28');adult.translations.eu.description='Artistaren haurtzaroan oinarritutako lana.';
  storeEvents([event('kk-1','Taller infantil','workshops','2026-11-28'),event('kk-2','Concierto de jazz','music','2026-11-28'),adult,event('kk-4','Taller infantil entre semana','workshops','2026-11-25')]);
  assert.deepEqual(listEvents(querySchema.parse({profile:'family',period:'weekend'})).events.map(row=>row.id),['kk-1']);
  assert.deepEqual(listEvents(querySchema.parse({profile:'music'})).events.map(row=>row.id),['kk-2']);
  assert.equal(listEvents(querySchema.parse({profile:'curious'})).total,2);
  assert.equal(listEvents(querySchema.parse({profile:'music',category:'theatre'})).total,0);
});
test('notification invitation waits for three real sessions, eight cards and seven days',()=>{
  const now=Date.now();let state=beginSession(emptyInvitationState,now);
  assert.equal(beginSession(state,now+60000).sessions,1);
  state=beginSession(state,now+31*60000);state=beginSession(state,now+62*60000);
  assert.equal(shouldInvite(state,7,now+62*60000,false,'default'),false);
  assert.equal(shouldInvite(state,8,now+62*60000,false,'default'),true);
  for(const permission of ['denied','unsupported'] as const)assert.equal(shouldInvite(state,8,now,false,permission),false);
  assert.equal(shouldInvite(state,8,now,true,'granted'),false);
  assert.equal(shouldInvite({...state,never:true},8,now,false,'default'),false);
  const shown={...state,lastShownAt:now,lastShownSession:3,sessions:6};
  assert.equal(shouldInvite(shown,8,now+6*86400000,false,'default'),false);
  assert.equal(shouldInvite(shown,8,now+7*86400000,false,'default'),true);
});
test('subscription API enforces origin, device ownership and a valid push endpoint',async()=>{
  const body={subscription,preferences:prefs()};
  assert.equal((await POST(request('POST',body,token,'https://other.test'))).status,403);
  assert.equal((await POST(request('POST',body))).status,200);
  const stored=db().prepare('SELECT token_hash FROM push_subscriptions').get() as {token_hash:string};
  assert.equal(stored.token_hash,tokenHash(token));assert.notEqual(stored.token_hash,token);
  assert.equal((await POST(request('POST',body,otherToken))).status,403);
  assert.equal((await POST(request('POST',{...body,subscription:{...subscription,endpoint:'https://127.0.0.1/private'}}))).status,400);
  assert.equal(validPushEndpoint('https://fcm.googleapis.com.attacker.test/a'),false);
  assert.equal(subscriptionSchema.safeParse({...subscription,keys:{...keys,p256dh:'a'.repeat(87)}}).success,false);
});
test('preferences and unsubscribe affect only the device holding its secret',async()=>{
  const sub=subscriber();
  assert.equal((await PATCH(request('PATCH',prefs({profile:'cinema'}),otherToken))).status,404);
  assert.equal((await PATCH(request('PATCH',prefs({profile:'cinema'})))).status,200);
  db().prepare('INSERT INTO push_deliveries VALUES (?,?,?,?)').run(sub.id,'test','new',new Date().toISOString());
  assert.equal((await DELETE(request('DELETE',undefined,otherToken))).status,200);
  assert.equal((db().prepare('SELECT count(*) AS n FROM push_subscriptions').get() as any).n,1);
  assert.equal((await DELETE(request('DELETE'))).status,200);
  assert.equal((db().prepare('SELECT count(*) AS n FROM push_deliveries').get() as any).n,0);
});
test('new-event digests exclude old catalogue entries, honour the profile and deduplicate',()=>{
  storeEvents([event('kk-100'),event('kk-101','Película','cinema')]);
  const sub=subscriber({newEvents:true,profile:'music'});
  db().prepare('UPDATE event_first_seen SET first_seen_at=?').run('2026-11-24T10:00:00Z');
  storeEvents([event('kk-102','Concierto nuevo'),event('kk-103','Nueva película','cinema')]);
  db().prepare("UPDATE event_first_seen SET first_seen_at='2026-11-24T13:00:00Z' WHERE event_id IN ('kk-102','kk-103')").run();
  const now=new Date('2026-11-24T17:00:00Z'),plan=planForSubscriber(sub,now)!;
  assert.equal(plan.kind,'new');assert.match(plan.payload.body,/1 plan nuevo: Concierto nuevo/);assert.doesNotMatch(plan.payload.body,/Nueva película/);
  commitPlan(sub.id,plan,now);assert.equal(planForSubscriber(sub,new Date('2026-11-24T18:00:00Z')),undefined);
});
test('weekend suggestions wait until Friday at 17:00 in Madrid',()=>{
  storeEvents([event('kk-100','Concierto del sábado','music','2026-11-28')]);const sub=subscriber({weekend:true});
  assert.equal(planForSubscriber(sub,new Date('2026-11-27T15:59:00Z')),undefined);
  const plan=planForSubscriber(sub,new Date('2026-11-27T16:00:00Z'))!;
  assert.equal(plan.kind,'weekend');assert.match(plan.payload.url,/period=weekend/);
});
test('saved-event reminders are bundled the previous evening and sent once',()=>{
  storeEvents([event()]);const sub=subscriber({reminders:true,savedIds:['kk-100']});
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T16:00:00Z')),undefined);
  const now=new Date('2026-11-24T17:00:00Z'),plan=planForSubscriber(sub,now)!;
  assert.equal(plan.kind,'reminders');commitPlan(sub.id,plan,now);
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T18:00:00Z')),undefined);
});
test('saved-event changes wait through quiet hours and survive until a successful delivery',()=>{
  storeEvents([event()]);const sub=subscriber({changes:true,savedIds:['kk-100']});
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T12:00:00Z')),undefined);
  db().prepare("UPDATE event_translations SET hours='20:00' WHERE event_id='kk-100'").run();
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T20:00:00Z')),undefined);
  const now=new Date('2026-11-25T08:00:00Z'),plan=planForSubscriber(sub,now)!;
  assert.equal(plan.kind,'changes');assert.equal(plan.payload.url,'/es/eventos/kk-100');
  commitPlan(sub.id,plan,now);assert.equal(planForSubscriber(sub,new Date('2026-11-25T09:00:00Z')),undefined);
});
test('saved-event changes between opt-in and the first scheduled check are detected',()=>{
  storeEvents([event()]);const sub=subscriber({changes:true,savedIds:['kk-100']});
  db().prepare("UPDATE event_translations SET hours='21:00' WHERE event_id='kk-100'").run();
  const plan=planForSubscriber(sub,new Date('2026-11-24T13:00:00Z'));
  assert.equal(plan?.kind,'changes');
});
test('natural event expiry is silent, while early withdrawal of an ongoing exhibition is reported',()=>{
  const exhibition=event('kk-101','Exposición','art','2026-11-20');exhibition.endDate='2026-11-30';
  storeEvents([event(),exhibition]);const sub=subscriber({changes:true,savedIds:['kk-100','kk-101']});
  db().prepare('INSERT INTO event_origins VALUES (?,?,?,?,?,0,0)').run('tabakalera','ended','kk-100','https://www.tabakalera.eus/es/ended','2026-11-25T18:00:00Z');
  assert.equal(planForSubscriber(sub,new Date('2026-11-26T08:00:00Z')),undefined);
  db().prepare('INSERT INTO event_origins VALUES (?,?,?,?,?,0,0)').run('tabakalera','withdrawn','kk-101','https://www.tabakalera.eus/es/withdrawn','2026-11-25T18:00:00Z');
  db().prepare("UPDATE events SET end_date='2026-11-25' WHERE id='kk-101'").run();
  const plan=planForSubscriber(sub,new Date('2026-11-26T09:00:00Z'));
  assert.equal(plan?.kind,'changes');assert.equal(plan?.payload.url,'/es/eventos/kk-101');
});
test('two-alert daily cap and a thirty-minute gap apply across notification kinds',()=>{
  storeEvents([event()]);const sub=subscriber({reminders:true,savedIds:['kk-100']});
  const plan=planForSubscriber(sub,new Date('2026-11-24T17:00:00Z'))!;
  commitPlan(sub.id,{...plan,key:'first',kind:'new'},new Date('2026-11-24T16:45:00Z'));
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T17:00:00Z')),undefined);
  commitPlan(sub.id,{...plan,key:'second',kind:'weekend'},new Date('2026-11-24T17:30:00Z'));
  assert.equal(planForSubscriber(sub,new Date('2026-11-24T18:30:00Z')),undefined);
});
test('provider queue lifetime ends before Madrid quiet hours in winter and summer',()=>{
  assert.equal(notificationTtl(new Date('2026-11-24T19:45:00Z')),900);
  assert.equal(notificationTtl(new Date('2026-07-24T18:45:00Z')),900);
  assert.equal(notificationTtl(new Date('2026-11-24T17:00:00Z')),7200);
  assert.equal(notificationTtl(new Date('2026-07-24T19:00:00Z')),0);
});
test('switching language and advancing a cancellation expiry do not create false change alerts',()=>{
  storeEvents([event()]);const sub=subscriber({changes:true,savedIds:['kk-100']});
  planForSubscriber(sub,new Date('2026-11-24T12:00:00Z'));
  const basque={...sub,preferences:JSON.stringify(prefs({changes:true,savedIds:['kk-100'],language:'eu'}))};
  assert.equal(planForSubscriber(basque,new Date('2026-11-24T13:00:00Z')),undefined);
  db().prepare('INSERT INTO event_origins VALUES (?,?,?,?,?,1,1)').run('tabakalera','cancel-fixture','kk-100','https://www.tabakalera.eus/es/test','2026-11-24T12:00:00Z');
  db().prepare("UPDATE events SET end_date='2026-11-23' WHERE id='kk-100'").run();
  const cancelled=getEvent('kk-100','es')!;assert.equal(cancelled.status,'cancelled');assert.match(calendar(cancelled,'es'),/STATUS:CANCELLED/);
  const now=new Date('2026-11-24T14:00:00Z'),plan=planForSubscriber(sub,now)!;assert.equal(plan.kind,'changes');commitPlan(sub.id,plan,now);
  db().prepare("UPDATE events SET end_date='2026-11-24' WHERE id='kk-100'").run();
  assert.equal(planForSubscriber(sub,new Date('2026-11-25T08:00:00Z')),undefined);
});
test('dispatcher dry run makes no network calls and leaves notification state unchanged',async()=>{
  storeEvents([event()]);subscriber({reminders:true,savedIds:['kk-100']});let calls=0;
  const before=db().prepare('SELECT * FROM push_subscriptions').all();
  const savedBefore=db().prepare('SELECT * FROM push_saved_state').all();
  const summary=await dispatchNotifications({dryRun:true,now:new Date('2026-11-24T17:00:00Z'),send:async()=>{calls++;}});
  assert.equal(summary.planned,1);assert.equal(calls,0);assert.deepEqual(db().prepare('SELECT * FROM push_subscriptions').all(),before);
  assert.deepEqual(db().prepare('SELECT * FROM push_saved_state').all(),savedBefore);
});
test('dispatcher removes expired subscriptions and persists provider Retry-After cooldowns',async()=>{
  storeEvents([event()]);subscriber({reminders:true,savedIds:['kk-100']});
  const expired=await dispatchNotifications({now:new Date('2026-11-24T17:00:00Z'),send:async()=>{throw {statusCode:410};}});
  assert.equal(expired.expired,1);
  subscriber({reminders:true,savedIds:['kk-100']});subscriber({reminders:true,savedIds:['kk-100']},subscription.endpoint+'-two',otherToken);
  let calls=0;const send=async()=>{calls++;throw {statusCode:429,headers:{'retry-after':'3600'}};};
  const limited=await dispatchNotifications({now:new Date('2026-11-24T17:00:00Z'),send});
  assert.equal(calls,1);assert.equal(limited.coolingDown,1);
  await dispatchNotifications({now:new Date('2026-11-24T17:15:00Z'),send});assert.equal(calls,1);
});
test('real Web Push payload generation encrypts a planned notification with the configured keys',()=>{
  storeEvents([event()]);const sub=subscriber({reminders:true,savedIds:['kk-100']});
  const plan=planForSubscriber(sub,new Date('2026-11-24T17:00:00Z'))!;
  const request=generateRequestDetails(subscription,JSON.stringify(plan.payload),{vapidDetails:{...vapid,subject:'https://lacultureta.com'},TTL:7200});
  assert.equal(request.method,'POST');assert.ok(Buffer.isBuffer(request.body));assert.ok(request.body!.length>100);
  assert.equal(request.headers['Content-Encoding'],'aes128gcm');assert.ok(request.headers.Authorization);
});
test('service worker shows pushes and restricts notification navigation to this site',async()=>{
  const handlers:Record<string,(event:any)=>void>={};let notification:any;
  const self={location:{origin:'https://lacultureta.test'},addEventListener:(name:string,callback:any)=>{handlers[name]=callback;},registration:{showNotification:async(title:string,options:any)=>{notification={title,...options};}}};
  runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL});
  let complete:Promise<unknown>|undefined;
  handlers.push({data:{json:()=>({title:'Tu plan',body:'Mañana',url:'https://outside.test/steal'})},waitUntil:(promise:Promise<unknown>)=>{complete=promise;}});
  await complete;assert.equal(notification.data.url,'/es');assert.equal(notification.title,'Tu plan');
});
test('family discovery and notification digests use the same evidence across both translations',()=>{
  const child=event('kk-501','Un viaje','theatre','2026-11-28');child.translations.eu.description='Adina: + 5 urte';
  const adult=event('kk-502','Drama','theatre','2026-11-28');adult.translations.eu.description='Euskadin bizi den familia baten istorioa.';
  storeEvents([child,adult]);
  for(const lang of ['es','eu'])assert.deepEqual(listEvents(querySchema.parse({lang,profile:'family'})).events.map(event=>event.id),['kk-501']);
  const sub=subscriber({profile:'family',weekend:true});
  const plan=planForSubscriber(sub,new Date('2026-11-27T16:00:00Z'));
  assert.equal(plan?.kind,'weekend');assert.match(plan!.payload.body,/Un viaje/);assert.doesNotMatch(plan!.payload.body,/Drama/);
});
