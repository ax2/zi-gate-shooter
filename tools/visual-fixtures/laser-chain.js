import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),hit=document.querySelector('#hit'),weak=document.querySelector('#weak'),loadout=document.querySelector('#loadout'),combos=document.querySelector('#combos');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle',index=0;
const plan=['electric','optical','optical','optical','optical'],rect=canvas.getBoundingClientRect();
const runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
await runtime.load();start.disabled=runtime.mode!=='menu';status.textContent=start.disabled?'加载失败':'就绪';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){const w=runtime.world;status.textContent=`${w.time.toFixed(2)}秒 / HP${w.player.hp} / ${stage} / 光链${w.laserArcHits}跳 / ${w.laserChainReady?'光链待发':'储备未满'}`;}
function step(){
 const w=runtime.world;
 if(runtime.mode==='choice'){const before=w.build.spent;runtime.activateControl('build:'+(plan[index]??'optical'));if(w.build.spent>before)index++;}
 if(runtime.mode==='branch'){const before=w.build.spent;runtime.activateControl('branch:burn');if(w.build.spent>before)index++;}
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:'+(w.activeWeapons.includes('arc')&&w.weaponStage('arc')===1?'arc':'research'));
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(progressionTarget(w),900));}
 clock+=1000/60;next(clock);frame++;
 if(stage==='unlock'&&w.laserChainUnlocked()){running=false;stage='unlock-frozen';hit.disabled=false;}
 if(stage==='hit'&&w.laserArcHits>0){running=false;stage='hit-frozen';}
 if(w.time>=360||['result','error','paused'].includes(runtime.mode)){running=false;stage=w.time>=360?'limit-without-capture':runtime.mode;}
 weak.disabled=loadout.disabled=combos.disabled=running;report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=index=0;stage='unlock';running=true;hit.disabled=weak.disabled=loadout.disabled=combos.disabled=true;requestAnimationFrame(pump);};
hit.onclick=()=>{stage='hit';running=true;hit.disabled=weak.disabled=loadout.disabled=combos.disabled=true;requestAnimationFrame(pump);};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
loadout.onclick=()=>{if(runtime.mode==='playing')runtime.activateControl('pause');runtime.activateControl('loadout');runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
combos.onclick=()=>{if(runtime.mode==='playing')runtime.activateControl('pause');if(runtime.mode!=='loadout')runtime.activateControl('loadout');runtime.activateControl('combos');runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__laserChainEvidence',{value:()=>({fixture:true,virtualClock:true,stage,frame,quality:save.settings.effects,...runtime.diagnostics()})});
