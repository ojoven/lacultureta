import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { track, flushAnalytics, safeAnalyticsProperties } from '../src/lib/analytics';
import { cardPose } from '../src/lib/card-motion';

const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
function environment(hostname='lacultureta.com',event?: (name:string,properties?:Record<string,unknown>)=>void) {
  const window={location:{hostname},rybbit:event?{event}:undefined};
  Object.defineProperty(globalThis,'window',{value:window,writable:true,configurable:true});
  Object.defineProperty(globalThis,'document',{value:{documentElement:{lang:'eu'}},writable:true,configurable:true});
  return window;
}
afterEach(()=>{
  environment('lacultureta.com',()=>{});flushAnalytics();
  if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else Reflect.deleteProperty(globalThis,'window');
  if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else Reflect.deleteProperty(globalThis,'document');
});
test('button actions promote both lower cards to exactly their next resting positions',()=>{
  assert.deepEqual(cardPose(1,0,true),cardPose(0,0,false));
  assert.deepEqual(cardPose(2,0,true),cardPose(1,0,false));
  assert.ok(cardPose(1,0,true).scale>cardPose(1,0,false).scale);
});
test('pointer tracking stays proportional, and release finishes at the same position as a button action',()=>{
  assert.deepEqual(cardPose(1,110,false),{offset:5.5,scale:.98});
  assert.deepEqual(cardPose(1,-110,false),cardPose(1,110,false));
  assert.deepEqual(cardPose(1,110,true),cardPose(1,0,true));
  assert.deepEqual(cardPose(1,600,false),cardPose(0,0,false));
});
test('Rybbit events wait for the asynchronous SDK and flush once with their original context',()=>{
  const browser=environment(),calls:{name:string;properties?:Record<string,unknown>}[]=[];
  track('event_saved',{event_id:'kk-123',category:'music',method:'button'});
  track('profile_selected',{profile:'music'});
  browser.rybbit={event:(name,properties)=>{calls.push({name,properties});}};
  flushAnalytics();flushAnalytics();
  assert.equal(calls.length,2);assert.equal(calls[0].name,'event_saved');
  assert.deepEqual(calls[0].properties,{language:'eu',event_id:'kk-123',category:'music',method:'button'});
});
test('analytics allowlists properties and never sends push credentials or saved-plan inventories',()=>{
  const cleaned=safeAnalyticsProperties({event_id:'tb-12-34',profile:'family',endpoint:'https://push.example/private',token:'private-token',savedIds:'kk-1,kk-2',description:'private text',category_count:2});
  assert.deepEqual(cleaned,{event_id:'tb-12-34',profile:'family',category_count:2});
});
test('local development is excluded and an unavailable or throwing analytics SDK cannot break actions',()=>{
  let calls=0;environment('localhost',()=>{calls++;});track('event_saved',{event_id:'kk-1'});assert.equal(calls,0);
  environment('lacultureta.com',()=>{throw new Error('Tracker blocked');});
  assert.doesNotThrow(()=>track('event_saved',{event_id:'kk-1'}));
});
