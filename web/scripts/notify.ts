import { sendNotification } from 'web-push';
import { db } from '../src/lib/db';
import { dispatchNotifications } from '../src/lib/push-dispatcher';
import { notificationTtl } from '../src/lib/push-planner';

async function main() {
  const database=db(),dryRun=process.argv.includes('--dry-run');
  const publicKey=process.env.VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY;
  if(!dryRun&&(!publicKey||!privateKey))throw new Error('VAPID keys are not configured');
  const summary=await dispatchNotifications({dryRun,send:async(subscriber,plan)=>{
      return sendNotification({endpoint:subscriber.endpoint,keys:{p256dh:subscriber.p256dh,auth:subscriber.auth}},JSON.stringify(plan.payload),{
        vapidDetails:{subject:'https://lacultureta.com',publicKey:publicKey!,privateKey:privateKey!},
        TTL:notificationTtl(),timeout:15000,urgency:plan.kind==='changes'?'high':'normal',topic:plan.payload.tag,
      });
  }});
  console.log(JSON.stringify(summary));database.close();
  if(summary.failed)process.exitCode=1;
}
main().catch(()=>{console.error('Notification dispatcher failed');process.exitCode=1});
