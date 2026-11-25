import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, ExternalLink, MapPin, ChevronLeft } from 'lucide-react';
import { getEvent } from '@/lib/events';
import { dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/types';
import { Header } from '@/components/header';
import { EventWhen } from '@/components/event-when';
import { displayHours } from '@/lib/event-timing';
import { Footer } from '@/components/footer';
import { EventImage, sourceNames } from '@/components/event-card';
export const dynamic='force-dynamic';
type Props={params:Promise<{lang:Language;id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {lang,id}=await params;const event=getEvent(id,lang);
  if(!event)return {title:'Plan no encontrado',robots:{index:false}};
  return {title:event.title,description:event.description.slice(0,155),alternates:{canonical:`/${lang}/eventos/${id}`,languages:{es:`/es/eventos/${id}`,eu:`/eu/eventos/${id}`}},openGraph:{title:event.title,description:event.description.slice(0,155),images:event.image?[event.image]:[]}};
}
export default async function EventPage({params}:Props){
  const {lang,id}=await params;const event=getEvent(id,lang);if(!event)notFound();const t=dictionary(lang);
  const endDate=event.endDate<event.startDate?event.startDate:event.endDate;
  const notice=event.status==='cancelled'?(lang==='eu'?'Antolatzaileak ekitaldia ezeztatu du.':'El organizador ha cancelado este evento.'):event.status==='withdrawn'?(lang==='eu'?'Ekitaldia ez da jada antolatzailearen agendan agertzen. Egiaztatu xehetasunak webgune ofizialean.':'Este evento ya no aparece en la agenda del organizador. Comprueba los detalles en la web oficial.'):null;
  const structured={ '@context':'https://schema.org','@type':'Event',name:event.title,description:event.description,startDate:event.startDate,endDate,eventStatus:event.status==='cancelled'?'https://schema.org/EventCancelled':undefined,image:event.image?[event.image]:undefined,url:`https://lacultureta.com/${lang}/eventos/${id}`,location:{'@type':'Place',name:event.place,address:{'@type':'PostalAddress',addressLocality:'Donostia / San Sebastián',addressCountry:'ES'}},isAccessibleForFree:event.isFree};
  return <>
    <Header language={lang} languageSuffix={`/eventos/${id}`}/>
    <main id="main" className="event-page" data-analytics-page="event" data-event-id={id} data-category={event.category} data-organizer={event.source}>
      <a className="text-button" href={`/${lang}`}><ChevronLeft size={16}/>{t.back}</a>
      <EventImage event={event} eager className="event-page-image"/>
      <div className="detail-content">
        <span className="category-tag">{t.categories[event.category]}</span><h1>{event.title}</h1>
        {notice&&<p className="event-status-notice" role="status">{notice}</p>}
        <div className="detail-meta"><p><CalendarDays size={20}/><span><EventWhen start={event.startDate} end={endDate} language={lang}/><small>{displayHours(event.hours)||t.hoursUnknown}</small></span></p><p><MapPin size={20}/><span>{event.place}<small>Donostia / San Sebastián</small></span></p></div>
        <p className="detail-price">{event.isFree?t.free:event.price||t.priceUnknown}{event.eventLanguage&&<span>{t.eventLanguage}: {event.eventLanguage}</span>}</p>
        <p className="event-description">{event.description}</p>
        <div className="detail-actions">
          {event.url&&<a href={event.url} target="_blank" rel="noreferrer" className="primary-button" data-analytics-event="official_link_clicked" data-event-id={id} data-category={event.category} data-organizer={event.source}>{t.official}<ExternalLink size={16}/></a>}
          {!event.status&&event.ticketUrl&&<a href={event.ticketUrl} target="_blank" rel="noreferrer" className="outline-button" data-analytics-event="ticket_link_clicked" data-event-id={id} data-category={event.category} data-organizer={event.source}>{t.tickets}<ExternalLink size={16}/></a>}
          <a className="outline-button" href={`/api/events/${id}/calendar?lang=${lang}`} data-analytics-event="calendar_download_clicked" data-event-id={id} data-category={event.category} data-organizer={event.source}><CalendarDays size={17}/>{t.calendar}</a>
        </div>
        <p className="device-note">{t.data} <a href={event.url||'https://opendata.euskadi.eus/api-culture/'}>{sourceNames[event.source]}</a></p>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
    </main><Footer language={lang}/>
  </>;
}
