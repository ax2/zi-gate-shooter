import {RELAY_SCREEN} from './relay-screen';
import type {OpeningWeapon} from './opening-plan';
import {SWEEPER} from './sweeper';
import {SUPPLY_CONVOY} from './supply-convoy';
import {MAGNETIC,MAGNETIC_REFINEMENT,type MagneticField} from './magnetic-field';
import {canLaserChain,LASER_CHAIN} from './laser-chain';
import {INTERCEPTOR} from './interceptor';
import {buildProofs,proofFormation,PROOF_WAVES,MAGNETIC_PROOF,type BuildProof} from './build-proof';
import { bossFormationFor, ESCORT } from './boss-formations';
import {ION_STORM} from './ion-storm';
import { FRACTURE } from './combos';
import { enemyHealthScale, firstAttackDelay } from './difficulty';
import { Contract, contracts, HUNTER, hunts, type HuntKind, type ContractKind } from './contracts';
import { BuildTree, isMagneticAugment, magneticAugments, SEEKER_BRIDGE, OPTICAL_FORK, ELECTRIC_FORK, BALLISTIC_FORK, RICOCHET, type MagneticAugment, type BuildBranch, type Route } from './build-tree';
import { armoryChoices,refitFocus } from './armory-offers';
import { supportMilestone,laserVisualBand } from './support-profile';
import {builtWeapon,builtSupport} from './build-profile';
import { C, clamp } from './config';
import {CONDUIT,canDisrupt} from './conduit';
import {enemyProjectileScale} from './projectile-pressure';
import type { EnemyKind } from './config';
import { sweep } from './collision';
import { activateOverload, gateValue, gateRewardLabel, grantEquipment, grantGate, permanentPower } from './rewards';
import type { Growth } from './rewards';
import { timeline, sectorIndex, sectorNames, SWARM } from './director';
import type { Spawn } from './director';
import { safeRoute } from './reachability';
import { advanceBody, guardClosed } from './behavior';
import { weaponNames, ARC_SHOT } from './weapons';
import type { WeaponKind } from './weapons';

export type BodyKind = EnemyKind | 'crate' | 'gate' | 'pickup';
export interface Body {
  id: number; kind: BodyKind; x: number; y: number; px: number; py: number;
  width: number; height: number; hp: number; maxHp: number; speed: number;
  active: boolean; age: number; timer: number; warning: number; hit: number;
  deploying?: boolean;reboundOrigin?:number;
  interceptWingShots?:number;interceptCoreShots?:number;interceptFiredAt?:number;interceptFireBeat?:0|1;interceptCoreRemaining?:number;
  energy: number; row: number; stage: number; rewardKind: 'power' | 'energy'; attack: number; lane: number;
  attackCycle: number; burst: number; fractureHits?:number; fractureReadyAt?:number; burnTicks?:number; burnTimer?:number; burnDamage?:number;
  dropGrace?:number;empRemaining?:number;sentryVolleys?:number;sweeperShots?:number;formationShots?:number;shotScale?:number; capacitorHits?:number; counterfire?:boolean;counterReady?:boolean;counterVolleys?:number;counterShotAge?:number; bountyRound?:number;bountyShots?:number;proofTarget?:boolean;proofShots?:number;proofGroup?:number;proofRound?:number;escort?:boolean;
  weaponKind?: WeaponKind;refit?:boolean;openingSupply?:boolean; pattern?: 'weave' | 'flank' | 'fan' | 'relocate' | 'intercept' | 'rebound' | 'convoy' | 'sweep' | 'relay-screen'; bossVariant?: number;
}
export interface Bullet {
  id: number; x: number; y: number; px: number; py: number;
  vx: number; vy: number; damage: number; age: number; active: boolean; hostile: boolean;
  sourceId?:number;weaponKind?: WeaponKind; remainingTargets?: number; hitBodies?: number[]; splashRadius?: number; chainHops?: number;
}
export interface EffectEvent { fieldId?:number;targetId?:number; seeker?:boolean; escortReward?:boolean; type: string; x: number; y: number; targetX?: number; targetY?: number; prism?: boolean; opticalBand?:1|2|3; text?: string; detail?: string; size?: number; enemyKind?: EnemyKind; bossVariant?: number; equipmentStage?: number; weaponKind?: WeaponKind }
interface Contact { t: number; rank: number; id: number; apply: () => void }
export type Phase = 'running' | 'boss-entry' | 'boss' | 'recovery' | 'dead';

