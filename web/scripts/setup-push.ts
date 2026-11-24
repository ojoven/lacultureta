import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, chmodSync, chownSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const path='/etc/lacultureta/push.env';
if(existsSync(path))console.log('Existing push configuration retained');
else {
  const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const key=privateKey.export({format:'jwk'});
  const publicKey=Buffer.concat([Buffer.from([4]),Buffer.from(key.x!,'base64url'),Buffer.from(key.y!,'base64url')]).toString('base64url');
  const group=Number(execFileSync('id',['-g','lacultureta'],{encoding:'utf8'}).trim());
  mkdirSync(dirname(path),{recursive:true,mode:0o750});chownSync(dirname(path),0,group);
  writeFileSync(path,`APP_ORIGIN=https://lacultureta.com\nVAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${key.d}\n`,{mode:0o640,flag:'wx'});
  chmodSync(path,0o640);chownSync(path,0,group);
  console.log('Push keys created; private key kept in /etc/lacultureta/push.env');
}
