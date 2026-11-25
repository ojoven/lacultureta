'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { Asterisk, SlidersHorizontal, MapPin, CalendarDays, Heart, X, RotateCcw, Check, ExternalLink, ChevronDown, ChevronLeft, ChevronRight, Share2, LoaderCircle, Sparkles, Bell, Map as MapIcon } from 'lucide-react';
import { Header } from './header';
import { DateRangeDialog } from './date-range-dialog';
import { EventWhen } from './event-when';
import { displayHours } from '@/lib/event-timing';
import { EventCard, EventImage, WelcomeCard, sourceNames, type CardInteraction } from './event-card';
import { dictionary, eventDate } from '@/lib/i18n';
import { categories, EVENT_ID_PATTERN, type CultureEvent, type EventPage, type Language } from '@/lib/types';
import { neighbourhoodLabel } from '@/lib/neighbourhoods';
import type { EventQuery } from '@/lib/events';
import { profileIds, profiles, profileLabel, type ProfileId } from '@/lib/profiles';
import { useNotifications } from './use-notifications';
import { ProfileDialog, NotificationDialog, NotificationInvitation, personalisationCopy } from './personalisation';
import { PaperIllustration } from './paper-illustration';
import { track, eventProperties } from '@/lib/analytics';
import { CARD_EXIT_MS } from '@/lib/card-motion';
import { swipeHistoryKey, readSwipeHistory, rememberSwipe, type SwipedPlan } from '@/lib/swipe-history';
import './discovery.css';
import './personalisation.css';
import './papel.css';

const EventMap=dynamic(()=>import('./event-map'),{ssr:false});

const storageKey = 'lacultureta.saved.v2';
const welcomeKey = 'lacultureta.welcome.v1';
const profileKey = 'lacultureta.profile.v1';
const defaults: Record<string, string | number> = { profile:'all', category: 'all', period: 'all', free: '0', page: 1, q: '', source: '', place: '', neighbourhood:'', from:'', to:'' };

