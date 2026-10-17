import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const baseline=new URL(location.href).searchParams.get('version')==='baseline',Runtime=baseline?(await import('/build/qa/Stage-225/baseline.mjs')).CanvasRuntime:CanvasRuntime;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',targetRound=1;stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[],sources=[],shots=[],seenShots=new Set();
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,spawn=w.spawn.bind(w);w.spawn=(...args)=>{const b=spawn(...args);if(w.phase==='running'&&w.roundTime>=6.5&&w.roundTime<8.7&&b.y>=300)sources.push({b,round:w.round,at:w.roundTime});return b;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,baseline,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,quality:runtime.save.settings.effects,hp:w.player.hp,growth:{...w.growth},sources:sources.map(({b,...s})=>({...s,id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age})),shots:shots.map(s=>({...s})),bodies:w.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,lockX:b.lockX})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||targetRound>3;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?'spread':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,w.phase==='running'&&w.round===targetRound&&targetRound>1&&w.roundTime>=5&&w.roundTime<10?652:undefined));
 clock+=1000/60;next(clock);frame++;
 for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);const source=sources.find(s=>s.b.id===b.sourceId);if(source)shots.push({time:w.time,round:w.round,roundTime:w.roundTime,sourceId:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}
 if(w.phase==='running'&&w.round===targetRound){
  if(targetRound===1&&w.roundTime>=8.2){targetRound++;freeze(baseline?'旧开场等待':'开场突围');return;}
  if(targetRound>1&&shots.some(s=>s.round===targetRound)&&w.roundTime>=8.2){const label=targetRound===2?'开场猎袭':'开场炮阵';targetRound++;freeze(label);return;}
  if(targetRound>1&&w.roundTime>=12){targetRound++;freeze('cleared-before-shot');return;}
 }
 if(w.time>=300||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__openingEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
