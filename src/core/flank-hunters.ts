import type{Spawn}from'./director';
export const FLANK_HUNTERS={starts:[18.6,36.2,40.3],follow:1.05}as const;
/** Second-cycle flanks get three authored pursuit packs. Every pack arrives in
 * opposite-side groups; no player/DPS sampling or new durability multiplier. */
export function flankHunters(round:number,mirror:boolean,variation:number):Spawn[]{
 if(round<5||round%3!==2)return[];
 const out:Spawn[]=[];
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,flankReserve:true,dropLabel:label,dropDetail:detail});
 for(const [i,at]of FLANK_HUNTERS.starts.entries()){
  const left=(i+variation)%2===0,side=left?180:540,other=720-side;
  const gun=variation>0;
  add(at,gun?'sniper':'charger',side,350,gun?(variation===1?'lockshot':'relocate'):'flank',gun?(variation===2?other:undefined):(left?280:440),
   ['交剪追猎','锁位接力','游猎回袭'][variation],['两翼错时冲锋 · 清一翼后转进','先拆锁位哨 · 后翼冲锋接战','机动哨换位 · 后翼折返追击'][variation]);
  if(gun)out[out.length-1].opening=.1;
  for(const [j,x]of[other-45,other+45].entries())add(at+.2+j*.2,'drone',x,470);
  add(at+FLANK_HUNTERS.follow,'charger',other,350,variation===2?'rebound':'flank',left?440:280);
  for(const [j,x]of[side-45,side+45].entries())add(at+FLANK_HUNTERS.follow+.2+j*.2,'drone',x,470);
 }
 return out;
}
