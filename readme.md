# La Cultureta

A bilingual cultural agenda for Donostia / San Sebastián. The production app is in `web/` and uses Next.js 16, React 19 and TypeScript. The previous Laravel application remains in the repository for reference. It is not included in deployments.

Live site: https://lacultureta.com

## Development

Use Node.js 22 or 24 LTS. Production uses Node 24.

```sh
npm run setup
npm run scrape
npm run dev
```

Open http://localhost:3100/es or http://localhost:3100/eu. The first import creates `web/data/lacultureta.sqlite`. Set `DATABASE_PATH` to use another location. Do not point a development or test process at the production database.

```sh
npm test
npm run typecheck
npm run build
```

## What changed

- Server-rendered Next.js pages, typed JSON routes and a responsive React frontend replace Laravel and jQuery in production.
- Event discovery fits one mobile viewport, with a date dropdown, a horizontal category rail and an additional filters button. The bottom menu opens Discover, Saved plans and the project introduction. There is no search field or scrolling event grid.
- A welcome card explains the project and swipe directions. Actual event cards are mounted and preloaded underneath the active card. Discovery supports gestures, buttons, keyboard arrows and undo. Saved plans also use cards with previous/next controls.
- Saved events stay in browser storage. Spanish and Basque use the same event IDs. There is no account or cross-device sync.
- Individual event pages have language alternatives, social metadata, structured event data and calendar downloads in the Europe/Madrid time zone.
- SQLite uses WAL mode, foreign keys, date/category indexes, parameterised queries and transactional upserts. Filters and pagination run in SQL instead of loading every event into PHP. Spanish and Basque translations have a composite primary key.
- Scraping runs outside HTTP requests. Imports update changed events, detect incomplete feeds, retry network errors and retain the previous data when a request fails. A complete snapshot expires events removed from the feed.
- The old anonymous user/rating endpoints, public scraper route and legacy tracking scripts are not deployed. Usage analytics now use the explicitly configured Rybbit instance described below.

## Donostia Kultura and Tabakalera

The scheduled importer reads **both organisers directly**, in Spanish and Basque:

- Donostia Kultura: `https://www.donostiakultura.eus/es/agenda` and `/eu/agenda`. The agenda embeds its full event list as JSON-LD, including descriptions, dates, places, images and prices. This includes events beyond the 24 visible cards, so pagination/detail crawling is not needed.
- Tabakalera: `https://www.tabakalera.eus/es/agenda-cultural-san-sebastian/` and its Basque version. The importer reads the public Gatsby page-data JSON used by the agenda and its “Ver más” button. It selects published activities and exhibitions, expands upcoming sessions and matches language variants by the stable node/session IDs. Calls for applications are excluded. Long descriptions and prices absent from this public dataset can be filled from Kulturklik.

Three fetching methods are available:

1. Normal HTTP, using `LaCulturetaBot/2.1 (+https://lacultureta.com)`.
2. Chrome-compatible HTTP through Python `curl_cffi`, using a stock browser TLS/HTTP profile and matching user agent. This method has been verified against both sites from the production server.
3. Optional headless Chromium through Playwright, configured with `SCRAPER_CHROME_PATH`. It runs in a dedicated browser context, blocks images/media/fonts/trackers, allows the page's JavaScript to run, and reports a remaining challenge as a failure. It never clicks or solves a CAPTCHA. The initial local Chromium probe remained blocked by Cloudflare; the HTTP methods succeeded. Chromium is not required or installed on the production server while the HTTP methods work.

The worker makes sequential page requests, with **at least five seconds between requests to the same host**. It reads and respects robots.txt, including crawl delays. HTTP 429/503 responses stop all alternate transports for that host. The cooldown respects Retry-After and is saved across runs. A run has a 100-request budget. Public page bodies are cached for four hours, robots policies for 24 hours, and stale cache entries use conditional ETag/Last-Modified requests. Headless browser subresources are normal page assets; the five-second interval governs top-level fetches.

