import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),buttons=Object.fromEntries(['start','select','rear','weak'].map(id=>[id,document.getElementById(id)]));
let stored=defaults();stored.settings.sound=false;stored.settings.shake=false;let runtime,clock=0,next=()=>{},running=false,frame=0,stage='loading',captured=null;const jumps=[];
async function load(){clock=0;const rect=canvas.getBoundingClientRect();runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>{stored=JSON.parse(JSON.stringify(s));},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});await runtime.load();}
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){status.textContent=`${runtime.world.time.toFixed(2)}秒 / HP${runtime.world.player.hp} / ${stage}`;}
function enable(keys){for(const [key,b]of Object.entries(buttons))b.disabled=!keys.includes(key);}
function freeze(name,keys){running=false;stage=name;enable(keys);report();}
function research(){const w=runtime.world;if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)runtime.activateControl('build:'+r);}if(runtime.mode==='branch'){if(stage==='choice'&&w.build.ranks.electric===1)return;runtime.activateControl('branch:'+(w.build.ranks.electric===1?'seeker':w.build.ranks.optical===1?'burn':'penetrator'));}}
function step(){const w=runtime.world;research();if(stage==='choice'&&runtime.mode==='branch'&&w.build.ranks.electric===1){freeze('electric-choice',['start','select']);return;}if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0){const aim=progressionTarget(w);if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(aim,900));}
 const prior=[...w.bodies],before=w.seekerLinks;clock+=1000/60;next(clock);frame++;
 if(w.seekerLinks>before){const links=runtime.arcs.filter(a=>a.seeker&&a.life>.12);for(const link of links){const target=prior.find(b=>Math.abs(b.x-link.tx)<.01&&Math.abs(b.y-link.ty)<.01);const event={time:w.time,...link,distance:Math.hypot(link.tx-link.x,link.ty-link.y),target:target?.kind,warning:target?.warning??0};jumps.push(event);if(stage==='rear'&&target?.kind==='sniper'&&event.distance>220&&link.ty<link.y){captured=event;freeze('actual-rear-hit',['start','rear','weak']);return;}}}
 if(w.time>300||['dead','error','result','paused'].includes(runtime.mode))freeze('limit-or-ended',['start']);report();}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(name){stage=name;running=true;enable([]);requestAnimationFrame(pump);}
buttons.start.onclick=async()=>{if(running)return;await load();frame=0;captured=null;jumps.length=0;runtime.activateControl('start');advance('choice');};
buttons.select.onclick=()=>{if(runtime.activateControl('branch:seeker'))freeze('seeker-selected',['start','rear','weak']);};
buttons.rear.onclick=()=>advance('rear');buttons.weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__seekerEvidence',{value:()=>({fixture:true,virtualClock:true,isolatedMemorySave:true,stage,frame,captured,jumps,quality:runtime.save.settings.effects,...runtime.diagnostics()})});await load();freeze('ready',['start']);
