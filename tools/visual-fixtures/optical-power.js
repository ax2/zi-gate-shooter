import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),prism=document.querySelector('#prism'),danger=document.querySelector('#danger'),weak=document.querySelector('#weak');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,index=0,stage='idle',freeze=-1;const plan=['optical','optical','optical','ballistic'];
const rect=canvas.getBoundingClientRect(),runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});await runtime.load();start.disabled=runtime.mode!=='menu';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){const d=runtime.diagnostics();status.textContent=`${d.time.toFixed(2)}秒 / HP${d.hp} / ${stage} / 光学层次${d.opticalBand} · 命中光冠${d.opticalImpacts}`;}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const before=w.build.spent;runtime.activateControl('build:'+(plan[index]??'optical'));if(w.build.spent>before)index++;}
 if(runtime.mode==='branch'){const before=w.build.spent;runtime.activateControl('branch:burn');if(w.build.spent>before)index++;}
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(progressionTarget(w),900));}
 clock+=1000/60;next(clock);frame++;const d=runtime.diagnostics();
 if(stage==='first'&&d.laserBands.includes(1)&&freeze<0)freeze=frame+3;
 if(stage==='prism'&&w.supportProfile().prism&&d.opticalImpacts>0&&d.laserBands.length>=3&&freeze<0)freeze=frame+3;
 if(stage==='danger'&&w.supportProfile().prism&&d.opticalImpacts>0&&d.laserBands.length>=3&&w.bullets.some(b=>b.hostile)&&freeze<0)freeze=frame+3;
 if(freeze>=0&&frame>=freeze){running=false;stage+='-frozen';freeze=-1;weak.disabled=false;prism.disabled=stage!=='first-frozen';danger.disabled=stage==='first-frozen';}
 if(w.time>=300||['result','error','paused'].includes(runtime.mode)){running=false;stage=w.time>=300?'limit-without-capture':runtime.mode;}
 report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=index=0;freeze=-1;stage='first';running=true;prism.disabled=danger.disabled=weak.disabled=true;requestAnimationFrame(pump);};
prism.onclick=()=>{stage='prism';running=true;freeze=-1;prism.disabled=danger.disabled=weak.disabled=true;requestAnimationFrame(pump);};
danger.onclick=()=>{stage='danger';running=true;freeze=-1;prism.disabled=danger.disabled=weak.disabled=true;requestAnimationFrame(pump);};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__opticalPowerEvidence',{value:()=>({fixture:true,virtualClock:true,stage,frame,quality:save.settings.effects,hostiles:runtime.world.bullets.filter(b=>b.hostile),targets:runtime.world.bodies.filter(b=>b.active).map(b=>({kind:b.kind,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp})),...runtime.diagnostics()})});report();
