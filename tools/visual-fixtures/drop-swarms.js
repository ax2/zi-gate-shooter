import {CanvasRuntime} from '/src/game/canvas-runtime.ts';import {World} from '/src/core/world.ts';import {C} from '/src/core/config.ts';import {defaults} from '/src/ui/storage.ts';
const canvas=document.querySelector('canvas'),save=defaults(),r=canvas.getBoundingClientRect();save.settings.sound=false;save.settings.shake=false;
const runtime=new CanvasRuntime({canvas,width:r.width,height:r.height,dpr:devicePixelRatio,menuBottom:0,image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/'+src;}),read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});await runtime.load();let scene='entry';
class PackOnly extends World{constructor(round){super(1337,round);this.scheduled=this.scheduled.filter(s=>s.drop);this.roundTime=31.8;}}
function show(id){scene=id;runtime.start();runtime.save.settings.effects=document.querySelector('#quality').value;const round=Number(document.querySelector('#round').value),w=new PackOnly(round);runtime.world=w;const aim=round===2?240:round===3?300:360;w.player.x=w.player.px=aim;w.growth.mastery=2;w.growth.stage=2;
w.weaponKind=id==='fragment'?'scatter':'arc';w.chooseBuild(id==='fragment'?'ballistic':'electric');w.chooseBuild(id==='fragment'?'ballistic':'electric',id==='fragment'?'fragment':'spread');
let entryFrames=0;
for(let i=0;i<240;i++){w.step(C.step,aim);for(const e of w.drainEffects())runtime.effect(e);runtime.render(C.step);if(w.dropSpawns)entryFrames++;
 if(id==='entry'&&entryFrames>=8)break;if(id==='arc'&&w.arcLinks>0)break;if(id==='fragment'&&w.scatterSplashHits>0)break;}
if(id!=='entry')for(let i=0;i<4;i++)runtime.render(C.step);runtime.render(0);
document.querySelector('#status').textContent=`R${round} · ${w.roundTime.toFixed(2)}秒 · 投送${w.dropSpawns}/击破${w.dropKills} · 连锁伤敌${w.arcLinks} · 溅射命中${w.scatterSplashHits}`;}
for(const id of ['entry','arc','fragment'])document.getElementById(id).onclick=()=>show(id);for(const id of ['round','quality'])document.getElementById(id).onchange=()=>show(scene);window.addEventListener('resize',()=>{const r=canvas.getBoundingClientRect();runtime.resize(r.width,r.height,devicePixelRatio);});show('entry');
