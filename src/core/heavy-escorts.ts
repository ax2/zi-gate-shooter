import type {Spawn} from './director';

export const HEAVY_ESCORTS={starts:[14.7,37.7],follow:1.05,hold:3.2,durability:3} as const;
export const heavyEscortHolding=(b:{kind:string;pattern?:string;heavyReserve?:boolean;age:number})=>
 !!b.heavyReserve&&b.kind==='armor'&&(b.pattern==='fan'||b.pattern==='sweep')&&b.age<HEAVY_ESCORTS.hold;
/** Heavy chapters pressure two priorities: a shielded gun on one wing and
 * an independently killable charge on the other. Fixed authored durability. */
export function heavyEscorts(round:number,mirror:boolean,variation:number):Spawn[]{
 if(round<3||round%3!==0)return [];
 const out:Spawn[]=[];
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number,label?:string,detail?:string)=>out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,heavyReserve:true,dropLabel:label,dropDetail:detail});
 for(const [i,at]of HEAVY_ESCORTS.starts.entries()){
  const side=(i+variation)%2===0?240:480,other=720-side;
  add(at,'guard',side,520,undefined,undefined,['护炮压进','护炮折返','护炮游弋'][variation],
   ['前盾护后炮 · 拆盾压炮，或清另一翼换位','前盾护折返炮 · 留意沿边回来的实弹','前盾护横移炮 · 清侧翼后跟枪拆炮'][variation]);
  out[out.length-1].opening=.5;
  add(at+.12,'armor',side,320,variation===0?'fan':variation===1?'bankshot':'sweep',variation===2?other:undefined);
  out[out.length-1].opening=.5;
  for(const [j,x]of[other-45,other+45].entries())add(at+.3+j*.18,'drone',x,470);
  add(at+HEAVY_ESCORTS.follow,'charger',other,350,'flank',other<360?280:440);
  add(at+HEAVY_ESCORTS.follow+.2,'drone',other,500);
 }
 return out;
}
