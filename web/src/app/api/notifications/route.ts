import { bearerToken, deleteSubscription, pushRequestSchema, PushError, saveSubscription, tokenHash, updatePreferences } from '@/lib/push-store';
import { notificationPreferencesSchema } from '@/lib/notification-preferences';

export const dynamic = 'force-dynamic';
const response = (body: unknown, status = 200) => Response.json(body, {status,headers:{'Cache-Control':'no-store'}});
export function GET() { return response({publicKey:process.env.VAPID_PUBLIC_KEY || null,configured:!!process.env.VAPID_PRIVATE_KEY&&!!process.env.VAPID_PUBLIC_KEY}); }
async function mutate(request: Request) {
  try {
    const origin = process.env.APP_ORIGIN || new URL(request.url).origin;
    if (request.headers.get('origin') !== origin) throw new PushError(403, 'Same-origin request required');
    const token = bearerToken(request);
    if (request.method === 'DELETE') { deleteSubscription(token); return response({ok:true}); }
    if (Number(request.headers.get('content-length')) > 24_000) throw new PushError(413,'Request too large');
    const text = await request.text();
    if (Buffer.byteLength(text)>24_000) throw new PushError(413,'Request too large');
    let body:unknown;try{body=JSON.parse(text);}catch{throw new PushError(400,'Invalid JSON');}
    if (request.method === 'POST') {
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) throw new PushError(503, 'Notifications are not configured');
      const parsed = pushRequestSchema.safeParse(body);
      if (!parsed.success) throw new PushError(400,'Invalid subscription or preferences');
      const requester = tokenHash((request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'local') + process.env.VAPID_PRIVATE_KEY);
      saveSubscription(parsed.data,token,requester);
    } else {
      const parsed = notificationPreferencesSchema.safeParse(body);
      if (!parsed.success) throw new PushError(400,'Invalid preferences');
      updatePreferences(parsed.data,token);
    }
    return response({ok:true});
  } catch(error) {
    if (error instanceof PushError) return response({error:error.message},error.status);
    console.error('Notification preference update failed');return response({error:'Could not save notification settings'},500);
  }
}
export const POST = mutate, PATCH = mutate, DELETE = mutate;
