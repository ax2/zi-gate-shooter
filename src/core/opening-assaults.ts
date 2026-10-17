import type{Spawn}from'./director';

/** Bridge the cleared first patrol into the chapter's main attack.
 * Fixed roster and timing; never derived from damage, loadout or health. */
export function openingAssaults(round:number,mirror:boolean,variation:number):Spawn[]{
 const out:Spawn[]=[],sector=(round-1)%3,flip=round>1&&sector!==1&&variation%2===1;
 const x=(v:number)=>mirror!==flip?720-v:v;
 const add=(at:number,kind:Spawn['kind'],lane:number,y:number,pattern?:Spawn['pattern'],target?:number)=>{
  out.push({at,kind,x:x(lane),drop:true,dropY:y,pattern,lane:target===undefined?undefined:x(target),openingAssault:true});
 };
 if(sector===0){
  // First crate is on the left: introduce a right-hand screen, not a wall in
  // front of its pickup. Later chapters alternate sides around a fan gun.
  for(let row=0;row<(round===1?2:3);row++)for(const [i,lane]of(round===1?[440,520]:[240,480]).entries()){
   const gun=round>1&&row===1&&i===0;
   add(6.5+row*.9+i*.15,gun?'armor':'drone',lane,gun?350:390,gun?'fan':undefined);
   if(gun)out[out.length-1].opening=.1;
  }
 }else if(sector===1){
  add(6.5,'sniper',180,340,'lockshot');
  for(const [i,lane]of[570,150].entries()){
   add(7.3+i*.9,'charger',lane,350,'flank',i===0?440:280);
   add(7.65+i*.9,'drone',i===0?490:230,430);
  }
 }else{
  for(const [i,lane]of[240,480].entries()){
   add(6.5+i*.9,'armor',lane,350,'fan');out[out.length-1].opening=.1;
   add(6.8+i*.9,'drone',lane,470);
  }
 }
 out[0].dropLabel=['开场突围','开场猎袭','开场炮阵'][sector];
 out[0].dropDetail=['交替机群接战 · 转火清一翼再接补给','锁位哨机与两翼短刺 · 抢拆或避弹换位','双炮错时扇射 · 先拆一翼打开通路'][sector];
 return out;
}
