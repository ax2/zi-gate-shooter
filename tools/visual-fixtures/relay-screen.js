import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {createBrowserControls} from '../../src/game/browser-controls.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),buttons=Object.fromEntries(['begin','advance','weak'].map(id=>[id,document.getElementById(id)]));let stored=defaults(),clock=0,next=()=>{},running=false,frame=0,stage='ready';const history=[];stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{action(name);report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>{stored=JSON.parse(JSON.stringify(s));},sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>{next=cb;}});
function action(name){if(!runtime.activateControl(name))throw Error('Visible action rejected: '+name);}
function report(){const w=runtime.world;status.textContent=`${w.time.toFixed(2)}秒 / R${w.round} / ${runtime.mode} / ${stage} / 停火目标${w.empTargets}`;}
function enable(keys){for(const[k,b]of Object.entries(buttons))b.disabled=!keys.includes(k);}
function snapshot(){const w=runtime.world;return {stage,time:w.time,round:w.round,roundTime:w.roundTime,hp:w.player.hp,score:w.score,kills:w.kills,emp:w.empTargets,conduitBursts:w.conduitBursts,formation:w.bodies.filter(b=>b.active&&b.pattern==='relay-screen').map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,empRemaining:b.empRemaining??0,shots:b.formationShots??0}))};}
function freeze(name){running=false;stage=name;history.push(snapshot());enable(['advance','weak']);report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==734)runtime.touchStart(734,...point(runtime.world.player.x));runtime.touchMove(734,...point(x));}
function step(){const w=runtime.world,watched=w.bodies.filter(b=>b.active&&b.pattern==='relay-screen'),before=w.conduitBursts;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':'seeker'):runtime.branchRoute==='ballistic'?'ricochet':'relay'));if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);frame++;
 const pack=w.bodies.filter(b=>b.active&&b.pattern==='relay-screen');
 if(stage==='to-formation'&&w.round===5&&pack.some(b=>b.age>=.55)){freeze('formation-live');return;}
 if(stage==='to-shots'&&pack.some(b=>(b.formationShots??0)>0)){freeze('formation-fired');return;}
 if(stage==='to-relay'&&pack.some(b=>b.kind==='conduit'&&b.age>=.45)){freeze('relay-vulnerable');return;}
 if(stage==='to-emp'&&w.conduitBursts>before&&watched.some(b=>b.kind==='conduit')){freeze('actual-relay-emp');return;}
 if(stage==='to-end'&&w.round===5&&w.roundTime>=54){freeze('formation-cleared');return;}
 if(w.time>600||['error','result','paused'].includes(runtime.mode))freeze('ended');report();}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(name){stage=name;running=true;enable([]);requestAnimationFrame(pump);}
buttons.begin.onclick=()=>{action('start');advance('to-formation');};buttons.advance.onclick=()=>advance(stage==='formation-live'?'to-shots':stage==='formation-fired'?'to-relay':stage==='relay-vulnerable'?'to-emp':'to-end');buttons.weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__relayScreenEvidence',{value:()=>({fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,stage,history,current:snapshot(),...runtime.diagnostics()})});await runtime.load();stage='ready';enable(['begin']);report();
