import{CanvasRuntime}from'../src/game/canvas-runtime';import{defaults}from'../src/ui/storage';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';import assert from'node:assert/strict';
const path='./baseline.mjs',Old=(await import(path)).CanvasRuntime;
const seconds=Number(process.env.COPY_SECONDS??300),routes=seconds>300?['electric']:['ballistic','electric','optical'];
const stringify=(v:unknown)=>JSON.stringify(v,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
const results=[];
for(const route of routes){let clock=0;const slots:any[]=[];
 for(const Runtime of [Old,CanvasRuntime]){
  const save=defaults();save.openingWeapon='scatter';save.settings.sound=false;save.settings.shake=false;const slot:any={next:()=>{},text:[],notices:0};
  const properties:any={font:'20px sans-serif'};
  const ctx=new Proxy(properties, {get(_t,k){if(k==='measureText')return(s:string)=>{const n=parseFloat(String(properties.font).replace(/^700 /,''));return {width:Array.from(s).reduce((sum,c)=>sum+(/[\u3400-\u9fff]/u.test(c)?n:/\s/u.test(c)?n*.3:n*.58),0)};};if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return(...a:unknown[])=>{if(k==='fillText')slot.text.push(String(a[0]));};},set(t,k,v){t[k]=v;return true;}})as CanvasRenderingContext2D;
  slot.r=new Runtime({canvas:{getContext:()=>ctx}as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512})as HTMLImageElement,read:()=>structuredClone(save),write(s:unknown){slot.save=structuredClone(s);},sound(){},silence(){},now:()=>clock,requestFrame:f=>slot.next=f});await slot.r.load();slot.r.start();slots.push(slot);
 }
 const copies=new Map<string,any>();let wrappedFrames=0;
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
  const queue=(s:any)=>[s.r.buildFeedback,s.r.pendingBuildFeedback,s.r.equipmentFeedback.pending,s.r.notice,s.r.noticeDetail,s.r.noticeUntil];assert.equal(stringify(queue(slots[1])),stringify(queue(slots[0])),route+' receipt state');
  const copy=current.presentedCopy;if(copy){
   assert.equal(copy.lines.join(''),copy.detail);if(copy.lines.length>1)wrappedFrames++;
   for(const row of copy.rows){assert.ok(row.width<=560+1e-6);assert.ok(row.y-row.size/2>=copy.bounds.top);assert.ok(row.y+row.size/2<=copy.bounds.bottom);}
   assert.ok(copy.detailFont>=18,'Real game copy too small: '+copy.detail);
   copies.set(copy.title+'|'+copy.detail,{title:copy.title,detail:copy.detail,lines:copy.lines,titleFont:copy.titleFont,detailFont:copy.detailFont});
  }
  const notice=current.presentedNotice;if(notice)noticeFrames++;if(slots[1].text.some((t:string)=>t.startsWith('快拾取')))urgent++;
  const stale=w.bodies.filter((b:any)=>b.active&&b.kind==='pickup'&&b.y>1076);if(stale.length)expired++;
  if(current.notice&&clock<current.noticeUntil&&!notice)hidden++;
  assert.ok(!['result','error'].includes(current.mode),route+' unexpected terminal');
 }
 assert.ok(current.world.time>=seconds-1e-8);assert.ok(urgent>0&&expired>0&&noticeFrames>0);
 const out={route,seconds,frames:frame,time:current.world.time,round:current.world.round,hp:current.world.player.hp,pickups:current.world.pickups,gates:current.world.gatesTaken,urgentFrames:urgent,framesWithPassedPickup:expired,noticeFrames,framesWithSuppressedNotice:hidden,serializedWorldModeSaveEqual:true,receiptQueuesAndTimersEqual:true,wrappedFrames,copyCorpus:[...copies.values()]};results.push(out);console.log(JSON.stringify({...out,copyCorpus:out.copyCorpus.length}));
}
writeFileSync('build/qa/Stage-240/runtime-'+seconds+'.json',JSON.stringify({method:'Old and new CanvasRuntime, mock canvas and images, normal earned builds and same actual pointer/control inputs, virtual60Hz. Per-frame public serialized World, runtime mode and saved state equal. JS-private fields are not serialized. Approximate deterministic canvas font widths are only for state/layout checks, not actual visual acceptance or device performance. Receipt queues and timers also equal every frame.',results},null,2));
