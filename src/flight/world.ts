import{defenseRules,supplyName,type Supply,type PickupReceipt}from'./defense';
import{componentRules,componentPairs,electrodePorts,bladeEnds}from'./early-parts';
import{flightProfile}from'./profile';
import{bossPartRules,bossPartReward,bossPartSpec,bossPartPosition,bossPartMuzzles,type BossPart,type BossAssembly,type BossSalvage}from'./boss-parts';
import{Assembly,parts,type Part}from'./technology';
import{trials,starterTrial,type TrialId}from'./records';
import{encounterTypes,type EncounterKind,type FlightEncounter,type EncounterRecord}from'./encounters';
import{airspacePlan,airspaceFormation,maneuverPose,maneuverMuzzle,type Maneuver}from'./airspace';
export const F={width:720,height:1280,minY:196,maxY:1198,speed:600,playerRadius:12,step:1/60,enemyLimit:26,hostileLimit:200,bulletLimit:280,lootLimit:32,fxLimit:220,fieldLimit:3}as const;
export type EnemyKind='drone'|'diver'|'sentry'|'spinner'|'lancer'|'boss'|'courier'|'minelayer'|'mine'|'projector'|'node';
export interface Enemy{id:number;kind:EnemyKind;x:number;y:number;px:number;py:number;hp:number;maxHp:number;r:number;age:number;timer:number;angle:number;seed:number;burn:number;burnTick:number;hit:number;aimX?:number;aimY?:number;keystoneHit?:string;shield?:number;shieldMax?:number;protectedBy?:number;retreat?:boolean;maneuver?:Maneuver;bossPart?:BossPart;bossMine?:number}
export interface Bullet{id:number;x:number;y:number;px:number;py:number;vx:number;vy:number;r:number;damage:number;hostile:boolean;age:number;life:number;bounce:number;pierce:number;style:'pulse'|'wing'|'rail'|'enemy'|'orb';hits:Set<number>;explosive:boolean;sourceEnemy?:number;damageSource?:string;guidance?:number;targetId?:number}
export interface Loot{id:number;x:number;y:number;part:Supply;amount:number;age:number;phase:number;trialReward?:boolean;encounterReward?:number;bossPartReward?:number}
export interface Effect{x:number;y:number;kind:'explosion'|'reactor'|'spark'|'arc'|'laser'|'ring'|'pickup'|'install';age:number;life:number;size:number;color:string;points?:{x:number;y:number}[];hostile?:boolean;icon?:number;label?:string}
export interface TechField{id:number;kind:"reflect"|"well";x:number;y:number;age:number;life:number;radius:number;remaining:number;tick:number}
export interface Notice{title:string;detail:string;time:number;icon?:number}
export interface FlightEvent{type:string;value?:string}
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export function segmentDistance(x:number,y:number,ax:number,ay:number,bx:number,by:number){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
const stats:Record<EnemyKind,{hp:number;r:number;score:number}>={drone:{hp:16,r:25,score:25},diver:{hp:25,r:28,score:40},sentry:{hp:70,r:35,score:80},spinner:{hp:95,r:39,score:110},lancer:{hp:75,r:34,score:90},boss:{hp:2400,r:110,score:1200},courier:{hp:180,r:45,score:200},minelayer:{hp:360,r:43,score:180},mine:{hp:14,r:22,score:10},projector:{hp:420,r:43,score:220},node:{hp:bossPartRules.hp,r:bossPartRules.radius,score:bossPartRules.score}};
export const lootLife=(l:Loot)=>l.trialReward||l.encounterReward!==undefined||(l.bossPartReward??0)>0?30:18;
/** Deterministic free-flight rules. Rendering, UI, audio and randomness do not share clocks. */
export class FlightWorld{
 readonly assembly=new Assembly();
 readonly player={x:360,y:1040,px:360,py:1040,hp:5,maxHp:5,invulnerable:1.4,armor:0};
 enemies:Enemy[]=[];bullets:Bullet[]=[];loot:Loot[]=[];effects:Effect[]=[];events:FlightEvent[]=[];
 pickupReceipt?:PickupReceipt;armorPickups=0;armorBlocks=0;shotInterceptions=0;expiredHostiles=0;private ordinaryDrops=0;private armorFlash=0;
 time=0;sector=0;sectorTime=0;kills=0;score=0;bossKills=0;damageTaken=0;partsCollected=0;scoreAwards=0;
 get scoreProgress(){const previous=this.scoreAwards?this.nextAward-(300+this.scoreAwards*150):0;return{next:this.nextAward,previous,ratio:clamp((this.score-previous)/(this.nextAward-previous),0,1)};}
 phase:'running'|'boss'|'dead'='running';notice:Notice={title:'自由空战',detail:'拖动任意方向 · 击敌拾取零件 · 点组装打开科技树',time:5};
 readonly contribution:Record<string,number>={};fields:TechField[]=[];private railContacts=0;private railCooldown=0;private lensContacts=0;private coilCasts=0;private wellContacts=0;private lensCooldown=0;private novaCooldown=0;private wellCooldown=0;private satelliteTimer=0;
 encounter?:FlightEncounter;readonly encounterHistory:EncounterRecord[]=[];encountersStarted=0;encountersWon=0;ordnanceCleared=0;minesDeployed=0;shieldDamage=0;private encounterSector=-1;airspaceFormations=0;airspaceShots=0;private maneuverSector=-1;
 trial?:{id:TrialId;progress:number;completed:boolean;rewarded:boolean;claimed:boolean;rewardId?:number;pending?:{x:number;y:number}};
 private readonly keystoneWins=new Set<string>();private readonly bossTactics=new Set<string>();private componentTimers=[.4,.4,.4];componentInterceptions=0;
 bossAssembly?:BossAssembly;bossModulesBroken=0;bossSalvageIssued=0;bossSalvageIssuedAmount=0;bossSalvageCollected=0;private bossSalvage:BossSalvage[]=[];
 target?:string;private rng:number;private serial=0;private wave=0;private spawnTimer=1;private shotTimer=0;private arcTimer=0;private laserTimer=0;private railTimer=0;private empTimer=5;private sunTimer=4;private shots=0;private stormHits=0;private dryKills=0;private nextAward=300;
 constructor(seed=Date.now()){this.rng=seed>>>0||1;}
 random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296;}
 start(id:string){if(this.time||this.assembly.installed.size||!['split','coil','laser'].includes(id))return false;const p=parts[['split','coil','laser'].indexOf(id)];this.assembly.inventory[p]=2;const ok=this.install(id);if(ok)this.trial={id:starterTrial[id],progress:0,completed:false,rewarded:false,claimed:false};return ok;}
 private advanceTrial(id:TrialId,at:{x:number;y:number}){const t=this.trial;if(!t||t.id!==id||t.completed||this.phase==='dead')return;t.progress++;if(t.progress>=trials[id].goal){t.completed=true;t.pending={x:at.x,y:at.y};this.tryTrialReward();}}
 private tryTrialReward(){const t=this.trial;if(!t?.pending||t.rewarded||this.phase==='dead')return;const info=trials[t.id],drop=this.addDrop(t.pending.x,t.pending.y,info.part,info.reward);if(!drop)return;drop.trialReward=true;drop.age=0;t.pending=undefined;t.rewarded=true;t.rewardId=drop.id;this.notice={title:'航线达成 · '+info.name,detail:`${info.reward}${{alloy:'弹芯',coil:'线圈',lens:'透镜'}[info.part]}已投送 · 飞近拾取`,time:3,icon:info.icon};this.events.push({type:'reward',value:t.id});}
 careerFacts(){return{kills:this.kills,bossKills:this.bossKills,score:this.score,trialCompleted:this.trial?.completed?this.trial.id:undefined,keystoneWins:[...this.keystoneWins],bossTactics:[...this.bossTactics]};}
 install(id:string){const was=this.assembly.has(id);if(this.phase==='dead'||this.player.hp<=0||!this.assembly.install(id))return false;if(this.target===id)this.target=undefined;this.fx({kind:'install',x:this.player.x,y:this.player.y,size:100,color:'#a9f3e5',life:.8});this.notice={title:was?'组件精校 +1':'新组件已装配',detail:id,time:2,icon:undefined};this.events.push({type:'upgrade',value:id});return true;}
 private fx(e:Omit<Effect,'age'>){if(this.effects.length>=F.fxLimit){const index=this.effects.findIndex(f=>!f.hostile);if(index>=0)this.effects.splice(index,1);else if(!e.hostile)return;else this.effects.shift();}this.effects.push({...e,age:0});}
 private bullet(x:number,y:number,vx:number,vy:number,damage:number,hostile=false,style:Bullet['style']='pulse',pierce=0,explosive=false,sourceEnemy?:number){
  if(this.bullets.filter(b=>b.hostile===hostile).length>=(hostile?F.hostileLimit:F.bulletLimit))return;
  const shot:Bullet={id:++this.serial,x,y,px:x,py:y,vx,vy,damage,hostile,style,r:hostile?(style==='orb'?9:6):style==='rail'?9:4,age:0,life:hostile?(style==='orb'?defenseRules.orbLife:defenseRules.shotLife):2.8,bounce:!hostile&&this.assembly.has('bounce')?1:0,pierce,hits:new Set(),explosive,...(sourceEnemy===undefined?{}:{sourceEnemy})};this.bullets.push(shot);return shot;
 }
 satellitePositions(){if(!this.assembly.has('satellites'))return[];return[-1,1].map(side=>{const a=this.time*1.6+(side<0?Math.PI:0);return{x:clamp(this.player.x+Math.cos(a)*88,18,702),y:clamp(this.player.y+Math.sin(a)*52,158,1230)};});}
 breakthroughProgress(){const p=flightProfile(this.assembly).breakthrough,id=p.id;if(!id)return undefined;const field=this.fields.find(f=>f.kind===(id==='reversefield'?'reflect':'well'));if(id==='reversefield'&&field)return{id,current:field.remaining,max:p.reflectCount,active:true};if(id==='lightwell'&&field)return{id,current:Number((field.life-field.age).toFixed(1)),max:field.life,active:true};return{id,current:id==='railburst'?this.railContacts:id==='stormlens'?this.lensContacts:id==='reversefield'?this.coilCasts:id==='lightwell'?this.wellContacts:id==='satellites'?Number(Math.max(0,p.satelliteInterval-this.satelliteTimer).toFixed(1)):Number(Math.max(0,p.novaCooldown-this.novaCooldown).toFixed(1)),max:id==='railburst'?p.railHits:id==='stormlens'?p.lensHits:id==='reversefield'?p.coilCasts:id==='lightwell'?p.wellHits:id==='satellites'?p.satelliteInterval:p.novaCooldown,active:false};}
 private field(kind:TechField['kind'],at:{x:number;y:number}){if(this.fields.length>=F.fieldLimit)return false;const p=flightProfile(this.assembly).breakthrough;this.fields.push({id:++this.serial,kind,x:clamp(at.x,32,688),y:clamp(at.y,158,1198),age:0,life:kind==='reflect'?p.reflectLife:p.wellLife,radius:kind==='reflect'?p.reflectRadius:p.wellRadius,remaining:kind==='reflect'?p.reflectCount:0,tick:0});this.events.push({type:kind==='reflect'?'ion-storm':'laser'});return true;}
 private laserCombination(e:Enemy,source:string){if(source!=='laser'&&source!=='prism')return;const p=flightProfile(this.assembly).breakthrough;if(p.stormlens){this.lensContacts=Math.min(p.lensHits,this.lensContacts+1);if(this.lensContacts>=p.lensHits&&this.lensCooldown<=0){this.lensContacts=0;this.lensCooldown=p.lensCooldown;this.arc(e,p.lensDamage,'stormlens');}}if(p.lightwell&&source==='laser'){this.wellContacts=Math.min(p.wellHits,this.wellContacts+1);if(this.wellContacts>=p.wellHits&&this.wellCooldown<=0&&this.field('well',e)){this.wellContacts=0;this.wellCooldown=p.wellCooldown;}}}
 private gunCombination(b:Bullet){const p=flightProfile(this.assembly).breakthrough;if(!p.railburst||b.damageSource||b.style==='rail')return;this.railContacts=Math.min(p.railHits,this.railContacts+1);if(this.railContacts<p.railHits||this.railCooldown>0||this.bullets.filter(b=>!b.hostile).length>F.bulletLimit-3)return;this.railContacts=0;this.railCooldown=p.railCooldown;for(const side of[-1,0,1]){const shot=this.bullet(this.player.x+side*26,this.player.y-42,side*150,-1200,p.railDamage,false,'rail',2);if(shot)shot.damageSource='railburst';}this.events.push({type:'laser'});}
 private updateFields(dt:number){const p=flightProfile(this.assembly).breakthrough;for(const f of this.fields){f.age+=dt;if(f.kind==='reflect'){f.x=this.player.x;f.y=this.player.y;}else if(f.age<f.life){f.tick-=dt;if(f.tick<=0){f.tick=p.wellInterval;for(const offset of[0,Math.PI/2]){const a=f.age*1.4+offset,dx=Math.cos(a)*f.radius,dy=Math.sin(a)*f.radius;this.beam({x:f.x-dx,y:f.y-dy},{x:f.x+dx,y:f.y+dy},p.wellDamage,'lightwell');}}}}this.fields=this.fields.filter(f=>f.age<f.life&&(f.kind!=='reflect'||f.remaining>0));}
 private spawn(kind:EnemyKind,x:number,y=-60){if(this.enemies.length>=F.enemyLimit)return;const s=stats[kind],hp=s.hp*(1+this.sector*.4),enemy:Enemy={id:++this.serial,kind,x,y,px:x,py:y,hp,maxHp:hp,r:s.r,age:0,timer:kind==='drone'?2.1:1.4,angle:0,seed:this.random()*Math.PI*2,burn:0,burnTick:0,hit:0};this.enemies.push(enemy);return enemy;}
 private beginBoss(){
  const boss=this.spawn('boss',360,-140);if(!boss)return;
  this.bossAssembly={parent:boss.id,sector:this.sector,deployed:false,nodes:[],broken:[],shots:[0,0],earlyDisarm:false,ended:false};this.deployBossParts();
 }
 private deployBossParts(){
  const state=this.bossAssembly;if(this.phase!=='boss'||!state||state.ended||state.deployed||this.bossSalvage.length||this.enemies.length>F.enemyLimit-2)return;
  const boss=this.enemies.find(e=>e.id===state.parent&&e.hp>0);if(!boss)return;const spec=bossPartSpec(state.sector);
  for(const side of[-1,1]){const pos=bossPartPosition(boss,side,0),e=this.spawn('node',pos.x,pos.y)!;e.bossPart={parent:boss.id,side,kind:spec.kind};e.timer=(spec.kind==='lens'?2.1:1.6)+(side>0?.45:0);state.nodes.push(e.id);}state.deployed=true;
 }
 private tryBossSalvage(){
  if(this.phase==='dead')return;for(const pending of this.bossSalvage.slice()){const l=this.addDrop(pending.x,pending.y,pending.part,pending.amount);if(!l)break;l.bossPartReward=(l.bossPartReward??0)+pending.amount;l.age=0;this.bossSalvageIssued++;this.bossSalvageIssuedAmount+=pending.amount;this.bossSalvage.splice(this.bossSalvage.indexOf(pending),1);}
 }
 private breakBossPart(e:Enemy){
  const state=this.bossAssembly;if(!e.bossPart||!state||state.ended||state.parent!==e.bossPart.parent||!state.nodes.includes(e.id)||state.broken.includes(e.id))return;
  const boss=this.enemies.find(n=>n.id===state.parent&&n.hp>0);if(!boss)return;state.approach??='disarm';state.broken.push(e.id);this.bossModulesBroken++;this.score+=bossPartRules.score;
  if(state.approach==='disarm'&&state.broken.length===2&&boss.hp>=boss.maxHp*.5)state.earlyDisarm=true;
  this.bossSalvage.push({node:e.id,x:e.x,y:e.y,part:bossPartSpec(state.sector).part,amount:bossPartReward(state)});this.tryBossSalvage();
  this.fx({kind:'reactor',x:e.x,y:e.y,size:90,color:'#a0f3ff',life:.7});this.events.push({type:'kill'});this.awardScore(e);
 }
 private finishBossParts(boss:Enemy){
  const state=this.bossAssembly;if(!state||state.parent!==boss.id||state.ended)return;
  if(state.approach==='disarm'&&state.earlyDisarm)this.bossTactics.add('disarm');else if(state.approach==='core')this.bossTactics.add('core');state.ended=true;
  for(const e of this.enemies)if(e.bossPart?.parent===boss.id||e.bossMine===boss.id){if(e.hp>0&&e.bossPart)this.fx({kind:'reactor',x:e.x,y:e.y,size:70,color:'#b4eaff',life:.5});e.hp=0;}
 }
 private bossPartShot(e:Enemy){
  const state=this.bossAssembly,part=e.bossPart;if(this.phase==='dead'||!state||state.ended||!part||state.parent!==part.parent||!this.enemies.some(n=>n.id===part.parent&&n.hp>0))return;
  const index=state.nodes.indexOf(e.id);if(index<0)return;const origins=bossPartMuzzles(e),speed=210+Math.min(90,this.sector*12);
  if(part.kind==='gun'){const aim=Math.atan2(this.player.y-e.y,this.player.x-e.x);for(let i=0;i<3;i++){const p=origins[i],a=aim+(i-1)*.18;if(this.bullet(p.x,p.y,Math.cos(a)*speed*1.15,Math.sin(a)*speed*1.15,1,true,'enemy',0,false,e.id))state.shots[index]++;}e.timer=bossPartRules.gunInterval;}
  else if(part.kind==='lens'){const p=origins[0],a=Math.atan2((e.aimY??this.player.y)-p.y,(e.aimX??this.player.x)-p.x),end={x:p.x+Math.cos(a)*1600,y:p.y+Math.sin(a)*1600};this.fx({kind:'laser',x:p.x,y:p.y,points:[p,end],size:12,color:'#ff927b',life:bossPartRules.lensLife,hostile:true});state.shots[index]++;if(segmentDistance(this.player.x,this.player.y,p.x,p.y,end.x,end.y)<F.playerRadius+6)this.hurt();e.aimX=undefined;e.aimY=undefined;e.timer=bossPartRules.lensInterval;}
  else{const p=origins[0],mine=this.spawn('mine',p.x,p.y);if(mine){mine.bossMine=part.parent;this.minesDeployed++;state.shots[index]++;this.fx({kind:'spark',x:p.x,y:p.y,size:30,color:'#ffc78a',life:.2});}e.timer=bossPartRules.mineInterval;}
 }
 private tryEncounter(){
  if(this.phase!=='running'||this.sectorTime<18||this.sectorTime>38||this.encounterSector===this.sector||this.encounter?.pending)return;
  const kind:EncounterKind=(['arms','mines','shield']as const)[this.sector%3],needed=kind==='shield'?3:1;if(this.enemies.length>F.enemyLimit-needed)return;
  const x=kind==='shield'?240+this.random()*240:120+this.random()*480,target=this.spawn(kind==='arms'?'courier':kind==='mines'?'minelayer':'projector',x,-80)!;if(kind==='mines')target.timer=.35;
  if(kind==='shield')for(const side of[-1,1]){const escort=this.spawn('sentry',x+side*145,20)!;escort.protectedBy=target.id;escort.angle=side;escort.shield=escort.shieldMax=720*(1+this.sector*.2);}
  this.encounterSector=this.sector;this.encounter={id:++this.encountersStarted,sector:this.sector,kind,target:target.id,started:this.time,outcome:'active',claimed:false};const info=encounterTypes[kind];this.notice={title:info.name,detail:info.brief+' · 掉落后飞近拾取',time:3,icon:info.icon};this.events.push({type:'warning'});
 }
 private releaseShields(id:number){for(const e of this.enemies)if(e.protectedBy===id){if((e.shield??0)>0)this.fx({kind:'spark',x:e.x,y:e.y,size:64,color:'#8beeff',life:.28});e.shield=0;e.protectedBy=undefined;}}
 private finishEncounter(won:boolean,at?:{x:number;y:number}){
  const e=this.encounter;if(!e||e.outcome!=='active'||won&&(this.phase==='dead'||this.player.hp<=0))return;e.outcome=won?'won':'escaped';e.ended=this.time;this.releaseShields(e.target);const target=this.enemies.find(n=>n.id===e.target);if(!won&&target)target.retreat=true;
  this.encounterHistory.push({id:e.id,sector:e.sector,kind:e.kind,outcome:e.outcome,started:e.started,time:this.time,claimed:false});if(this.encounterHistory.length>12)this.encounterHistory.shift();const info=encounterTypes[e.kind];
  if(won&&at){this.encountersWon++;e.pending={x:at.x,y:at.y};this.tryEncounterReward();}else this.notice={title:'目标撤离 · '+info.name,detail:'继续空战 · 下一空域有新的战术目标',time:3};
 }
 private tryEncounterReward(){const e=this.encounter;if(!e?.pending||e.rewardId!==undefined||this.phase==='dead')return;const info=encounterTypes[e.kind],l=this.addDrop(e.pending.x,e.pending.y,info.part,4);if(!l)return;l.encounterReward=e.id;l.age=0;e.rewardId=l.id;e.pending=undefined;this.notice={title:'行动达成 · '+info.name,detail:'4'+{alloy:'弹芯',coil:'线圈',lens:'透镜'}[info.part]+'已掉落 · 飞近拾取',time:3,icon:info.icon};this.events.push({type:'reward',value:e.kind});}
 private updateEncounter(){const e=this.encounter;if(e?.outcome==='active'){const target=this.enemies.find(n=>n.id===e.target&&n.hp>0);if(!target||target.y>1320||this.time-e.started>=encounterTypes[e.kind].duration)this.finishEncounter(false);}}
 private spawnWave(){
  if((this.wave+1)%4===2){
   const needed=3+Math.min(3,this.sector)+(this.sectorTime>30?1:0);if(this.enemies.length>F.enemyLimit-needed){this.spawnTimer=.35;return;}
   const plan=airspacePlan(this.sector),specs=airspaceFormation(this.sector,this.random()<.5?1:-1);this.wave++;
   for(const spec of specs){const e=this.spawn(spec.kind,spec.x,spec.y)!;if(spec.maneuver){e.maneuver=spec.maneuver;e.timer=spec.maneuver.kind==='cross'?.9:1.25;}}
   for(let i=3;i<needed;i++)this.spawn('drone',90+(i-2)*540/(needed-2),-380-(i-3)*75);
   this.airspaceFormations++;if(this.maneuverSector!==this.sector){this.maneuverSector=this.sector;if(this.notice.time<=0)this.notice={title:plan.name,detail:plan.brief,time:3};}return;
  }
  this.wave++;const p=this.sector%3,late=this.sectorTime>30,n=3+Math.min(3,this.sector),side=this.random()<.5?1:-1;
  if(this.wave%5===0){this.spawn(p===0?'lancer':p===1?'spinner':'sentry',120+this.random()*480);this.spawn('sentry',side===1?100:620,-240);return;}
  for(let i=0;i<n;i++){let x=90+(540/(n-1))*i,y=-60-i*62;
   if(p===1)x=side===1?110+i*70:610-i*70;
   if(p===2){x=i%2?540:180;y=-60-Math.floor(i/2)*110;}
   this.spawn(this.wave%3===0?(p===1?'diver':late?'sentry':'diver'):'drone',x,y);
  }
  if(late&&this.wave%2===0)this.spawn(p===0?'spinner':p===1?'lancer':'sentry',360,-300);
 }
 private enemyShot(e:Enemy){
  const dx=(e.kind==='lancer'?e.aimX??this.player.x:this.player.x)-e.x,dy=(e.kind==='lancer'?e.aimY??this.player.y:this.player.y)-e.y,a=Math.atan2(dy,dx),speed=210+Math.min(90,this.sector*12);
  const emit=(angle:number,scale=1,style:Bullet['style']='enemy')=>this.bullet(e.x,e.y+e.r*.6,Math.cos(angle)*speed*scale,Math.sin(angle)*speed*scale,1,true,style);
  if(e.bossPart){this.bossPartShot(e);return;}
  if(e.maneuver){
   const m=e.maneuver,origin=maneuverMuzzle(e),fire=(angle:number,scale=1,style:Bullet['style']='enemy')=>{if(this.bullet(origin.x,origin.y,Math.cos(angle)*speed*scale,Math.sin(angle)*speed*scale,1,true,style,0,false,e.id))this.airspaceShots++;};
   if(m.kind==='sweep'){const direction=Math.PI/2+Math.sin(e.angle)*.65;for(const offset of[-.16,0,.16])fire(direction+offset,1.1);e.angle+=.65*m.side;e.timer=1.65;}
   else if(m.kind==='cross'){for(const offset of[-.14,.14])fire(a+offset,1.15);e.timer=1.8;}
   else{for(let i=0;i<6;i++)fire(e.angle+i*Math.PI/3,.85,'orb');e.angle+=.22*m.side;e.timer=2.25;}
   return;
  }
  if(e.kind==='courier'){for(const side of[-1,0,1]){const angle=a+side*.18;this.bullet(e.x+side*26,e.y+54,Math.cos(angle)*speed*1.1,Math.sin(angle)*speed*1.1,1,true,'enemy',0,false,e.id);}e.timer=1.8;}
  else if(e.kind==='minelayer'){for(const side of[-1,0,1])if(this.enemies.length<F.enemyLimit-1){const mine=this.spawn('mine',clamp(e.x+side*60,40,680),e.y+48);if(mine){this.minesDeployed++;this.fx({kind:'spark',x:mine.x,y:mine.y,size:25,color:'#ffbd78',life:.25});}}e.timer=1.8;}
  else if(e.kind==='projector'){for(let i=0;i<6;i++)emit(e.angle+i*Math.PI/3,.75,'orb');e.angle+=.3;e.timer=2.6;}
  else if(e.kind==='mine'){for(let i=0;i<8;i++)emit(e.seed+i*Math.PI/4,.95,'orb');e.hp=0;this.fx({kind:'explosion',x:e.x,y:e.y,size:90,color:'#ffbb7b',life:.35});this.events.push({type:'kill'});}
  else if(e.kind==='drone'){emit(a);e.timer=2.8;}
  else if(e.kind==='sentry'){for(const d of[-.22,0,.22])emit(a+d);e.timer=2.5;}
  else if(e.kind==='spinner'){for(let i=0;i<10;i++)emit(e.angle+i*Math.PI/5,.75,'orb');e.angle+=.25;e.timer=2.8;}
  else if(e.kind==='lancer'){
   // The beam is already firing; only this visible finite segment can hurt.
   const end={x:e.x+Math.cos(a)*1600,y:e.y+Math.sin(a)*1600};this.fx({kind:'laser',x:e.x,y:e.y,points:[{x:e.x,y:e.y},end],size:11,color:'#ff7868',life:.2,hostile:true});
   if(segmentDistance(this.player.x,this.player.y,e.x,e.y,end.x,end.y)<F.playerRadius+5)this.hurt();e.timer=3.1;e.aimX=undefined;e.aimY=undefined;
  }else if(e.kind==='boss'){
   const modular=this.bossAssembly?.parent===e.id&&this.bossAssembly.deployed;
   if(this.sector%3===0){for(let i=0;i<14;i++)emit(e.angle+i*Math.PI/7,.8,'orb');if(!modular)for(const d of[-.3,-.15,0,.15,.3])emit(a+d,1.25);}
   else if(this.sector%3===1){for(const side of[-1,1]){const x=e.x+side*90,y=e.y+40,aim=Math.atan2(this.player.y-y,this.player.x-x);for(const d of(modular?[-.17,0,.17]:[-.34,-.17,0,.17,.34]))this.bullet(x,y,Math.cos(aim+d)*speed*1.3,Math.sin(aim+d)*speed*1.3,1,true,'enemy');}}
   else{for(let i=0;i<10;i++)emit(e.angle+i*Math.PI/5,.55,'orb');if(!modular)for(const side of[-1,1])for(const d of[-.1,0,.1])this.bullet(e.x+side*80,e.y+50,Math.sin(d)*speed,Math.cos(d)*speed*1.6,1,true);}
   e.angle+=.21;e.timer=e.hp<e.maxHp*.5?1.05:1.6;
   if(this.enemies.length<5){this.spawn(this.sector%2?'diver':'sentry',100,-80);this.spawn('drone',620,-150);}
  }
 }
 /** Physical shots collide before player damage; no weapon procs or rewards from ordnance. */
 private interceptShots(){
  const targets=this.bullets.filter(b=>b.hostile&&b.style==='orb'&&b.life>0&&b.age<b.life);
  for(const b of this.bullets){if(b.hostile||b.life<=0||b.age>=b.life)continue;let victim:Bullet|undefined,first=Infinity;
   for(const e of targets){if(e.life<=0)continue;const ax=b.px-e.px,ay=b.py-e.py,bx=b.x-e.x,by=b.y-e.y,r=b.r+e.r;
    if(Math.min(ax,bx)>r||Math.max(ax,bx)<-r||Math.min(ay,by)>r||Math.max(ay,by)<-r||segmentDistance(0,0,ax,ay,bx,by)>r)continue;
    const dx=bx-ax,dy=by-ay,t=clamp(-(ax*dx+ay*dy)/(dx*dx+dy*dy||1),0,1);if(t<first){victim=e;first=t;}
   }
   if(victim){victim.life=0;this.shotInterceptions++;if(b.pierce>0)b.pierce--;else b.life=0;this.fx({kind:'spark',x:victim.x,y:victim.y,size:27,color:'#9cf2ed',life:.18});}
  }
 }
 private hurt(){if(this.player.invulnerable>0||this.phase==='dead')return;this.player.hp--;this.damageTaken++;this.player.invulnerable=1.25;this.events.push({type:'hurt'});this.fx({kind:'ring',x:this.player.x,y:this.player.y,size:90,color:'#ff806d',life:.4});if(this.player.hp<=0){this.phase='dead';this.finishEncounter(false);this.events.push({type:'death'});this.fx({kind:'explosion',x:this.player.x,y:this.player.y,size:170,color:'#ffbe70',life:.8});}}
 private addDrop(x:number,y:number,part:Loot['part'],amount=1){if(this.loot.length>=F.lootLimit){const same=this.loot.find(l=>l.part===part);if(same){same.amount+=amount;return same;}return undefined;}const drop:Loot={id:++this.serial,x:clamp(x,40,680),y:clamp(y,158,1160),part,amount,age:0,phase:this.random()*6.28};this.loot.push(drop);return drop;}
 private randomPart():Part{const roll=this.random();if(this.target&&roll<.55){const cost=this.assembly.cost(this.target);const needed=parts.filter(p=>(cost[p]??0)>this.assembly.inventory[p]);if(needed.length)return needed[Math.floor(this.random()*needed.length)];}return parts[Math.floor(this.random()*parts.length)];}
 private hit(e:Enemy,amount:number,source:string){if(e.hp<=0||this.player.hp<=0||this.phase==='dead')return;if((e.shield??0)>0){const absorbed=Math.min(e.shield!,amount);e.shield!-=absorbed;this.shieldDamage+=absorbed;amount-=absorbed;e.hit=.1;this.fx({kind:'spark',x:e.x,y:e.y,size:40,color:'#91eaff',life:.12});if(amount<=0)return;}const dealt=Math.min(e.hp,amount);e.hp-=amount;e.hit=.07;const key=this.assembly.keystone;if(key&&(source===key||key==='arsenal'&&source==='guns'||source===this.assembly.breakthrough))e.keystoneHit=key;this.contribution[source]=(this.contribution[source]??0)+dealt;const state=this.bossAssembly;if(e.kind==='boss'&&state?.parent===e.id&&state.deployed&&!state.approach&&e.hp<=e.maxHp*.75&&state.nodes.length===2&&state.nodes.every(id=>this.enemies.some(n=>n.id===id&&n.hp>0)))state.approach='core';if(e.hp>0)return;
  if(e.kind==='node')this.breakBossPart(e);if(e.kind==='boss')this.finishBossParts(e);
  const combo=flightProfile(this.assembly).breakthrough;if(e.kind!=='mine'&&combo.novaecho&&(e.burn>0||source==='burn')&&source!=='novaecho'&&this.novaCooldown<=0){this.novaCooldown=combo.novaCooldown;const targets=this.enemies.filter(n=>n.hp>0&&n.y>=155&&n.y<=1280).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,4);for(let i=0;i<4;i++){const target=targets[i],angle=target?Math.atan2(target.y-e.y,target.x-e.x):-Math.PI/2+(i-1.5)*.45;this.beam({x:e.x,y:e.y},{x:e.x+Math.cos(angle)*1100,y:e.y+Math.sin(angle)*1100},combo.novaDamage,'novaecho');}}
  if(e.kind==='node')return;
  if(e.kind==='mine'){this.ordnanceCleared++;this.score+=stats.mine.score;this.fx({kind:'reactor',x:e.x,y:e.y,size:100,color:'#9cf5ff',life:.45});this.events.push({type:'kill'});for(const other of this.enemies)if(other.id!==e.id&&other.hp>0&&Math.hypot(other.x-e.x,other.y-e.y)<115)this.hit(other,35*(1+this.sector*.2),'mineblast');this.awardScore(e);return;}
  this.kills++;this.score+=stats[e.kind].score;this.dryKills++;if(source==='bounce')this.advanceTrial('ricochet',e);if(e.kind==='boss'&&e.keystoneHit)this.keystoneWins.add(e.keystoneHit);
  this.fx({kind:'explosion',x:e.x,y:e.y,size:e.kind==='boss'?280:e.r*2.7,color:'#ffc383',life:.65});this.events.push({type:e.kind==='boss'?'boss-kill':'kill'});
  if(this.dryKills>=4||this.random()<.36||e.kind==='boss'){const part=this.randomPart();const armor=e.kind!=='boss'&&this.ordinaryDrops++%defenseRules.armorEvery===0;this.addDrop(e.x,e.y,armor?'armor':part,e.kind==='boss'?3:1);this.dryKills=0;}
  if(e.kind==='projector')this.releaseShields(e.id);if(e.kind==='boss'){this.finishEncounter(false);for(const [i,p]of parts.entries())this.addDrop(e.x+(i-1)*95,e.y+80,p,2);this.addDrop(e.x,e.y+150,'repair');this.bossKills++;this.sector++;this.sectorTime=0;this.phase='running';this.spawnTimer=2;this.notice={title:'空域突破',detail:airspacePlan(this.sector).name+' · 首领留下组装零件',time:4};for(const b of this.bullets)if(b.hostile)b.life=0;}
  this.awardScore(e);if(this.encounter?.target===e.id)this.finishEncounter(true,e);
 }
 private awardScore(e:{x:number;y:number}){
  while(this.score>=this.nextAward){this.scoreAwards++;const earned=this.nextAward;this.nextAward+=300+this.scoreAwards*150;this.addDrop(e.x-42,e.y+38,parts[(this.scoreAwards-1)%3],2);if(this.scoreAwards%3===0)this.addDrop(e.x+42,e.y+38,'repair');this.notice={title:`${earned} 分 · 击破补给`,detail:'双份组件已掉落 · 飞近拾取',time:3};this.events.push({type:'reward'});}
 }
 private arc(from:{x:number;y:number},damage:number,source='coil'){
  const profile=flightProfile(this.assembly).electric,count=profile.targets,range=profile.range,visited=new Set<number>();let pos=from;
  for(let i=0;i<count;i++){
   const candidates=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&!visited.has(e.id)&&Math.hypot(e.x-pos.x,e.y-pos.y)<(i===0?range:profile.jumpRange));
   candidates.sort((a,b)=>this.assembly.has('seeker')?Number(b.timer<.6)-Number(a.timer<.6)||Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y):Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y));const e=candidates[0];if(!e)break;
   visited.add(e.id);this.fx({kind:'arc',x:pos.x,y:pos.y,points:[{x:pos.x,y:pos.y},{x:e.x,y:e.y}],size:3,color:'#c4a0ff',life:.18});this.fx({kind:'spark',x:e.x,y:e.y,size:28,color:'#e4ceff',life:.2});this.hit(e,damage*Math.pow(profile.falloff,i),source);pos=e;
  }
  if(source==='coil'&&visited.size>=3)this.advanceTrial('relay',pos);if(source==='coil'&&visited.size>0){const p=flightProfile(this.assembly).breakthrough;if(p.reversefield){this.coilCasts=Math.min(p.coilCasts,this.coilCasts+1);if(this.coilCasts>=p.coilCasts&&this.field('reflect',this.player))this.coilCasts=0;}}
 }
 private beam(start:{x:number;y:number},end:{x:number;y:number},damage:number,source:string,reflect=false){
  const profile=flightProfile(this.assembly).optical,contacts=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&segmentDistance(e.x,e.y,start.x,start.y,end.x,end.y)<e.r+9).sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y)).slice(0,profile.targets);
  for(const e of contacts){this.hit(e,damage,source);this.laserCombination(e,source);if(profile.burn){e.burn=profile.burnTicks;e.burnTick=profile.burnInterval;}}
  if(source==='laser'&&contacts.length>=2)this.advanceTrial('beam',contacts[contacts.length-1]);
  this.fx({kind:'laser',x:start.x,y:start.y,points:[start,end],size:reflect?7:11,color:source==='sun'?'#ffe4a0':'#8af6ff',life:.18});
 }
 private componentArc(from:{x:number;y:number},damage:number,count:number,range:number,source:string,excluded?:number){let at=from;const used=new Set(excluded===undefined?[]:[excluded]);for(let i=0;i<count;i++){const e=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&!used.has(e.id)&&Math.hypot(e.x-at.x,e.y-at.y)<range).sort((a,b)=>Math.hypot(a.x-at.x,a.y-at.y)-Math.hypot(b.x-at.x,b.y-at.y))[0];if(!e)break;used.add(e.id);this.fx({kind:'arc',x:at.x,y:at.y,points:[{x:at.x,y:at.y},{x:e.x,y:e.y}],size:4,color:'#cdb5ff',life:.2});this.hit(e,damage,source);at=e;}}
 private componentAttacks(dt:number){
  const p=this.player,profile=flightProfile(this.assembly),r=componentRules;if(p.hp<=0||this.phase==='dead')return;
  for(let col=0;col<3;col++){const id=profile.components[col];if(!id)continue;this.componentTimers[col]-=dt;if(this.componentTimers[col]>0)continue;const rule=r[id as keyof typeof r],power=profile.powers[col];this.componentTimers[col]=rule.interval;
   if(id==='hive'){for(const side of[-1,1])for(const i of[-1,0,1]){const angle=-Math.PI/2+side*.16+i*.18,b=this.bullet(p.x+side*68,p.y-20,Math.cos(angle)*r.hive.speed,Math.sin(angle)*r.hive.speed,r.hive.damage*power,false,'wing');if(b)b.damageSource=id;}this.events.push({type:'fire'});}
   else if(id==='needles'){for(const dx of[-18,0,18]){const b=this.bullet(p.x+dx,p.y-56,0,-r.needles.speed,r.needles.damage*power,false,'rail',r.needles.pierce);if(b)b.damageSource=id;}this.events.push({type:'fire'});}
   else if(id==='seekorb'){for(const side of[-1,1]){const b=this.bullet(p.x+side*72,p.y,side*110,-Math.sqrt(r.seekorb.speed**2-110**2),r.seekorb.damage*power,false,'orb');if(b){b.damageSource=id;b.guidance=r.seekorb.turn;b.life=r.seekorb.life;b.r=10;}}this.events.push({type:'arc'});}
   else if(id==='electrodes'){for(const port of electrodePorts(p,this.time)){this.componentArc(port,r.electrodes.damage*power,1,r.electrodes.range,id);const b=this.bullets.filter(b=>b.hostile&&b.life>0&&Math.hypot(b.x-port.x,b.y-port.y)<r.electrodes.intercept).sort((a,b)=>Math.hypot(a.x-port.x,a.y-port.y)-Math.hypot(b.x-port.x,b.y-port.y))[0];if(b){b.life=0;this.componentInterceptions++;this.fx({kind:'spark',x:b.x,y:b.y,size:38,color:'#d4c2ff',life:.25});this.fx({kind:'arc',x:port.x,y:port.y,points:[port,{x:b.x,y:b.y}],size:3,color:'#d2bcff',life:.18});}}this.events.push({type:'arc'});}
   else if(id==='tracker'){const from={x:p.x,y:p.y-52},target=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&Math.hypot(e.x-from.x,e.y-from.y)<r.tracker.range).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y))[0];if(target){const angle=Math.atan2(target.y-from.y,target.x-from.x);this.beam(from,{x:from.x+Math.cos(angle)*r.tracker.range,y:from.y+Math.sin(angle)*r.tracker.range},r.tracker.damage*power,id);this.events.push({type:'laser'});}}
   else if(id==='blades'){for(const end of bladeEnds(p,this.time))this.beam({x:p.x,y:p.y},end,r.blades.damage*power,id);this.events.push({type:'laser'});}
  }
 }
 private attacks(dt:number){
  const a=this.assembly,p=this.player,{guns:g,electric:em,optical:op,breakthrough:combo}=flightProfile(a);if(combo.satellites&&this.satelliteTimer<=0&&this.bullets.filter(b=>!b.hostile).length<=F.bulletLimit-2){this.satelliteTimer=combo.satelliteInterval;for(const pos of this.satellitePositions()){const target=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<pos.y).sort((a,b)=>Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y))[0],angle=target?Math.atan2(target.y-pos.y,target.x-pos.x):-Math.PI/2;const shot=this.bullet(pos.x,pos.y-14,Math.cos(angle)*900,Math.sin(angle)*900,combo.satelliteDamage,false,'wing');if(shot)shot.damageSource='satellites';}this.events.push({type:'fire'});}this.shotTimer-=dt;this.arcTimer-=dt;this.laserTimer-=dt;this.railTimer-=dt;this.empTimer-=dt;this.sunTimer-=dt;
  if(this.shotTimer<=0){this.shotTimer+=g.interval;this.shots++;this.bullet(p.x,p.y-42,0,-1050,g.damage,false,'pulse',0,g.flak&&this.shots%g.flakInterval===0);
   if(g.wingCount){const dirs=g.wingCount===6?[-.36,-.23,-.11,.11,.23,.36]:[-.17,.17];for(const ang of dirs){let vx=Math.sin(ang)*850,vy=-Math.cos(ang)*850;if(g.seeking){const e=this.enemies.filter(e=>e.hp>0&&e.y<p.y).sort((a,b)=>a.hp-b.hp)[0];if(e){const d=Math.hypot(e.x-p.x,e.y-p.y);vx=(e.x-p.x)/d*850+Math.sin(ang)*180;vy=(e.y-p.y)/d*850;}}this.bullet(p.x+Math.sign(ang)*38,p.y-24,vx,vy,g.wingDamage,false,'wing');}}
   this.events.push({type:'fire'});
  }
  if(g.rail&&this.railTimer<=0){this.railTimer=g.railInterval;this.bullet(p.x,p.y-48,0,-1350,g.railDamage,false,'rail',g.railPierce);}
  if(em.enabled&&this.arcTimer<=0){this.arcTimer=em.interval;this.arc({x:p.x,y:p.y-38},em.damage);if(em.sources===2)this.arc({x:p.x+65,y:p.y-20},em.damage,'tempest');this.events.push({type:'arc'});}
  if(op.enabled&&this.laserTimer<=0){this.laserTimer=op.interval;const d=op.damage;for(const x of op.beams===3?[p.x-64,p.x,p.x+64]:[p.x])this.beam({x,y:p.y-40},{x,y:110},d,'laser');
   if(op.prism)for(const side of[-1,1]){const x=side===-1?12:708,y=p.y-Math.abs(p.x-x)*1.2;this.beam({x:p.x,y:p.y-40},{x,y},d*op.prismDamage,'prism',true);this.beam({x,y},{x:p.x,y:y-Math.abs(p.x-x)*1.2},d*op.prismDamage,'prism',true);}this.events.push({type:'laser'});
  }
  if(em.emp&&this.empTimer<=0){this.empTimer=em.empInterval;this.fx({kind:'ring',x:p.x,y:p.y,size:em.empRadius,color:'#c6a0ff',life:.5});for(const e of this.enemies)if(Math.hypot(e.x-p.x,e.y-p.y)<em.empRadius)this.hit(e,em.empDamage,'emp');for(const b of this.bullets)if(b.hostile&&Math.hypot(b.x-p.x,b.y-p.y)<em.empRadius)b.life=0;this.events.push({type:'ion-storm'});}
  if(op.sun&&this.sunTimer<=0){this.sunTimer=op.sunInterval;for(let i=0;i<op.sunBeams;i++){const angle=-Math.PI/2+(i-3.5)*.16;this.beam({x:p.x,y:p.y-40},{x:p.x+Math.cos(angle)*1400,y:p.y+Math.sin(angle)*1400},op.sunDamage,'sun');}this.events.push({type:'laser'});}
 }
 step(dt:number,targetX=this.player.x,targetY=this.player.y){
  if(this.phase==='dead'||!Number.isFinite(dt)||dt<=0)return;dt=clamp(dt,0,1/30);this.time+=dt;this.sectorTime+=dt;this.railCooldown=Math.max(0,this.railCooldown-dt);this.lensCooldown=Math.max(0,this.lensCooldown-dt);this.novaCooldown=Math.max(0,this.novaCooldown-dt);this.wellCooldown=Math.max(0,this.wellCooldown-dt);this.satelliteTimer=Math.max(0,this.satelliteTimer-dt);this.notice.time=Math.max(0,this.notice.time-dt);
  const p=this.player,parameters=flightProfile(this.assembly);p.px=p.x;p.py=p.y;const dx=clamp(targetX,32,688)-p.x,dy=clamp(targetY,F.minY,F.maxY)-p.y,d=Math.hypot(dx,dy),f=Math.min(1,F.speed*dt/(d||1));p.x+=dx*f;p.y+=dy*f;p.invulnerable=Math.max(0,p.invulnerable-dt);p.armor=Math.max(0,p.armor-dt);this.armorFlash=Math.max(0,this.armorFlash-dt);
  this.spawnTimer-=dt;if(this.phase==='running'&&this.sectorTime>=60){if(this.enemies.length<F.enemyLimit){this.phase='boss';this.beginBoss();this.notice={title:'旗舰接近',detail:'击破获得三系零件 · 注意实际弹幕',time:3};}}
  else if(this.phase==='running'&&this.spawnTimer<=0){this.spawnTimer=Math.max(1.45,3.3-this.sector*.18);this.spawnWave();}
  this.tryEncounter();this.deployBossParts();
  for(const e of this.enemies){e.px=e.x;e.py=e.y;e.age+=dt;e.hit=Math.max(0,e.hit-dt);if(e.y>155)e.timer-=dt;
   if(e.retreat){e.y+=250*dt;}
   else if(e.bossPart){const parent=this.enemies.find(n=>n.id===e.bossPart!.parent&&n.hp>0);if(parent){const at=bossPartPosition(parent,e.bossPart.side,e.age);e.x=at.x;e.y=at.y;}else e.hp=0;}
   else if(e.maneuver){const at=maneuverPose(e.maneuver,e.age);e.x=at.x;e.y=at.y;}
   else if(e.kind==='courier'){e.y+=90*dt;e.x+=Math.cos(e.seed+e.age*1.3)*110*dt;}
   else if(e.kind==='minelayer'){e.y+=(e.y<275?120:e.age>11?145:26)*dt;e.x+=Math.cos(e.seed+e.age*.8)*105*dt;}
   else if(e.kind==='mine'){e.y+=45*dt;}
   else if(e.kind==='projector'){e.y+=(e.y<275?120:e.age>11?145:20)*dt;e.x+=Math.cos(e.seed+e.age*.7)*26*dt;}
   else if(e.protectedBy!==undefined){const source=this.enemies.find(n=>n.id===e.protectedBy&&n.hp>0);if(source){e.x=source.x+e.angle*145;e.y=source.y+100;}}
   else if(e.kind==='boss'){e.y=Math.min(285,e.y+130*dt);e.x=360+Math.sin(e.age*.5)*(this.bossAssembly?.parent===e.id?bossPartRules.swing:190);}
   else if(e.kind==='drone'){e.y+=130*dt;e.x+=Math.cos(e.seed+e.age*2)*45*dt;}
   else if(e.kind==='diver'){e.y+=(e.age>1.8?300:90)*dt;e.x+=Math.sin(e.seed)*95*dt;}
   else{e.y+=((e.age<2||e.age>8)?105:12)*dt;e.x+=Math.cos(e.seed+e.age)*30*dt;}
   e.x=clamp(e.x,32,688);if((e.kind==='lancer'||e.bossPart?.kind==='lens')&&e.y>155&&e.timer<=(e.bossPart?bossPartRules.lensLock:.65)&&e.aimX===undefined){e.aimX=p.x;e.aimY=p.y;}if(e.hp>0&&e.y>155&&!e.retreat){if(e.kind==='mine'){if(e.age>=.9&&(e.age>=4.5||Math.hypot(e.x-p.x,e.y-p.y)<145))this.enemyShot(e);}else if(e.timer<=0&&(e.kind!=='diver'||!!e.maneuver))this.enemyShot(e);}
   if(e.burn>0){e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=parameters.optical.burnInterval;e.burn--;this.hit(e,parameters.optical.burnDamage,'burn');}}
   if(e.hp>0&&(e.kind!=='mine'||e.age>=.9)&&segmentDistance(0,0,e.px-p.px,e.py-p.py,e.x-p.x,e.y-p.y)<e.r*.7+F.playerRadius)this.hurt();
  }
  if(p.hp<=0)return;this.updateFields(dt);this.attacks(dt);this.componentAttacks(dt);
  for(const b of this.bullets){if(p.hp<=0)break;b.px=b.x;b.py=b.y;b.age+=dt;if(!b.hostile&&b.guidance&&b.life>0){let target=this.enemies.find(e=>e.id===b.targetId&&e.hp>0&&e.y>=155&&e.y<=1280);if(!target){target=this.enemies.filter(e=>e.hp>0&&e.y>=155&&e.y<=1280&&Math.hypot(e.x-b.x,e.y-b.y)<componentRules.seekorb.range).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];b.targetId=target?.id;}if(target){const angle=Math.atan2(b.vy,b.vx),desired=Math.atan2(target.y-b.y,target.x-b.x),turn=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle)),next=angle+clamp(turn,-b.guidance*dt,b.guidance*dt);b.vx=Math.cos(next)*componentRules.seekorb.speed;b.vy=Math.sin(next)*componentRules.seekorb.speed;}}b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.hostile&&(b.age>=b.life||b.x<-defenseRules.edge||b.x>F.width+defenseRules.edge||b.y<134-defenseRules.edge||b.y>F.height+defenseRules.edge)){b.life=0;this.expiredHostiles++;}
   if(!b.hostile&&b.bounce>0&&(b.x<10||b.x>710)){b.x=clamp(b.x,10,710);b.vx=-b.vx;b.bounce--;this.fx({kind:'spark',x:b.x,y:b.y,size:25,color:'#ffd989',life:.2});}
  }
  this.interceptShots();
  for(const b of this.bullets){if(p.hp<=0)break;
   if(b.life<=0||b.age>=b.life)continue;
   if(b.hostile){const f=this.fields.find(f=>f.kind==='reflect'&&f.remaining>0&&Math.hypot(b.x-f.x,b.y-f.y)<=f.radius);if(f&&this.bullets.filter(n=>!n.hostile).length<F.bulletLimit){f.remaining--;b.hostile=false;b.vx*=-1.35;b.vy*=-1.35;b.px=b.x;b.py=b.y;b.damage=parameters.breakthrough.reflectDamage;b.damageSource='reversefield';delete b.sourceEnemy;b.style='pulse';b.r=4;b.age=0;b.life=2.8;b.hits.clear();b.bounce=this.assembly.has('bounce')?1:0;this.fx({kind:'spark',x:b.x,y:b.y,size:50,color:'#caa9ff',life:.22});}}
   if(b.hostile){const distance=segmentDistance(0,0,b.px-p.px,b.py-p.py,b.x-p.x,b.y-p.y);if(p.armor>0&&distance<defenseRules.armorRadius+b.r){b.life=0;this.armorBlocks++;if(this.armorFlash<=0){this.armorFlash=.08;this.fx({kind:'ring',x:p.x,y:p.y,size:70,color:'#9af8de',life:.25});this.events.push({type:'armor-block'});}}else if(distance<F.playerRadius+b.r){this.hurt();b.life=0;}}
   else for(const e of this.enemies){if(e.hp<=0||e.y<125||b.hits.has(e.id)||segmentDistance(0,0,b.px-e.px,b.py-e.py,b.x-e.x,b.y-e.y)>e.r+b.r)continue;b.hits.add(e.id);this.hit(e,b.damage,b.damageSource??(b.style==='rail'?'rail':'guns'));if(b.guidance)this.componentArc(e,componentRules.seekorb.chainDamage*parameters.powers[1],2,componentRules.seekorb.chainRange,'seekorb',e.id);this.gunCombination(b);this.fx({kind:'spark',x:b.x,y:b.y,size:b.style==='rail'?36:18,color:'#ffcf87',life:.16});
    if(b.explosive){this.fx({kind:'explosion',x:e.x,y:e.y,size:parameters.guns.flakRadius,color:'#ffd191',life:.4});for(const other of this.enemies)if(other.id!==e.id&&Math.hypot(other.x-e.x,other.y-e.y)<parameters.guns.flakRadius)this.hit(other,b.damage*parameters.guns.flakDamage,'flak');}
    if(this.assembly.has('bounce')&&b.style!=='rail'){const other=this.enemies.filter(o=>o.hp>0&&o.y>=155&&o.y<=1280&&!b.hits.has(o.id)&&Math.hypot(o.x-e.x,o.y-e.y)<280).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(other){this.fx({kind:'arc',x:e.x,y:e.y,points:[{x:e.x,y:e.y},{x:other.x,y:other.y}],size:2,color:'#ffcc83',life:.14});this.hit(other,b.damage*parameters.guns.bounceDamage,'bounce');}}
    if(parameters.electric.storm&&++this.stormHits%parameters.electric.stormContacts===0)this.arc(e,parameters.electric.stormDamage,'stormgun');
    if(b.pierce>0)b.pierce--;else{b.life=0;break;}
   }
  }
  for(const e of this.effects)if(e.hostile&&e.points&&e.age<e.life){const[a,b]=e.points;if(segmentDistance(p.x,p.y,a.x,a.y,b.x,b.y)<F.playerRadius+e.size/2)this.hurt();}
  if(p.hp>0)for(const l of this.loot){l.age+=dt;if(l.age>=lootLife(l)||l.y>=1320)continue;l.y+=22*dt;const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy);if(d<155){l.x+=dx/d*360*dt||0;l.y+=dy/d*360*dt||0;}if(Math.hypot(l.x-p.x,l.y-p.y)<30){const beforeHp=p.hp;if(l.part==='repair')p.hp=Math.min(p.maxHp,p.hp+1);else if(l.part==='armor'){p.armor=defenseRules.armorDuration;this.armorPickups++;}else{this.assembly.inventory[l.part]+=l.amount;this.partsCollected+=l.amount;}const previous=this.pickupReceipt;this.pickupReceipt={part:l.part,amount:previous?.part===l.part&&previous.until>this.time?previous.amount+l.amount:l.amount,until:this.time+defenseRules.receiptLife,repaired:p.hp-beforeHp};if(this.trial?.rewardId===l.id)this.trial.claimed=true;if(l.encounterReward!==undefined){if(this.encounter?.id===l.encounterReward)this.encounter.claimed=true;const record=this.encounterHistory.find(r=>r.id===l.encounterReward);if(record)record.claimed=true;}this.bossSalvageCollected+=l.bossPartReward??0;l.age=99;this.fx({kind:'pickup',x:p.x,y:p.y,size:56,color:l.part==='armor'?'#9af8de':l.part==='repair'?'#9df0ba':l.part==='alloy'?'#ffd28a':l.part==='coil'?'#c5a4ff':'#8bf3ff',life:.55,icon:l.part==='repair'||l.part==='armor'?undefined:l.part==='alloy'?3:l.part==='coil'?1:2,label:l.part==='armor'?'光甲 6秒':l.part==='repair'?(p.hp>beforeHp?'生命 +1':'生命已满'):`${supplyName(l.part)} +${l.amount}`});this.events.push({type:'pickup',value:l.part});}}
  this.enemies=this.enemies.filter(e=>e.hp>0&&e.y<1390);this.bullets=this.bullets.filter(b=>b.life>0&&b.age<b.life&&b.y>-100&&b.y<1390&&b.x>-120&&b.x<840);this.loot=this.loot.filter(l=>l.age<lootLife(l)&&l.y<1320);this.tryTrialReward();this.updateEncounter();this.tryEncounterReward();this.tryBossSalvage();
  for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.life);
 }
 drainEvents(){return this.events.splice(0);}
 diagnostics(){return{pickupReceipt:this.pickupReceipt?{...this.pickupReceipt}:null,armorPickups:this.armorPickups,armorBlocks:this.armorBlocks,shotInterceptions:this.shotInterceptions,expiredHostiles:this.expiredHostiles,componentInterceptions:this.componentInterceptions,components:componentPairs.map(pair=>pair.find(id=>this.assembly.has(id))),componentTimers:[...this.componentTimers],bossAssembly:this.bossAssembly?{...this.bossAssembly,nodes:[...this.bossAssembly.nodes],broken:[...this.bossAssembly.broken],shots:[...this.bossAssembly.shots]}:null,bossModulesBroken:this.bossModulesBroken,bossSalvageIssued:this.bossSalvageIssued,bossSalvageIssuedAmount:this.bossSalvageIssuedAmount,bossSalvageCollected:this.bossSalvageCollected,bossSalvagePending:this.bossSalvage.map(e=>({...e})),airspace:{...airspacePlan(this.sector),formations:this.airspaceFormations,shots:this.airspaceShots,active:this.enemies.filter(e=>e.hp>0&&e.maneuver).map(e=>e.id)},breakthrough:this.assembly.breakthrough,breakthroughProgress:this.breakthroughProgress(),fields:this.fields.map(f=>({...f})),encounter:this.encounter?{...this.encounter,pending:this.encounter.pending?{...this.encounter.pending}:undefined}:null,encounterHistory:this.encounterHistory.map(e=>({...e})),encountersStarted:this.encountersStarted,encountersWon:this.encountersWon,ordnanceCleared:this.ordnanceCleared,minesDeployed:this.minesDeployed,shieldDamage:this.shieldDamage,trial:this.trial?{...this.trial,pending:this.trial.pending?{...this.trial.pending}:undefined}:null,careerFacts:this.careerFacts(),time:this.time,sector:this.sector,sectorTime:this.sectorTime,phase:this.phase,player:{...this.player},kills:this.kills,score:this.score,nextAward:this.nextAward,scoreProgress:this.scoreProgress,scoreAwards:this.scoreAwards,partsCollected:this.partsCollected,installed:[...this.assembly.installed],keystone:this.assembly.keystone,inventory:{...this.assembly.inventory},calibrated:{...this.assembly.calibrated},ready:this.assembly.ready.map(t=>t.id),target:this.target,contribution:{...this.contribution},bossKills:this.bossKills,damageTaken:this.damageTaken,enemies:this.enemies.map(e=>({...e})),loot:this.loot.map(l=>({...l})),counts:{bullets:this.bullets.filter(b=>!b.hostile).length,hostiles:this.bullets.filter(b=>b.hostile).length,effects:this.effects.length}};}
}
