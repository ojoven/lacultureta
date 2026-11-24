import { db } from './db';
import { commitPlan, planForSubscriber, type PushPlan } from './push-planner';
import { validPushEndpoint, type PushSubscriber } from './push-store';
export async function dispatchNotifications(options:{dryRun?:boolean;now?:Date;send:(subscriber:PushSubscriber,plan:PushPlan)=>Promise<unknown>}) {
  const database=db(),dryRun=!!options.dryRun;
  const subscribers=database.prepare('SELECT * FROM push_subscriptions ORDER BY id').all() as PushSubscriber[];
  const summary={subscriptions:subscribers.length,planned:0,sent:0,expired:0,failed:0,coolingDown:0,dryRun};
  for(const subscriber of subscribers) {
    const now=options.now||new Date(),host=new URL(subscriber.endpoint).hostname;
    const cooling=database.prepare('SELECT until_at FROM push_provider_cooldowns WHERE host=?').get(host) as {until_at:string}|undefined;
    if(cooling&&cooling.until_at>now.toISOString()){summary.coolingDown++;continue;}
    try {
      if(!validPushEndpoint(subscriber.endpoint))throw new Error('Unsupported push service');
      let plan:PushPlan|undefined;
      if(dryRun){database.exec('BEGIN');try{plan=planForSubscriber(subscriber,now);}finally{database.exec('ROLLBACK');}}
      else plan=planForSubscriber(subscriber,now);
      if(!plan)continue;
      summary.planned++;
      if(dryRun)continue;
      await options.send(subscriber,plan);commitPlan(subscriber.id,plan,now);summary.sent++;
    } catch(error) {
      const status=(error as {statusCode?:number}).statusCode;
      if(status===404||status===410){database.prepare('DELETE FROM push_subscriptions WHERE id=?').run(subscriber.id);summary.expired++;}
      else summary.failed++;
      if(status===429||status===503) {
        const retry=(error as {headers?:Record<string,string>}).headers?.['retry-after'];
        const delay=retry&&/^\d+$/.test(retry)?Number(retry)*1000:retry?Date.parse(retry)-now.getTime():900000;
        const until=new Date(now.getTime()+Math.max(900000,Number.isFinite(delay)?delay:900000)).toISOString();
        database.prepare('INSERT INTO push_provider_cooldowns VALUES (?,?) ON CONFLICT(host) DO UPDATE SET until_at=excluded.until_at').run(host,until);
      }
    }
  }
  if(!dryRun)database.prepare('DELETE FROM push_deliveries WHERE sent_at<?').run(new Date((options.now||new Date()).getTime()-90*86400000).toISOString());
  return summary;
}
