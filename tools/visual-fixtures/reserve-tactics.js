import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,baseline=query.get('version')==='baseline',Runtime=baseline?(await import('/build/qa/Stage-222/baseline.mjs')).CanvasRuntime:CanvasRuntime;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=0;stored.openingWeapon='scatter';stored.nextBattlePlan=query.get('plan')==='0'?0:query.get('plan')==='2'?2:1;stored.settings.sound=false;stored.settings.shake=false;
const checkpoints=stored.nextBattlePlan===0?[{round:4,kind:'armor',pattern:'fan',name:'炮机混编'},{round:5,kind:'sniper',pattern:'lockshot',name:'锁位轮袭'}]:stored.nextBattlePlan===2?[{round:2,kind:'sniper',pattern:'lockshot',fork:true,name:'游猎双哨'},{round:3,kind:'armor',pattern:'sweep',name:'游弋盾炮'}]:[{round:3,kind:'armor',pattern:'bankshot',name:'折返盾炮'},{round:4,kind:'sniper',pattern:'lockshot',name:'锁位猎袭'}];const history=[],shots=[],born=new Map(),seenShots=new Set();
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,spawn=w.spawn.bind(w);w.spawn=(...args)=>{const b=spawn(...args);born.set(b.id,{b,round:w.round,at:w.roundTime,initialX:b.x});return b;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,baseline,normalEarnedFlow:true,initialBattlePlan:runtime.world.battlePlan,worldInjection:false,virtual60Hz:true,quality:runtime.save.settings.effects,hp:w.player.hp,growth:{...w.growth},shots:shots.map(s=>({...s})),enemies:w.bodies.filter(b=>b.active&&['drone','charger','armor','sniper','guard','elite','conduit'].includes(b.kind)).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,lockShots:b.lockShots,forkshot:b.forkshot,sentryVolleys:b.sentryVolleys,born:born.get(b.id)?{round:born.get(b.id).round,at:born.get(b.id).at,initialX:born.get(b.id).initialX}:null})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||checkpoint>=checkpoints.length;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world,target=checkpoints[checkpoint];
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?'spread':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing'){
  const gun=w.bodies.find(b=>b.active&&b.kind===target.kind&&b.pattern===target.pattern&&(!target.fork||b.forkshot)&&born.get(b.id)?.at<2&&born.get(b.id)?.round===target.round);
  // A valid alternative tactic: clear the opposite wing until the first volley,
  // then evade actual hazards with normal inputs. Never force an enemy alive.
  const focus=w.round===target.round&&w.phase==='running'&&w.roundTime<4?(gun?(gun.x<360?570:150):150):undefined;
  aim(progressionTarget(w,undefined,focus));
 }
 clock+=1000/60;next(clock);frame++;
 for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);const src=born.get(b.sourceId);shots.push({id:b.id,time:w.time,round:w.round,roundTime:w.roundTime,x:b.x,y:b.y,vx:b.vx,vy:b.vy,sourceId:b.sourceId,kind:src?.b.kind,pattern:src?.b.pattern,fork:src?.b.forkshot,spawnAt:src?.at});}
 if(w.round===target.round&&w.phase==='running'){
  const guns=[...born.values()].filter(s=>s.round===target.round&&s.at<2&&s.b.kind===target.kind&&s.b.pattern===target.pattern&&(!target.fork||s.b.forkshot));
  const ids=new Set(guns.map(s=>s.b.id)),live=w.bullets.filter(b=>b.hostile&&ids.has(b.sourceId));
  const ready=target.pattern==='bankshot'?live.some(b=>b.bankRemaining===0):target.pattern==='sweep'?live.length>0&&guns.some(s=>Math.abs(s.b.x-s.initialX)>100):live.length>0;
  if(ready||baseline&&w.roundTime>=3.2){checkpoint++;freeze(target.name);return;}
  if(w.roundTime>8){freeze('missed-'+target.name);return;}
 }
 if(w.time>=600||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__reserveEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
