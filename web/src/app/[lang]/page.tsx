import type { Metadata } from 'next';
import { Discovery } from '@/components/discovery';
import { listEvents, querySchema } from '@/lib/events';
import type { Language } from '@/lib/types';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{lang:Language}>}):Promise<Metadata>{
  const {lang}=await params;
  return {title:lang==='eu'?'Donostiako kultur agenda':'Tu próximo gran plan en Donostia',alternates:{canonical:`/${lang}`,languages:{es:'/es',eu:'/eu'}},description:lang==='eu'?'Donostiako kontzertuak, zinema, antzerkia eta erakusketak. Aurkitu eta gorde zure plan gogokoenak.':undefined};
}
export default async function Page({params,searchParams}:{params:Promise<{lang:Language}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {lang}=await params;const search=await searchParams;
  const parsed=querySchema.safeParse({...search,lang,source:''});
  const query={...(parsed.success?parsed.data:querySchema.parse({lang})),q:''};
  return <Discovery language={lang} initial={listEvents(search.saved==='1'?{...query,ids:''}:query)} initialQuery={query} initialSaved={search.saved==='1'}/>;
}
