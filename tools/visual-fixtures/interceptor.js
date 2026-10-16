import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),buttons=Object.fromEntries(['start','wing','core','fire','flight','break','archive','weak'].map(id=>[id,document.getElementById(id)]));
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle',tracked=null,until=0,visibleControls=[];
const rect=canvas.getBoundingClientRect(),runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),controls:buttons=>{visibleControls=buttons;},read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});await runtime.load();buttons.start.disabled=buttons.break.disabled=runtime.mode!=='menu';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){status.textContent=`${runtime.world.time.toFixed(2)}秒 / HP${runtime.world.player.hp} / ${stage}`;}
function freeze(label,enable=[]){running=false;stage=label+'-frozen';buttons.weak.disabled=false;for(const key of enable)buttons[key].disabled=false;}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints);runtime.activateControl('build:'+(a.includes('optical')?'optical':a[0]));}
 if(runtime.mode==='branch'){const action=visibleControls.find(b=>b.action==='branch:burn')?.action??visibleControls.find(b=>b.action.startsWith('branch:'))?.action;if(action)runtime.activateControl(action);}
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0){const observe=tracked&&stage!=='break';const aim=observe?(tracked.x<360?652:68):progressionTarget(w);if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(aim,900));}
 clock+=1000/60;next(clock);frame++;
 if(!tracked)tracked=w.bodies.find(b=>b.active&&b.pattern==='intercept')??null;
 if(stage==='charge'&&tracked?.warning>0&&!tracked.burst&&tracked.timer<=.5)freeze('wing-charge',['wing']);
 else if(stage==='wing'&&(tracked?.interceptWingShots??0)>0)freeze('wing-shot',['core']);
 else if(stage==='core'&&tracked?.warning>0&&tracked.burst)freeze('core-charge',['fire']);
 else if(stage==='fire'&&(tracked?.interceptCoreShots??0)>0)freeze('core-shot',['flight']);
 else if(stage==='flight'&&frame>=until)freeze('flight');
 else if(stage==='break'&&w.interceptorBreaks>0)freeze('break',['archive']);
 if(w.time>=300||['result','error','paused'].includes(runtime.mode)){running=false;stage=w.time>=300?'limit-without-capture':runtime.mode;}report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
function advance(name){stage=name;running=true;for(const [key,b]of Object.entries(buttons))b.disabled=!['start','break'].includes(key);if(name==='flight')until=frame+30;requestAnimationFrame(pump);}
function begin(name){clock=0;runtime.start();frame=0;tracked=null;until=0;advance(name);}
buttons.start.onclick=()=>begin('charge');buttons.break.onclick=()=>begin('break');for(const key of ['wing','core','fire','flight'])buttons[key].onclick=()=>advance(key);
buttons.archive.onclick=()=>{if(runtime.mode==='playing')runtime.activateControl('pause');if(runtime.mode==='paused')runtime.activateControl('home');if(runtime.mode==='menu')runtime.activateControl('achievements');runtime.activateControl('achievement-group:tactics');stage='archive';report();};
buttons.weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__interceptorEvidence',{value:()=>({fixture:true,virtualClock:true,isolatedMemorySave:true,stage,frame,quality:save.settings.effects,tracked:tracked?{id:tracked.id,x:tracked.x,y:tracked.y,hp:tracked.hp,maxHp:tracked.maxHp,age:tracked.age,warning:tracked.warning,beat:tracked.burst,wingShots:tracked.interceptWingShots??0,coreShots:tracked.interceptCoreShots??0}:null,hostiles:runtime.world.bullets.filter(b=>b.hostile),savedAchievements:save.achievements,...runtime.diagnostics()})});report();
