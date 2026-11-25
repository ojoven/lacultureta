'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, Heart, LoaderCircle, MapPin, Maximize2, RefreshCw } from 'lucide-react';
import type { CultureEvent, EventMapPage, Language, MapEvent, MapVenue } from '@/lib/types';
import type { EventQuery } from '@/lib/events';
import { dictionary } from '@/lib/i18n';
import { neighbourhoodLabel } from '@/lib/neighbourhoods';
import { EventWhen } from './event-when';
import { eventProperties, track } from '@/lib/analytics';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './event-map.css';

const copy={
  es:{map:'Mapa de planes',loading:'Cargando el mapa…',venues:'lugares',plans:'planes',hint:'Pulsa un lugar para ver sus planes.',back:'Todos los lugares',fit:'Ver todos los lugares',missing:'planes sin ubicación exacta. Puedes verlos en las tarjetas.',cards:'Ver tarjetas',empty:'No hay planes con ubicación exacta para estos filtros.',details:'Ver el plan',saved:'Guardado',loadError:'No se ha podido cargar el mapa.',tileError:'No se ha podido cargar el mapa de fondo. La lista de planes sigue disponible.',retry:'Reintentar',data:'Ubicaciones: Ayuntamiento de Donostia / San Sebastián · CC BY-SA 3.0',zoomIn:'Acercar',zoomOut:'Alejar',cluster:'Acerca el mapa para ver los lugares'},
  eu:{map:'Planen mapa',loading:'Mapa kargatzen…',venues:'leku',plans:'plan',hint:'Sakatu leku bat bertako planak ikusteko.',back:'Leku guztiak',fit:'Ikusi leku guztiak',missing:'plan kokapen zehatzik gabe. Txarteletan ikus ditzakezu.',cards:'Ikusi txartelak',empty:'Ez dago kokapen zehatzeko planik iragazki hauekin.',details:'Ikusi plana',saved:'Gordeta',loadError:'Ezin izan da mapa kargatu.',tileError:'Ezin izan da maparen atzeko planoa kargatu. Planen zerrenda ikus dezakezu.',retry:'Saiatu berriro',data:'Kokapenak: Donostiako Udala · CC BY-SA 3.0',zoomIn:'Hurbildu',zoomOut:'Urrundu',cluster:'Hurbildu mapa lekuak ikusteko'},
};
type PlanMarker=L.Marker&{planCount:number};
function icon(count:number,selected=false,cluster=false) {
  const node=document.createElement('span');node.textContent=String(count);
  return L.divIcon({className:`plan-pin ${selected?'selected':''} ${cluster?'plan-cluster':''}`,html:node,iconSize:cluster?[46,46]:[38,38],iconAnchor:cluster?[23,23]:[19,19]});
}
function MapCanvas({venues,selected,onSelect,tiles,language}:{venues:MapVenue[];selected:string|null;onSelect:(id:string)=>void;tiles:EventMapPage['tiles'];language:Language}) {
  const element=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),cluster=useRef<L.MarkerClusterGroup|null>(null);
  const markers=useRef(new Map<string,PlanMarker>()),select=useRef(onSelect),bounds=useRef<L.LatLngBounds|null>(null);
  const [tileError,setTileError]=useState(false),t=copy[language];
  select.current=onSelect;
  useEffect(()=>{
    if(!element.current)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance=L.map(element.current,{zoomControl:false,minZoom:10,maxZoom:tiles.maxZoom,scrollWheelZoom:true,zoomAnimation:!reduced,fadeAnimation:!reduced,markerZoomAnimation:!reduced}).setView([43.3167,-1.98],13);
    instance.attributionControl.setPrefix(false);
    L.control.zoom({position:'topleft',zoomInTitle:t.zoomIn,zoomOutTitle:t.zoomOut}).addTo(instance);
    const layer=L.tileLayer(tiles.url,{attribution:tiles.attribution,maxZoom:tiles.maxZoom,keepBuffer:1,updateWhenIdle:true}).addTo(instance);
    layer.on('tileerror',()=>setTileError(true));layer.on('tileload',()=>setTileError(false));
    const group=L.markerClusterGroup({maxClusterRadius:42,showCoverageOnHover:false,spiderfyOnMaxZoom:true,animate:!reduced,
      iconCreateFunction:item=>icon(item.getAllChildMarkers().reduce((n,marker)=>n+(marker as PlanMarker).planCount,0),false,true)}).addTo(instance);
    map.current=instance;cluster.current=group;
    const observer=new ResizeObserver(()=>instance.invalidateSize({pan:false}));observer.observe(element.current);
    return()=>{observer.disconnect();instance.remove();map.current=null;cluster.current=null;markers.current.clear();};
  },[tiles.url,tiles.attribution,tiles.maxZoom,t.zoomIn,t.zoomOut]);
  useEffect(()=>{
    const instance=map.current,group=cluster.current;if(!instance||!group)return;
    group.clearLayers();markers.current.clear();
    for(const venue of venues) {
      const marker=Object.assign(L.marker([venue.latitude,venue.longitude],{icon:icon(venue.events.length),title:`${venue.name} · ${venue.events.length} ${venue.events.length===1?'plan':t.plans}`,keyboard:true}),{planCount:venue.events.length});
      marker.on('click',()=>select.current(venue.id));group.addLayer(marker);markers.current.set(venue.id,marker);
    }
    bounds.current=venues.length?L.latLngBounds(venues.map(venue=>[venue.latitude,venue.longitude])):null;
    if(bounds.current)instance.fitBounds(bounds.current,{padding:[34,34],maxZoom:15,animate:false});
  },[venues,tiles.url,tiles.attribution,tiles.maxZoom,t.plans]);
  useEffect(()=>{
    for(const [id,marker] of markers.current)marker.setIcon(icon(marker.planCount,id===selected));
    const marker=selected?markers.current.get(selected):undefined;
    if(marker)cluster.current?.zoomToShowLayer(marker,()=>map.current?.panTo(marker.getLatLng()));
  },[selected,venues]);
  return <div className="event-map-canvas-wrap">
    <div className="event-map-canvas" ref={element} role="region" aria-label={t.map}/>
    <button className="map-fit" aria-label={t.fit} title={t.fit} onClick={()=>{if(bounds.current)map.current?.fitBounds(bounds.current,{padding:[34,34],maxZoom:15});}}><Maximize2 size={19}/></button>
    {tileError&&<p className="map-tile-error" role="status">{t.tileError}</p>}
  </div>;
}

