'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { beginSession, defaultNotificationPreferences, emptyInvitationState, notificationPreferencesSchema, shouldInvite, type InvitationState, type NotificationPreferences } from '@/lib/notification-preferences';
import type { Language } from '@/lib/types';
import type { ProfileId } from '@/lib/profiles';
import { track } from '@/lib/analytics';

const preferencesKey='lacultureta.notifications.v1',tokenKey='lacultureta.push-token.v1',invitationKey='lacultureta.notification-invitation.v1';
function readInvitation():InvitationState {
  try { const state=JSON.parse(localStorage.getItem(invitationKey)||'{}');return {...emptyInvitationState,...state}; } catch{return {...emptyInvitationState};}
}
function writeInvitation(state:InvitationState) { try{localStorage.setItem(invitationKey,JSON.stringify(state));}catch{} }
function deviceToken() {
  let token=localStorage.getItem(tokenKey);
  if(!token||!/^[\w-]{43}$/.test(token)){token=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');localStorage.setItem(tokenKey,token);}
  return token;
}
async function registration() {return navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});}
async function readyRegistration() {await registration();return navigator.serviceWorker.ready;}
function serverKey(value:string) {const raw=atob(value.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-value.length%4)%4));return Uint8Array.from(raw,char=>char.charCodeAt(0));}

