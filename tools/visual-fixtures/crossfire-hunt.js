import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';import {huntAim} from '../../tests/helpers/hunter-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),accept=document.querySelector('#accept'),shot=document.querySelector('#shot'),finish=document.querySelector('#finish'),claim=document.querySelector('#claim'),weak=document.querySelector('#weak'),archive=document.querySelector('#archive');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle',freeze=-1;
const rect=canvas.getBoundingClientRect(),runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});
await runtime.load();start.disabled=runtime.mode!=='menu';status.textContent=start.disabled?'加载失败':'就绪';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){const w=runtime.world;status.textContent=`${w.time.toFixed(2)}秒 / HP${w.player.hp} / ${stage} / 目标${w.contract?.targetKills??0}/2 · 已发${w.bountyShots}弹 · 研发${w.researchPoints}`;}
function step(){const w=runtime.world;
 if(runtime.mode==='choice')runtime.activateControl('build:optical');if(runtime.mode==='branch')runtime.activateControl('branch:burn');if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(stage==='seeking'&&runtime.mode==='playing'&&w.round>=2&&w.activeWeapons.some(k=>w.weaponStage(k)>=3)&&w.canAcceptContract('hunter')){runtime.activateControl('contracts-live');if(runtime.diagnostics().huntChoice!=='crossfire')runtime.activateControl('hunt-next');stage='selection';running=false;accept.disabled=false;report();return;}
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(w.contract?.status==='active'?huntAim(w):progressionTarget(w),900));}
 clock+=1000/60;next(clock);frame++;
 const targets=w.bodies.filter(b=>b.active&&b.bountyRound===w.round);
 if(stage==='charge'&&targets.length===2&&targets.every(b=>b.warning>0&&b.timer<.4)){stage='charge-frozen';running=false;shot.disabled=false;weak.disabled=false;}
 if(stage==='shot'&&w.bountyShots>0&&freeze<0)freeze=frame+6;
 if(freeze>=0&&frame>=freeze){stage='shot-frozen';running=false;finish.disabled=false;weak.disabled=false;freeze=-1;}
 if(runtime.mode==='contract-reward'){stage='reward';running=false;claim.disabled=false;}
 if(w.time>=180||['result','error','paused'].includes(runtime.mode)||w.contract?.status==='failed'){running=false;stage=w.time>=180?'limit-without-capture':runtime.mode==='playing'?'contract-failed':runtime.mode;}
 report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=0;freeze=-1;stage='seeking';running=true;accept.disabled=shot.disabled=finish.disabled=claim.disabled=weak.disabled=true;requestAnimationFrame(pump);};
accept.onclick=()=>{if(runtime.activateControl('contract:hunter')){runtime.activateControl('resume');stage='charge';running=true;accept.disabled=true;requestAnimationFrame(pump);}};
shot.onclick=()=>{stage='shot';running=true;freeze=-1;shot.disabled=weak.disabled=true;requestAnimationFrame(pump);};
finish.onclick=()=>{stage='finishing';running=true;finish.disabled=weak.disabled=true;requestAnimationFrame(pump);};
claim.onclick=()=>{if(runtime.activateControl('contract-claim:pierce')){stage='claimed';claim.disabled=true;archive.disabled=false;report();}};
archive.onclick=()=>{if(running)return;for(let i=0;i<20&&['choice','branch'].includes(runtime.mode);i++){runtime.activateControl('build:optical');if(runtime.mode==='branch')runtime.activateControl('branch:burn');}if(runtime.mode==='playing')runtime.activateControl('pause');if(runtime.mode==='paused')runtime.activateControl('home');if(runtime.mode==='menu')runtime.activateControl('achievements');runtime.activateControl('achievement-group:tactics');stage='archive';report();};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__crossfireHuntEvidence',{value:()=>({fixture:true,virtualClock:true,stage,frame,quality:save.settings.effects,contract:runtime.world.contract,reward:runtime.world.contractReward,...runtime.diagnostics()})});