export default function EventMap({query,language,saved,onDetails,onCards,onFacets}:{query:EventQuery;language:Language;saved:string[];onDetails:(event:CultureEvent)=>void;onCards:()=>void;onFacets:(page:Pick<EventMapPage,'places'|'neighbourhoods'>)=>void}) {
  const t=copy[language],d=dictionary(language);
  const [snapshot,setSnapshot]=useState<{key:string;page:EventMapPage}|null>(null),[error,setError]=useState(false),[loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<string|null>(null),[opening,setOpening]=useState<string|null>(null),[detailError,setDetailError]=useState(false),[reload,setReload]=useState(0);
  const panel=useRef<HTMLDivElement>(null),detailRequest=useRef<AbortController|null>(null),facets=useRef(onFacets);
  facets.current=onFacets;
  const params=useMemo(()=>new URLSearchParams({...Object.fromEntries(Object.entries(query).filter(([key,value])=>!['page','limit','ids'].includes(key)&&value!==undefined).map(([key,value])=>[key,String(value)])),lang:language}).toString(),[query,language]);
  const current=snapshot?.key===params?snapshot.page:null;
  useEffect(()=>{
    let active=true,request:AbortController|undefined,lastRequest=0;
    setSelected(null);setDetailError(false);
    const load=async()=>{
      if(!active)return;request?.abort();request=new AbortController();lastRequest=Date.now();setLoading(true);setError(false);
      try{
        const response=await fetch(`/api/events/map?${params}`,{signal:request.signal});if(!response.ok)throw new Error('Map request failed');
        const page=await response.json() as EventMapPage;if(!active)return;
        facets.current(page);
        setSnapshot(previous=>({key:params,page:{...page,venues:previous?.key===params&&JSON.stringify(previous.page.venues)===JSON.stringify(page.venues)?previous.page.venues:page.venues}}));
        setSelected(id=>page.venues.some(venue=>venue.id===id)?id:null);setLoading(false);
      }catch(error){if((error as Error).name!=='AbortError'&&active){setError(true);setLoading(false);}}
    };
    void load();
    const refresh=()=>{if(document.visibilityState==='visible'&&Date.now()-lastRequest>60000)void load();};
    const timer=setInterval(refresh,300000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;request?.abort();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[params,reload]);
  useEffect(()=>{track('map_view_opened',{profile:query.profile});},[]);
  useEffect(()=>{panel.current?.scrollTo({top:0});},[selected]);
  useEffect(()=>()=>detailRequest.current?.abort(),[]);
  const choose=useCallback((id:string)=>{setSelected(id);setDetailError(false);track('map_venue_selected',{venue_id:id});},[]);
  const open=async(event:MapEvent)=>{
    if(opening)return;
    detailRequest.current?.abort();const request=new AbortController();detailRequest.current=request;setOpening(event.id);setDetailError(false);
    try{const response=await fetch(`/api/events/${event.id}?lang=${language}`,{signal:request.signal});if(!response.ok)throw new Error('Event request failed');
      const detail=await response.json() as CultureEvent;if(request.signal.aborted)return;track('event_details_opened',{...eventProperties(detail),view:'map'});onDetails(detail);
    }catch(error){if((error as Error).name!=='AbortError')setDetailError(true);}finally{if(!request.signal.aborted)setOpening(null);}
  };
  const venue=current?.venues.find(venue=>venue.id===selected);
  return <section className="event-map-view" aria-label={t.map} aria-busy={loading}>
    <div className="event-map-layout">
      <div className="map-stage">
        {snapshot&&<MapCanvas venues={current?.venues||[]} tiles={snapshot.page.tiles} selected={selected} onSelect={choose} language={language}/>}
        {!current&&<div className="map-state" role="status">{error?<><MapPin size={27}/><p>{t.loadError}</p><button className="outline-button" onClick={()=>setReload(n=>n+1)}><RefreshCw size={16}/>{t.retry}</button></>:<><LoaderCircle className="spinning" size={29}/><p>{t.loading}</p></>}</div>}
        {current&&!current.mapped&&<div className="map-empty-message"><MapPin size={23}/><p>{t.empty}</p></div>}
      </div>
      <div className="map-panel" ref={panel}>
        <div className="map-panel-heading">{venue?<><button className="map-panel-back" onClick={()=>setSelected(null)}><ArrowLeft size={16}/>{t.back}</button><h2>{venue.name}</h2><p>{venue.address}{venue.neighbourhood&&` · ${neighbourhoodLabel(venue.neighbourhood,language)}`}</p></>:<><p className="map-eyebrow">DONOSTIA · {language==='eu'?'KULTURA':'CULTURA'}</p><h2>{t.map}</h2><p>{t.hint}</p></>}
          {current&&<span className="map-count">{venue?`${venue.events.length} ${venue.events.length===1?'plan':t.plans}`:`${current.mapped} ${t.plans} · ${current.venues.length} ${t.venues}`}{loading&&<LoaderCircle size={13} className="spinning"/>}</span>}
        </div>
        {error&&current&&<p className="map-detail-error" role="status">{t.loadError} <button onClick={()=>setReload(n=>n+1)}>{t.retry}</button></p>}
        {detailError&&<p className="map-detail-error" role="alert">{d.error}</p>}
        {venue?<div className="map-event-list">{venue.events.map(event=><button key={event.id} className="map-event-item" disabled={!!opening&&opening!==event.id} aria-busy={opening===event.id} onClick={()=>void open(event)} aria-label={`${t.details}: ${event.title}`}>
          <span className={`map-event-category ${event.category}`}>{d.categories[event.category]}</span><strong>{event.title}</strong>
          <span className="map-event-date"><CalendarDays size={13}/><EventWhen start={event.startDate} end={event.endDate} hours={event.hours} language={language}/></span>
          <span className="map-event-price">{event.isFree?d.free:event.price||d.priceUnknown}{saved.includes(event.id)&&<span><Heart size={12} fill="currentColor"/>{t.saved}</span>}{opening===event.id?<LoaderCircle size={16} className="spinning"/>:<ArrowUpRight size={17}/>}</span>
        </button>)}</div>:<div className="map-venue-list">{current?.venues.map(item=><button key={item.id} className="map-venue-item" onClick={()=>choose(item.id)}><span className="map-venue-pin"><MapPin size={18}/></span><span><strong>{item.name}</strong><small>{item.neighbourhood?neighbourhoodLabel(item.neighbourhood,language):item.address}</small></span><span className="map-venue-count">{item.events.length}</span><ChevronRight size={16}/></button>)}</div>}
        {current&&current.missingLocations>0&&<p className="map-missing"><MapPin size={15}/><span><strong>{current.missingLocations}</strong> {t.missing} <button onClick={onCards}>{t.cards}<ArrowUpRight size={13}/></button></span></p>}
      </div>
    </div>
    <a className="map-data-credit" href="https://www.donostia.eus/datosabiertos/catalogo/servicios-cultura" target="_blank" rel="noreferrer">{t.data}</a>
  </section>;
}
