import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,targetRound=query.get('round')==='6'?6:3;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',beat=0;stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[],groups=[],shots=[],seenShots=new Set();
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,drain=w.drainEffects.bind(w);w.drainEffects=()=>{const effects=drain();for(const e of effects)if(e.type==='drop-wave'&&e.text?.startsWith('终线'))groups.push({round:w.round,at:w.roundTime,time:w.time,label:e.text,ids:w.bodies.filter(b=>b.active&&b.pattern==='rake').map(b=>b.id)});return effects;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,quality:runtime.save.settings.effects,hp:w.player.hp,growth:{...w.growth},groups:groups.map(g=>({...g,ids:[...g.ids]})),shots:shots.map(s=>({...s})),bodies:w.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,timer:b.timer,volley:b.rakeVolley,fired:b.rakeFiredVolley,accepted:b.rakeShots})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||beat>=5;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-penetrator':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'spread'):w.canRefinePhoton()?'photon-reach':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,w.phase==='running'&&w.round===targetRound&&w.roundTime>=64&&beat<4?68:undefined));
 clock+=1000/60;next(clock);frame++;
 const group=groups.find(g=>g.round===targetRound);
 for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);if(group?.ids.includes(b.sourceId))shots.push({time:w.time,round:w.round,roundTime:w.roundTime,sourceId:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}
 if(w.round===targetRound&&group){
  const guns=w.bodies.filter(b=>b.active&&group.ids.includes(b.id)),count=shots.filter(s=>s.round===targetRound).length;
  if(beat===0&&guns.some(b=>b.warning>0)){beat=1;freeze('rake-charge');return;}
  if(beat>=1&&beat<=3&&count>=beat*(targetRound===6?6:3)){const label='rake-beat-'+beat;beat++;freeze(label);return;}
  if(beat<4&&!guns.length){beat=4;freeze('cleared-before-all-beats');return;}
  if(beat===4&&w.phase==='boss-entry'&&w.phaseTime>=1.7){beat=5;freeze('boss-entry');return;}
 }
 if(w.time>=650||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__rakeEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
