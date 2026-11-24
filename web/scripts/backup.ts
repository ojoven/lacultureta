import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, unlinkSync, existsSync, copyFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
const directory=process.env.BACKUP_DIRECTORY||'/var/backups/lacultureta';
mkdirSync(directory,{recursive:true});
const database=new Database(process.env.DATABASE_PATH||'data/lacultureta.sqlite',{readonly:true});
const filename=`lacultureta-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`;
database.backup(join(directory,filename)).then(()=>{
  database.close();
  if(existsSync('/etc/lacultureta/push.env')){const keyBackup=join(directory,'push.env');copyFileSync('/etc/lacultureta/push.env',keyBackup);chmodSync(keyBackup,0o640);}
  const backups=readdirSync(directory).filter(name=>/^lacultureta-\d{4}.*\.sqlite$/.test(name)).sort().reverse();
  for(const old of backups.slice(14))unlinkSync(join(directory,old));
  console.log(`Backup complete: ${filename}`);
}).catch(error=>{database.close();console.error(error.message);process.exitCode=1});
