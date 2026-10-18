import{C}from'./config';import{counterMuzzles}from'./boss-counter';import type{Body}from'./world';
export const BOSS_WEAVE={beats:3,spacing:.15,vy:320,targets:[80,240,380]}as const;
export const isWeaveBoss=(b:Pick<Body,'bossVariant'>)=>b.bossVariant!==1&&b.bossVariant!==2;
/** Fixed hull ports and alternating completed phrases; never sample the player. */
export function weaveVolley(b:Pick<Body,'x'|'y'|'bossVariant'|'weaveVolleys'>,beat:number,phrase=b.weaveVolleys??0){
 const at=phrase%2?BOSS_WEAVE.beats-1-beat:beat,target=BOSS_WEAVE.targets[at];
 return counterMuzzles(b).map((m,i)=>({...m,vx:((i?C.width-target:target)-m.x)*BOSS_WEAVE.vy/(C.playerY-m.y),vy:BOSS_WEAVE.vy}));
}
