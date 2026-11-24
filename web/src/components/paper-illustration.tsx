import type { CSSProperties } from 'react';
import type { ProfileId } from '@/lib/profiles';

// Exact windows in the approved Papel sheet. Cropping stays in CSS; artwork is not redrawn.
const tiles:Record<ProfileId,{x:number;y:number}>= {
  all:{x:28,y:82},family:{x:532,y:82},music:{x:1032,y:82},
  cinema:{x:28,y:548},curious:{x:532,y:548},stage:{x:1032,y:548},
};
export function PaperIllustration({profile,scene=false,className='',eager=false}:{profile:ProfileId;scene?:boolean;className?:string;eager?:boolean}) {
  const {x,y}=tiles[profile];
  const style={
    '--paper-portrait-x':`${-(x+48)/384*100}%`,'--paper-y':`${-y/384*100}%`,
    '--paper-scene-x':`${-x/480*100}%`,
  } as CSSProperties;
  return <span aria-hidden="true" data-illustration={profile} className={`paper-illustration ${scene?'paper-illustration--scene':''} ${className}`} style={style}>
    <img src="/illustrations/papel-v1.webp" alt="" width={1536} height={1024} loading={eager?'eager':'lazy'} decoding="async" draggable={false}/>
  </span>;
}
