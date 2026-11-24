'use client';

import { useEffect, useRef } from 'react';
import { Bell, BellRing, X, Check, Sparkles, LoaderCircle, ChevronRight } from 'lucide-react';
import { PaperIllustration } from './paper-illustration';
import { profileIds, profiles, profileLabel, type ProfileId } from '@/lib/profiles';
import { categories, type Language } from '@/lib/types';
import { dictionary } from '@/lib/i18n';
import type { NotificationControls } from './use-notifications';

const es={profiles:'Tu perfil cultural',profileIntro:'Elige lo que te apetece. Puedes cambiar de perfil cuando quieras.',notifications:'Avisos',intro:'Elige qué quieres recibir en este dispositivo.',newEvents:'Nuevos planes para mí',newHint:'Un resumen a partir de las 18:00, si hay novedades.',weekend:'Ideas para el fin de semana',weekendHint:'Los viernes, a partir de las 17:00.',reminders:'Recordar mis planes guardados',remindersHint:'El día anterior, a partir de las 18:00.',changes:'Cambios en mis planes',changesHint:'Cambios de fecha, horario, lugar o cancelaciones.',scope:'Qué categorías te interesan',all:'Todas las de mi perfil',limits:'Máximo 2 avisos al día. Sin avisos de 21:00 a 09:00. Hora de Donostia.',privacy:'Al activar los avisos guardamos tus preferencias y los identificadores de tus planes guardados para enviarte avisos en este dispositivo. Puedes eliminarlos al desactivar los avisos.',activate:'Activar avisos',save:'Guardar preferencias',off:'Desactivar y eliminar mis datos',active:'Avisos activados',saved:'Preferencias guardadas',error:'No se ha podido guardar. Comprueba tu conexión e inténtalo de nuevo.',denied:'Los avisos están bloqueados. Puedes permitirlos desde los ajustes de este sitio en tu navegador.',install:'En iPhone o iPad: abre esta web en Safari, pulsa Compartir y «Añadir a pantalla de inicio». Abre La Cultureta desde ese icono y activa los avisos aquí.',unsupported:'Este navegador no admite avisos. Prueba con un navegador compatible.',unconfigured:'Los avisos todavía no están disponibles. Inténtalo más tarde.',inviteTitle:'Tu próximo plan, a tiempo.',inviteIntro:'Elige tus avisos. Nosotros te recordamos cuándo salir.',later:'Más tarde',never:'No volver a preguntar',customise:'Elegir categorías y ver detalles',about:'El proyecto',close:'Cerrar',profile:'Perfil'};
const eu:typeof es={profiles:'Zure kultur profila',profileIntro:'Aukeratu gustuko duzuna. Profila nahi duzunean alda dezakezu.',notifications:'Abisuak',intro:'Aukeratu gailu honetan zer jaso nahi duzun.',newEvents:'Niretzako plan berriak',newHint:'Laburpen bat 18:00etatik aurrera, berritasunik badago.',weekend:'Astebururako ideiak',weekendHint:'Ostiraletan, 17:00etatik aurrera.',reminders:'Gordetako planak gogorarazi',remindersHint:'Bezperan, 18:00etatik aurrera.',changes:'Nire planen aldaketak',changesHint:'Data, ordutegi edo leku aldaketak eta ezeztapenak.',scope:'Zein kategoria interesatzen zaizkizu?',all:'Nire profileko guztiak',limits:'Gehienez 2 abisu egunean. Abisurik ez 21:00etatik 09:00etara. Donostiako ordua.',privacy:'Abisuak aktibatzean, zure hobespenak eta gordetako planen identifikatzaileak gordetzen ditugu, gailu honetan abisuak bidaltzeko. Abisuak desaktibatzean datuak ezaba ditzakezu.',activate:'Aktibatu abisuak',save:'Gorde hobespenak',off:'Desaktibatu eta ezabatu nire datuak',active:'Abisuak aktibatuta',saved:'Hobespenak gordeta',error:'Ezin izan da gorde. Egiaztatu konexioa eta saiatu berriro.',denied:'Abisuak blokeatuta daude. Arakatzaileko webgune honen ezarpenetan baimendu ditzakezu.',install:'iPhone edo iPad batean: ireki webgunea Safari-n, sakatu Partekatu eta «Gehitu hasierako pantailan». Ireki La Cultureta ikono horretatik eta aktibatu abisuak hemen.',unsupported:'Arakatzaile honek ez ditu abisuak onartzen. Probatu arakatzaile bateragarri bat.',unconfigured:'Abisuak ez daude oraindik erabilgarri. Saiatu geroago.',inviteTitle:'Zure hurrengo plana, garaiz.',inviteIntro:'Aukeratu abisuak. Guk gogoraraziko dizugu noiz atera.',later:'Geroago',never:'Ez galdetu berriro',customise:'Aukeratu kategoriak eta ikusi xehetasunak',about:'Proiektua',close:'Itxi',profile:'Profila'};
export function personalisationCopy(language:Language){return language==='eu'?eu:es;}
const kinds=['newEvents','weekend','reminders','changes'] as const;