/** Rendering-free authoritative simulation. Instances are discarded on restart. */
export class World {
  interceptorBreaks=0;
  readonly build = new BuildTree();
  private firstEquipmentResearch=false;
  private firstArmoryResearch=false;
  private bossResearchPoints=0;
  private contractResearchPoints=0;
  get researchPoints(){return Number(this.firstEquipmentResearch)+Number(this.firstArmoryResearch)+this.bossResearchPoints+this.contractResearchPoints;}
  get buildPoints(){return (this.growth.mastery??0)+this.researchPoints;}
  private equipmentResearch(exclusive:boolean){
    const before=this.researchPoints;
    this.firstEquipmentResearch=true;
    if(exclusive)this.firstArmoryResearch=true;
    return this.researchPoints-before;
  }
  chooseBuild(route: Route,branch?:BuildBranch) {
    if(isMagneticAugment(branch)&&!this.canRefineMagnetic())return false;
    if(!this.build.choose(route,this.buildPoints,branch))return false;
    if(isMagneticAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'磁暴精研 · '+magneticAugments[branch].name,detail:branch==='field-wide'?`半径${MAGNETIC_REFINEMENT.wideRadius} · 每拍${MAGNETIC_REFINEMENT.wideDamage*100}% · 常规精调保留`:`场外${MAGNETIC_REFINEMENT.linkRange}内一敌 · 原三拍/常规精调保留`});
    const kind=route==='ballistic'?'scatter':route==='electric'?'arc':null;
    if(kind && !this.activeWeapons.includes(kind)) {
      for(const owned of this.activeWeapons){this.weaponStages.set(owned,this.weaponStage(owned));this.acquiredWeapons.add(owned);}
      this.weaponStages.set(kind,1);this.acquiredWeapons.add(kind);
    }
    this.announceMagnetic();this.announceLaserChain();return true;
  }
  dropSpawns=0;dropKills=0;arcLinks=0;
  conduitBursts=0;empTargets=0;conduitTacticalWins=0;
  private dischargeConduit(source:Body){
    this.conduitBursts++;let affected=0,interrupted=0;
    for(const b of this.bodies)if(b.active&&canDisrupt(b.kind)&&!(b.dropGrace??0)&&b.y>=C.playerShotTop&&b.y<=C.playerY
      &&Math.hypot(b.x-source.x,b.y-source.y)<=CONDUIT.radius){
      if(b.warning>0)interrupted++;
      if((b.empRemaining??0)<CONDUIT.duration){affected++;this.empTargets++;}
      b.empRemaining=Math.max(b.empRemaining??0,CONDUIT.duration);b.warning=0;b.burst=0;b.timer=Math.max(b.timer,.6);
      if(b.pattern==='intercept')b.interceptCoreRemaining=0;
    }
    if(interrupted>=2)this.conduitTacticalWins++;
    this.effects.push({type:'emp',x:source.x,y:source.y,size:CONDUIT.radius,text:`中继击破 · ${affected}台停火`,detail:interrupted?`中断${interrupted}台蓄能 · 已发敌弹仍危险`:'停火1.5秒 · 已发敌弹仍危险'});
  }
  scatterPierces=0;scatterBursts=0;scatterSplashHits=0;scatterRicochets=0;
  ionCharge=0;ionBursts=0;ionHits=0;
  private ionReadyAt=0;
  private ionImpact(body:Body,damage:number){
    if(this.build.ranks.electric<3||this.bossVictory||(this.phase!=='running'&&this.phase!=='boss'))return;
    this.ionCharge=Math.min(ION_STORM.hits,this.ionCharge+1);
    if(this.ionCharge<ION_STORM.hits||this.time+1e-9<this.ionReadyAt)return;
    const targets=this.bodies.filter(target=>target.active&&target.kind in C.enemies&&!guardClosed(target)&&!(target.dropGrace??0)
      &&target.y>=C.playerShotTop&&target.y<=C.playerY&&!(target.kind==='boss'&&this.phase!=='boss')
      &&Math.hypot(target.x-body.x,target.y-body.y)<=ION_STORM.radius);
    // Hold a full circuit rather than spend it on an already empty impact point.
    if(!targets.length)return;
    this.ionCharge=0;this.ionReadyAt=this.time+ION_STORM.cooldown;this.ionBursts++;
    this.effects.push({type:'ion-storm',x:body.x,y:body.y,size:ION_STORM.radius,weaponKind:'arc'});
    for(const target of targets){
      if(!target.active||this.bossVictory||(this.phase!=='running'&&this.phase!=='boss'))continue;
      const before=target.hp;this.hit(target,damage*ION_STORM.damage,'arc');if(target.hp<before)this.ionHits++;
    }
  }
  seekerLinks=0;
  capacitorBursts=0;
  private capacitor(body:Body,damage:number){
    if(this.build.electricBranch!=='capacitor'||!body.active||!(body.kind in C.enemies)||guardClosed(body)
      ||body.y<C.playerShotTop||body.y>C.playerY||(body.kind==='boss'&&this.phase!=='boss'))return;
    body.capacitorHits=(body.capacitorHits??0)+1;
    if(body.capacitorHits<ELECTRIC_FORK.hits)return;
    body.capacitorHits=0;this.capacitorBursts++;
    this.effects.push({type:'capacitor',x:body.x,y:body.y,size:100,weaponKind:'arc'});
    this.hit(body,damage*ELECTRIC_FORK.damage,'arc');
  }
  burnHits=0;relayHits=0;
  private opticalSecondary(body:Body,damage:number){
    if(!(body.kind in C.enemies)||guardClosed(body)||(body.dropGrace??0)>0)return;
    if(this.build.opticalBranch==='burn'){
      if(!body.active)return;
      body.burnDamage=Math.max(body.burnDamage??0,damage*OPTICAL_FORK.burnDamage);
      body.burnTicks=OPTICAL_FORK.burnTicks;
      // Refresh the duration without postponing a pending tick.
      body.burnTimer=Math.min(body.burnTimer??OPTICAL_FORK.burnInterval,OPTICAL_FORK.burnInterval);
    }
  }
  private splitLaser(damage:number){
    const x=this.player.x,start=C.playerY-100;
    const candidates=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>=C.playerShotTop&&b.y<start
      &&!(b.kind==='boss'&&this.phase!=='boss')&&Math.abs(b.x-x)>b.width/2+8&&Math.abs(b.x-x)<=OPTICAL_FORK.relayRange)
      .sort((a,b)=>Math.hypot(a.x-x,a.y-start)-Math.hypot(b.x-x,b.y-start)||a.id-b.id);
    const target=candidates[0];if(!target)return;
    // Resolve the first collider along the finite split ray, including rewards and shields.
    const contacts=this.bodies.filter(b=>b.active&&b.kind!=='pickup'&&b.y>=C.playerShotTop&&b.y<start
      &&!(b.kind==='boss'&&this.phase!=='boss'))
      .map(body=>({body,t:sweep(x,start,target.x,target.y,body.x,body.y,body.x,body.y,body.width/2+5,body.height/2+5)}))
      .filter((hit):hit is {body:Body;t:number}=>hit.t!==null).sort((a,b)=>a.t-b.t||a.body.id-b.body.id);
    const hit=contacts[0];if(!hit)return;
    const endX=x+(target.x-x)*hit.t,endY=start+(target.y-start)*hit.t;
    this.relayHits++;this.effects.push({type:'refract',x,y:start,targetX:endX,targetY:endY});
    this.hit(hit.body,damage*OPTICAL_FORK.relayDamage,'pulse');return hit.body.id;
  }
  laserArcHits=0;
  laserFocusHits=0;
  private laserLinkEnergy=0;
  private laserLinkTargets=new Set<number>();
  get laserChainReady(){return this.laserLinkEnergy>0;}
  private announcedLaserChain=false;
  laserChainUnlocked(){return canLaserChain(this.build,this.activeWeapons.includes('arc')?this.weaponStage('arc'):0);}
  private announceLaserChain(){
    if(this.announcedLaserChain||!this.laserChainUnlocked())return;
    this.announcedLaserChain=true;this.laserTimer=0;
    this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'组合完成 · 电光连锁',detail:'全武器直击释出 · 群敌跳链 / 单体聚能'});
  }
  private laserChain(origin:{x:number;y:number},damage:number,visited:Set<number>){
    if(!this.laserChainUnlocked()||this.bossVictory||(this.phase!=='running'&&this.phase!=='boss'))return 'blocked';
    const hits=this.laserArcHits;let from=origin;
    for(let hop=0;hop<LASER_CHAIN.hops;hop++){
      if(this.bossVictory)break;
      const target=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&(!visited.has(b.id)||guardClosed(b)||(b.dropGrace??0)>0)
        &&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss')&&Math.hypot(b.x-from.x,b.y-from.y)<=LASER_CHAIN.range)
        .sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y)||a.id-b.id)[0];
      if(!target)break;
      if(guardClosed(target)||(target.dropGrace??0)>0)return this.laserArcHits>hits?'hit':'blocked';
      visited.add(target.id);damage*=LASER_CHAIN.decay;
      const before=target.hp;this.hit(target,damage,'pulse');
      if(target.hp<before){this.laserArcHits++;this.effects.push({type:'laser-arc',x:from.x,y:from.y,targetX:target.x,targetY:target.y});}
      from=target;
    }
    return this.laserArcHits>hits?'hit':'none';
  }
  private releaseLaserLink(source:{x:number;y:number;id:number}){
    if(this.laserLinkEnergy<=0||source.y<C.playerShotTop||source.y>C.playerY)return;
    const visited=new Set(this.laserLinkTargets);visited.add(source.id);
    let result=this.laserChain(source,this.laserLinkEnergy,visited);
    if(result==='none'){
      const target=this.bodies.find(b=>b.id===source.id&&b.active&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0));
      if(target){const before=target.hp;this.hit(target,this.laserLinkEnergy*LASER_CHAIN.focus,'pulse');
        if(target.hp<before){this.laserFocusHits++;this.effects.push({type:'laser-focus',x:target.x,y:target.y});result='hit';}}
    }
    if(result==='hit'){this.laserLinkEnergy=0;this.laserLinkTargets.clear();}
  }
  private advanceBurn(dt:number){
    if(this.phase!=='running'&&this.phase!=='boss')return;
    for(const body of this.bodies){
      if(!body.active||!body.burnTicks||body.y<C.playerShotTop||body.y>C.playerY||(body.kind==='boss'&&this.phase!=='boss'))continue;
      body.burnTimer=(body.burnTimer??OPTICAL_FORK.burnInterval)-dt;
      while(body.active&&body.burnTicks>0&&body.burnTimer<=1e-9){
        body.burnTimer+=OPTICAL_FORK.burnInterval;body.burnTicks--;this.burnHits++;
        this.effects.push({type:'burn-tick',x:body.x,y:body.y,weaponKind:'blast'});this.hit(body,body.burnDamage??0,'blast');
      }
      if(!body.burnTicks)body.burnDamage=undefined;
    }
  }
  fractureBursts=0;
  magneticFields:MagneticField[]=[];
  magneticBursts=0;magneticHits=0;magneticLinkHits=0;magneticWideHits=0;
  lastMagneticRefinementHit?:{mode:string;fieldId:number;targetId:number;time:number;x:number;y:number;fromX:number;fromY:number;distance:number};
  lastMagneticHit?:{fieldId:number;targetId:number;time:number;x:number;y:number;link?:boolean};
  magneticProofHits=0;readonly magneticCertifications=new Set<MagneticAugment>();
  private recordMagneticProofHit(target:Body){if(target.proofRound===this.round&&target.proofGroup&&this.contract?.recordMagneticGroup(target.proofGroup,this.round))this.magneticProofHits++;}
  private magneticReadyAt=0;private magneticId=0;private announcedMagnetic=false;
  magneticUnlocked(){return this.activeWeapons.includes('blast')&&this.weaponStage('blast')>=2&&this.build.ranks.electric>=2;}
  canRefineMagnetic(){return this.magneticUnlocked()&&this.build.ranks.electric>=3&&!this.build.magneticAugment;}
  private announceMagnetic(){
    if(this.announcedMagnetic||!this.magneticUnlocked())return;
    this.announcedMagnetic=true;
    this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'组合完成 · 磁暴榴弹',detail:'爆裂命中留下三拍电场 · 原火力保留'});
  }
  private leaveMagnetic(body:Body,damage:number){
    if(!this.magneticUnlocked()||this.bossVictory||(this.phase!=='running'&&this.phase!=='boss')||this.time+1e-9<this.magneticReadyAt||this.magneticFields.length>=MAGNETIC.limit)return;
    this.magneticReadyAt=this.time+MAGNETIC.cooldown;this.magneticBursts++;
    this.magneticFields.push({id:++this.magneticId,x:body.x,y:body.y,age:0,damage:damage*(this.build.magneticAugment==='field-wide'?MAGNETIC_REFINEMENT.wideDamage:MAGNETIC.damage),pulses:0,radius:this.build.magneticAugment==='field-wide'?MAGNETIC_REFINEMENT.wideRadius:MAGNETIC.radius,link:this.build.magneticAugment==='field-link'});
  }
  private advanceMagnetic(dt:number){
    if(this.phase!=='running'&&this.phase!=='boss'){this.magneticFields=[];return;}
    for(const field of this.magneticFields){
      field.age+=dt;field.y+=C.scrollSpeed*dt;
      while(field.pulses<MAGNETIC.pulses.length&&field.age+1e-9>=MAGNETIC.pulses[field.pulses]){
        field.pulses++;
        for(const target of this.bodies){
          if(this.bossVictory||this.player.hp<=0)break;
          if(!target.active||!(target.kind in C.enemies)||guardClosed(target)||(target.dropGrace??0)>0||target.y<C.playerShotTop||target.y>C.playerY||(target.kind==='boss'&&this.phase!=='boss')||Math.hypot(target.x-field.x,target.y-field.y)>(field.radius??MAGNETIC.radius))continue;
          const before=target.hp;this.hit(target,field.damage,'blast');
          if(target.hp<before){this.magneticHits++;if((field.radius??MAGNETIC.radius)>MAGNETIC.radius&&Math.hypot(target.x-field.x,target.y-field.y)>MAGNETIC.radius){this.magneticWideHits++;this.recordMagneticProofHit(target);this.lastMagneticRefinementHit={mode:'field-wide',fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,fromX:field.x,fromY:field.y,distance:Math.hypot(target.x-field.x,target.y-field.y)};}this.lastMagneticHit={fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y};this.effects.push({type:'magnetic-hit',x:target.x,y:target.y,weaponKind:'arc',fieldId:field.id,targetId:target.id});}
        }
        if(field.link&&!this.bossVictory&&this.player.hp>0){
          const distance=(b:Body)=>Math.hypot(b.x-field.x,b.y-field.y),priority=(b:Body)=>['sniper','armor','elite','guard','boss'].includes(b.kind)&&b.warning>0?1:0;
          const target=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0)&&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss')&&distance(b)>(field.radius??MAGNETIC.radius)&&distance(b)<=MAGNETIC_REFINEMENT.linkRange)
            .sort((a,b)=>priority(b)-priority(a)||distance(a)-distance(b)||a.id-b.id)[0];
          if(target){const before=target.hp;this.hit(target,field.damage,'arc');if(target.hp<before){this.magneticLinkHits++;this.recordMagneticProofHit(target);this.lastMagneticRefinementHit={mode:'field-link',fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,fromX:field.x,fromY:field.y,distance:distance(target)};this.lastMagneticHit={fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,link:true};this.effects.push({type:'magnetic-link',x:field.x,y:field.y,targetX:target.x,targetY:target.y,fieldId:field.id,targetId:target.id,weaponKind:'arc'});}}
        }
      }
    }
    this.magneticFields=this.magneticFields.filter(f=>f.age<MAGNETIC.life&&f.y-(f.radius??MAGNETIC.radius)<C.playerY);
    if(this.bossVictory||this.player.hp<=0)this.magneticFields=[];
  }
  private announcedFracture=false;
  fractureUnlocked(){return this.activeWeapons.includes('pierce')&&this.activeWeapons.includes('blast')&&this.weaponStage('pierce')>=2&&this.weaponStage('blast')>=2;}
  private announceFracture(){
    this.announceMagnetic();
    if(!this.announcedFracture&&this.fractureUnlocked()){
      this.announcedFracture=true;
      this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'组合完成 · 裂甲爆破',detail:'穿甲连续命中3次引爆 · 原有火力保留'});
    }
  }
  private fracture(body:Body,damage:number){
    if(!this.fractureUnlocked()||!body.active||!(body.kind in C.enemies)||guardClosed(body)||this.time<(body.fractureReadyAt??0))return;
    body.fractureHits=(body.fractureHits??0)+1;
    if(body.fractureHits<FRACTURE.hits)return;
    body.fractureHits=0;body.fractureReadyAt=this.time+FRACTURE.cooldown;this.fractureBursts++;
    this.effects.push({type:'fracture',x:body.x,y:body.y,size:FRACTURE.radius,weaponKind:'blast'});
    this.hit(body,damage*FRACTURE.direct,'blast');
    for(const other of this.bodies)if(other!==body&&other.active&&other.kind in C.enemies
      &&other.y>=C.playerShotTop&&other.y<=C.playerY&&!(other.kind==='boss'&&this.phase!=='boss')
      &&Math.hypot(other.x-body.x,other.y-body.y)<=FRACTURE.radius)this.hit(other,damage*FRACTURE.splash,'blast');
  }
  private calibrations=new Map<WeaponKind,number>();
  weaponCalibration(kind:WeaponKind){return this.calibrations.get(kind)??0;}
  profileFor(kind:WeaponKind) {
    return builtWeapon(kind,this.weaponStage(kind),this.weaponCalibration(kind),this.build);
  }
  supportProfile() {
    return builtSupport(this.growth.mastery,this.build);
  }
  bossWins=0;
  private bossLootRounds:number[]=[];
  get bossRewardRound(){return this.bossLootRounds[0]??null;}
  readonly bossLootStats={claimed:0,research:0,equipment:0};
  claimBossReward(kind:WeaponKind|'research'){
    if(this.bossRewardRound===null||this.player.hp<=0||this.phase==='dead')return false;
    if(kind!=='research'&&!this.activeWeapons.includes(kind))return false;
    this.bossLootRounds.shift();this.bossLootStats.claimed++;
    if(kind==='research'){
      this.bossResearchPoints++;this.bossLootStats.research++;
      this.effects.push({type:'research',x:this.player.x,y:C.playerY,text:'首领蓝图 · 研发+1点',detail:'可推进技能路线 · 已有火力保留'});
    }else{this.bossLootStats.equipment++;this.upgradeOwnedWeapon(kind);}
    this.announceFracture();this.announceLaserChain();return true;
  }
  private upgradeOwnedWeapon(kind:WeaponKind){
    for(const owned of this.activeWeapons)if(!this.weaponStages.has(owned))this.weaponStages.set(owned,this.weaponStage(owned));
    const stage=this.weaponStage(kind);
    if(stage<3){this.weaponStages.set(kind,stage+1);this.growth.stage=Math.max(this.growth.stage,stage+1);this.maxStage=Math.max(this.maxStage,stage+1);}
    else this.calibrations.set(kind,this.weaponCalibration(kind)+1);
    this.effects.push({type:'upgrade',x:this.player.x,y:C.playerY,weaponKind:kind,text:stage<3?`${weaponNames[kind]} · 升至T${stage+1}`:`${weaponNames[kind]} · 专属精校${this.weaponCalibration(kind)}`,detail:stage<3?'其他配件与已有火力保留':`该武器伤害系数 ${100+this.weaponCalibration(kind)*50}%`});
  }
  stormLinks=0;prismHits=0;proofWins=0;
  aceWins=0;flawlessAceWins=0;readonly certifiedBuilds=new Set<BuildProof>();
  availableProofs(){return (Object.keys(buildProofs) as BuildProof[]).filter(kind=>kind==='magnetic'?this.magneticUnlocked()&&!!this.build.magneticAugment:kind==='storm'?this.build.ranks.ballistic>=3&&this.build.ranks.electric>=1:kind==='prism'?this.supportProfile().prism:kind==='fracture'?this.fractureUnlocked():kind==='ion'?this.build.ranks.electric>=3:kind==='ricochet'?this.build.ballisticBranch==='ricochet'&&this.activeWeapons.includes('scatter'):this.laserChainUnlocked());}
  proofCount(kind:BuildProof){return kind==='magnetic'?this.magneticProofHits:kind==='storm'?this.stormLinks:kind==='prism'?this.prismHits:kind==='fracture'?this.fractureBursts:kind==='ion'?this.ionHits:kind==='ricochet'?this.scatterRicochets:this.laserArcHits;}
  readonly contractStats={accepted:0,won:0,failed:0,claimed:0};
  refitsClaimed=0;
  contract?: Contract;
  contractReward?: {charge:number;round:number;research?:number};
  claimContractReward(kind:WeaponKind|'energy'){
    if(!this.contractReward||this.player.hp<=0)return false;
    if(kind!=='energy'&&!this.activeWeapons.includes(kind))return false;
    const reward=this.contractReward;this.contractReward=undefined;this.contractStats.claimed++;
    if(kind==='energy'){
      const result=grantGate(this.growth,reward.charge,'energy');
      if(result.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'reward',x:this.player.x,y:C.playerY,text:`契约奖励 · 充能+${reward.charge}`,detail:this.chargeReceipt(result.activated)});
    }else{
      this.upgradeOwnedWeapon(kind);
    }
    if(reward.research){this.contractResearchPoints+=reward.research;this.effects.push({type:'research',x:this.player.x,y:C.playerY,text:`王牌悬赏 · 研发+${reward.research}点`,detail:'领取额外研发 · 选择升级路线'});}
    this.announceFracture();this.announceLaserChain();
    return true;
  }
  bountyShots=0;
  damageTaken=0;
  canAcceptContract(kind:ContractKind,proof?:BuildProof,hunt?:HuntKind){
    return kind in contracts&&!this.contractReward&&this.phase==='running'&&this.roundTime<=40&&this.player.hp>0&&this.contract?.status!=='active'&&this.contract?.round!==this.round
      &&(kind!=='hunter'||this.activeWeapons.some(k=>this.weaponStage(k)>=2))
      &&(kind==='research'?this.availableProofs().includes(proof??this.availableProofs()[0]):proof===undefined)
      &&(hunt===undefined||kind==='hunter'&&Object.hasOwn(hunts,hunt));
  }
  acceptContract(kind:ContractKind,proof?:BuildProof,hunt?:HuntKind){
    if(!this.canAcceptContract(kind,proof,hunt))return false;
    const selected=kind==='research'?(proof??this.availableProofs()[0]):undefined;
    this.contract=new Contract(kind,this.round,this.kills,this.activeWeapons.length,this.damageTaken,selected?{kind:selected,start:this.proofCount(selected)}:undefined,hunt);this.contractStats.accepted++;return true;
  }
  private spawnCrossfire(challenge:Contract){
    if(challenge.reinforcements||challenge.elapsed<challenge.nextReinforcement)return;
    if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+2>C.limits.enemies){challenge.nextReinforcement=challenge.elapsed+HUNTER.retry;return;}
    const candidates=[220,500].map(x=>{const b=this.spawn('elite',x,180);b.hp*=hunts.crossfire.durability;b.maxHp=b.hp;b.pattern='fan';b.bountyRound=challenge.round;return b;});
    if(!safeRoute(this.player.x,this.bodies,this.bullets,22,{phase:this.phase,phaseTime:this.phaseTime})){
      for(const b of candidates){delete b.bountyRound;b.active=false;}this.fallbackCount++;challenge.nextReinforcement=challenge.elapsed+HUNTER.retry;return;
    }
    challenge.reinforcements=2;this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:'双线王牌 · 同时出击',detail:'两侧强化扇射精英 · 全破额外研发1点'});
  }
  private spawnProofWave(challenge:Contract){
    if(!challenge.proof||challenge.reinforcements>=PROOF_WAVES.groups||challenge.elapsed<challenge.nextReinforcement)return;
    const troops=proofFormation(challenge.proof.kind);
    if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+troops.length>C.limits.enemies){challenge.nextReinforcement=challenge.elapsed+PROOF_WAVES.retry;return;}
    const candidates=troops.map(t=>{const b=this.spawn(t.kind,t.x,t.y);b.proofTarget=true;if('pattern' in t)b.pattern=t.pattern;if(challenge.proof?.kind==='magnetic'){b.hp*=MAGNETIC_PROOF.durability;b.maxHp=b.hp;}if(challenge.proof?.kind==='ricochet'||challenge.proof?.kind==='magnetic'){b.proofGroup=challenge.reinforcements+1;b.proofRound=this.round;}b.dropGrace=SWARM.grace;return b;});
    const horizon=Math.max(...candidates.map(b=>(C.playerY-b.y)/b.speed+1));
    if(!safeRoute(this.player.x,this.bodies,this.bullets,horizon,{phase:this.phase,phaseTime:this.phaseTime})){
      for(const b of candidates)b.active=false;this.fallbackCount++;challenge.nextReinforcement=challenge.elapsed+PROOF_WAVES.retry;return;
    }
    challenge.reinforcements++;challenge.nextReinforcement=challenge.elapsed+PROOF_WAVES.spacing;
    this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:`构筑检验 · ${buildProofs[challenge.proof.kind].name}`,detail:`验证敌阵 ${challenge.reinforcements}/${PROOF_WAVES.groups} · 投送屏障后可命中`});
  }
  readonly growth: Growth = { stage: 1, bonus: 0, energy: 0, overload: 0 };
  weaponKind: WeaponKind = 'pulse';
  player = { x: 360, px: 360, hp: 3, invulnerable: 0 };
  lastDamageCause: 'bullet' | 'enemy' | 'crate' | null = null;
  bodies: Body[] = [];
  bullets: Bullet[] = [];
  effects: EffectEvent[] = [];
  phase: Phase = 'running';
  round = 1; time = 0; roundTime = 0; phaseTime = 0; score = 0;
  shots = 0; hits = 0; kills = 0; cratesBroken = 0; pickups = 0; gatesTaken = 0;
  maxStage = 1; peakBodies = 0; peakBullets = 0; fallbackCount = 0; attackDeferrals = 0;
  private nextId = 1;
  private nextRow = 1;
  private fireTimers = new Map<WeaponKind, number>();
  private laserTimer = 0;
  private acquiredWeapons = new Set<WeaponKind>();
  private weaponStages = new Map<WeaponKind, number>();
  weaponStage(kind: WeaponKind) { return this.weaponStages.get(kind) ?? this.growth.stage; }
  get activeWeapons(): WeaponKind[] { return this.acquiredWeapons.size ? [...this.acquiredWeapons] : [this.weaponKind]; }
  private scheduled: Spawn[];
  private scheduleIndex = 0;
  escortSpawns=0;escortKills=0;tacticalWins=0;
  private escortGroup=0;private escortRetry=0;private bossEscortKills=0;private bossEscortSpawns=0;private bossStartDamage=0;
  get bossFormation(){return bossFormationFor(this.round);}
  get activeEscorts(){return this.bodies.filter(b=>b.active&&b.escort&&b.y<1344);}
  bossShieldActive(){return this.phase==='boss'&&this.bossFormation?.id==='bulwark'&&this.activeEscorts.some(b=>b.kind==='guard');}
  private spawnEscorts(){
    const formation=this.bossFormation;if(!formation||!this.bodies.some(b=>b.active&&b.kind==='boss'))return;
    while(this.escortGroup<formation.groups.length){
      const group=formation.groups[this.escortGroup];
      if(this.phaseTime<group.at||this.phaseTime<this.escortRetry)return;
      if(this.phaseTime>group.at+ESCORT.deadline){this.escortGroup++;continue;}
      if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+group.troops.length>C.limits.enemies){this.escortRetry=this.phaseTime+ESCORT.retry;return;}
      const candidates=group.troops.map(t=>{const b=this.spawn(t.kind,t.x,180);b.escort=true;if(b.kind==='guard'){b.hp*=ESCORT.guardDurability;b.maxHp=b.hp;}b.pattern=t.pattern;b.lane=t.lane??t.x;return b;});
      const horizon=Math.max(...candidates.map(b=>Math.max(3,(C.playerY-b.y)/Math.max(1,b.speed)+1)));
      if(!safeRoute(this.player.x,this.bodies,this.bullets,horizon,{phase:this.phase,phaseTime:this.phaseTime})){
        for(const b of candidates)b.active=false;this.fallbackCount++;this.escortRetry=this.phaseTime+ESCORT.retry;return;
      }
      this.escortSpawns+=candidates.length;this.bossEscortSpawns+=candidates.length;this.escortGroup++;
      this.effects.push({type:'formation',x:360,y:400,text:formation.name,detail:formation.hint});
    }
  }
  private bossVictory = false;
  private secondChance = false;
  private nextSpawnRetry = 0;
  private readonly seed: number;

  // initialRound supports deterministic replay fixtures; normal UI always starts
  // with the default round 1, T1 and zero bonus.
  constructor(seed = 1337, initialRound = 1,readonly openingWeapon?:OpeningWeapon) {
    this.seed = seed; this.round = Math.max(1, Math.floor(initialRound));
    this.scheduled = timeline(this.round, seed);
  }
  emit(type: string, x: number, y: number, text?: string, size?: number) {
    this.effects.push({ type, x, y, text, size });
  }
  drainEffects() { const out = this.effects; this.effects = []; return out; }
  private overloadNotice() {
    const level=this.growth.mastery ?? 0;
    const milestone=supportMilestone(level);
    return milestone ? `${milestone} · 永久火力+10%` : '充能突破 · 永久火力+10% · 超载6秒';
  }

  spawn(kind: BodyKind, x: number, y = -80, stage = 2): Body {
    const enemy = kind in C.enemies ? C.enemies[kind as EnemyKind] : null;
    const hpScale = enemy ? enemyHealthScale(kind as EnemyKind,this.round) : 1;
    const hp = enemy ? enemy.hp * hpScale : kind === 'crate' ? stage === 3 ? 112 : 48 : 1;
    const body: Body = {
      id: this.nextId++, kind, x, y, px: x, py: y,
      width: enemy?.width ?? (kind === 'gate' ? 240 : kind === 'pickup' ? 46 : 96),
      height: enemy?.height ?? (kind === 'gate' ? 138 : kind === 'pickup' ? 54 : 110),
      hp, maxHp: hp, speed: enemy ? enemy.speed * Math.min(1.15, 1 + (this.round - 1) * 0.05) : this.scrollSpeed,
      active: true, age: 0, timer: enemy ? firstAttackDelay(kind as EnemyKind) : 2.4, warning: 0, hit: 0,
      shotScale:enemy?enemyProjectileScale(this.round):1,
      deploying:y<0&&['armor','elite','guard'].includes(kind),
      energy: 0, row: 0, stage, rewardKind: this.growth.bonus >= 100 ? 'energy' : 'power', attack: 0, lane: kind === 'boss' ? 360 : x, attackCycle: 0, burst: 0,
    };
    this.bodies.push(body); return body;
  }
  get scrollSpeed() { return C.scrollSpeed + Math.min(2, this.round - 1) * 10; }
  private spawnGates(x: number, pair: boolean) {
    const row = this.nextRow++;
    for (const cx of pair ? [222, 498] : [x]) {
      const g = this.spawn('gate', cx, 180); g.row = row;
      if (pair && this.growth.bonus < 100) g.rewardKind = cx < 360 ? 'power' : 'energy';
      if (!pair && x === 360) g.width = 264;
    }
  }
  private admit(candidate: Body) {
    const arrival=candidate.kind==='conduit'?Math.max(0,CONDUIT.holdSeconds-candidate.age)+(C.playerY-Math.max(candidate.y,CONDUIT.hoverY))/Math.max(1,candidate.speed)
      :(C.playerY-candidate.y)/Math.max(1,candidate.speed);
    const horizon = Math.max(3,arrival+1);
    if (safeRoute(this.player.x, this.bodies, this.bullets, horizon)) return true;
    candidate.active = false; this.fallbackCount++;
    this.nextSpawnRetry = this.roundTime + 0.5;
    return false;
  }
  private rewardSlots(needed: number) {
    return this.bodies.filter(b => b.active && (b.kind === 'gate' || b.kind === 'crate' || b.kind === 'pickup')).length + needed <= C.limits.rewards;
  }
  private director(dt: number) {
    if (this.phase === 'running') {
      this.roundTime += dt;
      if (!this.secondChance && this.roundTime >= 25 && this.growth.stage === 1 && this.roundTime >= this.nextSpawnRetry && this.rewardSlots(1)) {
        this.secondChance = this.admit(this.spawn('crate', 480, 180, 2));
      }
      while (this.scheduleIndex < this.scheduled.length && this.scheduled[this.scheduleIndex].at <= this.roundTime && this.roundTime >= this.nextSpawnRetry) {
        const s = this.scheduled[this.scheduleIndex++];
        if (s.kind === 'armory') {
          if (!this.rewardSlots(2)) { this.scheduleIndex--; break; }
          const row = this.nextRow++;
          const choices: WeaponKind[][] = this.round > 3 ? [['arc', 'scatter'], ['blast', 'pierce'], ['pulse', 'arc']] : [['scatter', 'pierce'], ['blast', 'arc'], ['pulse', 'blast']];
          const chapterChoices = choices[sectorIndex(this.round)];
          const offered = armoryChoices(this.activeWeapons, chapterChoices,this.round>1?refitFocus(this.activeWeapons,this.weaponKind,this.build.ranks):undefined);
          const crates = (s.convoy?SUPPLY_CONVOY.lanes:[222,498]).map((x, i) => { const offer=offered[i],stage=offer.refit?Math.min(3,this.weaponStage(offer.kind)+1):Math.max(2,s.stage??2,this.growth.stage);
            const b = this.spawn('crate', x, 180, stage); b.row = row; b.weaponKind = offer.kind;b.refit=offer.refit; return b; });
          if (!this.admit(crates[0])) { for (const b of crates) b.active = false; this.scheduleIndex--; break; }
        } else if (s.kind === 'gates') {
          if (this.growth.overload > 0 && this.growth.energy >= 100) {
            if (!this.admit(this.spawn('drone', 360))) { this.scheduleIndex--; break; }
          }
          else {
            if (!this.rewardSlots(s.pair ? 2 : 1)) { this.scheduleIndex--; break; }
            this.spawnGates(s.x, !!s.pair);
          }
        } else if (s.kind === 'crate') {
          if (!this.rewardSlots(1)) { this.scheduleIndex--; break; }
          const crate=this.spawn('crate',s.x,180,s.stage);
          if(this.round===1&&s.at===8&&this.openingWeapon){crate.weaponKind=this.openingWeapon;crate.openingSupply=true;}
          if (!this.admit(crate)) { this.scheduleIndex--; break; }
        }
        else {
          const enemyCount = this.bodies.filter(b => b.active && b.kind in C.enemies).length;
          if (enemyCount >= C.limits.enemies) { this.scheduleIndex--; break; }
          const candidate = this.spawn(s.kind,s.x,s.drop?(s.dropY??SWARM.arrivalY):undefined);
          if(s.drop)candidate.dropGrace=SWARM.grace;
          candidate.pattern = s.pattern; candidate.lane = s.lane ?? s.x;
          if(s.pattern==='intercept')candidate.timer=INTERCEPTOR.opening;
          if(s.pattern==='sweep'&&s.kind!=='drone')candidate.timer=SWEEPER.opening;
          if(s.pattern==='relay-screen'){candidate.timer=s.kind==='guard'?RELAY_SCREEN.guardOpening:RELAY_SCREEN.sniperOpening;if(s.kind==='guard'||s.kind==='sniper'){candidate.hp*=RELAY_SCREEN.durability;candidate.maxHp=candidate.hp;}}
          // Preserve the queued item; wait with an empty lane, never swallow rewards
          // or cancel any already advertised body/attack to manufacture a safe route.
          if (!this.admit(candidate)) { this.scheduleIndex--; break; }
          if(s.drop)this.dropSpawns++;
          if(s.dropNotice)this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:'突降机群',detail:'短暂投送屏障 · 群攻可快速清场'});
          if(s.dropLabel)this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:s.dropLabel,detail:s.dropDetail??(s.kind==='guard'?'前盾后援 · 留意转火角度':s.kind==='sniper'?'两侧哨机 · 优先压制一翼':'装甲纵列 · 集中火力突破')});
        }
      }
      if (this.roundTime >= 72 && this.scheduleIndex >= this.scheduled.length && !this.bodies.some(b => b.active)) {
        this.phase = 'boss-entry'; this.phaseTime = 0;
        this.escortGroup=0;this.escortRetry=0;this.bossEscortKills=0;this.bossEscortSpawns=0;this.bossStartDamage=this.damageTaken;
        const boss = this.spawn('boss', 360, -150); boss.speed = 0;
        boss.bossVariant = sectorIndex(this.round);
        // Show each chapter's signature before high firepower can skip it.
        boss.attackCycle = [0, 2, 3][boss.bossVariant];
        this.emit('alert', 360, 360, `${sectorNames[sectorIndex(this.round)]} · 首领警戒`);
      }
    } else if (this.phase === 'boss-entry') {
      this.phaseTime += dt;
      const boss = this.bodies.find(b => b.kind === 'boss' && b.active);
      if (boss) boss.y = -150 + Math.min(1, this.phaseTime / 2) * (C.bossY+150);
      if (this.phaseTime >= 2) { this.phase = 'boss'; this.phaseTime = 0; }
    } else if (this.phase === 'boss') {this.phaseTime += dt;this.spawnEscorts();}
    else if (this.phase === 'recovery') {
      this.phaseTime += dt;
      if (this.phaseTime >= 4) {
        this.round++; this.roundTime = 0; this.phaseTime = 0; this.phase = 'running';
        this.scheduleIndex = 0; this.secondChance = this.growth.stage > 1; this.nextSpawnRetry = 0;
        this.scheduled = timeline(this.round, this.seed + this.round * 719);
        this.effects.push({type:'round',x:360,y:400,text:`第 ${this.round} 轮 · ${sectorNames[sectorIndex(this.round)]}`,
          detail:`敌弹速度+${Math.round((enemyProjectileScale(this.round)-1)*100)}% · 留意已发弹幕`});
      }
    }
  }

  private arcVelocity(x:number,y:number){
    const straight={vx:0,vy:-ARC_SHOT.speed};
    // Aimed rewards retain the player's straight shot. Never steer away from a
    // box or gate to farm an enemy; collision still decides every real hit.
    if(this.bodies.some(b=>b.active&&(b.kind==='crate'||b.kind==='gate')&&b.y>=C.playerShotTop&&b.y<y
      &&Math.abs(b.x-x)<=b.width/2+3))return straight;
    const target=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&(b.kind!=='boss'||this.phase==='boss')
      &&b.y>=C.playerShotTop&&b.y<=y-ARC_SHOT.minLead&&!(b.dropGrace??0)
      &&Math.abs(b.x-x)<=Math.min(ARC_SHOT.aimWidth,(y-b.y)*ARC_SHOT.maxSlope))
      .sort((a,b)=>b.y-a.y||a.id-b.id)[0];
    if(!target)return straight;
    const dx=target.x-x,dy=target.y-y,length=Math.hypot(dx,dy);
    return {vx:dx/length*ARC_SHOT.speed,vy:dy/length*ARC_SHOT.speed};
  }
  private shoot(dt: number) {
    if (this.phase === 'boss-entry' || this.phase === 'recovery') { this.fireTimers.clear(); this.laserTimer=0; return; }
    for (const kind of this.activeWeapons) {
    let timer = (this.fireTimers.get(kind) ?? 0) - dt;
    const w = this.profileFor(kind);
    while (timer <= 1e-9) {
      if (this.bullets.filter(b => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error('Player bullet budget exceeded');
      for (let i = 0; i < w.offsets.length; i++) {
        const x = this.player.x + w.offsets[i], y = C.playerY - (w.muzzleY ?? 72);
        const velocity=kind==='arc'?this.arcVelocity(x,y):{vx:w.vx[i],vy:-C.bulletSpeed};
        this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, ...velocity,
          damage: w.damage[i] * (1 + permanentPower(this.growth) / 100) * (this.growth.overload > 0 ? 1.35 : 1),
          age: 0, active: true, hostile: false, weaponKind: kind, remainingTargets: w.targets, hitBodies: [], splashRadius: w.splashRadius, chainHops: w.chainHops });
        this.shots++;
      }
      this.effects.push({type:'fire',x:this.player.x,y:C.playerY-70,size:this.weaponStage(kind),weaponKind:kind});
      timer += 1 / w.rate;
    }
    this.fireTimers.set(kind, timer);
    }
    const support=this.supportProfile();
    if (support.laserUnlocked) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0) {
        this.laserTimer += support.laserInterval;
        const start=C.playerY-100,laserDamage=support.laserDamage*(1+permanentPower(this.growth)/100)*(this.growth.overload>0?1.35:1);
        const opticalBand=laserVisualBand(this.growth.mastery,this.build.ranks.optical);
        const visited=new Set<number>();let origin:{x:number;y:number;id:number}|undefined,mainBlocked=false;
        for(const side of support.prism?[0,-1,1]:[0]) {
          const x=this.player.x+side*42, topX=this.player.x+side*180;
          const beamX=(y:number)=>x+(topX-x)*(start-y)/(start-C.playerShotTop);
          const targets=this.bodies.filter(b=>b.active && b.kind!=='pickup' && (b.kind!=='boss'||this.phase==='boss') && b.y>=C.playerShotTop && b.y<start
            && Math.abs(b.x-beamX(b.y))<=b.width/2+8).sort((a,b)=>b.y-a.y || a.id-b.id);
          let end=C.playerShotTop, count=0;
          for(const body of targets){
            const blocked=body.kind==='crate'||body.kind==='gate'||guardClosed(body)||(body.dropGrace??0)>0;
            const damage=support.laserDamage*(side===0?1:.45)*(1+permanentPower(this.growth)/100)*(this.growth.overload>0?1.35:1);
            visited.add(body.id);if(side===0&&count===0){mainBlocked=blocked;if(!blocked&&body.kind in C.enemies)origin={x:body.x,y:body.y,id:body.id};}
            const before=body.hp,beforeEnergy=body.energy;this.hit(body,damage,'pulse');if(side!==0&&body.kind in C.enemies&&body.hp<before)this.prismHits++;
            if(body.hp<before||body.kind==='gate'&&body.energy>beforeEnergy){const contactY=blocked?body.y+body.height/2:body.y;this.effects.push({type:'laser-impact',x:body.x,y:body.y,targetX:beamX(contactY),targetY:contactY,opticalBand,prism:side!==0});}
            if(side===0&&count===0&&!blocked)this.opticalSecondary(body,damage);
            if(blocked || ++count>=support.laserTargets){end=body.y+body.height/2;break;}
          }
          this.effects.push({type:'laser',x,y:start,targetX:beamX(end),targetY:end,prism:side!==0,opticalBand});
        }
        if(this.build.opticalBranch==='relay'){const id=this.splitLaser(laserDamage);if(id!==undefined)visited.add(id);}
        if(this.laserChainUnlocked()&&!mainBlocked){this.laserLinkEnergy=laserDamage;this.laserLinkTargets=visited;if(origin)this.releaseLaserLink(origin);}
      }
    }
  }
  private hostile(x: number, y: number, vx = 0, vy = 280) {
    if (this.bullets.filter(b => b.active && b.hostile).length >= C.limits.hostile) return;
    this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx, vy, damage: 1, age: 0, active: true, hostile: true });
  }
  step(dt: number, targetX = this.player.x) {
    if (this.phase === 'dead') return;
    this.time += dt;
    this.player.px = this.player.x;
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    const distance = clamp(targetX, C.minX, C.maxX) - this.player.x;
    this.player.x += clamp(distance, -C.moveSpeed * dt, C.moveSpeed * dt);
    if (this.phase !== 'boss-entry' && this.phase !== 'recovery') {
      this.growth.overload = Math.max(0, this.growth.overload - dt);
      if (activateOverload(this.growth)) this.emit('overload', this.player.x, C.playerY, this.overloadNotice());
    }
    this.director(dt);
    // Opt-in combat supplies its own targets; it must not depend on a sparse chapter tail.
    const challenge=this.contract;
    if(challenge?.status==='active'&&challenge.kind==='hunter'&&challenge.hunt==='crossfire'&&this.phase==='running')this.spawnCrossfire(challenge);
    if(challenge?.status==='active'&&this.phase==='running'&&challenge.kind==='research')this.spawnProofWave(challenge);
    if(challenge?.status==='active'&&challenge.kind!=='research'&&!(challenge.kind==='hunter'&&challenge.hunt==='crossfire')&&this.phase==='running'&&challenge.reinforcements<(challenge.kind==='hunter'?HUNTER.targets:22)&&challenge.elapsed>=challenge.nextReinforcement){
      const count=this.bodies.filter(b=>b.active&&b.kind in C.enemies).length;
      if(count<C.limits.enemies){
        const hunter=challenge.kind==='hunter',x=hunter?[220,500][challenge.reinforcements]:[200,360,520,360][challenge.reinforcements%4];
        const candidate=this.spawn(hunter?'elite':'drone',x,180);
        if(this.admit(candidate)){if(hunter)candidate.bountyRound=challenge.round;challenge.reinforcements++;challenge.nextReinforcement=challenge.elapsed+(hunter?HUNTER.spacing:.8);}
        else challenge.nextReinforcement=challenge.elapsed+HUNTER.retry;
      }
    }
    const hadBossShield=this.bossShieldActive();
    this.advanceBurn(dt);
    this.advanceMagnetic(dt);
    this.shoot(dt);
    for (const b of this.bodies) {
      b.px = b.x; b.py = b.y;
      const previousWarning = b.warning;
      const wasCounter=b.counterfire,wasCounterVolleys=b.counterVolleys??0;
      advanceBody(b, dt, this.phase, this.phaseTime, (x, y, vx, vy) => {
        const before=this.bullets.length;this.hostile(x,y,vx,vy);
        if(this.bullets.length<=before)return;
        if(b.pattern==='relay-screen'){b.formationShots=(b.formationShots??0)+1;this.bullets[this.bullets.length-1].sourceId=b.id;}
        if(b.proofTarget){b.proofShots=(b.proofShots??0)+1;this.bullets[this.bullets.length-1].sourceId=b.id;}
        if(b.pattern==='sweep'){b.sweeperShots=(b.sweeperShots??0)+1;this.bullets[this.bullets.length-1].sourceId=b.id;}
        if(b.pattern==='intercept'){
          if(b.burst)b.interceptCoreShots=(b.interceptCoreShots??0)+1;else b.interceptWingShots=(b.interceptWingShots??0)+1;
          b.interceptFiredAt=b.age;b.interceptFireBeat=b.burst?1:0;
        }
        if(b.bountyRound!==undefined){b.bountyShots=(b.bountyShots??0)+1;this.bountyShots++;}
      });
      if(b.kind==='boss'&&!wasCounter&&b.counterfire)this.effects.push({type:'boss-counter',x:b.x,y:b.y,text:'首领过热 · 双炮反击',detail:'双炮加入攻击循环 · 已发敌弹仍危险'});
      if(b.kind==='boss'&&(b.counterVolleys??0)>wasCounterVolleys)this.effects.push({type:'counter-fire',x:b.x,y:b.y});
      if (b.kind === 'boss' && previousWarning <= 0 && b.warning > 0
        && !safeRoute(this.player.x, this.bodies, this.bullets, b.attack === 3 ? 8 : 4, { phase: this.phase, phaseTime: this.phaseTime })) {
        // The warning has not been rendered yet. Delay the unannounced attack;
        // once displayed its geometry and duration are never changed.
        if(b.attack===4)b.counterReady=true;
        b.warning = 0; b.timer = 0.3; this.attackDeferrals++;
      }
    }
    for (const b of this.bullets) { b.px = b.x; b.py = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; }
    const contacts: Contact[] = [];
    const add = (t: number | null, rank: number, id: number, apply: () => void) => { if (t !== null) contacts.push({ t, rank, id, apply }); };
    for (const bullet of this.bullets) {
      if (bullet.hostile) {
        add(sweep(bullet.px, bullet.py, bullet.x, bullet.y, this.player.px, C.playerY, this.player.x, C.playerY, 27, 31), 1, bullet.id, () => {
          if (!bullet.active || this.player.hp <= 0) return;
          bullet.active = false; this.hurt('bullet');
        });
      } else for (const body of this.bodies) {
        if (!body.active || body.kind === 'pickup' || (body.kind === 'boss' && this.phase !== 'boss')) continue;
        // Player shots end in the visible combat strip, below the HUD. Clip both
        // moving segments to the same instant, and retain the original step's
        // contact time so a range crossing cannot reorder simultaneous rewards.
        if (bullet.py <= C.playerShotTop) continue;
        const fraction = bullet.y < C.playerShotTop ? (bullet.py - C.playerShotTop) / (bullet.py - bullet.y) : 1;
        const contact = sweep(bullet.px, bullet.py, bullet.px + (bullet.x - bullet.px) * fraction,
          bullet.py + (bullet.y - bullet.py) * fraction, body.px, body.py,
          body.px + (body.x - body.px) * fraction, body.py + (body.y - body.py) * fraction,
          body.width / 2 + 3, body.height / 2 + 8);
        add(contact === null ? null : contact * fraction, 0, bullet.id, () => {
          if (!bullet.active || !body.active || bullet.hitBodies?.includes(body.id)) return;
          bullet.hitBodies?.push(body.id);
          bullet.remainingTargets = (bullet.remainingTargets ?? 1) - 1;
          if (bullet.remainingTargets <= 0 || body.kind === 'gate' || body.kind === 'crate' || guardClosed(body) || (body.dropGrace??0)>0) bullet.active = false;
          const protectedEntry=(body.dropGrace??0)>0;
          if(!protectedEntry&&bullet.weaponKind==='scatter'&&this.build.ballisticBranch==='penetrator'&&body.kind in C.enemies&&(bullet.hitBodies?.length??0)>1){
            this.scatterPierces++;this.effects.push({type:'scatter-pierce',x:body.x,y:body.y,weaponKind:'scatter'});
          }
          const ionEligible=bullet.weaponKind==='arc'&&body.kind in C.enemies&&!guardClosed(body)&&!protectedEntry;
          const linkEligible=body.kind in C.enemies&&!guardClosed(body)&&!protectedEntry;
          const hpBefore=body.hp;
          this.hit(body, bullet.damage, bullet.weaponKind);
          if(protectedEntry)return;
          if(linkEligible&&body.hp<hpBefore&&bullet.weaponKind==='blast')this.leaveMagnetic(body,bullet.damage);
          if(linkEligible&&body.hp<hpBefore&&bullet.weaponKind==='scatter'&&this.build.ballisticBranch==='ricochet'){
            const target=this.bodies.filter(other=>other!==body&&other.active&&other.kind in C.enemies
              &&!(other.dropGrace??0)&&!guardClosed(other)&&!(other.kind==='boss'&&this.phase!=='boss')
              &&other.y>=C.playerShotTop&&other.y<=C.playerY&&Math.abs(other.x-body.x)>=RICOCHET.minSide
              &&Math.hypot(other.x-body.x,other.y-body.y)<=RICOCHET.range)
              .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.id-b.id)[0];
            if(target){const before=target.hp;this.hit(target,bullet.damage*RICOCHET.damage,'scatter');
              if(target.hp<before){this.scatterRicochets++;if(target.proofRound===this.round&&target.proofGroup)this.contract?.recordRicochetGroup(target.proofGroup,this.round);this.effects.push({type:'ricochet',x:body.x,y:body.y,targetX:target.x,targetY:target.y,weaponKind:'scatter'});}
            }
          }
          if(bullet.weaponKind==='pierce')this.fracture(body,bullet.damage);
          if(bullet.weaponKind==='arc')this.capacitor(body,bullet.damage);
          if(ionEligible&&body.hp<hpBefore)this.ionImpact(body,bullet.damage);
          const support=this.supportProfile();
          if (support.refractionTargets > 0 && bullet.weaponKind === 'pulse' && body.kind in C.enemies && !guardClosed(body)) {
            const reflected=this.bodies.filter(other=>other!==body && other.active && other.kind in C.enemies
              && other.y>=C.playerShotTop && other.y<=C.playerY && !(other.kind==='boss'&&this.phase!=='boss') && Math.hypot(other.x-body.x,other.y-body.y)<=support.refractionRange)
              .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.id-b.id).slice(0,support.refractionTargets);
            for(const next of reflected){
              this.effects.push({type:'refract',x:body.x,y:body.y,targetX:next.x,targetY:next.y});
              this.hit(next,bullet.damage*support.refractionDamage,'pulse');
            }
          }
          if (bullet.chainHops && body.kind in C.enemies) {
            const visited = new Set([body.id]); let origin = body, damage = bullet.damage;
            for (let hop = 0; hop < bullet.chainHops && !guardClosed(origin) && !(origin.dropGrace??0); hop++) {
              const seeker=hop===0&&bullet.weaponKind==='arc'&&this.build.electricBranch==='seeker';
              const candidates = this.bodies.filter(other => other.active && !visited.has(other.id)&&(!seeker||!(other.dropGrace??0)) && other.kind in C.enemies
                && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind==='boss'&&this.phase!=='boss')
                && Math.hypot(other.x-origin.x,other.y-origin.y) <= (seeker?SEEKER_BRIDGE.range:this.build.ranks.electric>=2?220:160));
              const priority=(target:Body)=>seeker&&!guardClosed(target)&&['sniper','armor','elite','guard','boss'].includes(target.kind)?target.warning>0?2:1:0;
              candidates.sort((a,b) => priority(b)-priority(a)||Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y) || a.id-b.id);
              const next = candidates[0]; if (!next) break;
              visited.add(next.id); damage *= this.build.ranks.electric>=3?0.8:0.65;
              this.effects.push({type:'arc',x:origin.x,y:origin.y,targetX:next.x,targetY:next.y,seeker});
              const before=next.hp,conducts=!guardClosed(next)&&!(next.dropGrace??0);this.hit(next,damage,bullet.weaponKind);if(bullet.weaponKind==='arc'&&next.hp<before){this.arcLinks++;if(seeker)this.seekerLinks++;if(conducts)this.ionImpact(next,damage);}
              if(bullet.weaponKind==='scatter'&&next.hp<before)this.stormLinks++;origin = next;
            }
          }
          if (bullet.splashRadius && body.kind in C.enemies && !(bullet.weaponKind==='scatter'&&guardClosed(body))) {
            // No secondary explosions, reward charging or off-screen farming.
            if(bullet.weaponKind==='scatter')this.scatterBursts++;
            this.effects.push({type:bullet.weaponKind==='scatter'?'scatter-burst':'blast',x:body.x,y:body.y,size:bullet.splashRadius,weaponKind:bullet.weaponKind});
            for (const other of this.bodies) if (other !== body && other.active && other.kind in C.enemies
              && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind==='boss'&&this.phase!=='boss') && !(other.dropGrace??0)
              && Math.hypot(other.x-body.x,other.y-body.y) <= bullet.splashRadius)
              {if(bullet.weaponKind==='scatter')this.scatterSplashHits++;this.hit(other,bullet.damage*BALLISTIC_FORK.splash,bullet.weaponKind);}
          }
          // Complete the original attack before spending at most one stored beam.
          // Derived hits never enter this projectile-contact callback.
          if(linkEligible&&body.hp<hpBefore)this.releaseLaserLink(body);
        });
      }
    }
    const rows = new Map<number, Body[]>();
    for (const b of this.bodies) {
      if (!b.active) continue;
      if (b.kind === 'gate') {
        const list = rows.get(b.row) ?? []; list.push(b); rows.set(b.row, list);
      } else if (b.kind === 'pickup') {
        // Relative swept circle, so the 52px pickup radius is not a square.
        const x = this.player.px - b.px, y = C.playerY - b.py;
        const dx = this.player.x - this.player.px - (b.x - b.px), dy = -(b.y - b.py);
        const a = dx * dx + dy * dy, c = x * x + y * y - C.pickupRadius ** 2;
        const q = 2 * (x * dx + y * dy), discriminant = q * q - 4 * a * c;
        const t = c <= 0 ? 0 : a > 0 && discriminant >= 0 ? (-q - Math.sqrt(discriminant)) / (2 * a) : -1;
        if (t >= 0 && t <= 1) add(t, 2, b.id, () => {
          if (!b.active || this.player.hp <= 0) return;
          b.active = false; this.pickups++;
          const previousWeapon = this.weaponKind;
          if(b.refit&&b.weaponKind&&this.activeWeapons.includes(b.weaponKind)){
            if(b.row)for(const alternative of this.bodies)if(alternative.row===b.row)alternative.active=false;
            this.upgradeOwnedWeapon(b.weaponKind);this.refitsClaimed++;
            const research=this.equipmentResearch(b.row>0);
            if(research)this.effects.push({type:'research',x:this.player.x,y:C.playerY,text:`装备研发 +${research}点`,detail:'可选择技能路线 · 已有火力保留'});
            this.announceFracture();this.announceLaserChain();return;
          }
          for (const kind of this.activeWeapons) if (!this.weaponStages.has(kind)) this.weaponStages.set(kind, this.weaponStage(kind));
          const addedWeapon = b.weaponKind && !this.activeWeapons.includes(b.weaponKind);
          if (b.weaponKind) {
            this.acquiredWeapons.add(this.weaponKind);
            this.acquiredWeapons.add(b.weaponKind);
            this.weaponKind = b.weaponKind;
          }
          if (b.row) for (const alternative of this.bodies) if (alternative.row === b.row) alternative.active = false;
          const kind = b.weaponKind ?? this.weaponKind;
          const localGrowth = {...this.growth, stage: this.weaponStages.get(kind) ?? 1};
          const result = grantEquipment(localGrowth, b.stage);
          this.weaponStages.set(kind, localGrowth.stage);
          Object.assign(this.growth, localGrowth, {stage: Math.max(this.growth.stage, localGrowth.stage)});
          this.maxStage = Math.max(this.maxStage, this.growth.stage);
          const research=this.equipmentResearch(b.row>0);
          const title = addedWeapon ? `新增${weaponNames[this.weaponKind]} · ${this.activeWeapons.length}种火力叠加`
            : result.upgraded ? `${weaponNames[kind]} · 升至T${localGrowth.stage}` : '重复装备 · 充能+30';
          const detail = [result.upgraded ? `${weaponNames[kind]} T${localGrowth.stage} · 其他配件保留` : addedWeapon ? '充能+30' : '',
            result.activated ? this.chargeReceipt(true) : !result.upgraded ? `当前充能 ${this.growth.energy}/100` : ''].filter(Boolean).join(' · ');
          this.effects.push({type:result.upgraded?'upgrade':'pickup',x:this.player.x,y:C.playerY,text:title,detail,size:b.stage});
          if(research)this.effects.push({type:'research',x:this.player.x,y:C.playerY,text:`装备研发 +${research}点`,detail:'可选择技能路线 · 已有火力保留'});
          this.announceFracture();this.announceLaserChain();
          if (previousWeapon !== this.weaponKind) this.emit('weapon', this.player.x, C.playerY);
          if (result.activated) this.emit('overload', this.player.x, C.playerY);
        });
      } else {
        add(sweep(this.player.px, C.playerY, this.player.x, C.playerY, b.px, b.py, b.x, b.y,
          b.width / 2 + C.playerRadius, b.height / 2 + C.playerRadius), 1, b.id, () => {
          if (!b.active || this.player.hp <= 0) return;
          b.active = false; this.hurt(b.kind === 'crate' ? 'crate' : 'enemy'); this.emit('crash', b.x, b.y, undefined, b.width);
        });
      }
    }
    for (const [, gates] of rows) {
      const first = gates[0];
      if (first.py < C.playerY && first.y >= C.playerY) {
        const t = (C.playerY - first.py) / (first.y - first.py);
        add(t, 3, first.id, () => {
          if (!first.active) return;
          const x = this.player.px + (this.player.x - this.player.px) * t;
          const chosen = gates.find(g => x >= g.x - g.width / 2 && x < g.x + g.width / 2);
          if (chosen && this.player.hp > 0) {
            const result = grantGate(this.growth, gateValue(chosen.energy, chosen.rewardKind), chosen.rewardKind);
            this.gatesTaken++;
            this.emit('gate-taken', chosen.x, C.playerY, gateRewardLabel(result), chosen.width);
            if (result.activated) this.emit('overload', this.player.x, C.playerY, this.overloadNotice());
          }
          for (const gate of gates) gate.active = false;
        });
      }
    }
    contacts.sort((a, b) => Math.round(a.t * 1e8) - Math.round(b.t * 1e8) || a.rank - b.rank || a.id - b.id);
    for (const contact of contacts) contact.apply();
    const liveBoss=this.bodies.find(b=>b.active&&b.kind==='boss');
    if(hadBossShield&&!this.bossShieldActive()&&liveBoss&&this.player.hp>0)this.emit('shield-down',liveBoss.x,liveBoss.y,'护卫屏障瓦解');
    if (this.player.hp <= 0) {
      this.phase = 'dead'; this.emit('death', this.player.x, C.playerY, '本次突围结束', 150);
    } else if (this.bossVictory) {
      this.bossWins++;
      this.bossLootRounds.push(this.round);
      const planned=this.bossFormation?.groups.reduce((n,g)=>n+g.troops.length,0)??0;
      if(planned>0&&this.bossEscortSpawns===planned&&this.bossEscortKills===planned&&this.damageTaken===this.bossStartDamage){
        this.tacticalWins++;this.emit('formation-clear',360,400,'战术拆解 · 编队全破且无伤获胜');
      }
      this.bossVictory = false; this.bullets = []; this.bodies = [];
      const restored=this.player.hp<3;
      this.player.hp = Math.min(3, this.player.hp + 1); this.player.invulnerable = 1;
      this.phase = 'recovery'; this.phaseTime = 0;
      const reward=grantGate(this.growth,C.killCharge.boss,'energy');
      if(reward.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'victory',x:360,y:430,text:`首领击破 · 充能+${C.killCharge.boss}`,
        detail:[restored?'装甲恢复+1':'装甲完好',this.chargeReceipt(reward.activated)].join(' · ')});
    }
    for(const b of this.bodies)if(b.bountyRound!==undefined&&b.hp>0&&(!b.active||b.y>=1344))this.contract?.targetEscaped(b.bountyRound);
    this.bodies = this.bodies.filter(b => b.active && b.y < 1344);
    this.bullets = this.bullets.filter(b => b.active && b.y > (b.hostile ? -90 : C.playerShotTop) && b.y < 1370 && b.x > -40 && b.x < 760 && b.age < (b.hostile ? 6 : C.bulletLife));
    const contract=this.contract;
    if(contract?.update(this.phase==='running'||this.phase==='boss'?dt:0,this.kills,this.activeWeapons.length,this.damageTaken,this.player.hp>0,contract.proof?this.proofCount(contract.proof.kind):0)){
      if(contract.status==='won'){
        this.contractStats.won++;
        if(contract.kind==='research'&&contract.proof){this.proofWins++;this.certifiedBuilds.add(contract.proof.kind);if(contract.proof.kind==='magnetic'&&this.build.magneticAugment)this.magneticCertifications.add(this.build.magneticAugment);}
        if(contract.kind==='hunter'&&contract.hunt==='crossfire'){this.aceWins++;if(this.damageTaken===contract.damage)this.flawlessAceWins++;}
        this.contractReward={charge:contracts[contract.kind].charge,round:this.round,...(contract.kind==='hunter'&&hunts[contract.hunt].research?{research:hunts[contract.hunt].research}:{})};
      }
      if(contract.status==='failed')this.contractStats.failed++;
      this.effects.push({type:'contract',x:this.player.x,y:C.playerY,text:contract.status==='won'?'契约完成 · 选择强化奖励':`契约失败 · ${contract.reason}`,detail:'每轮可接取一次 · 失败仅失去额外奖励'});
    }
    if(this.phase!=='running'&&this.phase!=='boss')this.magneticFields=[];
    this.peakBodies = Math.max(this.peakBodies, this.bodies.length);
    this.peakBullets = Math.max(this.peakBullets, this.bullets.length);
  }
  private hurt(cause: 'bullet' | 'enemy' | 'crate') {
    if (this.player.invulnerable > 0 || this.player.hp <= 0) return;
    this.lastDamageCause = cause;
    this.damageTaken++;
    this.player.hp--; this.player.invulnerable = C.invulnerability;
    this.emit('hurt', this.player.x, C.playerY);
  }
  private chargeReceipt(activated:boolean) {
    if(!activated)return `充能 ${this.growth.energy}/100`;
    const mastery=this.growth.mastery??0;
    const milestone=supportMilestone(mastery);
    return milestone ? `${milestone} · 火力+10%` : '火力+10% · 超载6秒';
  }
  private hit(b: Body, damage: number, weaponKind?: WeaponKind) {
    if((b.dropGrace??0)>0){this.effects.push({type:'drop-impact',x:b.x,y:b.y,weaponKind});return;}
    this.hits++; b.hit = 0.07;
    if (b.kind === 'gate') {
      const before = gateValue(b.energy, b.rewardKind); b.energy = Math.min(144, b.energy + damage);
      if (gateValue(b.energy, b.rewardKind) > before) this.emit('gate-level', b.x, b.y, `+${gateValue(b.energy, b.rewardKind)}${b.rewardKind === 'power' ? '%' : ''}`);
      this.emit('impact-gate', b.x, b.y); return;
    }
    const shield=b.kind==='boss'&&this.bossShieldActive()?1-(this.bossFormation?.shieldReduction??0):1;
    b.hp = Math.max(0, b.hp - damage * (guardClosed(b) ? 0.5 : 1)*shield);
    this.effects.push({ type: 'impact', x: b.x, y: b.y, size: b.width, weaponKind });
    if (b.hp > 0) return;
    b.active = false;
    if (b.kind === 'crate') {
      this.cratesBroken++;
      const pickup = this.spawn('pickup', b.x, b.y, b.stage); pickup.weaponKind = b.weaponKind; pickup.row = b.row;pickup.refit=b.refit;pickup.openingSupply=b.openingSupply;
      this.effects.push({ type: 'crate-break', x: b.x, y: b.y, text: '靠近领取', size: 110, equipmentStage: b.stage });
    } else {
      if(b.dropGrace!==undefined)this.dropKills++;
      if(b.kind==='conduit')this.dischargeConduit(b);
      this.kills++; this.score += C.enemies[b.kind as EnemyKind].score;
      this.effects.push({ type: b.kind === 'boss' ? 'boss-kill' : 'kill', x: b.x, y: b.y, size: b.width * 1.4, enemyKind: b.kind as EnemyKind, bossVariant: b.bossVariant });
      if (b.kind === 'boss') this.bossVictory = true;
      else if(b.escort){
        this.escortKills++;this.bossEscortKills++;
        const reward=grantGate(this.growth,ESCORT.charge,'energy');if(reward.activated)this.emit('overload',this.player.x,C.playerY);
        this.effects.push({type:'reward',escortReward:true,x:b.x,y:b.y,text:`编队击破 · 充能+${ESCORT.charge}`,detail:this.chargeReceipt(reward.activated)});
      }
      else if(b.kind==='elite'){
        const brokeCore=b.pattern==='intercept'&&(b.interceptWingShots??0)>0&&!(b.interceptCoreShots??0);
        if(brokeCore)this.interceptorBreaks++;
        const reward=grantGate(this.growth,C.killCharge.elite,'energy');
        if(reward.activated)this.emit('overload',this.player.x,C.playerY);
        this.effects.push({type:'reward',x:b.x,y:b.y,text:`${brokeCore?'截击断核':b.pattern==='intercept'?'截击精英击破':'精英击破'} · 充能+${C.killCharge.elite}`,detail:this.chargeReceipt(reward.activated)});
      }
      if(b.bountyRound!==undefined&&this.contract?.targetKilled(b.id,b.bountyRound)){
        this.effects.push({type:'bounty-progress',x:b.x,y:b.y,text:`悬赏精英 ${this.contract.targetKills}/2`,detail:this.contract.targetKills<2?'再击破一名领取契约强化':'目标全破 · 即将选择强化'});
      }
    }
  }
}


