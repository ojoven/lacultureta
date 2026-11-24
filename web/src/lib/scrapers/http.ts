import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import robotsParser from 'robots-parser';
import { chromium, type Browser, type BrowserContext } from 'playwright-core';

export const BOT = 'LaCulturetaBot';
const allowedHosts = new Set(['www.donostiakultura.eus', 'www.tabakalera.eus']);
export type FetchMethod = 'http' | 'chrome-http' | 'chromium';
export interface PageResponse { status: number; headers: Record<string, string>; body: string; method: FetchMethod; cached?: boolean }
interface CacheMetadata { fetchedAt: number; status: number; headers: Record<string, string>; method: FetchMethod }
export const sleep = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));
export function retryDelay(value: string | undefined, now = Date.now()): number {
  if (!value) return 60_000;
  const seconds = Number(value);
  return Math.max(0, Number.isFinite(seconds) ? seconds * 1000 : (Date.parse(value) - now) || 60_000);
}
export function allowedUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.port || url.username || url.password) throw new Error('URL outside the direct-source allowlist');
  url.hash = '';
  return url;
}
export function isChallenge(body: string) {
  return /<title[^>]*>\s*(?:Just a moment|Attention Required|Un momento)|Sorry, you have been blocked|Verificación de seguridad en curso|cf-chl-widget|challenge-platform\/h\/b\/orchestrate/i.test(body);
}

