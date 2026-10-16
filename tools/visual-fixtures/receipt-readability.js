import {CanvasRuntime,parseSave} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {recipeSupplyMatch} from '../../src/core/recipe-goal.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),buttons=Object.fromEntries(['choose','reload','start','pickup','complete','effect','skill','weak','readback'].map(id=>[id,document.getElementById(id)]));
let stored=defaults();stored.settings.sound=false;stored.settings.shake=false;let runtime,clock=0,next=()=>{},running=false,frame=0,stage='idle',receiptTitle='',visibleControls=[],effectStart=0,effectUntil=-1;const history=[];
async function load(){clock=0;const rect=canvas.getBoundingClientRect();runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),controls:b=>{visibleControls=b;},read:()=>stored,write:save=>{stored=JSON.parse(JSON.stringify(save));},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});await runtime.load();}
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){status.textContent=`${runtime.world.time.toFixed(2)}秒 / HP${runtime.world.player.hp} / ${stage}`;}
function enable(keys){for(const [key,b]of Object.entries(buttons))b.disabled=!keys.includes(key);}
function freeze(name,keys=[]){running=false;stage=name;history.push({stage,time:runtime.world.time,goal:runtime.diagnostics().recipeGoal,weapons:runtime.world.activeWeapons,levels:Object.fromEntries(runtime.world.activeWeapons.map(k=>[k,runtime.world.weaponStage(k)]))});enable(['choose','reload','start','skill','weak','readback',...keys]);report();}
function select(id){if(runtime.mode==='combos')runtime.activateControl('combos-back');runtime.activateControl('combos-menu');if(runtime.save.recipeGoal!==id)runtime.activateControl('recipe-goal:'+id);}
function research(){const w=runtime.world;if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints);runtime.activateControl('build:'+(a.includes('optical')?'optical':a[0]));}if(runtime.mode==='branch'){const a=visibleControls.find(b=>b.action==='branch:burn')?.action??visibleControls.find(b=>b.action.startsWith('branch:'))?.action;if(a)runtime.activateControl(a);}}
function step(){const w=runtime.world;if(stage!=='skill')research();if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 const marked=w.bodies.filter(b=>recipeSupplyMatch(w,runtime.save.recipeGoal,b));
 if(runtime.mode==='playing'&&frame%6===0){const avoid=stage==='box'?marked.find(b=>b.kind==='crate'):null;const wanted=marked.find(b=>b.kind==='pickup')??marked[0];const aim=avoid?(avoid.x<360?652:68):progressionTarget(w,wanted?.weaponKind);if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(aim,900));}
 clock+=1000/60;next(clock);frame++;const d=runtime.diagnostics();
 if(stage==='box'&&w.bodies.some(b=>recipeSupplyMatch(w,runtime.save.recipeGoal,b)&&b.kind==='crate'&&b.y>=340&&b.y<=650))freeze('target-box',['pickup']);
 else if(stage==='receipt'&&runtime.buildFeedback?.title===receiptTitle&&!runtime.buildFeedback.hidden&&w.time<runtime.buildFeedback.until)freeze('receipt-returned',['pickup']);
 else if(stage==='pickup'&&w.bodies.some(b=>recipeSupplyMatch(w,runtime.save.recipeGoal,b)&&b.kind==='pickup'))freeze('target-drop',['complete']);
 else if(stage==='complete'&&d.recipeGoal?.ready&&runtime.mode==='playing')freeze('goal-complete',['effect']);
 else if(stage==='effect'&&w.fractureBursts>effectStart&&effectUntil<0)effectUntil=frame+3;
 else if(stage==='effect'&&effectUntil>=0&&frame>=effectUntil)freeze('actual-fracture');
 else if(stage==='skill'&&runtime.mode==='choice')freeze('skill-choice');
 if(w.time>=300||['result','error','paused'].includes(runtime.mode)){running=false;stage=w.time>=300?'limit-without-capture':runtime.mode;enable(['reload','start','skill']);}report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(name){stage=name;running=true;enable([]);requestAnimationFrame(pump);}
buttons.choose.onclick=async()=>{if(running)return;await load();select('fracture');freeze('target-selected');};
buttons.reload.onclick=async()=>{if(running)return;stored=parseSave(JSON.parse(JSON.stringify(stored)));await load();freeze('preference-reloaded');};
async function begin(id,name){if(running)return;await load();select(id);runtime.activateControl('combos-back');runtime.activateControl('start');frame=0;advance(name);}
buttons.start.onclick=()=>begin('fracture','box');buttons.skill.onclick=()=>begin('prism','skill');buttons.pickup.onclick=()=>advance('pickup');buttons.complete.onclick=()=>advance('complete');
buttons.effect.onclick=()=>{effectStart=runtime.world.fractureBursts;effectUntil=-1;advance('effect');};
buttons.readback.onclick=()=>{receiptTitle=runtime.buildFeedback?.title??'';advance('receipt');};
buttons.weak.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__receiptEvidence',{value:()=>({fixture:true,virtualClock:true,receipt:runtime.buildFeedback?{...runtime.buildFeedback}:null,isolatedMemorySave:true,stage,frame,history,stored,quality:runtime.save.settings.effects,targets:runtime.world.bodies.filter(b=>b.active&&(b.kind==='crate'||b.kind==='pickup')).map(b=>({id:b.id,kind:b.kind,weapon:b.weaponKind,stage:b.stage,x:b.x,y:b.y,hp:b.hp,refit:!!b.refit,marked:recipeSupplyMatch(runtime.world,runtime.save.recipeGoal,b)})),...runtime.diagnostics()})});await load();enable(['choose','reload','start','skill']);report();
