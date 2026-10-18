import type{Spawn}from'./director';
import{RAKE}from'./rake-gun';
import{battleIndex,type BattlePlan}from'./battle-plan';
import type{EnemyKind}from'./config';
export const CLOSING_ASSAULT_AT=68;
export const CLOSING_CLEAR_CHARGE=40;
/** Fixed veteran equipment, never scaled from player DPS. Intro stays unchanged. */
export const closingDurability=(round:number,kind:EnemyKind)=>round<=1?1:({armor:3,sniper:3,guard:2,charger:2}as Partial<Record<EnemyKind,number>>)[kind]??1;
/** One authored closing fight after the road and its rewards are clear.
 * Faster kills buy an earlier boss, never damage-scaled enemy durability. */
export function closingAssault(round:number,mirror:boolean,plan:BattlePlan=0):Spawn[]{
 const out:Spawn[]=[],sector=(Math.max(1,round)-1)%3,variation=battleIndex(round,plan);
 const add=(kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number)=>out.push({at:CLOSING_ASSAULT_AT,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane,closing:true,opening:kind==='guard'?1.5:.1});
 if(sector===0){
  if(variation===1){add('guard',220,500);add('armor',220,320,'bankshot');add('drone',500,390);add('drone',500,490);}
  else if(variation===2){add('guard',360,500);add('armor',500,350,'sweep',220);add('drone',180,430);add('drone',540,430);}
  else{add('guard',360,500);add('armor',360,320,'fan');add('drone',240,390);add('drone',480,390);}
 }else if(sector===1){
  if(variation===1){add('sniper',220,340,'relocate',220);out[out.length-1].opening=1;add('charger',150,480,'rebound',280);add('charger',570,350,'flank',440);}
  else if(variation===2){add('sniper',500,340,'lockshot');out[out.length-1].forkshot=true;add('charger',150,350,'rebound',280);add('charger',570,350,'rebound',440);}
  else{add('sniper',360,340,'lockshot');add('charger',150,350,'flank',280);add('charger',570,350,'flank',440);}
 }else{
  if(variation===1){add('armor',220,320,'bankshot');add('armor',500,350,'rake');add('guard',220,500);}
  else if(variation===2){add('armor',220,350,'sweep',500);add('armor',500,350,'booster');add('guard',360,500);}
  else{add('armor',240,350,round>=6?'rake':'fan');add('armor',480,350,'rake');if(round>=6)out[out.length-1].opening=.1+RAKE.stagger;add('guard',360,500);}
 }
 return out;
}
export function closingBrief(round:number,plan:BattlePlan=0){
 const variation=battleIndex(round,plan),sector=(Math.max(1,round)-1)%3;
 if(variation>0)return ([
  [{title:'终线折返护炮',detail:'侧盾护折返炮 · 拆盾抢炮或转进另一翼'}, {title:'终线游弋护炮',detail:'炮机横移离盾 · 跟枪拆炮，留意侧翼轻机'}],
  [{title:'终线游猎接刺',detail:'机动哨换位 · 近翼折返，先清近敌'}, {title:'终线三角回袭',detail:'三角实弹接双翼折返 · 抢拆哨机再转进'}],
  [{title:'终线折返旋扫',detail:'侧盾护折返炮 · 另一翼旋扫，先拆一炮'}, {title:'终线火箭游击',detail:'横移炮牵制 · 火箭先缓后快，先拆一翼'}],
 ] as const)[sector][variation-1];
 return round%3===0?{title:round>=6?'终线旋扫·双炮':'终线旋扫',detail:'三拍连续转向 · 抢拆一炮或随实弹换位'}:([
 {title:'终线突破',detail:'前盾护炮 · 拆盾压炮后直面首领'},
 {title:'终线猎袭',detail:'中路锁位 · 两翼短刺 · 清场后首领接近'},
 {title:'终线炮阵',detail:'双炮错位扇射 · 集火一翼打开缺口'},
]as const)[(Math.max(1,round)-1)%3];
}
