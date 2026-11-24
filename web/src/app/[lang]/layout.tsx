import { notFound } from 'next/navigation';
import { languages } from '@/lib/types';
export default async function LanguageLayout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}) {
  const {lang}=await params;
  if(!languages.includes(lang as 'es'|'eu')) notFound();
  return children;
}
