import { Asterisk } from 'lucide-react';
import { dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/types';
export function Footer({language}:{language:Language}) {
  const t=dictionary(language);
  return <footer className="site-footer"><div><Asterisk size={19}/><span>{t.footer}</span></div><p>{t.data} <a href="https://opendata.euskadi.eus/api-culture/" target="_blank" rel="noreferrer">Kulturklik · Open Data Euskadi</a></p><span>© {new Date().getFullYear()} La Cultureta</span></footer>;
}
