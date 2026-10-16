import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';
import {createBrowserControls} from '../../src/game/browser-controls.ts';
import {browserImage} from '../../src/game/browser-image.ts';
import {defaults} from '../../src/ui/storage.ts';
import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
import {proofTarget} from '../../tests/helpers/proof-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status');
const buttons=Object.fromEntries(['begin','advance','weak','reload'].map(id=>[id,document.getElementById(id)]));
let stored=defaults(),clock=0,next=()=>{},running=false,frame=0,stage='ready';const history=[];
stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{action(name);if(runtime.world.build.magneticAugment&&stage==='await-fork')freeze('refinement-selected');if(name==='home'||name==='achievements-back')enable();report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>{stored=JSON.parse(JSON.stringify(s));},sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>{next=cb;}});
function action(name){if(!runtime.activateControl(name))throw Error('Visible action rejected: '+name);}
function report(){const w=runtime.world;status.textContent=`${w.time.toFixed(2)}秒 / R${w.round} / ${runtime.mode} / ${stage} / ${w.contract?.proofProgress??0}命中 · ${w.contract?.proofGroupCount??0}批`;}
function enable(){buttons.begin.disabled=running||runtime.mode!=='menu';buttons.advance.disabled=running||['ready','await-fork'].includes(stage);buttons.weak.disabled=running;buttons.reload.disabled=running||runtime.mode!=='menu';}
function snapshot(){const w=runtime.world;return {stage,time:w.time,round:w.round,mode:runtime.mode,hp:w.player.hp,augment:w.build.magneticAugment,progress:w.contract?.proofProgress,groups:w.contract?.proofGroupCount,contractStatus:w.contract?.status,reward:w.contractReward,hit:w.lastMagneticRefinementHit,certifications:[...w.magneticCertifications],saved:JSON.parse(JSON.stringify(stored.achievements))};}
function freeze(name){running=false;stage=name;history.push(snapshot());enable();report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==734)runtime.touchStart(734,...point(runtime.world.player.x));runtime.touchMove(734,...point(x));}
function step(){const w=runtime.world;
 if(stage==='to-fork'&&runtime.mode==='choice'&&w.canRefineMagnetic()&&w.build.available(w.buildPoints).includes('electric')){freeze('await-fork');return;}
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')&&w.build.ranks.electric<3?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?'seeker':runtime.branchRoute==='ballistic'?'ricochet':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(w.contract?.status==='active'?proofTarget(w,'magnetic'):progressionTarget(w));
 clock+=1000/60;next(clock);frame++;
 if(stage==='to-offer'&&runtime.mode==='playing'&&w.canAcceptContract('research','magnetic')){freeze('offer-ready');return;}
 if(stage==='to-progress'&&w.contract?.proofProgress>=3){freeze('first-batch-progress');return;}
 if(runtime.mode==='contract-reward'){freeze('proof-won');return;}
 if(stage==='to-claimed'&&runtime.mode==='playing'){freeze('reward-claimed');return;}
 if(w.time>600||['error','result','paused'].includes(runtime.mode)){freeze('ended');return;}report();}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(name){stage=name;running=true;enable();requestAnimationFrame(pump);}
buttons.begin.onclick=()=>{action('start');advance('to-fork');};
buttons.advance.onclick=()=>advance(stage==='refinement-selected'?'to-offer':stage==='first-batch-progress'?'to-win':runtime.world.contractReward?'to-win':runtime.world.contract?.status==='won'?'to-claimed':'to-progress');
buttons.weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
buttons.reload.onclick=async()=>{await runtime.load();freeze('record-reloaded');};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__magneticProofEvidence',{value:()=>({fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,stage,history,current:snapshot(),...runtime.diagnostics()})});
await runtime.load();freeze('ready');
