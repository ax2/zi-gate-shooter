import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,plan=[1,2].includes(Number(query.get('plan')))?Number(query.get('plan')):0;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');
let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',targetRound=Math.max(2,Math.min(7,Number(query.get('round'))||2)),beat=0;const rewardView=query.has('reward');if(rewardView)targetRound=1;stored.openingWeapon='scatter';stored.nextBattlePlan=plan;stored.settings.sound=false;stored.settings.shake=false;const history=[],closing=[],shots=[],seenShots=new Set();
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('正常开局');}else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,drain=w.drainEffects.bind(w);w.drainEffects=()=>{const effects=drain();for(const e of effects){if(e.type==='drop-wave'&&e.text?.startsWith('终线'))closing.push({round:w.round,at:w.roundTime,time:w.time,label:e.text,ids:w.bodies.filter(b=>b.active).map(b=>b.id)});if(e.type==='closing-clear'){const row=closing.find(c=>c.round===w.round);if(row)row.reward={time:w.time,...e};}}return effects;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,plan,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,isolatedMemorySave:true,quality:runtime.save.settings.effects,closing:structuredClone(closing),shots:structuredClone(shots),bodies:w.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,lockX:b.lockX,lockShots:b.lockShots,forkshot:b.forkshot})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode+' / 战况'+plan;advance.disabled=running||runtime.mode!=='playing'||targetRound>7;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==769)runtime.touchStart(769,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(769,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):(w.canRefinePhoton()?'photon-reach':'burn')));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 const pack=closing.find(c=>c.round===w.round);
 // Only the first observation window deliberately aims at the clear outer lane.
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,!rewardView&&w.round===targetRound&&beat<2&&w.phase==='running'&&w.roundTime>=64?652:undefined));
 clock+=1000/60;next(clock);frame++;
 for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);const group=closing.find(c=>c.ids.includes(b.sourceId));if(group)shots.push({time:w.time,round:w.round,roundTime:w.roundTime,sourceId:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy,bankRemaining:b.bankRemaining,boostAfter:b.boostAfter});}
 const current=closing.find(c=>c.round===targetRound);
 if(w.round===targetRound&&current){
  if(rewardView){if(current.reward){targetRound=8;freeze('终线全歼已到账');return;}}else{
  if(beat===0&&w.roundTime>=current.at+.5){beat=1;freeze(current.label+' · 入场');return;}
  if(beat===1&&shots.some(s=>s.round===targetRound)&&w.roundTime>=current.at+1.6){beat=2;freeze(current.label+' · 实弹');return;}
  if(beat===1&&w.phase!=='running'){beat=2;freeze('先于出招全破');return;}
  if(beat===2&&(current.reward||w.phase!=='running')){beat=0;targetRound++;freeze(current.reward?'终线全歼已到账':'存在漏敌，无全歼奖励');return;}
 }
 }
 if(w.time>=800||['result','error'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<360&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__closingVariationsEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
