'use client';
import { useSyncExternalStore } from 'react';
import { madridToday } from '@/lib/dates';
import { eventTiming } from '@/lib/event-timing';
import type { Language } from '@/lib/types';
const listeners=new Set<()=>void>();let timer:ReturnType<typeof setInterval>|undefined;
const publish=()=>{for(const listener of listeners)listener();};
function subscribe(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1){timer=setInterval(publish,60000);window.addEventListener('focus',publish);document.addEventListener('visibilitychange',publish);}
  return()=>{listeners.delete(listener);if(!listeners.size){clearInterval(timer);window.removeEventListener('focus',publish);document.removeEventListener('visibilitychange',publish);}};
}
export function useMadridToday(){return useSyncExternalStore<string|null>(subscribe,madridToday,()=>null);}
export function EventWhen({start,end,hours='',language}:{start:string;end:string;hours?:string;language:Language}) {
  const today=useMadridToday();return <>{eventTiming(start,end,hours,language,today)}</>;
}
