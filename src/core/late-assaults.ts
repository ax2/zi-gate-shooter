import type{Spawn}from'./director';
/** Authored late chapter counterattacks. No player state, damage or RNG input. */
export const LATE_ASSAULT={hold:3.2,durability:{armor:2,sniper:2,elite:2}}as const;
export const lateAssaultDurability=(kind:string,pattern?:string)=>pattern==='bankshot'?1:LATE_ASSAULT.durability[kind as keyof typeof LATE_ASSAULT.durability]??1;
export const lateAssaultHolding=(b:{kind:string;pattern?:string;lateAssault?:boolean;age:number})=>!!b.lateAssault&&b.kind==='armor'&&(b.pattern==='fan'||b.pattern==='sweep')&&b.age<LATE_ASSAULT.hold;
export function lateAssaults(round:number,mirror:boolean,variation:number):Spawn[]{
 const sector=(Math.max(1,round)-1)%3,start=sector===0?53.5:sector===1?46:47,out:Spawn[]=[];
 const flip=mirror!==!!(variation%2);
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number)=>out.push({at,kind,x:flip?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:flip?720-lane:lane,lateAssault:true});
 if(sector===0){
  for(let row=0;row<4;row++)for(const[i,lane]of[200,290,430,520].entries()){
   const anchor=row===0&&i===2||variation>0&&row===2&&i===1;
   const shield=row===0&&i===1;
   const kind=anchor?(variation===0?'elite':'armor'):shield?'guard':'drone';
   const x=shield?430:lane,pattern=kind==='elite'?'intercept':kind==='armor'?(variation===2?'sweep':'fan'):undefined;
   add(start+row*1.05+i*.12,kind,x,kind==='elite'||kind==='armor'?330:shield?550:420+row*20,pattern,pattern==='sweep'?720-x:undefined);
  }
 }else if(sector===1){
  for(let row=0;row<4;row++){
   const left=row%2===0,x=left?180:540,other=720-x,gun=row===0||row===3||variation===2&&row===2;
   add(start+row*1.35,gun?'sniper':'charger',x,350,gun?(variation===2||row===3?'relocate':'lockshot'):variation>0?'rebound':'flank',gun?(variation===2||row===3?other:undefined):(left?440:280));
   if(gun)out[out.length-1].opening=.1;
   if(gun&&variation===1)out[out.length-1].forkshot=true;
   for(const lane of[x,left?260:460])add(start+row*1.35+.45,'drone',lane,460,variation===2?undefined:'weave');
  }
 }else{
  for(let row=0;row<4;row++){
   const x=row%2===0?240:480,pattern=variation===1?'bankshot':variation===2?'sweep':row===2?'booster':'fan';
   add(start+row*1.8,'armor',x,350,pattern,pattern==='sweep'?720-x:undefined);out[out.length-1].opening=.35;
   add(start+row*1.8+.35,row===0?'guard':'drone',x,row===0?550:470);
   add(start+row*1.8+.6,'drone',720-x,470);
  }
 }
 const labels=sector===0?['压阵突击','双炮推进','游弋夹炮']:sector===1?['双翼猎袭','三角追猎','游猎换阵']:['错层压进','折返封锁','双翼炮阶'];
 const details=sector===0?'前盾护后炮 · 轻机连续压进 · 先破一翼再转火':sector===1?'两翼交班接战 · 追拆哨机或诱射后换位':'前盾掩护错层炮 · 清近敌再拆后炮 · 留意实弹';
 if(out[0]){out[0].dropLabel=labels[variation];out[0].dropDetail=details;}
 return out;
}
