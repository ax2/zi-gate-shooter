/** One real side-wall reflection, not a projected enemy trajectory. */
export const mirrorRules={left:16,right:704,life:3.6,radius:12,speed:1.15}as const;
export interface WallTurn{x:number;y:number;t:number}
export function mirrorMount(at:{x:number;y:number},side:number,variant:number){const angle=Math.atan2(variant===2?.8:.45,side),x=at.x+side*37,y=at.y+16;return{x,y,angle,muzzleX:x+Math.cos(angle)*20,muzzleY:y+Math.sin(angle)*20};}
interface Path{px:number;py:number;x:number;y:number;wallTurn?:WallTurn}
interface MirrorMotion{x:number;y:number;vx:number;vy:number;mirror:number;wallTurn?:WallTurn}
export function advanceMirror(b:MirrorMotion,dt:number){
 delete b.wallTurn;const dx=b.vx*dt,dy=b.vy*dt,edge=dx<0?mirrorRules.left:mirrorRules.right,t=dx?(edge-b.x)/dx:Infinity;
 if(b.mirror>0&&t>=0&&t<=1){b.wallTurn={x:edge,y:b.y+dy*t,t};b.x=edge-dx*(1-t);b.y+=dy;b.vx=-b.vx;b.mirror--;return true;}
 b.x+=dx;b.y+=dy;return false;
}
function sample(p:Path,t:number){const k=p.wallTurn;if(!k)return{x:p.px+(p.x-p.px)*t,y:p.py+(p.y-p.py)*t};if(t<=k.t){const f=k.t?t/k.t:0;return{x:p.px+(k.x-p.px)*f,y:p.py+(k.y-p.py)*f};}const f=(t-k.t)/(1-k.t||1);return{x:k.x+(p.x-k.x)*f,y:k.y+(p.y-k.y)*f};}
/** Closest contact on synchronized piecewise motion, including the turn's time. */
export function pathContact(a:Path,b:Path,radius:number){const cuts=[0,...[a.wallTurn?.t,b.wallTurn?.t].filter((n):n is number=>n!==undefined&&n>0&&n<1),1].sort((a,b)=>a-b);
 for(let i=1;i<cuts.length;i++){const lo=cuts[i-1],hi=cuts[i];if(hi===lo)continue;const aa=sample(a,lo),ab=sample(a,hi),ba=sample(b,lo),bb=sample(b,hi),x=aa.x-ba.x,y=aa.y-ba.y,dx=ab.x-bb.x-x,dy=ab.y-bb.y-y,t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x+dx*t,y+dy*t)<=radius)return lo+(hi-lo)*t;
 }
 return undefined;
}
