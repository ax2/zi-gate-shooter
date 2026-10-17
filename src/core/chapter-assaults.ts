import type {Spawn} from './director';

/** Three visible pressure phrases, separated from the existing special encounters.
 * Counts are authored, never based on the player's damage or weapon selection. */
export function chapterAssaults(round:number,mirror:boolean,variation:number):Spawn[]{
 const sector=(round-1)%3,out:Spawn[]=[];
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,dropLabel:label,dropDetail:detail});
 for(const [phrase,start] of [10,21,53.5].entries()){
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
    add(start+row*1.35,'charger',x(side),330,'flank',x(left?460:260),row===0?'侧翼轮袭':undefined,row===0?'两翼错时内切 · 清掉一侧后转移':undefined);
    for(const lane of [side,left?230:490])add(start+row*1.35+.45,'drone',x(lane),390,'weave');
   }
  }else{
   // Fewer but heavier anchors, with a staggered screen rather than another swarm.
   for(let row=0;row<3;row++){
    // Keep 120px from the existing outer supply guards and their nameplates.
    const side=row%2===0?300:420;
    add(start+row*1.8,'armor',x(side),350,'fan',undefined,row===0?'重装梯队':undefined,row===0?'前后错层炮甲 · 穿列或集中拆炮':undefined);
    for(const lane of [side-60,side+60])add(start+row*1.8+.6,'drone',x(lane),470);
   }
  }
 }
 return out;
}
