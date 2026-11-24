'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { analyticsEnabled, analyticsEvents, flushAnalytics, track, type AnalyticsEvent } from '@/lib/analytics';

export function Analytics() {
  const [enabled,setEnabled]=useState(false);
  useEffect(()=>{
    setEnabled(analyticsEnabled());
    const clicked=(event:MouseEvent)=>{
      const element=event.target instanceof Element?event.target.closest<HTMLElement>('[data-analytics-event]'):null;
      const name=element?.dataset.analyticsEvent as AnalyticsEvent|undefined;
      if(!element||!name||!analyticsEvents.includes(name))return;
      if(name==='language_changed'&&element.dataset.analyticsValue===document.documentElement.lang)return;
      track(name,{event_id:element.dataset.eventId,category:element.dataset.category,organizer:element.dataset.organizer,value:element.dataset.analyticsValue,view:element.dataset.analyticsView});
    };
    document.addEventListener('click',clicked);
    const page=document.querySelector<HTMLElement>('[data-analytics-page="event"]');
    if(page)track('event_details_opened',{event_id:page.dataset.eventId,category:page.dataset.category,organizer:page.dataset.organizer,view:'page'});
    return()=>document.removeEventListener('click',clicked);
  },[]);
  return enabled?<Script id="rybbit-analytics" src="https://analytics.mtorr.es/api/script.js?siteId=339fd640cc48" strategy="afterInteractive" defer onLoad={flushAnalytics}/>:null;
}
