import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'web/package.json'));
const sharp=require('sharp'),source=resolve(root,'design/illustrations/lacultureta-icon-v2.png');
const output=resolve(root,'web/public/branding');mkdirSync(output,{recursive:true});
for(const size of [192,512])await sharp(source).resize(size,size).png().toFile(resolve(output,`icon-v2-${size}.png`));
await sharp(source).resize(410,410).extend({top:51,bottom:51,left:51,right:51,background:'#fbf3e7'}).png().toFile(resolve(output,'icon-v2-maskable.png'));
await sharp(source).resize(180,180).png().toFile(resolve(output,'apple-touch-icon-v2.png'));
const sizes=[16,32,48],images=await Promise.all(sizes.map(size=>sharp(source).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
for(let index=0;index<sizes.length;index++){
  const entry=6+16*index;header[entry]=sizes[index];header[entry+1]=sizes[index];header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(images[index].length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=images[index].length;
}
writeFileSync(resolve(output,'favicon-v2.ico'),Buffer.concat([header,...images]));
copyFileSync(resolve(output,'favicon-v2.ico'),resolve(root,'web/public/favicon.ico'));
console.log('Exported Papel favicon and app icons');
