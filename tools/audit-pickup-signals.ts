import{CanvasRuntime}from'../src/game/canvas-runtime';import{defaults}from'../src/ui/storage';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';import assert from'node:assert/strict';
const path='./baseline.mjs',Old=(await import(path)).CanvasRuntime;
const seconds=Number(process.env.SIGNAL_SECONDS??300),routes=seconds>300?['electric']:['ballistic','electric','optical'];
const stringify=(v:unknown)=>JSON.stringify(v,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const results=[];
for(const route of routes){let clock=0;const slots:any[]=[];
 for(const Runtime of [Old,CanvasRuntime]){
  const save=defaults();save.openingWeapon='scatter';save.settings.sound=false;save.settings.shake=false;const slot:any={next:()=>{},text:[],notices:0};
  const ctx=new Proxy({}, {get(_t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return(...a:unknown[])=>{if(k==='fillText')slot.text.push(String(a[0]));};},set(){return true;}})as CanvasRenderingContext2D;
  slot.r=new Runtime({canvas:{getContext:()=>ctx}as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512})as HTMLImageElement,read:()=>structuredClone(save),write(s:unknown){slot.save=structuredClone(s);},sound(){},silence(){},now:()=>clock,requestFrame:f=>slot.next=f});await slot.r.load();slot.r.start();slots.push(slot);
 }
 const current=slots[1].r;let aim=360,urgent=0,expired=0,noticeFrames=0,hidden=0,frame=0;
 const action=(name:string)=>{for(const s of slots)assert.equal(s.r.activateControl(name),true,name);};
 while(current.world.time<seconds-1e-8&&frame<seconds*60+1800){
  const w=current.world;if(current.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)action('build:'+r);}
  if(current.mode==='branch'){const r=current.branchRoute;action('branch:'+(r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':'burn'));}
  if(current.mode==='boss-reward')action('boss-claim:research');
  if(frame%6===0&&current.mode==='playing'){
   aim=progressionTarget(w);for(const s of slots){const scale=390/720,pad=(844-1280*scale)/2;s.r.cancelTouch();s.r.touchStart(738,s.r.world.player.x*scale,pad+900*scale);s.r.touchMove(738,aim*scale,pad+900*scale);}
  }
  clock+=1000/60;for(const s of slots){s.text=[];s.next(clock);}frame++;
  assert.equal(stringify(current.world),stringify(slots[0].r.world),route+' World frame'+frame);assert.equal(current.mode,slots[0].r.mode,route+' mode');assert.equal(stringify(slots[1].save),stringify(slots[0].save),route+' save');
  const notice=current.presentedNotice;if(notice)noticeFrames++;if(slots[1].text.some((t:string)=>t.startsWith('快拾取')))urgent++;
  const stale=w.bodies.filter((b:any)=>b.active&&b.kind==='pickup'&&b.y>1076);if(stale.length)expired++;
  if(current.notice&&clock<current.noticeUntil&&!notice)hidden++;
  assert.ok(!['result','error'].includes(current.mode),route+' unexpected terminal');
 }
 assert.ok(current.world.time>=seconds-1e-8);assert.ok(urgent>0&&expired>0&&noticeFrames>0);
 const out={route,seconds,frames:frame,time:current.world.time,round:current.world.round,hp:current.world.player.hp,pickups:current.world.pickups,gates:current.world.gatesTaken,urgentFrames:urgent,framesWithPassedPickup:expired,noticeFrames,framesWithSuppressedNotice:hidden,serializedWorldModeSaveEqual:true};results.push(out);console.log(JSON.stringify(out));
}
writeFileSync('build/qa/Stage-232/runtime-'+seconds+'.json',JSON.stringify({method:'Old and new CanvasRuntime, mock canvas and images, normal earned builds and same actual pointer/control inputs, virtual60Hz. Per-frame public serialized World, runtime mode and saved state equal. JS-private fields are not serialized. Not visual or human-performance evidence.',results},null,2));
