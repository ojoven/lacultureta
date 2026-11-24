import { z } from 'zod';
import { categories, EVENT_ID_PATTERN } from './types';
import { profileIds } from './profiles';

export const notificationPreferencesSchema = z.object({
  language: z.enum(['es', 'eu']).default('es'),
  profile: z.enum(profileIds).default('all'),
  categories: z.array(z.enum(categories)).max(8).transform(values => [...new Set(values.filter(value => value !== 'all'))]).default([]),
  newEvents: z.boolean().default(true),
  weekend: z.boolean().default(true),
  reminders: z.boolean().default(true),
  changes: z.boolean().default(true),
  savedIds: z.array(z.string().regex(EVENT_ID_PATTERN)).max(100).default([]),
});
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export const defaultNotificationPreferences = notificationPreferencesSchema.parse({});
export const invitationPolicy = { everySessions: 3, afterCards: 8, minimumDays: 7, sessionGapMinutes: 30 };
export interface InvitationState { sessions: number; cardsSeen: number; lastActivity: number; lastShownSession: number; lastShownAt: number; never: boolean }
export const emptyInvitationState: InvitationState = { sessions: 0, cardsSeen: 0, lastActivity: 0, lastShownSession: 0, lastShownAt: 0, never: false };
export function beginSession(state: InvitationState, now: number): InvitationState {
  const fresh=now - state.lastActivity >= invitationPolicy.sessionGapMinutes * 60_000 || !state.sessions;
  return { ...state, sessions: state.sessions + (fresh ? 1 : 0), cardsSeen:fresh?0:state.cardsSeen, lastActivity: now };
}
export function shouldInvite(state: InvitationState, cards: number, now: number, active: boolean, permission: NotificationPermission | 'unsupported') {
  return !active && permission !== 'denied' && permission !== 'unsupported' && !state.never &&
    state.sessions >= invitationPolicy.everySessions && state.sessions - state.lastShownSession >= invitationPolicy.everySessions &&
    cards >= invitationPolicy.afterCards && (!state.lastShownAt || now - state.lastShownAt >= invitationPolicy.minimumDays * 86400000);
}
