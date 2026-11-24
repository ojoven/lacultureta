import { createHash, randomUUID, timingSafeEqual, ECDH } from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
import { notificationPreferencesSchema, type NotificationPreferences } from './notification-preferences';
import { savedSnapshot } from './push-planner';

export function validPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash &&
      (host === 'fcm.googleapis.com' || host === 'web.push.apple.com' || host === 'updates.push.services.mozilla.com' || host.endsWith('.push.services.mozilla.com') || host.endsWith('.notify.windows.com'));
  } catch { return false; }
}
export const subscriptionSchema = z.object({
  endpoint: z.string().min(25).max(2048).refine(validPushEndpoint, 'Unsupported push service'),
  keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87,88}={0,2}$/).refine(value=>{try{return Buffer.from(value,'base64url').length===65&&!!ECDH.convertKey(Buffer.from(value,'base64url'),'prime256v1');}catch{return false;}},'Invalid encryption key'), auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/).refine(value=>Buffer.from(value,'base64url').length===16) }),
});
export const pushRequestSchema = z.object({ subscription: subscriptionSchema, preferences: notificationPreferencesSchema });
export interface PushSubscriber {
  id: string; endpoint: string; p256dh: string; auth: string; preferences: string;
  created_at: string; last_new_check: string;
}
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export function bearerToken(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-zA-Z0-9_-]{43})$/)?.[1];
  if (!token) throw new PushError(401, 'Missing device token');
  return token;
}
export class PushError extends Error { constructor(public status: number, message: string) { super(message); } }
export function saveSubscription(input: z.infer<typeof pushRequestSchema>, token: string, requester: string, now = new Date()) {
  const database = db(), hash = tokenHash(token), stamp = now.toISOString();
  return database.transaction(() => {
    const previous = database.prepare('SELECT id,token_hash FROM push_subscriptions WHERE endpoint=? OR token_hash=?').get(input.subscription.endpoint, hash) as {id:string;token_hash:string}|undefined;
    if (previous && !timingSafeEqual(Buffer.from(previous.token_hash), Buffer.from(hash))) throw new PushError(403, 'This subscription belongs to another device token');
    if (!previous) {
      const { count } = database.prepare('SELECT COUNT(*) AS count FROM push_subscriptions WHERE requester_hash=? AND created_at>?').get(requester, new Date(now.getTime()-86400000).toISOString()) as {count:number};
      if (count >= 20) throw new PushError(429, 'Too many new subscriptions; try again tomorrow');
    }
    const id = previous?.id || randomUUID();
    database.prepare(`INSERT INTO push_subscriptions VALUES (@id,@endpoint,@p256dh,@auth,@hash,@preferences,@requester,@stamp,@stamp,@stamp)
      ON CONFLICT(id) DO UPDATE SET endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,preferences=excluded.preferences,updated_at=excluded.updated_at`)
      .run({id,...input.subscription,...input.subscription.keys,hash,preferences:JSON.stringify(input.preferences),requester,stamp});
    savedSnapshot({id},input.preferences);
    return id;
  })();
}
export function updatePreferences(preferences: NotificationPreferences, token: string) {
  const database=db();
  database.transaction(()=>{
    const subscriber=database.prepare('SELECT id FROM push_subscriptions WHERE token_hash=?').get(tokenHash(token)) as {id:string}|undefined;
    if(!subscriber)throw new PushError(404,'Subscription not found');
    database.prepare('UPDATE push_subscriptions SET preferences=?,updated_at=? WHERE id=?').run(JSON.stringify(preferences),new Date().toISOString(),subscriber.id);
    savedSnapshot(subscriber,preferences);
  })();
}
export function deleteSubscription(token: string) { db().prepare('DELETE FROM push_subscriptions WHERE token_hash=?').run(tokenHash(token)); }
