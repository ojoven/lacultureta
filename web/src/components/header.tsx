import { Heart } from 'lucide-react';
import { dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/types';

export function Header({language, savedCount=0, saved=false, onNavigate, languageSuffix=''}:{language:Language;savedCount?:number;saved?:boolean;onNavigate?:(saved:boolean)=>void;languageSuffix?:string}) {
  const t=dictionary(language);
  return <header className="site-header"><div className="header-inner">
    <a href={`/${language}`} className="brand" aria-label="La Cultureta"><img className="brand-illustration" src="/branding/icon-v2-192.png" width={34} height={34} alt="" draggable={false}/><span>la cultureta<span className="brand-dot">.</span></span></a>
    <nav className="main-nav" aria-label={language==='eu'?'Nabigazio nagusia':'Navegación principal'}>
      <a href={`/${language}`} className={!saved?'active':''} onClick={onNavigate?e=>{e.preventDefault();onNavigate(false)}:undefined}>{t.discover}</a>
      <a href={`/${language}?saved=1`} className={saved?'active saved-nav':'saved-nav'} onClick={onNavigate?e=>{e.preventDefault();onNavigate(true)}:undefined}><Heart size={17}/>{t.saved}{savedCount>0&&<span className="count-badge">{savedCount}</span>}</a>
    </nav>
    <div className="language-switch" aria-label={language==='eu'?'Hizkuntza':'Idioma'}><a href={'/es'+languageSuffix} hrefLang="es" className={language==='es'?'selected':''} aria-current={language==='es'?'page':undefined} data-analytics-event="language_changed" data-analytics-value="es">ES</a><a href={'/eu'+languageSuffix} hrefLang="eu" className={language==='eu'?'selected':''} aria-current={language==='eu'?'page':undefined} data-analytics-event="language_changed" data-analytics-value="eu">EU</a></div>
  </div></header>;
}
