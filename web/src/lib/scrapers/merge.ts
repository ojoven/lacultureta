import type { ImportedEvent, Language } from '../types';
import { normaliseUrl, type DirectEvent } from './direct';

export interface Origin { source: string; originKey: string; eventId: string; url: string; cancelled: boolean }
export interface ExistingOrigin { source: string; origin_key: string; event_id: string }
const titleKey = (title: string) => title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function coreTitle(event:ImportedEvent) {
  const title=event.translations.es.title;
  const quoted=title.match(/["“](.+?)["”]/)?.[1];
  return titleKey(quoted||(event.category==='cinema'?title.replace(/,[^,]+$/,''):title));
}
function match(event: ImportedEvent, candidates: ImportedEvent[], used = new Set<string>()): ImportedEvent | undefined {
  const primaryUrl=normaliseUrl(event.translations.es.url), title = titleKey(event.translations.es.title);
  const time = event.translations.es.hours.match(/\b\d{1,2}:\d{2}\b/)?.[0];
  const scores = candidates.filter(candidate=>!used.has(candidate.id)).map(candidate=>{
    if (candidate.startDate!==event.startDate || candidate.endDate!==event.endDate) return {candidate,score:0};
    const candidateTitle=titleKey(candidate.translations.es.title);
    const sameUrl=!!primaryUrl&&normaliseUrl(candidate.translations.es.url)===primaryUrl;
    const directCore=coreTitle(event),candidateCore=coreTitle(candidate);
    const sameTitle=title===candidateTitle||(Math.min(title.length,candidateTitle.length)>=5&&(title.includes(candidateTitle)||candidateTitle.includes(title)))||
      (event.category==='cinema'&&Math.min(directCore.length,candidateCore.length)>=8&&(directCore.includes(candidateCore)||candidateCore.includes(directCore)));
    if(!sameUrl&&!sameTitle)return {candidate,score:0};
    const candidateTime=candidate.translations.es.hours.match(/\b\d{1,2}:\d{2}\b/)?.[0];
    const sameSource=candidate.source===event.source;
    if(!sameSource&&!sameUrl&&!(event.source==='tabakalera'&&candidate.translations.es.place.toLowerCase().includes('tabakalera')&&time&&time===candidateTime&&sameTitle))return {candidate,score:0};
    if(time&&candidateTime&&time!==candidateTime&&!sameUrl)return {candidate,score:0};
    const session=(event as Partial<DirectEvent>).originKey?.split('-')[1];
    const sessionMatch=!!session&&Object.values(candidate.translations).some(translation=>translation.url.endsWith('#c'+session));
    return {candidate,score:(sameUrl?4:0)+(sameTitle?2:0)+(time&&time===candidateTime?1:0)+(sameSource?1:0)+(sessionMatch?4:0)};
  }).filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score);
  return scores.length&&(!scores[1]||scores[0].score>scores[1].score)?scores[0].candidate:undefined;
}
export function mergeImports(fallback: ImportedEvent[], direct: DirectEvent[], stored: ImportedEvent[] = [], existingOrigins: ExistingOrigin[] = []) {
  const events = new Map<string, ImportedEvent>();
  const origins: Origin[] = [];
  const originMap = new Map(existingOrigins.map(origin=>[origin.source+'|'+origin.origin_key,origin.event_id]));
  const storedMap = new Map(stored.map(event=>[event.id,event]));
  const directIds = new Set(existingOrigins.filter(origin=>origin.source!=='kulturklik').map(origin=>origin.event_id));
  const usedDirectBySource = new Map<string, Set<string>>(), usedStored = new Set<string>();
  for (const item of fallback) {
    const previous = storedMap.get(item.id)||match(item,stored,usedStored);
    const event=previous?(directIds.has(previous.id)?previous:{...item,id:previous.id,externalId:previous.externalId}):item;
    if(previous)usedStored.add(previous.id);
    events.set(event.id,event);
    origins.push({source:'kulturklik',originKey:item.externalId,eventId:event.id,url:item.translations.es.url,cancelled:false});
  }
  let matched=0;
  for(const item of direct) {
    let used=usedDirectBySource.get(item.source);
    if(!used){used=new Set<string>();usedDirectBySource.set(item.source,used);}
    const previousId=originMap.get(item.source+'|'+item.originKey);
    const pinned=previousId?(events.get(previousId)||storedMap.get(previousId)):undefined;
    const previous=pinned||match(item,[...events.values()],used)||match(item,stored,used);
    const id=previous?.id||item.id;
    if(previous)matched++;
    used.add(id);
    const translations={} as ImportedEvent['translations'];
    for(const language of ['es','eu'] as Language[]) {
      const fresh=item.translations[language],old=previous?.translations[language];
      translations[language]={...fresh};
      for(const key of ['description','place','price','hours','ticketUrl'] as const)if(!fresh[key]&&old?.[key])translations[language][key]=old[key];
      if(item.descriptionIsSummary&&old?.description)translations[language].description=old.description;
      if(!item.translatedLanguages.includes(language)&&old)translations[language]={...old};
    }
    const event: ImportedEvent={id,externalId:previous?.externalId||item.externalId,source:item.source,
      category:item.category==='other'&&previous?previous.category:item.category,startDate:item.startDate,endDate:item.endDate,
      image:item.image||previous?.image||'',eventLanguage:item.eventLanguage||previous?.eventLanguage||'',translations};
    events.set(id,event);
    origins.push({source:item.source,originKey:item.originKey,eventId:id,url:item.originUrl,cancelled:item.cancelled});
  }
  return {events:[...events.values()],origins,matched,newDirect:direct.length-matched};
}
