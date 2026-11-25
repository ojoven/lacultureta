import { addDays } from './dates';
import { eventDate } from './i18n';
import type { Language } from './types';
const weekdays={es:['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],eu:['igande','astelehen','astearte','asteazken','ostegun','ostiral','larunbat']};
const nextBasque=['igandean','astelehenean','asteartean','asteazkenean','ostegunean','ostiralean','larunbatean'];
export function relativeEventDate(start:string,end:string,language:Language,today:string):string {
  if(start<today&&end>=today)return language==='eu'?'Abian':'En curso';
  const days=Math.round((Date.parse(start+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);
  if(days===0)return language==='eu'?'Gaur':'Hoy';
  if(days===1)return language==='eu'?'Bihar':'Mañana';
  if(days<0)return '';
  const currentDay=new Date(today+'T12:00:00Z').getUTCDay(),weekStart=addDays(today,-((currentDay+6)%7));
  const weekday=new Date(start+'T12:00:00Z').getUTCDay();
  if(start<addDays(weekStart,7))return language==='eu'?`${weekdays.eu[weekday][0].toUpperCase()+weekdays.eu[weekday].slice(1)} honetan`:`Este ${weekdays.es[weekday]}`;
  if(start<addDays(weekStart,14))return language==='eu'?`Datorren ${nextBasque[weekday]}`:`El próximo ${weekdays.es[weekday]}`;
  return '';
}
export function displayHours(hours:string){return hours.replace(/\b(\d{1,2}):(\d{2})\b/g,'$1.$2');}
export function eventTiming(start:string,end:string,hours:string,language:Language,today?:string|null) {
  const relative=today?relativeEventDate(start,end,language,today):'';
  return `${relative?relative+' ':''}${eventDate(start,end,language)}${hours?' - '+displayHours(hours):''}`;
}
