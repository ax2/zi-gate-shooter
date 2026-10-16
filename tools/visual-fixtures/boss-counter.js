import {counterCharge} from '../../src/core/boss-counter.ts';
import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),shot=document.querySelector('#shot'),weak=document.querySelector('#weak');
const targetRound=Math.max(1,Math.min(3,Number(new URLSearchParams(location.search).get('round'))||1));
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle',finish=-1;
const rect=canvas.getBoundingClientRect();const runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
await runtime.load();start.disabled=runtime.mode!=='menu';status.textContent=start.disabled?'加载失败':'就绪';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){const w=runtime.world,b=w.bodies.find(b=>b.active&&b.kind==='boss');status.textContent=`${w.time.toFixed(1)}秒 / ${w.round}轮 / HP${w.player.hp} / ${stage} / 反击${b?.counterVolleys??0}`;}
function step(){
 const w=runtime.world;
 if(runtime.mode==='choice')runtime.activateControl('build:electric');if(runtime.mode==='branch')runtime.activateControl('branch:spread');
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(progressionTarget(w),900));}
 clock+=1000/60;next(clock);frame++;
 const b=w.bodies.find(b=>b.active&&b.kind==='boss');
 if(stage==='charge'&&w.round===targetRound&&b?.counterfire&&b.attack===4&&b.warning>0&&counterCharge(b)>=.6){running=false;stage='charge-frozen';shot.disabled=false;weak.disabled=false;}
 if(stage==='shot'&&b?.counterVolleys&&finish<0)finish=frame+6;
 if(finish>=0&&frame>=finish){running=false;stage='shot-frozen';weak.disabled=false;}
 if(w.time>=targetRound*100+80||runtime.mode==='result'||runtime.mode==='error'||runtime.mode==='paused'){running=false;stage=w.time>=targetRound*100+80?'limit-without-capture':runtime.mode;}
 report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=0;finish=-1;stage='charge';running=true;shot.disabled=true;weak.disabled=true;requestAnimationFrame(pump);};
shot.onclick=()=>{stage='shot';running=true;finish=-1;shot.disabled=true;weak.disabled=true;requestAnimationFrame(pump);};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__bossCounterEvidence',{value:()=>({fixture:true,virtualClock:true,targetRound,stage,quality:save.settings.effects,...runtime.diagnostics(),boss:runtime.world.bodies.filter(b=>b.active&&b.kind==='boss').map(b=>({x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,attack:b.attack,warning:b.warning,counterfire:b.counterfire,counterVolleys:b.counterVolleys,age:b.age,counterShotAge:b.counterShotAge})),hostiles:runtime.world.bullets.filter(b=>b.hostile)})});
