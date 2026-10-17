import type {Spawn} from './director';
export const FLANK_SUPPLY_AT=46;

/** Three visible pressure phrases, separated from the existing special encounters.
 * Counts are authored, never based on the player's damage or weapon selection. */
export function chapterAssaults(round:number,mirror:boolean,variation:number):Spawn[]{
 const sector=(round-1)%3,out:Spawn[]=[];
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,dropLabel:label,dropDetail:detail});
 // Flank interception overlaps the supply approach, then releases before the
 // 55.5s guard/sentry tail. Heavy waves crest before their existing battery.
 for(const [phrase,start] of [10,21,sector===2?47:sector===1?FLANK_SUPPLY_AT:53.5].entries()){
  const flip=(phrase+variation)%2===1;
  const x=(value:number)=>flip?720-value:value;
  if(sector===0){
   // Split clusters: a concentrated volley clears one group; the other keeps moving.
   const opening=round===1&&phrase<2,lanes=opening?[200,360,520]:[200,280,440,520];
   for(let row=0;row<(opening?2:3);row++)for(const [i,lane] of lanes.entries())
    add(start+row*1.05+i*.12,'drone',x(lane),330+row*25,undefined,undefined,
     row===0&&i===0?'集群突破':undefined,row===0&&i===0?'连续机群 · 集火开路再转火':undefined);
  }else if(sector===1){
   // Opposite-side arrivals alternate instead of closing both exits simultaneously.
   for(let row=0;row<3;row++){
    const left=row%2===0,side=left?150:570;
    const target=phrase===2?(left?280:440):(left?460:260);
    add(start+row*1.35,'charger',x(side),330,'flank',x(target),row===0?(phrase===2?'补给截击':'侧翼轮袭'):undefined,row===0?(phrase===2?'两翼短刺 · 先清近敌再接补给':'两翼错时内切 · 清掉一侧后转移'):undefined);
    for(const lane of [side,left?230:490])add(start+row*1.35+.45,'drone',x(lane),390,'weave');
   }
  }else{
   // Fewer but heavier anchors, with a staggered screen rather than another swarm.
   for(let row=0;row<3;row++){
    // Keep 120px from the existing outer supply guards and their nameplates.
    const side=row%2===0?300:420;
    const breach=phrase===1&&row<2;
    add(breach?start:start+row*1.8,'armor',x(breach?420:side),breach?(row===0?550:350):350,breach?'fire-control':'fan',undefined,
     row===0&&!breach?'重装梯队':undefined,row===0&&!breach?'前后错层炮甲 · 穿列或集中拆炮':undefined);
    if(breach)out[out.length-1].breach=true;
    for(const [i,lane] of [side-60,side+60].entries()){
     if(phrase===1&&row===0&&i===1){
      add(start,'conduit',x(180),450,'fire-control',undefined,'破阵重炮','先拆侧方中继停炮开甲 · 或等开火后强拆');
      out[out.length-1].breach=true;
     }else add(start+row*1.8+.6,'drone',x(lane),470);
    }
   }
  }
 }
 return out;
}