export function useNotifications(language:Language,profile:ProfileId,savedIds:string[],ready:boolean) {
  const [preferences,setPreferences]=useState<NotificationPreferences>(defaultNotificationPreferences);
  const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[invite,setInvite]=useState(false);
  const [availability,setAvailability]=useState<'loading'|'supported'|'install'|'unsupported'|'unconfigured'>('loading');
  const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('default');
  const [error,setError]=useState(false),[savedMessage,setSavedMessage]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const publicKey=useRef(''),registrationPromise=useRef<Promise<ServiceWorkerRegistration>|undefined>(undefined);
  const managed={...preferences,language,profile,savedIds};
  const serialised=JSON.stringify(managed),latest=useRef(managed);latest.current=managed;
  useEffect(()=>{
    try {const parsed=notificationPreferencesSchema.safeParse(JSON.parse(localStorage.getItem(preferencesKey)||'{}'));if(parsed.success)setPreferences({...parsed.data,categories:parsed.data.profile===profile?parsed.data.categories:[]});}catch{}
    const session=beginSession(readInvitation(),Date.now());writeInvitation(session);
    const activity=()=>{if(document.visibilityState==='visible'){writeInvitation(beginSession(readInvitation(),Date.now()));if('Notification' in window){setPermission(Notification.permission);if(Notification.permission!=='granted')setActive(false);}}};
    document.addEventListener('visibilitychange',activity);
    const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone;
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(ios&&!standalone){setAvailability('install');setPermission('default');}
    else if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)||!window.isSecureContext){setAvailability('unsupported');setPermission('unsupported');}
    else {
      setPermission(Notification.permission);
      registrationPromise.current=readyRegistration();
      Promise.all([registrationPromise.current,fetch('/api/notifications').then(response=>response.json())]).then(async([worker,config])=>{
        if(!config.configured||!config.publicKey){setAvailability('unconfigured');return;}
        publicKey.current=config.publicKey;setAvailability('supported');
        const subscription=await worker.pushManager.getSubscription();
        setActive(!!subscription&&Notification.permission==='granted'&&!!localStorage.getItem(tokenKey));
      }).catch(()=>setAvailability('unsupported'));
    }
    setLoaded(true);
    return()=>document.removeEventListener('visibilitychange',activity);
  },[]);
  const previousProfile=useRef(profile);
  useEffect(()=>{if(previousProfile.current!==profile){setPreferences(previous=>({...previous,categories:[]}));previousProfile.current=profile;}},[profile]);
  useEffect(()=>{if(loaded&&ready)try{localStorage.setItem(preferencesKey,serialised);}catch{}},[serialised,loaded,ready]);
  const sync=useCallback(async()=>{
    const token=localStorage.getItem(tokenKey);if(!token)return;
    const response=await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(latest.current)});
    if(response.status===404){setActive(false);throw new Error('Subscription expired');}
    if(!response.ok)throw new Error('Could not save preferences');
  },[]);
  useEffect(()=>{
    if(!loaded||!ready||!active)return;
    const timer=setTimeout(()=>{sync().catch(()=>setError(true));},500);
    return()=>clearTimeout(timer);
  },[serialised,loaded,ready,active,sync]);
  useEffect(()=>{if(active||permission==='denied')setInvite(false);},[active,permission]);
  const recordCard=useCallback(()=>{
    const now=Date.now(),state=beginSession(readInvitation(),now);state.cardsSeen++;
    const eligible=availability==='supported'||availability==='install';
    if(eligible&&shouldInvite(state,state.cardsSeen,now,active,permission)) {
      state.lastShownSession=state.sessions;state.lastShownAt=now;setInvite(true);
      track('notification_invitation_shown',{profile:latest.current.profile});
    }
    writeInvitation(state);
  },[active,availability,permission]);
  const dismiss=useCallback((never=false)=>{if(invite)track('notification_invitation_dismissed',{choice:never?'never':'later'});setInvite(false);const state=readInvitation();state.never=never||state.never;writeInvitation(state);},[invite]);
  const activate=async()=>{
    if(availability!=='supported'||busy)return;
    track('notification_enable_requested',{profile});
    setBusy(true);setError(false);setSavedMessage(false);
    // Permission is requested directly from the button gesture, before network or worker waits.
    const granted=Notification.permission==='granted'?Promise.resolve('granted' as NotificationPermission):Notification.requestPermission();
    let created:PushSubscription|undefined;
    try {
      const result=await granted;setPermission(result);
      track('notification_permission_result',{status:result});
      if(result!=='granted')return;
      const worker=await (registrationPromise.current||readyRegistration());
      let subscription=await worker.pushManager.getSubscription();
      if(subscription&&!localStorage.getItem(tokenKey)){await subscription.unsubscribe();subscription=null;}
      const token=deviceToken();
      if(!subscription){subscription=await worker.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:serverKey(publicKey.current)});created=subscription;}
      const response=await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({subscription:subscription.toJSON(),preferences:latest.current})});
      if(!response.ok)throw new Error('Subscription could not be saved');
      setActive(true);setInvite(false);setSavedMessage(true);
      track('notifications_enabled',{profile,enabled_types:['newEvents','weekend','reminders','changes'].filter(kind=>latest.current[kind as keyof NotificationPreferences]===true).length,category_count:latest.current.categories.length});
    }catch{if(created)await created.unsubscribe().catch(()=>{});setError(true);track('notification_error',{status:'activation'});}finally{setBusy(false);}
  };
  const save=async()=>{setBusy(true);setError(false);try{if(active)await sync();setSavedMessage(true);track('notification_preferences_saved',{profile,enabled_types:['newEvents','weekend','reminders','changes'].filter(kind=>latest.current[kind as keyof NotificationPreferences]===true).length,category_count:latest.current.categories.length});}catch{setError(true);track('notification_error',{status:'preferences'});}finally{setBusy(false);}};
  const deactivate=async()=>{
    setBusy(true);setError(false);
    try{
      const token=localStorage.getItem(tokenKey);
      if(token){const response=await fetch('/api/notifications',{method:'DELETE',headers:{Authorization:'Bearer '+token}});if(!response.ok)throw new Error('Could not remove subscription');}
      const worker=await (registrationPromise.current||readyRegistration());await (await worker.pushManager.getSubscription())?.unsubscribe();
      localStorage.removeItem(tokenKey);setActive(false);dismiss();const state=readInvitation();writeInvitation({...state,lastShownAt:Date.now(),lastShownSession:state.sessions});setSavedMessage(false);
      track('notifications_disabled');
    }catch{setError(true);track('notification_error',{status:'deactivation'});}finally{setBusy(false);}
  };
  return {preferences:managed,setPreferences,active,busy,invite,availability,permission,error,savedMessage,activate,deactivate,save,dismiss,recordCard};
}
export type NotificationControls=ReturnType<typeof useNotifications>;
