import { getEvent } from '@/lib/events';
import { calendar } from '@/lib/calendar';
import { EVENT_ID_PATTERN } from '@/lib/types';
export function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  return params.then(({id})=>{
    const language=new URL(request.url).searchParams.get('lang')==='eu'?'eu':'es';
    if(!EVENT_ID_PATTERN.test(id))return new Response('Not found',{status:404});
    const event=getEvent(id,language);
    if(!event)return new Response('Not found',{status:404});
    return new Response(calendar(event,language),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':`attachment; filename="cultureta-${id}.ics"`,'Cache-Control':'public, max-age=300'}});
  });
}
