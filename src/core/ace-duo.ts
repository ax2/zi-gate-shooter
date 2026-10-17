import type {Body} from './world';
export type AceRole='fan'|'needle';
export const ACE_DUO={warning:.8,rageWarning:1,rageLead:.2,recovery:2.4,rageRecovery:1.5,spacing:.16,needleShots:3,rageNeedleShots:5,fanVx:[-120,0,120],rageFanVx:[-140,-70,0,70,140],fanVy:300,needleVy:400} as const;
/** Timers and age are advanced by advanceBody, also used by the no-kill forecast. */
export function advanceAce(b:Body,offline:boolean,shot:(x:number,y:number,vx?:number,vy?:number)=>void){
 if(b.timer>1e-9||offline)return;
 if(b.warning<=0&&!b.burst){
  if(b.aceRagePending){b.aceEnraged=true;b.aceRagePending=false;}
  b.warning=b.aceEnraged?ACE_DUO.rageWarning:ACE_DUO.warning;b.timer=b.warning;return;
 }
 const y=b.y+b.height/2;
 if(b.aceRole==='fan')for(const vx of b.aceEnraged?ACE_DUO.rageFanVx:ACE_DUO.fanVx)shot(b.x,y,vx,ACE_DUO.fanVy);
 else{shot(b.x,y,0,ACE_DUO.needleVy);b.burst++;}
 b.warning=0;
 if(b.aceRole==='needle'&&b.burst<(b.aceEnraged?ACE_DUO.rageNeedleShots:ACE_DUO.needleShots))b.timer=ACE_DUO.spacing;
 else{b.burst=0;b.timer=b.aceRagePending?ACE_DUO.rageLead:b.aceEnraged?ACE_DUO.rageRecovery:ACE_DUO.recovery;}
}