export function ProfileDialog({open,onClose,onChoose,onAbout,current,language}:{open:boolean;onClose:()=>void;onChoose:(id:ProfileId)=>void;onAbout:()=>void;current:ProfileId;language:Language}) {
  const dialog=useRef<HTMLDialogElement>(null),t=personalisationCopy(language);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
  return <dialog ref={dialog} className="preference-dialog profile-dialog" aria-labelledby="profiles-title" onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="dialog-heading"><h2 id="profiles-title">{t.profiles}</h2><button className="icon-button" autoFocus aria-label={t.close} onClick={onClose}><X/></button></div>
    <div className="preference-body"><p className="preference-intro">{t.profileIntro}</p>
    <div className="profile-options">{profileIds.map(id=><button key={id} className={current===id?'profile-option selected':'profile-option'} aria-pressed={current===id} onClick={()=>onChoose(id)}><PaperIllustration profile={id} eager={open}/><span className="profile-option-copy"><strong>{profiles[id][language][0]}</strong><small>{profiles[id][language][1]}</small></span>{current===id?<Check size={19}/>:<ChevronRight size={18}/>}</button>)}</div>
    <button className="text-button preference-about" onClick={()=>{onClose();onAbout();}}>{t.about}</button></div>
  </dialog>;
}
function NotificationChoices({controls,language,compact=false}:{controls:NotificationControls;language:Language;compact?:boolean}) {
  const t=personalisationCopy(language);
  return <div className={compact?'notification-choices compact':'notification-choices'}>{kinds.map(kind=><label key={kind}><input type="checkbox" checked={controls.preferences[kind]} onChange={event=>controls.setPreferences(previous=>({...previous,[kind]:event.target.checked}))}/><span><strong>{compact&&kind==='reminders'?(language==='eu'?'Nire planak gogorarazi':'Recordar mis planes'):t[kind]}</strong>{!compact&&<small>{t[(kind==='newEvents'?'newHint':kind==='weekend'?'weekendHint':kind==='reminders'?'remindersHint':'changesHint')]}</small>}</span></label>)}</div>;
}
export function NotificationDialog({open,onClose,controls,language}:{open:boolean;onClose:()=>void;controls:NotificationControls;language:Language}) {
  const dialog=useRef<HTMLDialogElement>(null),t=personalisationCopy(language),d=dictionary(language);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
  const allowed=controls.availability==='supported'&&controls.permission!=='denied';
  return <dialog ref={dialog} className="preference-dialog notification-dialog" aria-labelledby="notifications-title" onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="dialog-heading"><h2 id="notifications-title"><Bell size={22}/>{t.notifications}</h2><button className="icon-button" autoFocus aria-label={t.close} onClick={onClose}><X/></button></div>
    <p className="preference-intro">{t.intro}</p>
    <p className="notification-profile">{t.profile}: <strong>{profileLabel(controls.preferences.profile,language)}</strong>{controls.active&&<span><Check size={14}/>{t.active}</span>}</p>
    <NotificationChoices controls={controls} language={language}/>
    <fieldset className="notification-categories"><legend>{t.scope}</legend><label><input type="checkbox" checked={!controls.preferences.categories.length} onChange={()=>controls.setPreferences(previous=>({...previous,categories:[]}))}/>{t.all}</label>{categories.filter(category=>category!=='all').filter(category=>!profiles[controls.preferences.profile].categories.length||profiles[controls.preferences.profile].categories.includes(category)).map(category=><label key={category}><input type="checkbox" checked={controls.preferences.categories.includes(category)} onChange={event=>controls.setPreferences(previous=>({...previous,categories:event.target.checked?[...previous.categories,category]:previous.categories.filter(value=>value!==category)}))}/>{d.categories[category]}</label>)}</fieldset>
    <p className="notification-limits">{t.limits}</p>
    {controls.availability==='install'&&<p className="notification-notice">{t.install}</p>}
    {controls.availability==='unsupported'&&<p className="notification-notice">{t.unsupported}</p>}
    {controls.availability==='unconfigured'&&<p className="notification-notice">{t.unconfigured}</p>}
    {controls.permission==='denied'&&<p className="notification-notice">{t.denied}</p>}
    {controls.error&&<p role="alert" className="notification-error">{t.error}</p>}
    {controls.savedMessage&&<p role="status" className="notification-success"><Check size={16}/>{t.saved}</p>}
    <p className="notification-privacy">{t.privacy}</p>
    <div className="notification-buttons"><button className="primary-button" disabled={controls.busy||controls.availability==='loading'||(!controls.active&&!allowed)} onClick={controls.active?controls.save:controls.activate}>{controls.busy?<LoaderCircle size={18} className="spinning"/>:<BellRing size={18}/>} {controls.active?t.save:t.activate}</button>{controls.active&&<button className="text-button" disabled={controls.busy} onClick={controls.deactivate}>{t.off}</button>}</div>
  </dialog>;
}
export function NotificationInvitation({controls,language,onSettings}:{controls:NotificationControls;language:Language;onSettings:()=>void}) {
  const t=personalisationCopy(language);
  return <article className="discovery-card notification-invitation" data-depth="0" aria-labelledby="notification-invitation-title"><div className="notification-invitation-content"><span className="notification-emblem"><BellRing size={36}/><Sparkles size={20}/></span><p className="eyebrow">LA CULTURETA · {t.notifications.toUpperCase()}</p><h2 id="notification-invitation-title">{t.inviteTitle}</h2><p className="notification-invite-intro">{t.inviteIntro}</p><NotificationChoices controls={controls} language={language} compact/><button className="notification-customise" onClick={onSettings}>{t.customise}<ChevronRight size={16}/></button><p className="notification-limits">{t.limits}</p><button className="text-button notification-never" onClick={()=>controls.dismiss(true)}>{t.never}</button></div></article>;
}
