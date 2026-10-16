import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {proofTarget} from '../../tests/helpers/proof-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),accept=document.querySelector('#accept'),claim=document.querySelector('#claim');
const cycle=document.querySelector('#cycle'),mixed=new URLSearchParams(location.search).has('mixed');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle';
const rect=canvas.getBoundingClientRect();
const runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
await runtime.load();start.disabled=runtime.mode!=='menu';status.textContent=start.disabled?'加载失败':'就绪';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){const w=runtime.world;status.textContent=`${w.time.toFixed(1)}秒 / ${w.round}轮 / HP${w.player.hp} / ${stage} / 进度${w.contract?.proofProgress??0} / 已领${w.contractStats.claimed}`;}
function step(){
 const w=runtime.world;
 if(runtime.mode==='choice')runtime.activateControl(mixed&&w.build.ranks.electric>=3&&w.build.ranks.ballistic<3?'build:ballistic':'build:electric');
 if(runtime.mode==='branch')runtime.activateControl(w.build.ranks.ballistic===1?'branch:penetrator':'branch:spread');
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&stage==='seeking'&&w.canAcceptContract('research','ion')&&(!mixed||w.availableProofs().length>1)){
  runtime.activateControl('contracts-live');stage='selection';running=false;accept.disabled=false;cycle.hidden=w.availableProofs().length<2;report();return;
 }
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(proofTarget(w,w.contract?.proof?.kind??'ion'),900));}
 clock+=1000/60;next(clock);frame++;
 if(runtime.mode==='contract-reward'){running=false;stage='reward';claim.disabled=false;}
 if(w.time>=(mixed?600:180)||runtime.mode==='result'||runtime.mode==='error'||runtime.mode==='paused'||w.contract?.status==='failed'){running=false;stage=runtime.mode==='playing'?'contract-failed':runtime.mode;}
 report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=0;stage='seeking';running=true;accept.disabled=true;claim.disabled=true;requestAnimationFrame(pump);};
accept.onclick=()=>{if(runtime.activateControl('contract:research')&&runtime.world.contract?.kind==='research'){runtime.activateControl('resume');stage='active';running=true;accept.disabled=true;requestAnimationFrame(pump);}};
cycle.onclick=()=>{runtime.activateControl('proof-next');report();};
claim.onclick=()=>{if(runtime.activateControl('contract-claim:arc')){stage='claimed';claim.disabled=true;report();}};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__proofEvidence',{value:()=>({fixture:true,virtualClock:true,stage,frame,contract:runtime.world.contract,...runtime.diagnostics()})});