Kulturklik / Open Data Euskadi remains a fallback and supplies other Donostia organisers. Its feed is filtered to province `20`, municipality `82` (the API's Nora code for Donostia). Documentation: https://opendata.euskadi.eus/api-culture/?api=culture_events

Direct records take priority when updating events. Matching preserves existing event IDs, favourites and calendar links. Each provider's origin key and last-seen state are stored separately. A failed or unexpectedly small source response cannot retire the previous catalogue. Explicit source cancellations and withdrawn direct records cannot be restored by a stale fallback feed. Ticket availability can change between source updates; original links are kept on every event.

```sh
# Normal import: direct agendas first, then the fallback/supplementary feed.
npm run scrape

# Check direct parsing and matching without changing stored events.
SCRAPER_PYTHON_PATH=/path/to/venv/bin/python npm --prefix web run scrape -- --direct-only --dry-run

# Force a transport during diagnosis. A zero TTL bypasses the page cache.
SCRAPER_FETCH_METHOD=chrome-http SCRAPER_CACHE_TTL_MS=0 npm --prefix web run scrape -- --source=donostia-kultura --dry-run
```

Install the Python helper with `python3 -m venv /path/to/venv` and `/path/to/venv/bin/pip install -r ops/requirements-scraper.txt`. On the production server the helper lives at `/opt/lacultureta/scraper-venv`. `ops/deploy.sh` prepares this dependency when needed. `ops/setup-scraper.sh` can also prepare it directly on Ubuntu. Python helper requests and browser fallback navigation are restricted to the two source hosts.

Useful optional settings: `SCRAPER_FETCH_METHOD` (`http`, `chrome-http`, `chromium` selects the first method), `SCRAPER_INTERVAL_MS`, `SCRAPER_MAX_REQUESTS`, `SCRAPER_CACHE_TTL_MS`, `SCRAPER_PYTHON_PATH`, `SCRAPER_CHROME_PATH`. The health endpoint reports the most recent result for each importer under `sources`.

## Profiles and mobile notifications

The bottom menu contains Discover, Saved plans, Profile and Notifications. The Profile panel also opens the project introduction. Five category profiles are available: family plans, music, cinema, art and ideas, and theatre/dance. Family plans start with the coming weekend selected. They use explicit child/family audience phrases in the source title or description, in Spanish or Basque; this is not an age rating. Users can change the date. A profile is stored on the device and carried in the URL and language links. Saved plans remain available across profiles.

The five illustration sheets are in `design/illustrations/`: `a-editorial.png`, `b-risograph.png`, `c-line.png`, `d-paper.png` and `e-clay.png`. Each is a two-row, three-column grid with the Lacultureta woman and five profiles. `lacultureta-directions.png` is the initial comparison sheet. `brief.json` and `variants.json` record the image generation prompts.

**Papel is the selected production style.** An optimised WebP copy of the approved sheet is served from `web/public/illustrations/papel-v1.webp`. `PaperIllustration` crops the six scenes in CSS, sharing one image download and excluding the review sheet's labels. Profile choices, the selected-profile label and the bottom Profile button use circular portraits. The welcome card uses the first Lacultureta illustration, with a compact portrait layout on short screens. The original sheet and the other style options stay in `design/` for reference.

Notifications use standard Web Push, a push-only service worker and an installable web app manifest. iPhone/iPad users must add the website to the Home Screen and open that app before enabling notifications (iOS/iPadOS 16.4 or later). The browser permission dialog appears only after the user presses Activate. A blocked permission is explained without repeated prompts.

Users can select notification categories within their profile and these notification types:

- New matching events: one daily digest from 18:00, when there are new events since the device's last check. Existing events at subscription time are excluded.
- Weekend suggestions: Friday from 17:00, if matching events exist.
- Saved-event reminders: the previous evening from 18:00.
- Saved-event changes: changes of date, time, place, title or explicit cancellation/withdrawal. The baseline is captured at opt-in and when a saved plan is added. Normal expiry after an event's scheduled end does not generate an alert.

Times use `Europe/Madrid`, including daylight-saving changes. The dispatcher checks every 15 minutes. Quiet hours are 21:00–09:00. Provider queue lifetimes are limited to two hours and shortened to expire by 21:00. A device receives at most two notifications per Madrid calendar day, with at least 30 minutes between alerts. Changes take priority, then reminders, weekend suggestions and new-event digests. Importing remains a separate six-hour job, so source changes can only be detected at the next successful import. Provider delivery and device settings can add delays.

Inactive users see an invitation card after eight event cards in an eligible session. It starts at session three, then requires at least three more sessions and seven days since the last invitation. A session starts after 30 minutes of inactivity. Saving and skipping both count as viewing an event; welcome cards and saved-list navigation do not. "Never ask again", blocked browser permission and active subscriptions suppress invitations. The policy is defined in `web/src/lib/notification-preferences.ts`.

The server stores the push endpoint, encryption keys, selected preferences and saved event IDs only after opt-in. A random device secret authorises preference changes and deletion; only its hash is stored on the server. Endpoints are limited to recognised push services, mutation requests require the site's origin, and new subscriptions have a per-client limit. Turning notifications off deletes the subscription, saved-event baseline and delivery history from the live database. The device's local saved plans are retained. Local database backups may retain deleted records until the 14-copy rotation expires. Expired provider subscriptions are removed automatically. Provider Retry-After cooldowns persist across runs. Delivery records are kept for 90 days.

VAPID keys are generated once on deployment in `/etc/lacultureta/push.env` (root-owned, readable by the application group). The private key is never returned by an API or included in a release. The database backup also keeps a protected copy of this file. Preserve the key when restoring subscriptions. The public configuration is available at `/api/notifications`; notification preferences and endpoints are never listed by a public route.

```sh
# Inspect planned sends without delivery or changes to notification state.
npm --prefix web run notify -- --dry-run

ssh agent 'sudo systemctl status lacultureta-notify.timer --no-pager'
ssh agent 'sudo journalctl -u lacultureta-notify.service -n 30 --no-pager'
```

## Usage analytics

The production site loads `https://analytics.mtorr.es/api/script.js?siteId=339fd640cc48` with Next.js Script after hydration. Tracking is enabled only on `lacultureta.com` and `www.lacultureta.com`, so local previews and tests do not populate the production reports. The Rybbit dashboard controls automatic pageviews, SPA navigation and outbound tracking. The app avoids replacing an unchanged URL when paginating cards.

Custom events use the following groups:

- Discovery: `welcome_viewed`, `welcome_started`, `event_viewed`, `event_details_opened`.
- Decisions: `event_saved`, `event_skipped`, `event_removed`, `event_undo`. Card decisions include `method=button`, `swipe` or `keyboard`; saving from details or the saved list has its own method. Repeated saves include `status=already_saved`.
- Preferences and navigation: `filter_changed`, `filters_opened`, `profile_selected`, `profile_menu_opened`, `navigation_changed`, `language_changed`.
- Event actions: `ticket_link_clicked`, `official_link_clicked`, `calendar_download_clicked`, `event_shared`. These measure clicks and successful native-share/clipboard actions; they do not claim that a ticket purchase completed.
- Notifications: `notifications_opened`, `notification_invitation_shown`, `notification_invitation_dismissed`, `notification_enable_requested`, `notification_permission_result`, `notifications_enabled`, `notifications_disabled`, `notification_preferences_saved`, `notification_error`.

Properties are allowlisted: interface language, profile, public event ID, category, organiser, view, interaction method, filter, selected value, status and aggregate counts. Push endpoints, device tokens, saved-plan inventories and descriptions are excluded. Events wait up to 15 seconds for the asynchronous SDK, with a maximum of 100 queued events. Tracker failures never block navigation or saving a plan. SDK-level privacy settings continue to apply.

Useful funnels include `welcome_viewed → welcome_started → event_saved`, `event_viewed → event_details_opened → ticket_link_clicked`, and `notification_invitation_shown → notification_enable_requested → notifications_enabled`. `event_details_opened` distinguishes `view=page` from discovery/saved-list modal openings.

The app icon is a simplified Papel portrait generated with built-in imagegen. Its source and prompt are in `design/illustrations/lacultureta-icon-v2.png` and `icon-v2.json`. Run `node ops/build-icons.mjs` to export the favicon, Apple touch icon, standard PWA icons and maskable icon under `web/public/branding/`. Versioned filenames prevent old favicon caches from hiding the new design.

## Production server

The target is `agent`, IP `51.178.28.241`, host `vps-a518857d`, Ubuntu 24.04. Caddy terminates HTTPS and proxies to `127.0.0.1:3100`. Both the apex and `www` DNS records point to this server. `www` redirects to the apex domain.

- App releases: `/opt/lacultureta/releases/<UTC timestamp>`
- Active release: `/opt/lacultureta/current`
- Runtime: `/opt/lacultureta/runtime/bin/node`
- Database: `/var/lib/lacultureta/lacultureta.sqlite`
- Backups: `/var/backups/lacultureta/` (14 copies, on the same server)
- Units and timers: `ops/lacultureta*`
- Caddy virtual hosts: `ops/Caddyfile`

```sh
# Build locally, upload a standalone release, import events and restart the app.
npm run deploy

# Server operations
ssh agent 'sudo systemctl status lacultureta --no-pager'
ssh agent 'sudo systemctl start lacultureta-scrape'
ssh agent 'sudo journalctl -u lacultureta -u lacultureta-scrape -n 60 --no-pager'
ssh agent 'sudo systemctl list-timers "lacultureta*"'
curl --fail https://lacultureta.com/api/health
```

The deployment helper expects this server's existing Node/npm installation for preparing the SQLite native binary. It copies the Node runtime into the app directory and installs the native module for that runtime. The service runs as a dedicated system user with a read-only application directory and a writable database directory. A failed application health check restores the previous release when available.

The Node HTTP importer uses the server’s trusted CA bundle through `NODE_EXTRA_CA_CERTS`. The Euskadi API uses an Izenpe certificate chain that is trusted by Ubuntu but is absent from this Node build’s bundled CA set. TLS verification stays enabled.

Imports run every six hours at 00:15, 06:15, 12:15 and 18:15 **server time (UTC)**, with up to two minutes of delay. A daily online SQLite backup runs at 03:35 UTC. The health route returns HTTP 503 if the last successful import is over 36 hours old or no upcoming events remain. It is ready for an external uptime monitor; no external alert service is configured.

To roll back, point `/opt/lacultureta/current` to a previous release and restart `lacultureta.service`. Database changes are additive. No legacy production database was present on this server, so no historical users or ratings were migrated.

### Returning visitors and venues

Swipes in either direction are kept in `lacultureta.swiped.v1` in the browser. They survive visits, languages, profiles, filters and event rescheduling. Undo removes the current decision. Saved plans remain available in Mis planes. Swipe history stays on the device; clearing site data removes it. Skips made before this release cannot be recovered.

Cards open details from any point on the card, including the image, with Enter/Space support and drag suppression. The filter bar contains date and category dropdowns plus the extra filters button. Organiser is no longer a user filter.

The SQLite venue registry stores bilingual aliases, addresses, optional longitude/latitude, neighbourhoods, sources and verification status. The municipal culture snapshot seeds verified points. Venue websites supply additional confirmed addresses. Existing events are backfilled and each import updates links. Unresolved places keep null location fields. No venue or neighbourhood filter is added by this change. See [venue data and attribution](web/src/data/venues/README.md).
