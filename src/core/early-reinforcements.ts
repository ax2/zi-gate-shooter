import type{Spawn}from'./director';

/** Fixed early pursuit, bridging the upgraded opening into the 6.5s assault.
 * Stagger each arrival so one splash cannot erase an entire unseen row. */
export function earlyReinforcements(round:number,mirror:boolean,variation:number):Spawn[]{
 if(round<=1)return [];
 const out:Spawn[]=[],sector=(round-1)%3;
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,earlyReserve:true,dropLabel:label,dropDetail:detail});
 for(const [row,at]of[2.6,4.8].entries()){
  const side=(row+variation)%2===0?240:480,other=720-side;
  if(sector===0){
   for(const [i,x]of[side-55,side,side+55].entries()){
    const charger=row===1&&i===1;
    add(at+i*.28,charger?'charger':'drone',x,charger?340:390,charger?'rebound':undefined,charger?other:undefined,
     row===0&&i===0?'追兵接战':undefined,row===0&&i===0?'两批机群交替 · 后批冲锋折返 · 清翼再转火':undefined);
   }
  }else if(sector===1){
   const lane=side<360?150:570;
   add(at,'charger',lane,350,'flank',side<360?280:440,row===0?'双翼追兵':undefined,row===0?'两翼错时短刺 · 清掉近侧再换边':undefined);
   // Short-cut chargers already contest the inside. Screens keep fixed lanes
   // so the outer road remains a useful escape after the pursuit joins in.
   for(const [i,x]of[side-45,side+45].entries())add(at+.35+i*.28,'drone',x,430);
  }else{
   const moving=row===1;
   add(at,'armor',side,350,moving?'sweep':'fan',moving?other:undefined,row===0?'炮群接战':undefined,row===0?'锚炮后接横移炮 · 拆炮并留意后续实弹':undefined);
   // The moving reserve can be admitted late beside the original 6.5s guns.
   // Its extra lead prevents their first fan volleys from synchronizing.
   out[out.length-1].opening=moving?1:.1;
   for(const [i,x]of[other-45,other+45].entries())add(at+.35+i*.28,'drone',x,440);
  }
 }
 return out;
}