/** Shared per-origin pacing, cache and robots policy for every transport. */
export class SourceFetcher {
  readonly metrics = { requests: 0, cacheHits: 0, methods: { http: 0, 'chrome-http': 0, chromium: 0 } };
  readonly cacheDirectory: string;
  private lastRequest = new Map<string, number>();
  private cooldown = new Map<string, number>();
  private policies = new Map<string, ReturnType<typeof robotsParser>>();
  private cooldownLoaded = new Set<string>();
  private preferred = new Map<string, FetchMethod>();
  private browser?: Browser;
  private context?: BrowserContext;
  private readonly interval: number;
  private queue: Promise<void> = Promise.resolve();
  constructor(options: { cacheDirectory?: string; intervalMs?: number } = {}) {
    this.cacheDirectory = options.cacheDirectory || resolve(dirname(process.env.DATABASE_PATH || resolve('data/lacultureta.sqlite')), 'source-cache');
    const configured = options.intervalMs ?? Number(process.env.SCRAPER_INTERVAL_MS || 5000);
    this.interval = Number.isFinite(configured) ? Math.max(1000, configured) : 5000;
  }
  private paths(url: string) {
    const hash = createHash('sha256').update(url).digest('hex');
    return { body: resolve(this.cacheDirectory, hash + '.body'), metadata: resolve(this.cacheDirectory, hash + '.json') };
  }
  private async cache(url: string): Promise<(CacheMetadata & { body: string }) | undefined> {
    try {
      const paths = this.paths(url);
      const metadata = JSON.parse(await readFile(paths.metadata, 'utf8')) as CacheMetadata;
      return { ...metadata, body: await readFile(paths.body, 'utf8') };
    } catch { return undefined; }
  }
  private async save(url: string, response: PageResponse) {
    await mkdir(this.cacheDirectory, { recursive: true, mode: 0o750 });
    const paths = this.paths(url);
    const temporary=paths.body+'.tmp-'+process.pid;
    await writeFile(temporary, response.body, { mode: 0o640 });
    await rename(temporary,paths.body);
    await writeFile(paths.metadata, JSON.stringify({ fetchedAt: Date.now(), status: response.status, headers: response.headers, method: response.method }), { mode: 0o640 });
  }
  private async pace(url: URL) {
    if ((this.cooldown.get(url.origin) || 0) > Date.now()) throw new Error(`${url.hostname} is cooling down after a rate-limit response`);
    const crawlDelay = (this.policies.get(url.origin)?.getCrawlDelay(BOT) || 0) * 1000;
    const pause = Math.max(this.interval, crawlDelay) - (Date.now() - (this.lastRequest.get(url.origin) || 0));
    if (pause > 0) await sleep(pause);
    this.lastRequest.set(url.origin, Date.now());
    this.metrics.requests++;
    if (this.metrics.requests > Number(process.env.SCRAPER_MAX_REQUESTS || 100)) throw new Error('Direct-source request budget exhausted');
  }
  private async policy(url: URL) {
    if(!this.cooldownLoaded.has(url.origin)) {
      try {this.cooldown.set(url.origin,JSON.parse(await readFile(resolve(this.cacheDirectory,'cooldown-'+url.hostname+'.json'),'utf8')).until);}catch{}
      this.cooldownLoaded.add(url.origin);
    }
    if (this.policies.has(url.origin)) return;
    const robotsUrl = url.origin + '/robots.txt';
    const cached = await this.cache(robotsUrl);
    if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
      this.policies.set(url.origin, robotsParser(robotsUrl, cached.body)); return;
    }
    await this.pace(url);
    let response:PageResponse;
    try{response=await this.http(robotsUrl, {});}catch{await this.pace(url);response=await this.chromeHttp(robotsUrl, {});}
    if (response.status === 403 || isChallenge(response.body)) { await this.pace(url); response = await this.chromeHttp(robotsUrl, {}); }
    if (response.status === 429 || response.status === 503) this.rateLimit(url, response);
    if (response.status === 404) response.body = 'User-agent: *\nAllow: /';
    else if (response.status !== 200 || isChallenge(response.body) || !/user-agent\s*:/i.test(response.body)) throw new Error(`Cannot read robots policy for ${url.hostname}`);
    await this.save(robotsUrl, response);
    this.policies.set(url.origin, robotsParser(robotsUrl, response.body));
  }
  private rateLimit(url: URL, response: PageResponse): never {
    const delay = Math.max(60_000, retryDelay(response.headers['retry-after']));
    this.cooldown.set(url.origin, Date.now() + delay);
    mkdirSync(this.cacheDirectory,{recursive:true,mode:0o750});
    writeFileSync(resolve(this.cacheDirectory,'cooldown-'+url.hostname+'.json'),JSON.stringify({until:Date.now()+delay}),{mode:0o640});
    throw new Error(`${url.hostname} returned ${response.status}; no alternate transport will retry it for ${Math.ceil(delay / 1000)}s`);
  }
  private async http(url: string, conditional: Record<string, string>): Promise<PageResponse> {
    this.metrics.methods.http++;
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(40_000), headers: {
      'User-Agent': `${BOT}/2.1 (+https://lacultureta.com)`, 'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'es-ES,eu;q=0.9', ...conditional,
    } });
    if (Number(response.headers.get('content-length')) > 40 * 1024 * 1024) throw new Error('Source response exceeds 40 MiB');
    const body = await response.text();
    if (Buffer.byteLength(body) > 40 * 1024 * 1024) throw new Error('Source response exceeds 40 MiB');
    return { status: response.status, headers: Object.fromEntries(response.headers), body, method: 'http' };
  }
  private async chromeHttp(url: string, conditional: Record<string, string>): Promise<PageResponse> {
    this.metrics.methods['chrome-http']++;
    const python = process.env.SCRAPER_PYTHON_PATH || (existsSync('/opt/lacultureta/scraper-venv/bin/python') ? '/opt/lacultureta/scraper-venv/bin/python' : 'python3');
    const script = process.env.SCRAPER_PYTHON_SCRIPT || resolve('scripts/fetch-browser.py');
    return new Promise((resolve, reject) => {
      const child = execFile(python, [script], { timeout: 50_000, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
        try {
          const response = JSON.parse(stdout);
          if (error || response.error) reject(new Error(response.error || stderr.slice(0, 300) || error?.message));
          else resolve({ ...response, method: 'chrome-http' });
        } catch { reject(new Error('Chrome-compatible HTTP helper is unavailable: ' + (stderr || error?.message || '').slice(0, 250))); }
      });
      child.stdin?.end(JSON.stringify({ url, headers: conditional }));
    });
  }
  private async chrome(url: string): Promise<PageResponse> {
    this.metrics.methods.chromium++;
    const executablePath = process.env.SCRAPER_CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
    if (!executablePath) throw new Error('Headless Chromium is not configured; set SCRAPER_CHROME_PATH to enable it');
    if (!this.browser) {
      this.browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-dev-shm-usage'] });
      this.context = await this.browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', viewport: { width: 1280, height: 900 } });
      await this.context.route('**/*', route => {
        const request = route.request(), target = new URL(request.url());
        if (['image', 'font', 'media', 'stylesheet'].includes(request.resourceType()) || (!allowedHosts.has(target.hostname)&&target.hostname!=='challenges.cloudflare.com')) return route.abort();
        return route.continue();
      });
    }
    const page = await this.context!.newPage();
    let navigationStatus=500;
    page.on('response',response=>{if(response.request().isNavigationRequest()&&response.frame()===page.mainFrame())navigationStatus=response.status();});
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      if (response?.status() === 429 || response?.status() === 503) return { status: response.status(), headers: response.headers(), body: '', method: 'chromium' };
      let body = await page.content();
      if (isChallenge(body)) {
        try { await page.waitForFunction(() => !/Just a moment|Attention Required|Un momento/i.test(document.title), undefined, { timeout: 15_000 }); } catch {}
        body = await page.content();
      }
      if (/application\/json/i.test(response?.headers()['content-type'] || '')) body = await page.locator('pre').innerText();
      // A remaining challenge is a failure; this never clicks or solves a CAPTCHA.
      return { status: isChallenge(body) ? 403 : navigationStatus, headers: response?.headers() || {}, body, method: 'chromium' };
    } finally { await page.close(); }
  }
  async get(value: string, ttlMs = Number(process.env.SCRAPER_CACHE_TTL_MS ?? 4 * 60 * 60 * 1000)): Promise<PageResponse> {
    const previous=this.queue;
    let release!:()=>void;
    this.queue=new Promise<void>(resolve=>{release=resolve;});
    await previous;
    try{return await this.getPage(value,ttlMs);}finally{release();}
  }
  private async getPage(value: string, ttlMs: number): Promise<PageResponse> {
    const url = allowedUrl(value);
    await this.policy(url);
    if (this.policies.get(url.origin)?.isAllowed(url.href, BOT) === false) throw new Error(`robots.txt disallows ${url.pathname}`);
    const cached = await this.cache(url.href);
    if (cached && Date.now() - cached.fetchedAt < ttlMs) { this.metrics.cacheHits++; return { ...cached, cached: true }; }
    const conditional: Record<string, string> = {};
    if (cached?.headers.etag) conditional['If-None-Match'] = cached.headers.etag;
    if (cached?.headers['last-modified']) conditional['If-Modified-Since'] = cached.headers['last-modified'];
    const configured=process.env.SCRAPER_FETCH_METHOD;
    const first = (['http','chrome-http','chromium'].includes(configured||'')?configured as FetchMethod:undefined)||this.preferred.get(url.origin);
    const methods: FetchMethod[] = first ? [first, ...(['http', 'chrome-http', 'chromium'] as FetchMethod[]).filter(m => m !== first)] : ['http', 'chrome-http', 'chromium'];
    const errors: string[] = [];
    for (const method of methods) {
      await this.pace(url);
      try {
        const response = method === 'http' ? await this.http(url.href, conditional) : method === 'chrome-http' ? await this.chromeHttp(url.href, conditional) : await this.chrome(url.href);
        if (response.status === 429 || response.status === 503) this.rateLimit(url, response);
        if (response.status === 304 && cached) { response.status = 200; response.body = cached.body; response.headers = { ...cached.headers, ...response.headers }; }
        if ([301, 302, 307, 308].includes(response.status)) throw new Error('Unexpected source redirect; update the canonical source URL');
        if (response.status !== 200 || isChallenge(response.body)) throw new Error(`HTTP ${response.status}${isChallenge(response.body) ? ' (security challenge)' : ''}`);
        await this.save(url.href, response); this.preferred.set(url.origin, method); return response;
      } catch (error) {
        if ((this.cooldown.get(url.origin) || 0) > Date.now()) throw error;
        errors.push(`${method}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw new Error(`${url.hostname}: ${errors.join('; ')}`);
  }
  async close() { await this.browser?.close(); }
}
