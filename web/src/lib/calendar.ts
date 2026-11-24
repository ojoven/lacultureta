import type { CultureEvent } from './types';
import { addDays } from './dates';
export function calendar(event:CultureEvent, language:string) {
  const escape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const day=(value:string)=>value.replaceAll('-','');
  const time=event.hours.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  const endDate=event.endDate<event.startDate?event.startDate:event.endDate;
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//La Cultureta//Agenda//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  if(time)lines.push('BEGIN:VTIMEZONE','TZID:Europe/Madrid','BEGIN:DAYLIGHT','DTSTART:19700329T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','TZOFFSETFROM:+0100','TZOFFSETTO:+0200','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:19701025T030000','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','TZOFFSETFROM:+0200','TZOFFSETTO:+0100','END:STANDARD','END:VTIMEZONE');
  lines.push('BEGIN:VEVENT',`UID:${event.id}@lacultureta.com`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`);
  if(event.status==='cancelled')lines.push('STATUS:CANCELLED');
  if(time&&event.startDate===endDate)lines.push(`DTSTART;TZID=Europe/Madrid:${day(event.startDate)}T${time[1].padStart(2,'0')}${time[2]}00`);
  else lines.push(`DTSTART;VALUE=DATE:${day(event.startDate)}`,`DTEND;VALUE=DATE:${day(addDays(endDate,1))}`);
  lines.push(`SUMMARY:${escape(event.title)}`,`LOCATION:${escape(event.place+', Donostia / San Sebastián')}`,`DESCRIPTION:${escape(event.description+'\n'+event.hours+'\n'+event.price)}`,`URL:https://lacultureta.com/${language}/eventos/${event.id}`,'END:VEVENT','END:VCALENDAR');
  return lines.map(line=>{
    let result='',bytes=0;
    for(const char of line){const length=Buffer.byteLength(char);if(bytes+length>74){result+='\r\n ';bytes=1}result+=char;bytes+=length}
    return result;
  }).join('\r\n')+'\r\n';
}
