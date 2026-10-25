/** Source: original four-part mechanical kit; whole cells exported224+padding16.
 * Calibrated bearing/mouth pixels in the1254px atlas, never guessed from opaque bounds. */
export type InstallationKind='turret'|'bunker';
export interface InstallationFire{time:number;aim:number;rounds:number;ports:number[];origins:{port:number;x:number;y:number}[]}
export const installationArt={cell:627,pad:16,content:224,tile:256,pivots:[{x:343,y:360},{x:309,y:428},{x:343,y:290},{x:309,y:331}]}as const;
export const installationRules={recoilLife:.18,flashLife:.10,wreckLife:.65}as const;
export function installationRig(kind:InstallationKind){return kind==='bunker'?{base:2,head:3,baseSize:156,headSize:134}:{base:0,head:1,baseSize:140,headSize:96};}
export function installationAim(kind:InstallationKind,at:{x:number;y:number},target:{x:number;y:number}){return kind==='bunker'?Math.PI/2:Math.atan2(target.y-at.y,target.x-at.x);}
export function installationMuzzles(kind:InstallationKind,at:{x:number;y:number},aim:number){const rig=installationRig(kind),pivot=installationArt.pivots[rig.head],ports=kind==='bunker'?[{x:309,y:163}]:[{x:257,y:170},{x:309,y:170},{x:361,y:170}],scale=installationArt.content/installationArt.cell/installationArt.tile*rig.headSize,angle=aim+Math.PI/2;return ports.map((p,port)=>{const dx=(p.x-pivot.x)*scale,dy=(p.y-pivot.y)*scale;return{port,x:at.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:at.y+dx*Math.sin(angle)+dy*Math.cos(angle)};});}
export function installationRecoil(fire:Pick<InstallationFire,'time'>|undefined,time:number){const age=fire?time-fire.time:Infinity;return age>=0&&age<installationRules.recoilLife?Math.sin(age/installationRules.recoilLife*Math.PI)*4:0;}
export function installationPivot(frame:number){const p=installationArt.pivots[frame];return{x:(installationArt.pad+p.x*installationArt.content/installationArt.cell)/installationArt.tile,y:(installationArt.pad+p.y*installationArt.content/installationArt.cell)/installationArt.tile};}
