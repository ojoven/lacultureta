import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ImportedEvent } from './types';
import { syncVenueCatalogue, linkEventVenues, venueCatalogueVersion } from './venues';

let connection: Database.Database | undefined;
export function db() {
  if (connection) return connection;
  const path = process.env.DATABASE_PATH || resolve(process.cwd(), 'data/lacultureta.sqlite');
  mkdirSync(dirname(path), { recursive: true });
  connection = new Database(path);
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');
  connection.pragma('busy_timeout = 10000');
  connection.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, source TEXT NOT NULL, external_id TEXT NOT NULL,
      category TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
      image TEXT NOT NULL, event_language TEXT NOT NULL DEFAULT '', is_free INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
      UNIQUE(source, external_id)
    );
    CREATE INDEX IF NOT EXISTS events_dates ON events(end_date, start_date);
    CREATE INDEX IF NOT EXISTS events_category ON events(category, end_date);
    CREATE TABLE IF NOT EXISTS event_translations (
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      language TEXT NOT NULL CHECK(language IN ('es', 'eu')), title TEXT NOT NULL,
      description TEXT NOT NULL, place TEXT NOT NULL, price TEXT NOT NULL,
      hours TEXT NOT NULL, url TEXT NOT NULL, ticket_url TEXT NOT NULL,
      PRIMARY KEY(event_id, language)
    );
    CREATE INDEX IF NOT EXISTS translations_language ON event_translations(language, place);
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY, name_es TEXT NOT NULL, name_eu TEXT NOT NULL,
      address_es TEXT, address_eu TEXT, latitude REAL, longitude REAL, neighbourhood TEXT,
      source_url TEXT, source_license TEXT, status TEXT NOT NULL, updated_at TEXT NOT NULL,
      CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
    );
    CREATE INDEX IF NOT EXISTS venues_neighbourhood ON venues(neighbourhood);
    CREATE TABLE IF NOT EXISTS venue_aliases (alias TEXT PRIMARY KEY,venue_id TEXT NOT NULL REFERENCES venues(id));
    CREATE TABLE IF NOT EXISTS event_venues (
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      venue_id TEXT NOT NULL REFERENCES venues(id), PRIMARY KEY(event_id,venue_id)
    );
    CREATE INDEX IF NOT EXISTS event_venues_venue ON event_venues(venue_id,event_id);
    CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS scraper_runs (
      id INTEGER PRIMARY KEY, source TEXT NOT NULL, started_at TEXT NOT NULL,
      finished_at TEXT, status TEXT NOT NULL, event_count INTEGER NOT NULL DEFAULT 0, error TEXT
    );
    CREATE TABLE IF NOT EXISTS event_origins (
      source TEXT NOT NULL, origin_key TEXT NOT NULL,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      url TEXT NOT NULL, last_seen_at TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1, cancelled INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(source, origin_key)
    );
    CREATE INDEX IF NOT EXISTS origins_event ON event_origins(event_id, active);
    CREATE TABLE IF NOT EXISTS event_first_seen (
      event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE, first_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS first_seen_date ON event_first_seen(first_seen_at);
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY, endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE, preferences TEXT NOT NULL, requester_hash TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_new_check TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS push_deliveries (
      subscription_id TEXT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      delivery_key TEXT NOT NULL, kind TEXT NOT NULL, sent_at TEXT NOT NULL,
      PRIMARY KEY(subscription_id, delivery_key)
    );
    CREATE TABLE IF NOT EXISTS push_saved_state (
      subscription_id TEXT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, fingerprint TEXT NOT NULL,
      PRIMARY KEY(subscription_id, event_id)
    );
    CREATE TABLE IF NOT EXISTS push_provider_cooldowns (host TEXT PRIMARY KEY, until_at TEXT NOT NULL);
  `);
  const database=connection;
  database.transaction(()=>{
    syncVenueCatalogue(database);
    if(!database.prepare('SELECT 1 FROM schema_migrations WHERE name=?').get(venueCatalogueVersion)) {
      const rows=database.prepare(`SELECT e.id,e.source,es.place AS esPlace,eu.place AS euPlace FROM events e
        JOIN event_translations es ON es.event_id=e.id AND es.language='es'
        JOIN event_translations eu ON eu.event_id=e.id AND eu.language='eu'`).all() as {id:string;source:ImportedEvent['source'];esPlace:string;euPlace:string}[];
      linkEventVenues(database,rows.map(row=>({id:row.id,source:row.source,translations:{es:{place:row.esPlace},eu:{place:row.euPlace}}})));
      database.prepare('INSERT INTO schema_migrations(name) VALUES (?)').run(venueCatalogueVersion);
    }
  })();
  // Existing events form the baseline; subscribing never announces the entire old catalogue.
  connection.prepare('INSERT OR IGNORE INTO event_first_seen SELECT id,? FROM events').run(new Date().toISOString());
  return connection;
}
export function storeEvents(events: ImportedEvent[]) {
  const database = db();
  const eventStatement = database.prepare(`INSERT INTO events VALUES (@id,@source,@externalId,@category,@startDate,@endDate,@image,@eventLanguage,@isFree,@now,@now)
    ON CONFLICT(id) DO UPDATE SET source=excluded.source, category=excluded.category,
    start_date=excluded.start_date, end_date=excluded.end_date, image=excluded.image,
    event_language=excluded.event_language, is_free=excluded.is_free,
    updated_at=excluded.updated_at, last_seen_at=excluded.last_seen_at`);
  const translationStatement = database.prepare(`INSERT INTO event_translations VALUES (@id,@language,@title,@description,@place,@price,@hours,@url,@ticketUrl)
    ON CONFLICT(event_id,language) DO UPDATE SET title=excluded.title, description=excluded.description,
    place=excluded.place, price=excluded.price, hours=excluded.hours, url=excluded.url, ticket_url=excluded.ticket_url`);
  database.transaction(() => {
    const now = new Date().toISOString();
    const firstSeen = database.prepare('INSERT OR IGNORE INTO event_first_seen VALUES (?,?)');
    for (const event of events) {
      const free = /gratis|gratuit|doan|sarrera librea|entrada libre|^0\s*€?$/i.test(event.translations.es.price);
      eventStatement.run({ ...event, isFree: +free, now });
      firstSeen.run(event.id, now);
      for (const language of ['es', 'eu'] as const) translationStatement.run({ id: event.id, language, ...event.translations[language] });
    }
    linkEventVenues(database,events);
  })();
}

/** Internal import snapshot, including both translations, for stable identity matching. */
export function storedUpcomingEvents(today: string): ImportedEvent[] {
  const rows = db().prepare(`SELECT e.id,e.source,e.external_id AS externalId,e.category,e.start_date AS startDate,
    e.end_date AS endDate,e.image,e.event_language AS eventLanguage,
    t.language,t.title,t.description,t.place,t.price,t.hours,t.url,t.ticket_url AS ticketUrl
    FROM events e JOIN event_translations t ON t.event_id=e.id WHERE e.end_date>=?
      OR EXISTS(SELECT 1 FROM event_origins o WHERE o.event_id=e.id AND o.source<>'kulturklik')`).all(today) as (Omit<ImportedEvent, 'translations'> & {language:'es'|'eu'} & ImportedEvent['translations']['es'])[];
  const events = new Map<string, ImportedEvent>();
  for (const row of rows) {
    let event = events.get(row.id);
    if (!event) {
      event = { id:row.id,source:row.source,externalId:row.externalId,category:row.category,startDate:row.startDate,endDate:row.endDate,image:row.image,eventLanguage:row.eventLanguage,translations:{} as ImportedEvent['translations'] };
      events.set(row.id,event);
    }
    event.translations[row.language] = {title:row.title,description:row.description,place:row.place,price:row.price,hours:row.hours,url:row.url,ticketUrl:row.ticketUrl};
  }
  return [...events.values()].filter(event=>event.translations.es&&event.translations.eu);
}
