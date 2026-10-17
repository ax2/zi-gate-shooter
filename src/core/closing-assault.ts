import type{Spawn}from'./director';
export const CLOSING_ASSAULT_AT=68;
/** One authored closing fight after the road and its rewards are clear.
 * Faster kills buy an earlier boss, never damage-scaled enemy durability. */
export function closingAssault(round:number,mirror:boolean):Spawn[]{
 const out:Spawn[]=[],sector=(Math.max(1,round)-1)%3;
 const add=(kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number)=>out.push({at:CLOSING_ASSAULT_AT,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,closing:true,opening:kind==='guard'?1.5:.1});
 if(sector===0){add('guard',360,500);add('armor',360,320,'fan');add('drone',240,390);add('drone',480,390);}
 else if(sector===1){add('sniper',360,340,'lockshot');add('charger',150,350,'flank',280);add('charger',570,350,'flank',440);}
 else{add('armor',240,350,'fan');add('armor',480,350,'fan');add('guard',360,500);}
 return out;
}
export const closingBrief=(round:number)=>([
 {title:'终线突破',detail:'前盾护炮 · 拆盾压炮后直面首领'},
 {title:'终线猎袭',detail:'中路锁位 · 两翼短刺 · 清场后首领接近'},
 {title:'终线炮阵',detail:'双炮错位扇射 · 集火一翼打开缺口'},
]as const)[(Math.max(1,round)-1)%3];
