import { getEvent } from '@/lib/events';
import { EVENT_ID_PATTERN } from '@/lib/types';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params,lang=new URL(request.url).searchParams.get('lang')||'es';
  if(!EVENT_ID_PATTERN.test(id)||!['es','eu'].includes(lang))return Response.json({error:'Invalid event'},{status:400});
  const event=getEvent(id,lang as 'es'|'eu');
  return event?Response.json(event,{headers:{'Cache-Control':'public, max-age=30'}}):Response.json({error:'Event not found'},{status:404});
}
