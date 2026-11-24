import type { CultureEvent } from './types';

export const analyticsEvents = [
  'welcome_viewed','welcome_started','event_viewed','event_saved','event_skipped','event_removed','event_undo',
  'event_details_opened','event_shared','ticket_link_clicked','official_link_clicked','calendar_download_clicked',
  'filter_changed','filters_opened','profile_selected','profile_menu_opened','navigation_changed','language_changed',
  'notifications_opened','notification_invitation_shown','notification_invitation_dismissed',
  'notification_enable_requested','notification_permission_result','notifications_enabled','notifications_disabled',
  'notification_preferences_saved','notification_error',
] as const;
export type AnalyticsEvent=typeof analyticsEvents[number];
const allowedProperties = new Set(['language','event_id','category','organizer','profile','previous_profile','view','method','filter','value','status','choice','enabled_types','category_count']);
export type AnalyticsProperties=Record<string,string|number|boolean|undefined>;
declare global { interface Window { rybbit?: { event:(name:string,properties?:Record<string,string|number|boolean>)=>void } } }
const queue:{name:AnalyticsEvent;properties:Record<string,string|number|boolean>;expires:number}[]=[];
let retry:ReturnType<typeof setTimeout>|undefined;
export function analyticsEnabled() {return typeof window!=='undefined'&&['lacultureta.com','www.lacultureta.com'].includes(window.location.hostname);}
export function safeAnalyticsProperties(properties:AnalyticsProperties) {
  return Object.fromEntries(Object.entries(properties).filter(([key,value])=>allowedProperties.has(key)&&value!==undefined&&['string','number','boolean'].includes(typeof value)).map(([key,value])=>[key,typeof value==='string'?value.slice(0,120):value])) as Record<string,string|number|boolean>;
}
export function flushAnalytics() {
  if(!analyticsEnabled())return;
  if(retry){clearTimeout(retry);retry=undefined;}
  while(queue.length&&queue[0].expires<Date.now())queue.shift();
  if(typeof window.rybbit?.event!=='function') {
    if(queue.length)retry=setTimeout(flushAnalytics,300);
    return;
  }
  for(const item of queue.splice(0))try{window.rybbit.event(item.name,item.properties);}catch{}
}
export function track(name:AnalyticsEvent,properties:AnalyticsProperties={}) {
  if(!analyticsEnabled())return;
  queue.push({name,properties:safeAnalyticsProperties({language:document.documentElement.lang,...properties}),expires:Date.now()+15000});
  if(queue.length>100)queue.shift();
  flushAnalytics();
}
export function eventProperties(event:Pick<CultureEvent,'id'|'category'|'source'>) {return {event_id:event.id,category:event.category,organizer:event.source};}
