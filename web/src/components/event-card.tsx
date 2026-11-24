'use client';

import { useState, type CSSProperties, type PointerEventHandler } from 'react';
import { Asterisk, Music2, Clapperboard, Drama, Palette, BookOpen, MessagesSquare, Hammer, Sparkles, CalendarDays, MapPin, ExternalLink, Heart, X } from 'lucide-react';
import { dictionary, eventDate } from '@/lib/i18n';
import type { CultureEvent, Language } from '@/lib/types';
import { PaperIllustration } from './paper-illustration';
import { cardPose, CARD_EXIT_MS } from '@/lib/card-motion';

export const categoryIcons = { all: Sparkles, music: Music2, cinema: Clapperboard, theatre: Drama, art: Palette, literature: BookOpen, talks: MessagesSquare, workshops: Hammer, other: Asterisk };
export const sourceNames = { 'donostia-kultura': 'Donostia Kultura', tabakalera: 'Tabakalera', kulturklik: 'Kulturklik' };

export function EventImage({ event, className = '', eager = false }: { event: CultureEvent; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const Icon = categoryIcons[event.category] || Asterisk;
  if (!event.image || failed) return <div className={`event-placeholder ${event.category} ${className}`}><Icon strokeWidth={0.8} /><span>la cultureta.</span></div>;
  return <img className={className} src={event.image} alt="" loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} draggable={false} />;
}

export type CardInteraction = {
  style?: CSSProperties;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onPointerMove?: PointerEventHandler<HTMLElement>;
  onPointerUp?: PointerEventHandler<HTMLElement>;
  onPointerCancel?: PointerEventHandler<HTMLElement>;
};

export function EventCard({ event, language, depth, drag, leaving, interaction, onDetails }: {
  event: CultureEvent; language: Language; depth: number; drag: number;
  leaving: 'left' | 'right' | null; interaction?: CardInteraction; onDetails: () => void;
}) {
  const t = dictionary(language);
  const active = depth === 0;
  const pose=cardPose(depth,drag,!!leaving);
  const transform = active ? `translateX(${drag}px) rotate(${drag / 24}deg)` : `translateY(${pose.offset}px) scale(${pose.scale})`;
  const transition=!active&&(leaving||drag===0)?`transform ${CARD_EXIT_MS}ms cubic-bezier(.2,.7,.3,1)`:'none';
  return <article
    className={`discovery-card deck-event ${active && leaving ? 'leaving-' + leaving : ''}`}
    data-depth={depth} data-event-id={event.id} aria-hidden={!active} inert={!active}
    {...(active ? interaction : {})}
    style={{ zIndex: 5 - depth, transform, transition, '--drag-x': `${drag}px`, '--drag-angle': `${drag / 24}deg` } as CSSProperties}
  >
    <EventImage event={event} eager className="discovery-image" />
    <div className="card-gradient" />
    <div className="card-topline"><span className="category-tag">{t.categories[event.category]}</span><span className="card-price">{event.isFree ? t.free : event.price || t.priceUnknown}</span></div>
    {active && Math.abs(drag) > 45 && <span className={`swipe-stamp ${drag > 0 ? 'yes' : 'no'}`}>{drag > 0 ? t.save : t.skip}</span>}
    <div className="card-copy">
      <span className="card-source">{sourceNames[event.source]}</span>
      <h2>{event.title}</h2>
      <div className="card-meta"><span><CalendarDays size={16} />{eventDate(event.startDate, event.endDate, language)}{event.hours && ` · ${event.hours}`}</span><span><MapPin size={16} />{event.place}</span></div>
      <button className="card-details" onClick={onDetails} tabIndex={active ? 0 : -1}>{t.details}<ExternalLink size={16} /></button>
    </div>
  </article>;
}

export function WelcomeCard({ language, drag, leaving, interaction }: { language: Language; drag: number; leaving: 'left' | 'right' | null; interaction: CardInteraction }) {
  const t = dictionary(language);
  return <article className={`welcome-card paper-welcome discovery-card ${leaving ? 'leaving-' + leaving : ''}`} {...interaction}
    style={{ zIndex: 6, transform: `translateX(${drag}px) rotate(${drag / 24}deg)`, '--drag-x': `${drag}px`, '--drag-angle': `${drag / 24}deg` } as CSSProperties}>
    <div className="welcome-art"><PaperIllustration profile="all" scene eager className="welcome-illustration"/></div>
    <div className="welcome-content">
      <h1>{t.welcomeTitle}</h1>
      <p className="welcome-intro">{t.welcomeIntro}</p>
      <div className="welcome-instructions"><p><span><X size={18} /></span>{t.welcomeSkip}</p><p><span><Heart size={18} /></span>{t.welcomeSave}</p></div>
    </div>
  </article>;
}
