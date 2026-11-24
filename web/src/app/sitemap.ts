import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { madridToday } from '@/lib/dates';
export const dynamic='force-dynamic';
export default function sitemap():MetadataRoute.Sitemap{
  const events=db().prepare('SELECT id,updated_at FROM events WHERE end_date>=? ORDER BY start_date LIMIT 10000').all(madridToday()) as {id:string;updated_at:string}[];
  return ['es','eu'].flatMap(language=>[{url:`https://lacultureta.com/${language}`,changeFrequency:'daily' as const,priority:1},...events.map(event=>({url:`https://lacultureta.com/${language}/eventos/${event.id}`,lastModified:new Date(event.updated_at),changeFrequency:'daily' as const,priority:.6,alternates:{languages:{es:`https://lacultureta.com/es/eventos/${event.id}`,eu:`https://lacultureta.com/eu/eventos/${event.id}`}}}))]);
}
