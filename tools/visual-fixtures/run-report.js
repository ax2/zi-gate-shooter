import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {createBrowserControls} from '/src/game/browser-controls.ts';import {defaults} from '/src/ui/storage.ts';import {C} from '/src/core/config.ts';
const canvas=document.querySelector('canvas'),save=defaults(),r=canvas.getBoundingClientRect();save.settings.sound=false;save.settings.shake=false;
const bridge=createBrowserControls(canvas,action=>runtime.activateControl(action));
const runtime=new CanvasRuntime({canvas,width:r.width,height:r.height,dpr:devicePixelRatio,menuBottom:0,image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/'+src;}),read:()=>save,write(){},sound(){},silence(){},controls:bridge.update,now:()=>10000,requestFrame(){}});
await runtime.load();
function show(){runtime.start();const w=runtime.world;w.growth.mastery=9;
for(const route of ['electric','electric','electric','ballistic','ballistic','ballistic','optical','optical','optical'])w.chooseBuild(route);
for(const kind of ['pulse','scatter','pierce','blast','arc']){const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind=kind;w.step(C.step,360);w.drainEffects();}
w.chooseBuild('optical');
for(let i=0;i<3;i++){w.contractReward={charge:100,round:1};w.claimContractReward('pulse');}
// Explicit presentation fixtures, not event/achievement acceptance evidence.
w.score=38750;w.time=733;w.round=8;w.kills=387;w.gatesTaken=22;w.bossWins=7;Object.assign(w.contractStats,{accepted:6,won:4,failed:2,claimed:4});
w.scatterPierces=125;w.scatterSplashHits=38;w.fractureBursts=19;w.capacitorBursts=24;w.burnHits=96;w.relayHits=17;
save.achievements.kills=487;save.achievements.bosses=8;save.achievements.unlocked=['hunter','boss','storm','specialist','fracture','arsenal'];runtime.runAchievements=['specialist','fracture','arsenal'];runtime.runNewBest=true;save.best=38750;w.player.hp=0;w.phase='dead';w.lastDamageCause='bullet';runtime.mode='result';runtime.render(0);}
document.querySelector('#full').onclick=show;document.querySelector('#empty').onclick=()=>{runtime.start();save.best=0;save.achievements.kills=0;save.achievements.bosses=0;save.achievements.unlocked=[];runtime.world.player.hp=0;runtime.world.phase='dead';runtime.mode='result';runtime.render(0);};window.addEventListener('resize',()=>{const r=canvas.getBoundingClientRect();runtime.resize(r.width,r.height,devicePixelRatio);});show();
