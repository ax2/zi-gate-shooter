import type {Spawn} from './director';
export const HEAVY_PUSH={first:28.8,second:30.1,nearY:680,rearY:500} as const;
/** A heavy-chapter gate fight: clear the close screen, charge the original gates
 * under staggered rear fire, then finish the column after crossing. */
export function heavyCounterPush(round:number,mirror:boolean,variation:number):Spawn[]{
 if((Math.max(1,round)-1)%3!==2)return [];
 const out:Spawn[]=[],side=variation===1?520:200,other=720-side;
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number)=>out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane});
 const first=variation===0?'fan':'sweep',second=variation===1?'fan':'sweep';
 add(HEAVY_PUSH.first,'armor',side,300,first,first==='sweep'?other:undefined);out[0].opening=.1;
 out[0].dropLabel=['门后反压','游弋反压','双翼反压'][variation];out[0].dropDetail='先清近侧轻机 · 边充门边避后炮实弹';
 for(const [i,x]of[side-60,side+60].entries())add(HEAVY_PUSH.first+.25+i*.12,'drone',x,HEAVY_PUSH.nearY);
 add(HEAVY_PUSH.second,'armor',other,350,second,second==='sweep'?side:undefined);out[out.length-1].opening=.35;
 for(const [i,x]of[other-60,other+60].entries())add(HEAVY_PUSH.second+.25+i*.12,'drone',x,HEAVY_PUSH.rearY);
 return out;
}
