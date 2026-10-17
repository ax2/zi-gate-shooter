import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=0,choiceSeen=false;stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[],rays=[];
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,drain=w.drainEffects.bind(w);w.drainEffects=()=>{const effects=drain();for(const e of effects)if(e.type==='mirror-laser')rays.push({time:w.time,round:w.round,x:e.x,y:e.y,bounced:e.bounced,segments:e.segments.map(s=>({...s})),hits:w.mirrorHits,doubles:w.mirrorDoubleHits});return effects;};}
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,hp:w.player.hp,growth:{...w.growth},quality:runtime.save.settings.effects,unlocked:[...stored.achievements.unlocked],tracked:stored.achievements.tracked,rays:rays.map(r=>({...r,segments:r.segments.map(s=>({...s}))})),bodies:w.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age})),hostiles:w.bullets.filter(b=>b.hostile).map(b=>({...b}))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||checkpoint>=3;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'&&runtime.branchRoute==='optical'&&w.build.ranks.optical===1&&!choiceSeen){choiceSeen=true;freeze('optical-choice');return;}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='optical'?(w.canRefinePhoton()?'photon-reach':'mirror'):runtime.branchRoute==='electric'?'spread':'ricochet'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing'){const focus=w.phase==='running'&&w.build.opticalBranch==='mirror'&&checkpoint<2?(checkpoint===0?160:560):undefined;aim(progressionTarget(w,undefined,focus));}
 const prior=rays.length;clock+=1000/60;next(clock);frame++;
 const last=rays.at(-1);
 if(last&&rays.length>prior&&last.bounced&&checkpoint===0&&last.x<200&&w.mirrorHits>0){checkpoint++;freeze('left-reflection');return;}
 if(last&&rays.length>prior&&last.bounced&&checkpoint===1&&last.x>520){checkpoint++;freeze('right-reflection');return;}
 if(checkpoint===2&&w.mirrorDoubleHits>0&&stored.achievements.unlocked.includes('wall-cutter')){checkpoint++;freeze('wall-cutter-earned');return;}
 if(w.time>=400||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__mirrorEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
