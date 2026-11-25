'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { CalendarDays,X } from 'lucide-react';
import { addDays,madridToday } from '@/lib/dates';
import { dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/types';
import { useMadridToday } from './event-when';
import './date-range-dialog.css';
export function DateRangeDialog({open,from,to,language,onClose,onApply}:{open:boolean;from:string;to:string;language:Language;onClose:()=>void;onApply:(from:string,to:string)=>void}) {
  const ref=useRef<HTMLDialogElement>(null),t=dictionary(language),today=useMadridToday();
  const [draftFrom,setFrom]=useState(''),[draftTo,setTo]=useState('');
  useEffect(()=>{if(open){const day=madridToday();setFrom(from&&from>=day?from:day);setTo(to&&to>=day?to:addDays(day,6));ref.current?.showModal();}else ref.current?.close();},[open,from,to]);
  const valid=!!draftFrom&&!!draftTo&&draftFrom<=draftTo;
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(valid)onApply(draftFrom,draftTo);};
  return <dialog ref={ref} className="date-range-dialog" aria-labelledby="date-range-title" onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="dialog-heading"><h2 id="date-range-title">{t.chooseDates}</h2><button autoFocus className="icon-button" aria-label={t.close} onClick={onClose}><X/></button></div>
    <form onSubmit={submit} className="date-range-fields">
      <p>{t.dateRangeHint}</p>
      <label><span><CalendarDays size={16}/>{t.dateFrom}</span><input aria-label={t.dateFrom} type="date" required min={today||undefined} value={draftFrom} onInput={event=>setFrom(event.currentTarget.value)} onChange={event=>setFrom(event.target.value)}/></label>
      <label><span><CalendarDays size={16}/>{t.dateTo}</span><input aria-label={t.dateTo} type="date" required min={draftFrom||today||undefined} value={draftTo} onInput={event=>setTo(event.currentTarget.value)} onChange={event=>setTo(event.target.value)}/></label>
      {!valid&&draftFrom&&draftTo&&<p className="date-range-error" role="alert">{t.dateRangeError}</p>}
      <div className="date-range-actions"><button type="button" className="outline-button" onClick={onClose}>{t.cancel}</button><button type="submit" className="primary-button" disabled={!valid}>{t.applyDates}</button></div>
    </form>
  </dialog>;
}
