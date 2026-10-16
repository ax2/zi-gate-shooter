import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),buttons=Object.fromEntries(['begin','choose','next','weak','loadout'].map(id=>[id,document.getElementById(id)]));
let saved=defaults(),clock=0,next=()=>{},running=false,frame=0,stage='ready',captureAfter=0;const history=[],contacts=[];saved.settings.sound=false;saved.settings.shake=false;
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>saved,write:s=>{saved=JSON.parse(JSON.stringify(s));},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
const report=()=>{status.textContent=`${runtime.world.time.toFixed(2)}秒 / ${runtime.mode} / ${stage} / 跳弹${runtime.world.scatterRicochets}次`;};
function enable(keys){for(const [key,b]of Object.entries(buttons))b.disabled=!keys.includes(key);}
function freeze(name,keys){running=false;stage=name;enable(keys);report();}
function action(name){if(!runtime.activateControl(name))throw new Error('Visible action rejected: '+name);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;const point=v=>[px+v*s,py+900*s];if(runtime.pointer!==731)runtime.touchStart(731,...point(runtime.world.player.x));runtime.touchMove(731,...point(x));}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')&&w.build.ranks.ballistic<3?'ballistic':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){if(runtime.branchRoute==='ballistic'&&w.build.ranks.ballistic===1&&!w.build.ballisticBranch){freeze('actual-earned-fork',['choose']);return;}action('branch:'+(runtime.branchRoute==='electric'?'spread':runtime.branchRoute==='optical'?'burn':'ricochet'));}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0)aim(progressionTarget(w));
 const hits=w.scatterRicochets,hp=w.player.hp,prior=new Map(w.bodies.map(b=>[b.id,{x:b.x,y:b.y,hp:b.hp}]));clock+=1000/60;next(clock);frame++;
 if(w.player.hp<hp)contacts.push({time:w.time,hp:w.player.hp,cause:w.lastDamageCause});
 if(w.scatterRicochets>hits){const traces=runtime.supportBeams.filter(b=>b.ricochet);history.push({time:w.time,hits:w.scatterRicochets,traces:traces.map(t=>({...t,distance:Math.hypot(t.tx-t.x,t.ty-t.y)})),enemies:w.bodies.filter(b=>b.kind in {drone:1,charger:1,armor:1,guard:1,elite:1,sniper:1,boss:1}).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,before:prior.get(b.id)?.hp,active:b.active}))});if(w.scatterRicochets>captureAfter&&traces.some(t=>Math.hypot(t.tx-t.x,t.ty-t.y)>140)){freeze('actual-flank-hit',['next','weak','loadout']);return;}}
 if(w.time>600||['error','result','paused'].includes(runtime.mode))freeze('ended-without-capture',[]);report();}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(){running=true;enable([]);requestAnimationFrame(pump);}
buttons.begin.onclick=()=>{action('start');stage='to-fork';advance();};buttons.choose.onclick=()=>{action('branch:ricochet');stage='to-hit';advance();};buttons.next.onclick=()=>{captureAfter=runtime.world.scatterRicochets;stage='to-next-hit';advance();};buttons.weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};buttons.loadout.onclick=()=>{action('pause');action('loadout');freeze('actual-loadout',[]);};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__ricochetEvidence',{value:()=>({fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,stage,history,contacts,quality:runtime.save.settings.effects,...runtime.diagnostics()})});await runtime.load();freeze('ready',['begin']);
