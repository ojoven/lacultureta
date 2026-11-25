import { listMapEvents, querySchema } from '@/lib/events';
export const dynamic='force-dynamic';
export function GET(request:Request) {
  const parsed=querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if(!parsed.success)return Response.json({error:'Invalid filters'},{status:400});
  return Response.json(listMapEvents(parsed.data),{headers:{'Cache-Control':'public, max-age=30, stale-while-revalidate=60'}});
}
