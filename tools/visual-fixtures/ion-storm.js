import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';
import {browserImage} from '../../src/game/browser-image.ts';
import {defaults} from '../../src/ui/storage.ts';
import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),weak=document.querySelector('#weak');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,finish=-1,stopped='not-started';
const rect=canvas.getBoundingClientRect();
const runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,
 image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
await runtime.load();start.disabled=runtime.mode!=='menu';status.textContent=start.disabled?'加载失败，请检查资源':'就绪';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function step(){
 const w=runtime.world;
 if(runtime.mode==='choice')runtime.activateControl('build:electric');
 if(runtime.mode==='branch')runtime.activateControl('branch:spread');
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='contract-reward')runtime.activateControl('contract-claim:energy');
 if(runtime.mode==='playing'&&frame%6===0){
  if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));
  runtime.touchMove(731,...point(progressionTarget(w),900));
 }
 clock+=1000/60;next(clock);frame++;
 if(w.ionBursts&&finish<0)finish=frame+8;
 if(finish>=0&&frame>=finish){running=false;stopped='actual-discharge-frozen';weak.disabled=false;}
 if(w.time>=300||runtime.mode==='result'||runtime.mode==='error'||runtime.mode==='paused'){running=false;stopped=runtime.mode;}
 status.textContent=`${w.time.toFixed(1)}秒 · ${w.round}轮 · HP${w.player.hp} · 放电${w.ionBursts}/命中${w.ionHits} · ${running?'回放中':stopped}`;
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{runtime.start();clock=0;frame=0;finish=-1;running=true;stopped='running';weak.disabled=true;requestAnimationFrame(pump);};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__ionEvidence',{value:()=>({fixture:true,virtualClock:true,stopped,frame,...runtime.diagnostics()})});