export function Discovery({ language, initial, initialQuery, initialSaved, initialMap=false }: { language: Language; initial: EventPage; initialQuery: EventQuery; initialSaved: boolean; initialMap?:boolean }) {
  const t = dictionary(language);
  const [query, setQuery] = useState({ ...initialQuery, q: '', source: '' as EventQuery['source'] });
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedView, setSavedView] = useState(initialSaved);
  const [mapView,setMapView]=useState(initialMap&&!initialSaved);
  const [savedIndex, setSavedIndex] = useState(0);
  const [welcome, setWelcome] = useState(!initialSaved&&!initialMap);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState<SwipedPlan[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRangeOpen,setDateRangeOpen]=useState(false);
  const [profileOpen, setProfileOpen] = useState(false),[notificationOpen,setNotificationOpen]=useState(false);
  const [detail, setDetail] = useState<CultureEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState('');
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const gesture = useRef<{ x: number; y: number; dx: number; horizontal: boolean } | null>(null);
  const undo = useRef<{ id: string; wasSaved: boolean } | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const filters = useRef<HTMLDialogElement>(null);
  const firstRequest = useRef(true);
  const loadedQuery=useRef(JSON.stringify({...initialQuery,q:'',source:''})),lastImpression=useRef('');
  const actionLock = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedIds = savedView ? saved.join(',') : '';
  const notifications=useNotifications(language,query.profile,saved,ready),p=personalisationCopy(language);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(ids)) setSaved(ids.filter((id: unknown) => typeof id === 'string' && EVENT_ID_PATTERN.test(id)).slice(0, 100));
    } catch {}
    try {
      setDismissed(readSwipeHistory(localStorage.getItem(swipeHistoryKey)));
      if (localStorage.getItem(welcomeKey)) setWelcome(false);
      if(!new URLSearchParams(window.location.search).has('profile')) {
        const stored=localStorage.getItem(profileKey) as ProfileId|null;
        if(stored&&profileIds.includes(stored)&&stored!==initialQuery.profile){firstRequest.current=false;setQuery(previous=>({...previous,profile:stored,category:'all',period:stored==='family'&&!new URLSearchParams(window.location.search).has('period')?'weekend':previous.period}));}
      }
    } catch {}
    setReady(true);
    return () => clearTimeout(animationTimer.current);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {} } }, [saved, ready]);
  useEffect(()=>{if(ready)try{localStorage.setItem(profileKey,query.profile);}catch{}},[ready,query.profile]);
  useEffect(()=>{if(ready)try{localStorage.setItem(swipeHistoryKey,JSON.stringify(dismissed));}catch{}},[ready,dismissed]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if(event.key===swipeHistoryKey){setDismissed(readSwipeHistory(event.newValue));return;}
      if (event.key !== storageKey) return;
      try { const ids = JSON.parse(event.newValue || '[]'); if (Array.isArray(ids)) setSaved(ids.filter((id: unknown) => typeof id === 'string' && EVENT_ID_PATTERN.test(id)).slice(0, 100)); } catch {}
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value && value !== defaults[key] && !['lang', 'ids', 'limit', 'page', 'q'].includes(key)) params.set(key, String(value));
    if (savedView) params.set('saved', '1');
    if(mapView)params.set('view','map');
    const nextUrl=`/${language}${params.size ? '?' + params : ''}`;
    if(window.location.pathname+window.location.search!==nextUrl)window.history.replaceState(null, '', nextUrl);
    if(mapView){firstRequest.current=false;setLoading(false);return;}
    if (firstRequest.current && !savedView) { firstRequest.current = false; return; }
    firstRequest.current = false;
    const controller = new AbortController();
    const api = new URLSearchParams({ ...Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])), lang: language });
    if (savedView) { api.set('ids', savedIds); api.set('limit', '100'); api.set('page', '1'); api.set('profile','all'); }
    setLoading(true); setError(false);
    fetch(`/api/events?${api}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Request failed');
      return response.json() as Promise<EventPage>;
    }).then(next => {
      loadedQuery.current=JSON.stringify(query);
      setData(previous => query.page > 1 && !savedView ? { ...next, events: [...previous.events, ...next.events.filter(e => !previous.events.some(p => p.id === e.id))] } : next);
      setLoading(false);
    }).catch(e => { if (e.name !== 'AbortError') { setLoading(false); setError(true); } });
    return () => controller.abort();
  }, [query, savedView, mapView, ready, language, reload, savedIds]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { setSavedIndex(0); undo.current = null; }, [query.profile, query.category, query.period, query.from, query.to, query.place, query.neighbourhood, query.source, query.free, savedView]);
  useEffect(() => { setSavedIndex(index => Math.min(index, Math.max(0, data.events.length - 1))); }, [data.events.length]);
  useEffect(() => { if (detail) modal.current?.showModal(); else modal.current?.close(); }, [detail]);
  useEffect(() => { if (filterOpen) filters.current?.showModal(); else filters.current?.close(); }, [filterOpen]);

  const dismissedIds=new Set(dismissed.map(item=>item.id));
  const visible = savedView ? data.events.slice(savedIndex) : ready?data.events.filter(e => !dismissedIds.has(e.id)&&!saved.includes(e.id)):[];
  const current = visible[0];
  const showingWelcome = welcome && !savedView&&!mapView;
  const showingInvitation=notifications.invite&&!showingWelcome&&!savedView&&!mapView;
  const specialCard=showingWelcome||showingInvitation;
  const blocked = mapView||!!leaving || !!detail || filterOpen || dateRangeOpen || profileOpen || notificationOpen || (loading && query.page === 1);
  useEffect(()=>{
    if(mapView||!ready||loading||leaving||loadedQuery.current!==JSON.stringify(query))return;
    const key=showingWelcome?'welcome':showingInvitation?'notification':current?`${savedView?'saved':'discover'}:${current.id}`:'empty';
    if(lastImpression.current===key)return;
    lastImpression.current=key;
    if(showingWelcome)track('welcome_viewed',{profile:query.profile});
    else if(current&&!showingInvitation)track('event_viewed',{...eventProperties(current),profile:query.profile,view:savedView?'saved':'discover'});
  },[mapView,ready,loading,leaving,query,current,showingWelcome,showingInvitation,savedView]);
  useEffect(() => {
    if (!ready || mapView || savedView || showingWelcome || loading || error || visible.length > 5 || query.page >= data.pages || data.page !== query.page) return;
    setQuery(q => ({ ...q, page: q.page + 1 }));
  }, [ready, mapView, savedView, showingWelcome, loading, error, visible.length, query.page, data.pages, data.page]);

  const update = (patch: Partial<EventQuery>,report=true) => {
    if(report)for(const [key,value] of Object.entries(patch))if(['category','period','source','place','free','neighbourhood'].includes(key)&&value!==query[key as keyof EventQuery])track('filter_changed',{filter:key,value:key==='place'?(value?'selected':'all'):String(value),profile:query.profile});
    clearTimeout(animationTimer.current); actionLock.current = false; gesture.current = null;
    const nextPatch=patch.period&&patch.period!=='custom'?{...patch,from:'',to:''}:patch;
    setDrag(0); setLeaving(null); setQuery(q => ({ ...q, ...nextPatch, page: 1, q: '' }));
  };
  const reset = () => {track('filter_changed',{filter:'reset',value:'all'});update({ profile:'all',category: 'all', period: 'all', source: '', place: '', free: '0', neighbourhood:'', ids: undefined },false);};
  const chooseProfile=(profile:ProfileId)=>{track('profile_selected',{profile,previous_profile:query.profile});update({profile,category:'all',period:profile==='family'?'weekend':'all',place:'',source:'',free:'0'},false);setSavedView(false);setProfileOpen(false);};
  const finishWelcome = useCallback((method='button') => { if(welcome)track('welcome_started',{method});setWelcome(false); try { localStorage.setItem(welcomeKey, '1'); } catch {} }, [welcome]);
  const toggleSave = (id: string) => {
    const event=detail?.id===id?detail:data.events.find(item=>item.id===id);
    track(saved.includes(id)?'event_removed':'event_saved',{...(event?eventProperties(event):{event_id:id}),method:detail?'details':'saved_list',profile:query.profile});
    setSaved(ids => ids.includes(id) ? ids.filter(i => i !== id) : [id, ...ids].slice(0, 100));
  };
  const openDetails=(event:CultureEvent)=>{track('event_details_opened',{...eventProperties(event),profile:query.profile,view:savedView?'saved':'discover'});setDetail(event);};
  const openProfiles=(method:string)=>{track('profile_menu_opened',{method,profile:query.profile});setProfileOpen(true);};
  const openNotifications=(method:string)=>{track('notifications_opened',{method,profile:query.profile});setNotificationOpen(true);};
  const rate = useCallback((like: boolean,method:'button'|'swipe'|'keyboard'='button') => {
    if (actionLock.current || blocked || (!current && !specialCard)) return;
    if(showingInvitation){if(like){track('notifications_opened',{method:'invitation'});setNotificationOpen(true);}else notifications.dismiss();return;}
    if (savedView) { setSavedIndex(index => Math.max(0, Math.min(data.events.length - 1, index + (like ? 1 : -1)))); setDrag(0); return; }
    actionLock.current = true;
    if (!showingWelcome) undo.current = { id: current.id, wasSaved: saved.includes(current.id) };
    setLeaving(like ? 'right' : 'left');
    animationTimer.current = setTimeout(() => {
      if (showingWelcome) finishWelcome(method);
      else {
        track(like?'event_saved':'event_skipped',{...eventProperties(current),method,profile:query.profile,status:like&&saved.includes(current.id)?'already_saved':'new'});
        if (like) { setSaved(ids => ids.includes(current.id) ? ids : [current.id, ...ids].slice(0, 100)); setToast(t.savedToast); }
        setDismissed(history => rememberSwipe(history,current));
        notifications.recordCard();
      }
      setDrag(0); setLeaving(null); actionLock.current = false;
    }, CARD_EXIT_MS);
  }, [blocked, current, showingWelcome, showingInvitation, specialCard, savedView, data.events.length, saved, finishWelcome, t.savedToast, notifications.recordCard, notifications.dismiss,query.profile]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input,select,textarea,button,a,dialog,[contenteditable=true]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); rate(event.key === 'ArrowRight','keyboard'); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [rate]);
  const interaction: CardInteraction = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (blocked || event.button !== 0 || (event.target instanceof Element && event.target.closest('button,a'))) return;
      gesture.current = { x: event.clientX, y: event.clientY, dx: 0, horizontal: false }; event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: event => {
      if (!gesture.current || leaving) return;
      const dx = event.clientX - gesture.current.x, dy = event.clientY - gesture.current.y;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) gesture.current.horizontal = true;
      if (gesture.current.horizontal) { gesture.current.dx = dx; setDrag(dx); }
    },
    onPointerUp: () => {
      if (!gesture.current) return;
      const dx = gesture.current.dx; gesture.current = null;
      if (Math.abs(dx) > 75) rate(dx > 0,'swipe'); else setDrag(0);
    },
    onPointerCancel: () => { gesture.current = null; setDrag(0); },
  };
  const restore = () => { if (!undo.current || blocked) return; const { id, wasSaved } = undo.current;track('event_undo',{event_id:id}); setDismissed(history => history.filter(item => item.id !== id)); if (!wasSaved) setSaved(ids => ids.filter(i => i !== id)); undo.current = null; };
  const navigate = (savedPage: boolean,view=savedPage?'saved':'discover') => {
    track('navigation_changed',{view,profile:query.profile});
    setMapView(false);
    update({ category: 'all', period: savedPage?'all':query.profile==='family'?'weekend':'all', place: '', source: '', free: '0',neighbourhood:savedPage?'':query.neighbourhood },false);
    if (savedPage && !savedView) setData(previous => ({ ...previous, events: previous.events.filter(event => saved.includes(event.id)), total: saved.length }));
    setSavedView(savedPage); setDetail(null); if (!savedPage&&view!=='about') finishWelcome('navigation');
  };
  const showCards=()=>{track('navigation_changed',{view:'discover',profile:query.profile});update({},false);setSavedView(false);setMapView(false);finishWelcome('navigation');};
  const showMap=()=>{track('navigation_changed',{view:'map',profile:query.profile});update({},false);setSavedView(false);setMapView(true);setDetail(null);finishWelcome('map');};
  const showAbout = () => { navigate(false,'about'); setWelcome(true); };
  const share = async (event: CultureEvent) => {
    const url = `${window.location.origin}/${language}/eventos/${event.id}`;
    try { if (navigator.share) {await navigator.share({ title: event.title, url });track('event_shared',{...eventProperties(event),method:'native'});} else { await navigator.clipboard.writeText(url); setToast(t.copied);track('event_shared',{...eventProperties(event),method:'clipboard'}); } } catch {}
  };
  const filterCount = [query.place,query.neighbourhood, query.free === '1'].filter(Boolean).length;
  const languageParams = new URLSearchParams();
  for (const key of ['profile','category', 'period', 'from', 'to', 'free','neighbourhood'] as const) if (query[key] && query[key] !== defaults[key]) languageParams.set(key, query[key]);
  if (savedView) languageParams.set('saved', '1');
  if(mapView)languageParams.set('view','map');
  const price = (event: CultureEvent) => event.isFree ? t.free : event.price || t.priceUnknown;
  const deckEvents = visible.slice(0, specialCard ? 2 : 3);
  const availableCategories=categories.filter(category=>category==='all'||!profiles[query.profile].categories.length||profiles[query.profile].categories.includes(category));

  return <div className={`discovery-app ${mapView?'view-map':''}`}>
    <Header language={language} saved={savedView} savedCount={saved.length} onNavigate={saved=>{if(!saved&&mapView)showCards();else navigate(saved);}} languageSuffix={languageParams.size ? '?' + languageParams : ''} />
    <section className="app-filterbar" aria-label={t.filters}>
      <div className="date-select">{query.period==='custom'?<button className="range-edit" aria-label={t.editDates} title={t.editDates} onClick={()=>setDateRangeOpen(true)}><CalendarDays size={16}/></button>:<CalendarDays size={16}/>}<select aria-label={t.date} value={query.period} onChange={event => {if(event.target.value==='custom')setDateRangeOpen(true);else update({ period: event.target.value as EventQuery['period'] });}}><option value="all">{t.date}</option><option value="today">{t.today}</option><option value="tomorrow">{t.tomorrow}</option><option value="weekend">{t.weekend}</option><option value="week">{t.week}</option><option value="custom">{query.period==='custom'?eventDate(query.from,query.to,language):t.customDates}</option></select><ChevronDown size={14} /></div>
      <div className="date-select category-select"><Sparkles size={16}/><select aria-label={t.category} value={query.category} onChange={event=>update({category:event.target.value as EventQuery['category']})}>{availableCategories.map(category=><option key={category} value={category}>{t.categories[category]}</option>)}</select><ChevronDown size={14}/></div>
      <button className={`filter-button ${filterCount ? 'has-filters' : ''}`} aria-label={t.filters} onClick={() => {track('filters_opened');setFilterOpen(true);}}><SlidersHorizontal size={19} />{filterCount > 0 && <span>{filterCount}</span>}</button>
    </section>

    <main id="main" className="app-main" aria-busy={loading}>
      <div className="app-status"><span><Asterisk size={15} />{mapView?t.map:<><strong>{savedView&&current?`${savedIndex+1} / ${data.events.length}`:data.total}</strong> {savedView ? t.savedCount : t.plans}</>}{loading && <LoaderCircle size={14} className="spinning" />}</span><button className="profile-status" onClick={()=>openProfiles('status')} aria-label={p.profiles}><PaperIllustration profile={query.profile} eager/><span className="profile-status-label">{profileLabel(query.profile,language)}</span><ChevronDown size={12}/></button></div>
      {mapView?<EventMap query={query} language={language} saved={saved} onDetails={setDetail} onCards={showCards} onFacets={page=>setData(previous=>({...previous,places:page.places,neighbourhoods:page.neighbourhoods}))}/>:<section className="app-deck" aria-label={savedView ? t.saved : t.discover}>
        {error ? <div className="empty-state"><h2>{t.error}</h2><button className="primary-button" onClick={() => setReload(n => n + 1)}>{t.retry}</button></div> : loading && !current && !specialCard ? <div className="empty-state" role="status" aria-label={language === 'eu' ? 'Planak kargatzen' : 'Cargando planes'}><LoaderCircle className="spinning" size={30} /></div> : current || specialCard ? <>
          <div className="card-stack">
            {deckEvents.map((event, index) => <EventCard key={event.id} event={event} language={language} depth={index + (specialCard ? 1 : 0)} drag={drag} leaving={leaving} interaction={interaction} onDetails={() => {if(!blocked&&!actionLock.current)openDetails(event);}} />).reverse()}
            {showingWelcome && <WelcomeCard language={language} drag={drag} leaving={leaving} interaction={interaction} />}
            {showingInvitation&&<NotificationInvitation controls={notifications} language={language} onSettings={()=>openNotifications('invitation')}/>}
          </div>
          <div className={`app-actions ${showingWelcome ? 'welcome-actions' : ''}`}>
            {showingWelcome ? <button className="primary-button welcome-start" disabled={blocked} onClick={()=>rate(true)}><Sparkles size={19} />{t.welcomeStart}</button> : showingInvitation?<><button className="skip-button" onClick={()=>notifications.dismiss()}>{p.later}</button><button className="save-button" onClick={()=>openNotifications('menu')}><Bell size={18}/><span>{p.notifications}</span></button></>:savedView ? <>
              <button className="round-action" disabled={savedIndex === 0 || blocked} aria-label={t.previous} onClick={() => setSavedIndex(i => i - 1)}><ChevronLeft size={23} /></button>
              <button className="save-button remove-saved" disabled={blocked} onClick={() => current && toggleSave(current.id)} aria-label={t.remove}><Heart size={23} fill="currentColor" /><span>{t.remove}</span></button>
              <button className="round-action" disabled={savedIndex >= data.events.length - 1 || blocked} aria-label={t.nextPlan} onClick={() => setSavedIndex(i => i + 1)}><ChevronRight size={23} /></button>
            </> : <>
              <button className="undo-button" onClick={restore} disabled={!undo.current || blocked} aria-label={t.undo}><RotateCcw size={20} /></button>
              <button className="skip-button" disabled={blocked} onClick={() => rate(false)}><X size={24} /><span>{t.skip}</span></button>
              <button className="save-button" disabled={blocked} onClick={() => rate(true)}><Heart size={22} /><span>{t.save}</span></button>
            </>}
          </div>
        </> : <div className="empty-state"><Sparkles size={36} /><h2>{savedView ? t.emptySaved : data.total ? t.caughtUp : t.noEvents}</h2><p>{savedView ? t.emptySavedText : data.total ? t.caughtUpText : t.noEventsText}</p><button className="primary-button" disabled={loading} onClick={() => { if (savedView) navigate(false); else if (query.page < data.pages) setQuery(q => ({ ...q, page: q.page + 1 })); else reset(); }}>{query.page < data.pages && !savedView ? t.loadMore : t.restart}</button></div>}
      </section>}
    </main>

    <nav className="bottom-nav" aria-label={language === 'eu' ? 'Nabigazio nagusia' : 'Navegación principal'}>
      <button className={!mapView&&!savedView && !showingWelcome ? 'active' : ''} aria-current={!mapView&&!savedView && !showingWelcome ? 'page' : undefined} onClick={() => mapView?showCards():navigate(false)}><Sparkles size={22} /><span>{t.discover}</span></button>
      <button className={mapView?'active':''} aria-current={mapView?'page':undefined} onClick={showMap}><MapIcon size={22}/><span>{t.map}</span></button>
      <button className={savedView ? 'active' : ''} aria-current={savedView ? 'page' : undefined} onClick={() => navigate(true)}><span className="nav-icon"><Heart size={22} />{saved.length > 0 && <span className="nav-badge">{saved.length}</span>}</span><span>{t.saved}</span></button>
      <button className={notificationOpen?'active':''} aria-expanded={notificationOpen} onClick={()=>openNotifications('menu')}><span className="nav-icon"><Bell size={22}/>{notifications.active&&<span className="notification-active-dot"/>}</span><span>{p.notifications}</span></button>
    </nav>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    <DateRangeDialog open={dateRangeOpen} from={query.from} to={query.to} language={language} onClose={()=>setDateRangeOpen(false)} onApply={(from,to)=>{update({period:'custom',from,to});track('filter_changed',{filter:'date_range',value:`${from}/${to}`,profile:query.profile});setDateRangeOpen(false);}}/>
    <ProfileDialog open={profileOpen} onClose={()=>setProfileOpen(false)} onChoose={chooseProfile} onAbout={showAbout} current={query.profile} language={language}/>
    <NotificationDialog open={notificationOpen} onClose={()=>setNotificationOpen(false)} controls={notifications} language={language}/>

    <dialog ref={filters} className="filter-dialog" aria-labelledby="filters-title" onClose={() => setFilterOpen(false)} onClick={e => { if (e.target === e.currentTarget) setFilterOpen(false); }}>
      <div className="dialog-heading"><h2 id="filters-title">{t.filters}</h2><button autoFocus className="icon-button" aria-label={t.close} onClick={() => setFilterOpen(false)}><X /></button></div>
      <div className="filter-fields">
        <label>{t.neighbourhood}<span className="select-wrapper"><select aria-label={t.neighbourhood} value={query.neighbourhood} onChange={e=>update({neighbourhood:e.target.value,place:''})}><option value="">{t.allNeighbourhoods}</option>{data.neighbourhoods.slice().sort((a,b)=>neighbourhoodLabel(a,language).localeCompare(neighbourhoodLabel(b,language),language)).map(name=><option key={name} value={name}>{neighbourhoodLabel(name,language)}</option>)}</select><ChevronDown size={17}/></span></label>
        <label>{t.place}<span className="select-wrapper"><select aria-label={t.place} value={query.place} onChange={e => update({ place: e.target.value })}><option value="">{t.allPlaces}</option>{data.places.map(place => <option key={place}>{place}</option>)}</select><ChevronDown size={17} /></span></label>
        <label className="checkbox-label"><input type="checkbox" checked={query.free === '1'} onChange={e => update({ free: e.target.checked ? '1' : '0' })} />{t.onlyFree}</label>
        <button className="primary-button" onClick={() => setFilterOpen(false)}>{t.apply}</button><button className="text-button" onClick={reset}>{t.reset}</button>
      </div>
    </dialog>
    <dialog ref={modal} className="event-dialog" aria-labelledby="event-title" onClose={() => setDetail(null)} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
      {detail && <><div className="dialog-image"><EventImage event={detail} eager /><button autoFocus className="dialog-close" aria-label={t.close} onClick={() => setDetail(null)}><X /></button><span className="category-tag">{t.categories[detail.category]}</span></div>
        <div className="detail-content"><p className="eyebrow">{sourceNames[detail.source]}</p><h2 id="event-title">{detail.title}</h2>
          <div className="detail-meta"><p><CalendarDays size={19} /><span><EventWhen start={detail.startDate} end={detail.endDate} language={language}/><small>{displayHours(detail.hours) || t.hoursUnknown}</small></span></p><p><MapPin size={19} /><span>{detail.place}<small>Donostia / San Sebastián</small></span></p></div>
          <p className="detail-price">{price(detail)}{detail.eventLanguage && <span>{t.eventLanguage}: {detail.eventLanguage}</span>}</p><p className="event-description">{detail.description}</p>
          <div className="detail-actions"><button className={`primary-button ${saved.includes(detail.id) ? 'saved-button' : ''}`} onClick={() => toggleSave(detail.id)}><Heart size={18} fill={saved.includes(detail.id) ? 'currentColor' : 'none'} />{saved.includes(detail.id) ? t.remove : t.save}</button>{(detail.ticketUrl || detail.url) && <a className="outline-button" href={detail.ticketUrl || detail.url} target="_blank" rel="noreferrer" data-analytics-event={detail.ticketUrl?'ticket_link_clicked':'official_link_clicked'} data-event-id={detail.id} data-category={detail.category} data-organizer={detail.source}>{detail.ticketUrl ? t.tickets : t.official}<ExternalLink size={16} /></a>}</div>
          <div className="detail-secondary"><a href={`/api/events/${detail.id}/calendar?lang=${language}`} data-analytics-event="calendar_download_clicked" data-event-id={detail.id} data-category={detail.category} data-organizer={detail.source}><CalendarDays size={16} />{t.calendar}</a><button onClick={() => share(detail)}><Share2 size={16} />{t.share}</button><a href={`/${language}/eventos/${detail.id}`}>{t.more}</a></div>
        </div></>}
    </dialog>
  </div>;
}
