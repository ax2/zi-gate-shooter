import type {Spawn} from './director';
/** Authored immediate contact: ordinary durability, visible deployment grace.
 * Five members per chapter; the original three retain their timings and lanes. */
export function vanguardPatrol(round:number,mirror:boolean):Spawn[]{
 const sector=(Math.max(1,round)-1)%3,out:Spawn[]=[];
 const add=(at:number,kind:Spawn['kind'],x:number,y:number,pattern?:Spawn['pattern'],lane?:number)=>out.push({at,kind,x:mirror?720-x:x,drop:true,dropY:y,pattern,lane:lane===undefined?undefined:mirror?720-lane:lane});
 if(sector===0){
  add(1,'drone',360,360);add(1.35,'drone',240,360);add(1.7,'drone',480,360);
  add(3.5,'drone',210,360);add(5.5,'drone',510,360);
 }else if(sector===1){
  add(1,'drone',200,390,'weave');add(1.35,'charger',570,350,'flank',440);
  add(2.2,'drone',520,390,'weave');add(2.75,'drone',230,430,'weave');
  add(4.5,'charger',140,330,'flank',480);
 }else{
  add(1,'armor',360,350,'fan');out[0].opening=.35;
  add(1.35,'drone',240,460);add(1.7,'drone',480,460);
  add(4,'drone',360,390);add(5.5,'drone',360,390);
 }
 out[0].dropLabel=['先遣集群','先遣猎袭','先遣炮屏'][sector];
 out[0].dropDetail=['轻机展开两翼 · 集火一组再转向','右翼短刺接左翼长切 · 先清近敌再转进','中路炮机带前屏 · 穿列拆炮或清翼换位'][sector];
 return out;
}

/** Two small pursuit groups fill the measured introductory56.6–62s lull.
 * The original58s gate and62s release stay scheduled; neither is replaced. */
export function introPursuit():Spawn[]{
 return [57.5,59.5].flatMap((at,row)=>[200,270,340].map((x,i)=>({at:at+i*.12,kind:'drone' as const,x:row?720-x:x,drop:true,dropY:360,dropLabel:row===0&&i===0?'门前追兵':undefined,dropDetail:row===0&&i===0?'两批机群交替 · 清掉近侧，再转火充门':undefined})));
}
