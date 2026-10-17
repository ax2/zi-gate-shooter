import type {Spawn} from './director';

/** Fixed chapter-specific reserves, independent of the player's equipment.
 * Each phrase alternates sides and keeps the opposite outer road available. */
export function pursuitWaves(round:number,mirror:boolean,variation:number):Spawn[]{
 if(round<=1)return [];
 const out:Spawn[]=[],sector=(round-1)%3;
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],label?:string,detail?:string,lane?:number)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,dropLabel:label,dropDetail:detail,...(lane===undefined?{}:{lane:mirror?720-lane:lane})});
 for(const [phrase,at] of (sector!==0?[.5,14,26]:[.5,18.5,28.5]).entries()){
  const left=(phrase+variation)%2===0,side=left?240:480,other=720-side;
  if(sector===0){
   // Two close clusters demand a quick clear followed by a real change of aim.
   for(let row=0;row<2;row++)for(const [i,x] of [side-50,side,side+50].entries()){
    const anchor=i===1&&variation>0,kind=anchor?(variation===1?'armor':row===0?'sniper':'charger'):'drone';
    const xx=row?720-x:x,pattern=kind==='armor'?'fan':kind==='sniper'?'lockshot':kind==='charger'?'flank':'weave';
    add(at+row*.9+i*.12,kind,xx,kind==='armor'?350:390,pattern,
     row===0&&i===0?['追击机群','炮机混编','锁位猎袭'][variation]:undefined,
     row===0&&i===0?['两批交替突入 · 清完一翼再转火','炮甲藏在机群中 · 优先拆炮再追散机','先拆锁位哨机 · 留意另一翼冲锋'][variation]:undefined,
     kind==='charger'?360:undefined);
    if(kind==='armor')out[out.length-1].opening=.1;
   }
  }else if(sector===1){
   // Staggered guns create actual shots if the player chases only the screen.
   add(at,'sniper',side,340,variation===2?'relocate':variation===1||phrase===0?'lockshot':undefined,
    ['双哨追击','锁位轮袭','游猎双哨'][variation],['先拆一翼哨机 · 留意实弹后换边','两翼先后锁定 · 诱射后转进或抢先拆炮','机动炮换位 · 三角炮封侧 · 留意实弹'][variation]);
   if(variation===2)out[out.length-1].opening=.1;
   add(at+1.2,'sniper',other,340,variation>0||phrase===0?'lockshot':undefined);
   if(variation===2)out[out.length-1].forkshot=true;
   // Moving guns already cross the center. Their screens keep fixed lanes so
   // the supply approach does not become a full-width weaving body barrier.
   const screen=variation===2?undefined:'weave';
   if(phrase===0){add(at,'guard',side,500);add(at+1.2,'guard',other,500);}
   else{add(at+.35,'drone',side-50,460,screen);add(at+.95,'drone',other+50,460,screen);}
   for(const [i,x]of[side+50,other-50].entries())add(at+.35+i*.6,'drone',x,460,screen);
  }else{
   // Front shield and rear fan gun are a small column, not another drone swarm.
   add(at,'guard',side,500,undefined,['盾炮追击','折返盾炮','游弋盾炮'][variation],
    ['前盾挡枪 · 转火后炮或集中击穿','前盾护炮 · 外射弹反弹一次 · 抢拆或换位','后炮横移扇射 · 跟枪拆炮或先破前盾'][variation]);
   add(at,'armor',side,320,variation===1?'bankshot':variation===2?'sweep':'fan',undefined,undefined,variation===2?other:undefined);
   for(const [i,x]of[other-45,other+45].entries())add(at+.45+i*.25,'drone',x,400,'weave');
  }
 }
 return out;
}
