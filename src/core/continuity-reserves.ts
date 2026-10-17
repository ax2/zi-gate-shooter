import type {Spawn} from './director';

/** Fixed reserves bridge measured quiet spans. Flank chapters already have
 * continuous hunters here, so receive no additional bodies. Never follows DPS. */
export function continuityReserves(round:number,mirror:boolean,variation:number):Spawn[]{
 const out:Spawn[]=[],sector=(Math.max(1,round)-1)%3;
 const side=variation===1?480:240,other=720-side;
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,dropLabel:label,dropDetail:detail});
 if(round===1){
  for(const [row,at]of[32.1,32.9].entries())for(const [i,x]of[side-45,side+45].entries())
   add(at+i*.18,'drone',row?720-x:x,460,undefined,undefined,row===0&&i===0?'追兵穿插':undefined,row===0&&i===0?'两翼错时接战 · 清掉近侧再转火':undefined);
 }else if(sector===0){
  for(const [i,x]of[side-60,side,side+60].entries())add(40.3+i*.18,'drone',x,460,variation===2?'weave':undefined,undefined,i===0?'机群续袭':undefined,i===0?'清近侧轻机 · 留意后续火箭炮':undefined);
  add(46.1,'armor',other,350,'booster',undefined,'火箭增援','两侧火箭错时加速 · 先拆一炮再接补给');
  out[out.length-1].opening=.5;
  add(46.35,'armor',side,350,'booster');out[out.length-1].opening=.5;
  add(46.55,'drone',side,550);
 }else if(sector===2){
  add(19.1,'armor',side,350,'bankshot',undefined,'折返接战','外射弹沿边折返 · 清近敌或抢拆后炮');
  for(const [i,x]of[other-50,other+50,other].entries())add(19.3+i*.28,'drone',x,500+i*35);
 }
 return out;
}
