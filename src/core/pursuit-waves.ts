import type {Spawn} from './director';

/** Fixed chapter-specific reserves, independent of the player's equipment.
 * Each phrase alternates sides and keeps the opposite outer road available. */
export function pursuitWaves(round:number,mirror:boolean,variation:number):Spawn[]{
 if(round<=1)return [];
 const out:Spawn[]=[],sector=(round-1)%3;
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],label?:string,detail?:string)=>
  out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,dropLabel:label,dropDetail:detail});
 for(const [phrase,at] of (sector!==0?[.5,14,26]:[.5,18.5,28.5]).entries()){
  const left=(phrase+variation)%2===0,side=left?240:480,other=720-side;
  if(sector===0){
   // Two close clusters demand a quick clear followed by a real change of aim.
   for(let row=0;row<2;row++)for(const [i,x] of [side-50,side,side+50].entries())
    add(at+row*.9+i*.12,'drone',row?720-x:x,390,'weave',row===0&&i===0?'追击机群':undefined,row===0&&i===0?'两批交替突入 · 清完一翼再转火':undefined);
  }else if(sector===1){
   // Staggered guns create actual shots if the player chases only the screen.
   add(at,'sniper',side,340,phrase===0?'lockshot':undefined,'双哨追击','先拆一翼哨机 · 留意实弹后换边');
   add(at+1.2,'sniper',other,340,phrase===0?'lockshot':undefined);
   if(phrase===0){add(at,'guard',side,500);add(at+1.2,'guard',other,500);}
   else{add(at+.35,'drone',side-50,460,'weave');add(at+.95,'drone',other+50,460,'weave');}
   for(const [i,x]of[side+50,other-50].entries())add(at+.35+i*.6,'drone',x,460,'weave');
  }else{
   // Front shield and rear fan gun are a small column, not another drone swarm.
   add(at,'guard',side,500,undefined,'盾炮追击','前盾挡枪 · 转火后炮或集中击穿');
   add(at,'armor',side,320,'fan');
   for(const [i,x]of[other-45,other+45].entries())add(at+.45+i*.25,'drone',x,400,'weave');
  }
 }
 return out;
}
