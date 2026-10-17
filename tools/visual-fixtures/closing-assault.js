import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,baseline=query.get('version')==='baseline',Runtime=baseline?(await import('/build/qa/Stage-223/baseline.mjs')).CanvasRuntime:CanvasRuntime;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',targetRound=query.get('view')==='heavy'?3:query.get('view')==='flank'?2:1,watch='closing',bossStarted=null;stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[],closing=[],shots=[],bosses=[],seenShots=new Set();
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,drain=w.drainEffects.bind(w);w.drainEffects=()=>{const effects=drain();for(const e of effects)if(e.type==='drop-wave'&&e.text?.startsWith('终线'))closing.push({round:w.round,at:w.roundTime,time:w.time,label:e.text,ids:w.bodies.filter(b=>b.active).map(b=>b.id)});return effects;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,baseline,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,quality:runtime.save.settings.effects,hp:w.player.hp,growth:{...w.growth},closing:closing.map(c=>({...c,ids:[...c.ids]})),shots:shots.map(s=>({...s})),bosses:bosses.map(b=>({...b})),bodies:w.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,lockX:b.lockX,lockShots:b.lockShots})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||targetRound>3||baseline&&stage==='baseline-wait';}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?'spread':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 const pack=closing.find(c=>c.round===w.round);
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,watch==='closing'&&w.phase==='running'&&w.round===targetRound&&(pack&&w.roundTime<pack.at+3||query.has('view')&&w.roundTime>=64)?652:undefined));
 const priorPhase=w.phase;clock+=1000/60;next(clock);frame++;if(w.phase==='boss'&&priorPhase!=='boss')bossStarted=w.time;if(priorPhase==='boss'&&w.phase!=='boss'&&bossStarted!==null){bosses.push({round:w.round,from:bossStarted,to:w.time,seconds:w.time-bossStarted});bossStarted=null;}
 for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);const group=closing.find(c=>c.ids.includes(b.sourceId));if(group)shots.push({time:w.time,round:w.round,roundTime:w.roundTime,sourceId:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}
 const current=closing.find(c=>c.round===targetRound);
 if(baseline&&w.round===1&&w.roundTime>=69.5&&w.phase==='running'){freeze('baseline-wait');return;}
 if(!baseline&&w.round===targetRound&&watch==='closing'&&current){
  if(shots.some(s=>s.round===targetRound)&&w.roundTime>=current.at+.75){watch='entry';freeze(current.label);return;}
  if(w.phase!=='running'){watch='entry';freeze('cleared-before-shot');return;}
 }
 if(!baseline&&w.round===targetRound&&watch==='entry'&&w.phase==='boss-entry'&&w.phaseTime>=1.7){targetRound++;watch='closing';freeze('boss-entry-'+w.round);return;}
 if(w.time>=400||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__closingEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
