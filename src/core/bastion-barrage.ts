import{C}from'./config';import type{Body}from'./world';
export const BASTION_BARRAGE={echo:.2,spacing:1.8,vy:280,muzzleY:90,ports:[-145,-87,-29,29,87,145]}as const;
export const barrageNextGap=(gap:number)=>gap===360?580:360;
export const barrageTargets=(gap:number)=>[80,150,220,290,360,430,500,570,640].filter(x=>Math.abs(x-gap)>=110);
/** Fixed target gaps, fired by the hull's six real ports. No player tracking. */
export function barrageVolley(b:Pick<Body,'x'|'y'|'lane'|'barrageLane'>,beat:number){
 const first=b.barrageLane??b.lane,gap=beat<2?first:barrageNextGap(first),targets=barrageTargets(gap);
 return BASTION_BARRAGE.ports.map((offset,port)=>{const x=b.x+offset,y=b.y+BASTION_BARRAGE.muzzleY;return{port,x,y,vx:(targets[port]-x)*BASTION_BARRAGE.vy/(C.playerY-y),vy:BASTION_BARRAGE.vy};});
}
