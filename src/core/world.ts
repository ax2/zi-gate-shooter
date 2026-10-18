import{claimBossSalvage,BOSS_SALVAGE}from './boss-salvage';
import{BOSS_RESERVES,bossReserveFor}from './boss-reserves';
import{pullPickup}from'./pickup-recovery';
import {RapidBreak} from './rapid-break';
import{BOOSTER}from'./booster';
import{MINELAYER,MINE_TACTIC,mineTactic}from'./minelayer';
import{hostileContactShape}from'./hostile-shape';
import{counterTitle}from'./boss-counter';
import {hasControlShutter}from'./control-shutter';
import {BANKSHOT,advanceProjectile,type FlightSegment} from './bankshot';
import {HEAVY_ESCORTS} from './heavy-escorts';
import {FIRE_CONTROL,BREACH_CONTROL,fireControlSource} from './fire-control';
import {CombatLedger,type DamageSource} from './combat-ledger';
import {isStormAugment,stormAugments,STORM_REFINEMENT,type StormAugment} from './storm-refinement';
import {LOCKSHOT,INTRO_LOCKSHOT} from './lockshot';
import {ACE_DUO,type AceRole} from './ace-duo';
import {RELAY_SCREEN} from './relay-screen';
import {BATTERY} from './battery';
import {calibrationVisualBand,type CalibrationBand} from './calibration-visual';
import type {OpeningWeapon} from './opening-plan';
import {battleBrief,type BattlePlan} from './battle-plan';
import {SWEEPER} from './sweeper';
import {SUPPLY_CONVOY} from './supply-convoy';
import {DRIFT_SUPPLY} from './drift-supply';
import {MAGNETIC,MAGNETIC_REFINEMENT,type MagneticField} from './magnetic-field';
import {canLaserChain,isPhotonAugment,photonAugments,laserChainProfile} from './laser-chain';
import {INTERCEPTOR} from './interceptor';
import {buildProofs,proofFormation,PROOF_WAVES,MAGNETIC_PROOF,STORM_PROOF,type BuildProof} from './build-proof';
import { bossFormationFor, ESCORT,type EscortTroop } from './boss-formations';
import {OVERLOAD} from './overload';
import {OVERDRIVE,overdriveForms,isOverdriveForm,type OverdriveForm}from'./overdrive';
import{MIRROR_LASER,mirrorPath,type MirrorSegment}from'./mirror-laser';
import {CLOSING_ASSAULT_AT,CLOSING_CLEAR_CHARGE,closingBrief,closingDurability} from './closing-assault';
import {ION_STORM,ION_ORB,ION_SPEAR,isIonAugment,ionAugments,type IonOrb,type IonSpear} from './ion-storm';
import { FRACTURE,FRACTURE_LINE,fractureProfile,isFractureAugment,fractureAugments } from './combos';
import { enemyHealthScale, firstAttackDelay } from './difficulty';
import { Contract, contracts, HUNTER, hunts, type HuntKind, type ContractKind } from './contracts';
import { BuildTree, hasOptical,isOpticalFusion,opticalFusionBranch,opticalName,OPTICAL_FUSION,hasAmmo,isAmmoFusion,AMMO_FUSION,ammoName,isMagneticAugment, magneticAugments, SEEKER_BRIDGE, OPTICAL_FORK, ELECTRIC_FORK, BALLISTIC_FORK, RICOCHET, type MagneticAugment, type BallisticBranch,type BuildBranch, type Route } from './build-tree';
import { armoryChoices,refitFocus } from './armory-offers';
import { supportMilestone,laserVisualBand } from './support-profile';
import {builtWeapon,builtSupport} from './build-profile';
import { C, clamp } from './config';
import {CONDUIT,canDisrupt} from './conduit';
import {enemyProjectileScale} from './projectile-pressure';
import type { EnemyKind } from './config';
import { sweep } from './collision';
import { activateOverload, gateValue, gateRewardLabel, grantEquipment, grantGate, permanentPower } from './rewards';
import {gateAtCrossing} from './gate-contact';
import type { Growth } from './rewards';
import { timeline, sectorIndex, sectorNames, SWARM,INTRO_ESCORT } from './director';
import type { Spawn } from './director';
import { safeRoute } from './reachability';
import { advanceBody, guardClosed, guardDamageScale } from './behavior';
import { isBallisticWeapon,type BallisticWeapon,weaponNames, ARC_SHOT } from './weapons';
import type { WeaponKind } from './weapons';

export type BodyKind = EnemyKind | 'crate' | 'gate' | 'pickup';
export interface Body {
  weaveBeat?:number;weaveShotBeat?:number;weaveShotPhrase?:number;weaveVolleys?:number;weaveShots?:number;weaveFiredAt?:number;weaveFiredBeat?:number;weaveFiredPhrase?:number;weaveFiredPorts?:number;
  mineSpent?:boolean;mineShots?:number;mineFiredAt?:number;minePassed?:number;mineTouched?:boolean;mineDamageStart?:number;mineKilled?:boolean;mineAwarded?:boolean;
  bossSalvageMask?:number;
  bossReserveAt?:number;bossReserveSpent?:boolean;bossReserveSpawns?:number;escortHold?:number;bossReserve?:boolean;
  boosterSpent?:boolean;boosterShots?:number;boosterFiredAt?:number;boosterFiredSide?:-1|1;
  rakeVolley?:number;rakeFiring?:boolean;rakeShots?:number;rakeFiredAt?:number;rakeFiredVolley?:number;
  introEscort?:boolean;
  convoyHold?:number;
  aceRole?:AceRole;aceRagePending?:boolean;aceEnraged?:boolean;aceRageShots?:number;aceFiredAt?:number;
  id: number; kind: BodyKind; x: number; y: number; px: number; py: number;
  width: number; height: number; hp: number; maxHp: number; speed: number;
  active: boolean; age: number; timer: number; warning: number; hit: number;
  shieldTurn?:0|1;deploying?: boolean;reboundOrigin?:number;
  interceptWingShots?:number;interceptCoreShots?:number;interceptFiredAt?:number;interceptFireBeat?:0|1;interceptCoreRemaining?:number;
  energy: number; row: number; stage: number; rewardKind: 'power' | 'energy'; attack: number; lane: number;
  attackCycle: number; burst: number; fractureHits?:number; fractureReadyAt?:number; burnTicks?:number; burnTimer?:number; burnDamage?:number;
  heavyReserve?:boolean;flankReserve?:boolean;dropGrace?:number;empRemaining?:number;sentryVolleys?:number;lockWarning?:number;lockX?:number;forkshot?:boolean;lockFiredAngle?:number;lockShots?:number;lockAcceptedShots?:number;lockPassed?:number;lockDamageStart?:number;lockFiredAt?:number;sweeperShots?:number;formationShots?:number;shotScale?:number; capacitorHits?:number;stormHits?:number; counterfire?:boolean;counterReady?:boolean;counterVolleys?:number;counterShotAge?:number;counterBeat?:number;counterShotBeat?:number;counterFiredAt?:number;counterFiredBeat?:number;counterShots?:number;wingBeat?:number;wingShotBeat?:number;wingShotAge?:number;wingVolleys?:number;wingFiredAt?:number;wingFiredBeat?:number;wingShots?:number;barrageBeat?:number;barrageLane?:number;barrageShotBeat?:number;barrageShotPort?:number;barrageFiredAt?:number;barrageFiredBeat?:number;barrageFiredPorts?:number;barrageShots?:number;barrageVolleys?:number; bountyRound?:number;bountyShots?:number;proofTarget?:boolean;proofShots?:number;proofGroup?:number;proofRound?:number;escort?:boolean;
  bankShots?:number;bankFiredAt?:number;controlShutter?:boolean;controlOpenUntil?:number;controlPatrol?:boolean;controlHomeX?:number;controlGroup?:number;controlLinked?:boolean;controlShots?:number;controlBoostedShots?:number;
  batteryShots?:number;weaponKind?: WeaponKind;refit?:boolean;openingSupply?:boolean;directedRefit?:boolean; pattern?: 'weave' | 'flank' | 'fan' | 'relocate' | 'intercept' | 'rebound' | 'convoy' | 'sweep' | 'relay-screen' | 'battery' | 'drift-supply' | 'lockshot' | 'fire-control' | 'bankshot' | 'rake' | 'booster' | 'minelayer'; bossVariant?: number;
}
export interface Bullet {
  mine?:boolean;
  readonly calibrationBand?:CalibrationBand;
  id: number; x: number; y: number; px: number; py: number;
  vx: number; vy: number; damage: number; age: number; active: boolean; hostile: boolean;
  boostAfter?:number;boostFactor?:number;
  readonly ammoFusion?:BallisticBranch|null;readonly ammoBranch?:BallisticBranch|null;bankRemaining?:number;sourceId?:number;weaponKind?: WeaponKind; remainingTargets?: number; hitBodies?: number[]; splashRadius?: number; chainHops?: number;
}
export interface EffectEvent {gain?:number; segments?:MirrorSegment[];bounced?:boolean; fieldId?:number;targetId?:number; seeker?:boolean; escortReward?:boolean; type: string; x: number; y: number; targetX?: number; targetY?: number; prism?: boolean; opticalBand?:1|2|3; text?: string; detail?: string; size?: number; enemyKind?: EnemyKind; bossVariant?: number; equipmentStage?: number; weaponKind?: WeaponKind }
interface Contact { t: number; rank: number; id: number; apply: () => void }
export type Phase = 'running' | 'boss-entry' | 'boss' | 'recovery' | 'dead';

/** Rendering-free authoritative simulation. Instances are discarded on restart. */
export class World {
  get bossSalvageEnabled(){return true;}
  readonly #combatLedger=new CombatLedger();
  combatContributions(){return this.#combatLedger.snapshot();}
  interceptorBreaks=0;
  lockPreemptWins=0;lockBaitWins=0;
  minePreemptWins=0;mineCounterWins=0;
  private mineTargets=new Map<number,Body>();
  get pendingMineCounter(){
    const b=[...this.mineTargets.values()].find(b=>b.mineKilled&&!b.mineAwarded&&b.mineShots===MINE_TACTIC.shots&&!b.mineTouched&&b.mineDamageStart===this.damageTaken);
    return b?{id:b.id,passed:b.minePassed??0}:null;
  }
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
    if(isOpticalFusion(branch)&&!this.canFuseOptics())return false;
    if(isAmmoFusion(branch)&&!this.canFuseAmmo())return false;
    if(isStormAugment(branch)&&!this.canRefineStorm())return false;
    if(isIonAugment(branch)&&!this.canRefineIon())return false;
    if(isFractureAugment(branch)&&!this.canRefineFracture())return false;
    if(isPhotonAugment(branch)&&!this.canRefinePhoton())return false;
    if(isMagneticAugment(branch)&&!this.canRefineMagnetic())return false;
    if(!this.build.choose(route,this.buildPoints,branch))return false;
    if(isOpticalFusion(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'双镜复合 · '+opticalName(this.build),detail:'原镜组保留 · 追加'+({burn:'三次灼烧',relay:'独立侧束',mirror:'场边折返束'})[opticalFusionBranch(branch)]+' · 本次常规精调保留'});
    if(isAmmoFusion(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'复合弹芯 · '+ammoName(this.build),detail:'两种弹芯共同生效 · 旧火力与本次常规精调保留'});
    if(isStormAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'雷暴精研 · '+stormAugments[branch].name,detail:stormAugments[branch].detail+' · 常规增伤保留'});
    if(isFractureAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'裂甲精研 · '+fractureAugments[branch].name,detail:fractureAugments[branch].detail+' · 常规精调保留'});
    if(isPhotonAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'光链精研 · '+photonAugments[branch].name,detail:photonAugments[branch].detail+' · 常规精调保留'});
    if(isMagneticAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'磁暴精研 · '+magneticAugments[branch].name,detail:branch==='field-wide'?`半径${MAGNETIC_REFINEMENT.wideRadius} · 每拍${MAGNETIC_REFINEMENT.wideDamage*100}% · 常规精调保留`:`场外${MAGNETIC_REFINEMENT.linkRange}内一敌 · 原三拍/常规精调保留`});
    if(isIonAugment(branch))this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'离子精研 · '+ionAugments[branch].name,detail:ionAugments[branch].detail+' · 原放电与常规精调保留'});
    const kind=route==='ballistic'?'scatter':route==='electric'?'arc':null;
    if(kind && !this.activeWeapons.includes(kind)) {
      for(const owned of this.activeWeapons){this.weaponStages.set(owned,this.weaponStage(owned));this.acquiredWeapons.add(owned);}
      this.weaponStages.set(kind,1);this.acquiredWeapons.add(kind);
    }
    this.announceMagnetic();this.announceLaserChain();return true;
  }
  dropSpawns=0;dropKills=0;arcLinks=0;
  private closingIds=new Set<number>();private closingKillIds=new Set<number>();private closingAwarded=false;
  closingClears=0;
  overdriveForm?:OverdriveForm;private overdriveTimer=0;overdriveShots=0;overdriveHits=0;
  canChooseOverdrive(){return this.player.hp>0&&this.phase!=='dead'&&(this.growth.mastery??0)>=OVERDRIVE.mastery&&!this.overdriveForm;}
  chooseOverdrive(value:unknown){
    if(!isOverdriveForm(value)||!this.canChooseOverdrive())return false;
    this.overdriveForm=value;this.overdriveTimer=0;
    this.effects.push({type:'overdrive-ready',x:this.player.x,y:C.playerY,text:'超载协议 · '+overdriveForms[value].name,detail:'每次超载期间追加攻击 · 原火力与增伤提速保留'});return true;
  }
  private fireOverdrive(dt:number){
    if(this.bossVictory||this.player.hp<=0)return;
    if(!this.overdriveForm||this.growth.overload<=0){this.overdriveTimer=0;return;}
    if(this.overdriveTimer>0)this.overdriveTimer-=dt;if(this.overdriveTimer>1e-9)return;
    this.overdriveTimer+=OVERDRIVE.interval;this.overdriveShots++;
    const x=this.player.x,y=C.playerY-100,scale=(1+permanentPower(this.growth)/100)*OVERLOAD.damage;
    const eligible=(b:Body)=>b.active&&b.kind in C.enemies&&b.y>=C.playerShotTop&&b.y<y&&(b.kind!=='boss'||this.phase==='boss');
    if(this.overdriveForm==='lance'){
      const targets=this.bodies.filter(b=>b.active&&b.kind!=='pickup'&&(b.kind!=='boss'||this.phase==='boss')&&b.y>=C.playerShotTop&&b.y<y&&Math.abs(b.x-x)<=b.width/2+OVERDRIVE.lineHalfWidth).sort((a,b)=>b.y-a.y||a.id-b.id);
      let end:number=C.playerShotTop,count=0;
      for(const b of targets){const blocked=b.kind==='gate'||b.kind==='crate'||guardClosed(b)||(b.dropGrace??0)>0,before=b.hp;this.hit(b,OVERDRIVE.lineDamage*scale,'pulse','overdrive');if(b.kind in C.enemies&&b.hp<before)this.overdriveHits++;
        if(blocked||++count>=OVERDRIVE.lineTargets||this.bossVictory){end=Math.min(y,b.y+b.height/2);break;}}
      this.effects.push({type:'overdrive-lance',x,y,targetX:x,targetY:end});
    }else{
      const visited=new Set<number>();let origin={x,y},damage=OVERDRIVE.arcDamage*scale;
      for(let hop=0;hop<OVERDRIVE.arcTargets;hop++){
        const range=hop===0?OVERDRIVE.range:OVERDRIVE.chainRange;
        const next=this.bodies.filter(b=>eligible(b)&&!(b.dropGrace??0)&&!visited.has(b.id)&&Math.hypot(b.x-origin.x,b.y-origin.y)<=range).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||a.id-b.id)[0];if(!next)break;
        visited.add(next.id);const blocked=guardClosed(next),before=next.hp;this.hit(next,damage,'arc','overdrive');if(next.hp<before)this.overdriveHits++;
        this.effects.push({type:'overdrive-arc',x:origin.x,y:origin.y,targetX:next.x,targetY:next.y});origin={x:next.x,y:next.y};if(blocked||this.bossVictory)break;damage*=OVERDRIVE.falloff;
      }
    }
  }
  get closingStatus(){return{round:this.round,total:this.closingIds.size,kills:this.closingKillIds.size,rewarded:this.closingAwarded};}
  bankShots?:number;bankReflections?:number;lastBankReflection?:{time:number;x:number;y:number;id:number};
  fireControlShots=0;fireControlBoostedShots=0;lastFireControlBreak?:{time:number;id:number;affected:number;interrupted:number};
  conduitBursts=0;empTargets=0;conduitTacticalWins=0;
  private dischargeConduit(source:Body){
    this.conduitBursts++;let affected=0,interrupted=0;
    for(const b of this.bodies)if(b.controlShutter)b.controlLinked=!!fireControlSource(b,this.bodies);
    for(const b of this.bodies)if(b.active&&canDisrupt(b.kind)&&!(b.dropGrace??0)&&b.y>=C.playerShotTop&&b.y<=C.playerY
      &&Math.hypot(b.x-source.x,b.y-source.y)<=CONDUIT.radius){
      if(b.warning>0)interrupted++;
      if((b.empRemaining??0)<CONDUIT.duration){affected++;this.empTargets++;}
      b.empRemaining=Math.max(b.empRemaining??0,CONDUIT.duration);b.warning=0;b.burst=0;b.timer=Math.max(b.timer,.6);
      if(b.pattern==='intercept')b.interceptCoreRemaining=0;
    }
    if(interrupted>=2)this.conduitTacticalWins++;
    if(source.pattern==='fire-control')this.lastFireControlBreak={time:this.time,id:source.id,affected,interrupted};
    this.effects.push({type:'emp',x:source.x,y:source.y,size:CONDUIT.radius,text:`${source.pattern==='fire-control'?'火控断供':'中继击破'} · ${affected}台停火`,detail:source.pattern==='fire-control'?`中断${interrupted}台蓄能 · 恢复单线，旧弹仍危险`:interrupted?`中断${interrupted}台蓄能 · 已发敌弹仍危险`:'停火1.5秒 · 已发敌弹仍危险'});
  }
  scatterPierces=0;scatterBursts=0;scatterSplashHits=0;scatterRicochets=0;
  readonly #attachmentHits=new Map<BallisticWeapon,{pierces:number;ricochets:number;splashHits:number}>();
  private attachmentHit(kind:BallisticWeapon,metric:'pierces'|'ricochets'|'splashHits'){let row=this.#attachmentHits.get(kind);if(!row){row={pierces:0,ricochets:0,splashHits:0};this.#attachmentHits.set(kind,row);}row[metric]++;}
  ballisticReactions(){return [{kind:'scatter' as BallisticWeapon,pierces:this.scatterPierces,ricochets:this.scatterRicochets,splashHits:this.scatterSplashHits},...[...this.#attachmentHits].map(([kind,row])=>({kind,...row}))];}
  ballisticTotals(){return this.ballisticReactions().reduce((a,b)=>({pierces:a.pierces+b.pierces,ricochets:a.ricochets+b.ricochets,splashHits:a.splashHits+b.splashHits}),{pierces:0,ricochets:0,splashHits:0});}
  ionCharge=0;ionBursts=0;ionHits=0;
  ionOrbs:IonOrb[]=[];ionSpears:IonSpear[]=[];
  ionOrbSpawns=0;ionOrbHits=0;ionSpearShots=0;ionSpearHits=0;ionBonusDamage=0;
  canRefineIon(){return this.build.ranks.electric>=3&&this.build.refinements.electric>=2&&!this.build.ionAugment
    &&this.activeWeapons.includes('arc')&&this.weaponStage('arc')>=3&&!this.canRefineMagnetic();}
  private ionLive(){return this.player.hp>0&&!this.bossVictory&&(this.phase==='running'||this.phase==='boss');}
  private launchIon(body:Body,damage:number){
    if(!this.ionLive()||body.y<=C.playerShotTop)return;
    const base={x:body.x,y:body.y,px:body.x,py:body.y,age:0,damage,active:true,originId:body.id};
    if(this.build.ionAugment==='ion-orb'&&this.ionOrbs.filter(p=>p.active).length<ION_ORB.limit){
      const y=Math.min(C.playerY-24,body.y+Math.min(80,body.height/2+32));
      this.ionOrbs.push({...base,y,py:y,id:this.nextId++,pulses:0});this.ionOrbSpawns++;
    }
    if(this.build.ionAugment==='ion-spear'&&body.y-12>C.playerShotTop&&this.ionSpears.filter(p=>p.active).length<=ION_SPEAR.limit-2){
      for(const side of [-1,1]){
        let x=body.x+side*12,y=body.y-12;
        const target=this.bodies.filter(b=>b.active&&b.id!==body.id&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0)
          &&(b.x-body.x)*side>24&&b.y<=body.y+32&&b.y>=C.playerShotTop&&b.y<=C.playerY
          &&!(b.kind==='boss'&&this.phase!=='boss')&&Math.hypot(b.x-x,b.y-y)<=ION_SPEAR.aimRange)
          .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id-b.id)[0];
        const fallback=!target&&side===-1&&body.active&&body.hp>0&&!guardClosed(body)&&!(body.dropGrace??0);
        if(fallback){x=body.x-body.width/2-16;y=body.y+16;}
        const aim=target??(fallback?body:undefined);
        const dx=aim?aim.x-x:side,dy=aim?Math.min(-16,aim.y-y):-1,length=Math.hypot(dx,dy),speed=ION_SPEAR.speed*Math.SQRT2;
        this.ionSpears.push({...base,id:this.nextId++,x,px:x,y,py:y,vx:dx/length*speed,vy:dy/length*speed,remaining:ION_SPEAR.targets,hitBodies:fallback?[]:[body.id]});
      }
      this.ionSpearShots+=2;
    }
  }
  private ionBonusHit(body:Body,damage:number,orb:boolean){
    const before=body.hp;this.hit(body,damage,'arc','ion');
    if(body.hp<before){if(orb)this.ionOrbHits++;else this.ionSpearHits++;this.ionBonusDamage+=Math.min(before,before-body.hp);}
  }
  /** Derived projectiles share chronological contact resolution, without calling electric procs. */
  private advanceIon(dt:number,add:(t:number|null,rank:number,id:number,apply:()=>void)=>void){
    if(!this.ionLive()){this.ionOrbs=[];this.ionSpears=[];return;}
    for(const p of [...this.ionOrbs,...this.ionSpears]){
      if(!p.active)continue;
      const orb='pulses' in p,life=orb?ION_ORB.life:ION_SPEAR.life,oldAge=p.age;
      const duration=Math.min(dt,Math.max(0,life-oldAge));p.px=p.x;p.py=p.y;
      p.x+=(orb?0:p.vx)*duration;p.y+=(orb?-ION_ORB.speed:p.vy)*duration;p.age+=dt;
      const fraction=Math.min(duration/dt,p.y<C.playerShotTop?(p.py-C.playerShotTop)/(p.py-p.y)*duration/dt:1);
      for(const b of this.bodies){
        if(!b.active||b.kind==='pickup'||(b.kind==='boss'&&this.phase!=='boss')||(b.id===p.originId&&(orb||p.hitBodies.includes(b.id))))continue;
        const blocker=b.kind==='crate'||b.kind==='gate'||guardClosed(b);
        if(orb&&!blocker)continue;
        const scale=duration>0?fraction*dt/duration:0;
        const contact=sweep(p.px,p.py,p.px+(p.x-p.px)*scale,p.py+(p.y-p.py)*scale,b.px,b.py,b.px+(b.x-b.px)*fraction,b.py+(b.y-b.py)*fraction,b.width/2+5,b.height/2+5);
        add(contact===null?null:contact*fraction,0,p.id,()=>{
          if(!p.active||!b.active||!this.ionLive())return;
          if(orb){if(b.kind==='crate'||b.kind==='gate'||guardClosed(b))p.active=false;return;}
          if(p.hitBodies.includes(b.id))return;
          p.hitBodies.push(b.id);
          if(b.kind==='crate'||b.kind==='gate'||(b.dropGrace??0)>0){p.active=false;return;}
          this.ionBonusHit(b,p.damage*ION_SPEAR.damage,false);
          if(guardClosed(b)||--p.remaining<=0)p.active=false;
        });
      }
      if(orb)while(p.pulses<ION_ORB.pulses.length&&ION_ORB.pulses[p.pulses]<=Math.min(life,p.age)+1e-9){
        const t=Math.max(0,(ION_ORB.pulses[p.pulses++]-oldAge)/dt),y=p.py-ION_ORB.speed*t*dt;
        add(t,.5,p.id,()=>{
          if(!p.active||!this.ionLive()||y<C.playerShotTop)return;
          const targets=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0)
            &&!(b.kind==='boss'&&this.phase!=='boss')&&b.y>=C.playerShotTop&&b.y<=C.playerY)
            .map(b=>({b,d:Math.hypot(b.px+(b.x-b.px)*t-p.x,b.py+(b.y-b.py)*t-y)}))
            .filter(v=>v.d<=ION_ORB.radius).sort((a,b)=>a.d-b.d||a.b.id-b.b.id).slice(0,ION_ORB.targets);
          this.effects.push({type:'ion-storm',x:p.x,y,size:ION_ORB.radius,weaponKind:'arc'});
          for(const {b} of targets){if(!this.ionLive())break;if(b.active)this.ionBonusHit(b,p.damage*ION_ORB.damage,true);}
        });
      }
    }
  }
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
      const before=target.hp;this.hit(target,damage*ION_STORM.damage,'arc','ion');if(target.hp<before)this.ionHits++;
    }
    this.launchIon(body,damage);
  }
  seekerLinks=0;
  capacitorBursts=0;
  capacitorTransfers=0;capacitorRecovered=0;
  private relayCapacitor(body:Body,charge:number){
    if(this.build.electricBranch!=='capacitor'||this.bossVictory||body.kind==='boss'||charge<=0||!(body.kind in C.enemies)||(body.dropGrace??0)>0||body.y<C.playerShotTop||body.y>C.playerY)return;
    charge=Math.min(ELECTRIC_FORK.hits-1,charge);body.capacitorHits=0;
    const next=this.bodies.filter(b=>b!==body&&b.active&&b.hp>0&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0)
      &&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss')&&(b.capacitorHits??0)<ELECTRIC_FORK.hits-1
      &&Math.hypot(b.x-body.x,b.y-body.y)<=ELECTRIC_FORK.relayRange)
      .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.id-b.id)[0];
    if(next){const before=next.capacitorHits??0;next.capacitorHits=Math.min(ELECTRIC_FORK.hits-1,before+charge);this.capacitorTransfers++;this.capacitorRecovered+=next.capacitorHits-before;
      this.effects.push({type:'capacitor-relay',targetId:next.id,x:body.x,y:body.y,targetX:next.x,targetY:next.y,size:next.capacitorHits-before});}
  }
  private capacitor(body:Body,damage:number){
    if(this.build.electricBranch!=='capacitor'||this.bossVictory||!body.active||!(body.kind in C.enemies)||guardClosed(body)||(body.dropGrace??0)>0
      ||body.y<C.playerShotTop||body.y>C.playerY||(body.kind==='boss'&&this.phase!=='boss'))return;
    body.capacitorHits=(body.capacitorHits??0)+1;
    if(body.capacitorHits<ELECTRIC_FORK.hits)return;
    body.capacitorHits=0;this.capacitorBursts++;
    this.effects.push({type:'capacitor',targetId:body.id,x:body.x,y:body.y,size:100,weaponKind:'arc'});
    this.hit(body,damage*ELECTRIC_FORK.damage,'arc');
  }
  burnHits=0;relayHits=0;
  mirrorShots=0;mirrorHits=0;mirrorBounces=0;mirrorDoubleHits=0;
  private mirrorLaser(damage:number){
    if(this.bossVictory)return;
    const segments:MirrorSegment[]=[],visited=new Set<number>();let stopped=false,bounced=false,count=0,afterBounceHits=0;
    for(const [index,segment]of mirrorPath(this.player.x).entries()){
      if(index>0)bounced=true;
      const contacts=this.bodies.filter(b=>b.active&&b.kind!=='pickup'&&!visited.has(b.id)&&b.y>=C.playerShotTop&&b.y<C.playerY-100
        &&!(b.kind==='boss'&&this.phase!=='boss'))
        .map(body=>({body,t:sweep(segment.x,segment.y,segment.tx,segment.ty,body.x,body.y,body.x,body.y,body.width/2+MIRROR_LASER.radius,body.height/2+MIRROR_LASER.radius)}))
        .filter((hit):hit is{body:Body;t:number}=>hit.t!==null).sort((a,b)=>a.t-b.t||a.body.id-b.body.id);
      let end=1;
      for(const {body,t}of contacts){
        if(!body.active)continue;visited.add(body.id);
        const blocked=body.kind==='crate'||body.kind==='gate'||guardClosed(body)||(body.dropGrace??0)>0;
        const before=body.hp,energy=body.energy;
        this.hit(body,damage*MIRROR_LASER.damage,'pulse','laser');
        if(body.kind in C.enemies&&body.hp<before){this.mirrorHits++;if(index>0)afterBounceHits++;}
        if(body.hp<before||body.kind==='gate'&&body.energy>energy)this.effects.push({type:'laser-impact',x:body.x,y:body.y,targetX:segment.x+(segment.tx-segment.x)*t,targetY:segment.y+(segment.ty-segment.y)*t,opticalBand:2});
        if(blocked||++count>=MIRROR_LASER.targets||this.bossVictory){end=t;stopped=true;break;}
      }
      segments.push({...segment,tx:segment.x+(segment.tx-segment.x)*end,ty:segment.y+(segment.ty-segment.y)*end});
      if(stopped)break;
    }
    this.mirrorShots++;if(bounced)this.mirrorBounces++;if(afterBounceHits>=2)this.mirrorDoubleHits++;
    this.effects.push({type:'mirror-laser',x:this.player.x,y:C.playerY-100,segments,bounced});
  }
  private opticalSecondary(body:Body,damage:number){
    if(!(body.kind in C.enemies)||guardClosed(body)||(body.dropGrace??0)>0)return;
    if(hasOptical(this.build,'burn')){
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
    this.hit(hit.body,damage*OPTICAL_FORK.relayDamage,'pulse','laser');return hit.body.id;
  }
  laserArcHits=0;
  laserFocusHits=0;
  private laserLinkEnergy=0;
  private laserLinkTargets=new Set<number>();
  get laserChainReady(){return this.laserLinkEnergy>0;}
  private announcedLaserChain=false;
  laserChainUnlocked(){return canLaserChain(this.build,this.activeWeapons.includes('arc')?this.weaponStage('arc'):0);}
  canRefinePhoton(){return this.laserChainUnlocked()&&!this.build.photonAugment;}
  private announceLaserChain(){
    if(this.announcedLaserChain||!this.laserChainUnlocked())return;
    this.announcedLaserChain=true;this.laserTimer=0;
    this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'组合完成 · 电光连锁',detail:'全武器直击释出 · 群敌跳链 / 单体聚能'});
  }
  private laserChain(origin:{x:number;y:number},damage:number,visited:Set<number>){
    if(!this.laserChainUnlocked()||this.bossVictory||(this.phase!=='running'&&this.phase!=='boss'))return 'blocked';
    const hits=this.laserArcHits,profile=laserChainProfile(this.build.photonAugment);let from=origin;
    for(let hop=0;hop<profile.hops;hop++){
      if(this.bossVictory)break;
      const target=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&(!visited.has(b.id)||guardClosed(b)||(b.dropGrace??0)>0)
        &&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss')&&Math.hypot(b.x-from.x,b.y-from.y)<=profile.range)
        .sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y)||a.id-b.id)[0];
      if(!target)break;
      if(guardClosed(target)||(target.dropGrace??0)>0)return this.laserArcHits>hits?'hit':'blocked';
      visited.add(target.id);damage*=profile.decay;
      const before=target.hp;this.hit(target,damage,'pulse','photon');
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
      if(target){const before=target.hp;this.hit(target,this.laserLinkEnergy*laserChainProfile(this.build.photonAugment).focus,'pulse','photon');
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
        this.effects.push({type:'burn-tick',x:body.x,y:body.y,weaponKind:'blast'});this.hit(body,body.burnDamage??0,'blast','laser');
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
          const before=target.hp;this.hit(target,field.damage,'blast','magnetic');
          if(target.hp<before){this.magneticHits++;if((field.radius??MAGNETIC.radius)>MAGNETIC.radius&&Math.hypot(target.x-field.x,target.y-field.y)>MAGNETIC.radius){this.magneticWideHits++;this.recordMagneticProofHit(target);this.lastMagneticRefinementHit={mode:'field-wide',fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,fromX:field.x,fromY:field.y,distance:Math.hypot(target.x-field.x,target.y-field.y)};}this.lastMagneticHit={fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y};this.effects.push({type:'magnetic-hit',x:target.x,y:target.y,weaponKind:'arc',fieldId:field.id,targetId:target.id});}
        }
        if(field.link&&!this.bossVictory&&this.player.hp>0){
          const distance=(b:Body)=>Math.hypot(b.x-field.x,b.y-field.y),priority=(b:Body)=>['sniper','armor','elite','guard','boss'].includes(b.kind)&&b.warning>0?1:0;
          const target=this.bodies.filter(b=>b.active&&b.kind in C.enemies&&!guardClosed(b)&&!(b.dropGrace??0)&&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss')&&distance(b)>(field.radius??MAGNETIC.radius)&&distance(b)<=MAGNETIC_REFINEMENT.linkRange)
            .sort((a,b)=>priority(b)-priority(a)||distance(a)-distance(b)||a.id-b.id)[0];
          if(target){const before=target.hp;this.hit(target,field.damage,'arc','magnetic');if(target.hp<before){this.magneticLinkHits++;this.recordMagneticProofHit(target);this.lastMagneticRefinementHit={mode:'field-link',fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,fromX:field.x,fromY:field.y,distance:distance(target)};this.lastMagneticHit={fieldId:field.id,targetId:target.id,time:this.time,x:target.x,y:target.y,link:true};this.effects.push({type:'magnetic-link',x:field.x,y:field.y,targetX:target.x,targetY:target.y,fieldId:field.id,targetId:target.id,weaponKind:'arc'});}}
        }
      }
    }
    this.magneticFields=this.magneticFields.filter(f=>f.age<MAGNETIC.life&&f.y-(f.radius??MAGNETIC.radius)<C.playerY);
    if(this.bossVictory||this.player.hp<=0)this.magneticFields=[];
  }
  private announcedFracture=false;
  fractureUnlocked(){return this.activeWeapons.includes('pierce')&&this.activeWeapons.includes('blast')&&this.weaponStage('pierce')>=2&&this.weaponStage('blast')>=2;}
  canRefineFracture(){return this.fractureUnlocked()&&this.build.ranks.ballistic>=3&&!this.build.fractureAugment;}
  fractureProfile(){return fractureProfile(this.build.fractureAugment);}
  fractureWaves=0;fractureWaveHits=0;
  fractureFinishWaves=0;fractureFinishHits=0;fractureWaveDamage=0;
  lastFractureWaveHit?:{time:number;sourceId:number;targetId:number;fromKill:boolean;x:number;y:number;targetX:number;targetY:number;damage:number};
  private announceFracture(){
    this.announceMagnetic();
    if(!this.announcedFracture&&this.fractureUnlocked()){
      this.announcedFracture=true;
      this.effects.push({type:'combination',x:this.player.x,y:C.playerY,text:'组合完成 · 裂甲爆破',detail:'穿甲连续命中3次引爆 · 原有火力保留'});
    }
  }
  private fracture(body:Body,damage:number){
    if(this.bossVictory||this.player.hp<=0||!this.fractureUnlocked()||!body.active||!(body.kind in C.enemies)||guardClosed(body)||this.time<(body.fractureReadyAt??0))return;
    const profile=this.fractureProfile();
    body.fractureHits=(body.fractureHits??0)+1;
    if(body.fractureHits<profile.hits)return;
    body.fractureHits=0;body.fractureReadyAt=this.time+FRACTURE.cooldown;this.fractureBursts++;
    this.effects.push({type:'fracture',x:body.x,y:body.y,size:FRACTURE.radius,weaponKind:'blast'});
    this.hit(body,damage*FRACTURE.direct,'blast','fracture');
    if(this.bossVictory)return;
    for(const other of this.bodies)if(other!==body&&other.active&&other.kind in C.enemies
      &&other.y>=C.playerShotTop&&other.y<=C.playerY&&!(other.kind==='boss'&&this.phase!=='boss')
      &&Math.hypot(other.x-body.x,other.y-body.y)<=FRACTURE.radius){
        if(this.bossVictory)break;this.hit(other,damage*FRACTURE.splash,'blast','fracture');
      }
    if(this.build.fractureAugment==='fracture-line'&&!this.bossVictory)this.fractureWave(body,damage);
  }
  private fractureWave(source:Body,damage:number,fromKill=false){
    if(this.bossVictory||this.player.hp<=0)return;
    const start=source.y,top=Math.max(C.playerShotTop,start-FRACTURE_LINE.range);if(top>=start)return;
    const candidates=this.bodies.filter(b=>b.active&&b.id!==source.id&&b.kind!=='pickup'&&b.y-b.height/2<=start&&b.y>=C.playerShotTop&&b.y<=C.playerY&&!(b.kind==='boss'&&this.phase!=='boss'))
      .map(b=>({b,t:sweep(source.x,start,source.x,top,b.x,b.y,b.x,b.y,b.width/2+FRACTURE_LINE.width/2,b.height/2)}))
      .filter((h):h is {b:Body;t:number}=>h.t!==null).sort((a,b)=>a.t-b.t||a.b.id-b.b.id);
    let end:number=top,count=0;
    for(const {b}of candidates){
      if(this.bossVictory||this.player.hp<=0)break;if(!b.active)continue;
      const contact=Math.min(start,b.y+b.height/2),blocked=guardClosed(b)||(b.dropGrace??0)>0;
      if(b.kind==='gate'||b.kind==='crate'||(b.dropGrace??0)>0){end=contact;break;}
      const before=b.hp;this.hit(b,damage*FRACTURE_LINE.damage,'blast','fracture');if(b.hp<before){
        const applied=Math.min(before,before-b.hp);this.fractureWaveHits++;this.fractureWaveDamage+=applied;if(fromKill)this.fractureFinishHits++;
        this.lastFractureWaveHit={time:this.time,sourceId:source.id,targetId:b.id,fromKill,x:source.x,y:start,targetX:b.x,targetY:b.y,damage:applied};
      }
      if(blocked||++count>=FRACTURE_LINE.targets||this.bossVictory){end=contact;break;}
    }
    this.fractureWaves++;if(fromKill)this.fractureFinishWaves++;this.effects.push({type:'fracture-wave',x:source.x,y:start,targetX:source.x,targetY:end});
  }
  /** Player intent affects future offers only; never upgrades or rewrites an admitted reward. */
  refitTarget?:WeaponKind;
  setRefitTarget(kind?:WeaponKind){
    if(kind!==undefined&&!this.activeWeapons.includes(kind))return false;
    this.refitTarget=kind;return true;
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
  stormLinks=0;stormRelayLinks=0;stormFocusBursts=0;stormFocusDamage=0;prismHits=0;proofWins=0;
  canFuseOptics(){return this.build.ranks.optical>=3&&this.build.refinements.optical>=OPTICAL_FUSION.refinements&&!!this.build.opticalBranch&&!this.build.opticalFusion&&!this.canRefinePhoton();}
  canFuseAmmo(){return this.build.ranks.ballistic>=3&&this.build.refinements.ballistic>=AMMO_FUSION.refinements&&!!this.build.ballisticBranch&&!this.build.ammoFusion&&this.activeWeapons.some(k=>isBallisticWeapon(k)&&this.weaponStage(k)>=3)&&!this.canRefineFracture()&&!this.canRefineStorm();}
  canRefineStorm(){return this.build.ranks.ballistic>=3&&this.build.ranks.electric>=1&&this.build.refinements.ballistic>=STORM_REFINEMENT.refinements
    &&this.weaponStage('scatter')>=3&&this.activeWeapons.includes('scatter')&&!this.build.stormAugment&&!this.canRefineFracture();}
  private stormProofHits?:Partial<Record<StormAugment,number>>;
  private recordStormProof(kind:StormAugment,target:Body){
    if(!target.proofTarget||!target.proofGroup||target.proofRound!==this.round)return;
    if(this.contract?.recordStormGroup(kind,target.proofGroup,this.round)){
      this.stormProofHits??={};this.stormProofHits[kind]=(this.stormProofHits[kind]??0)+1;
    }
  }
  private stormFocus(body:Body,damage:number){
    if(this.build.stormAugment!=='storm-focus'||this.player.hp<=0||this.bossVictory||!body.active||!(body.kind in C.enemies)||guardClosed(body)||(body.dropGrace??0)
      ||body.y<C.playerShotTop||body.y>C.playerY||(body.kind==='boss'&&this.phase!=='boss'))return;
    body.stormHits=(body.stormHits??0)+1;
    if(body.stormHits<STORM_REFINEMENT.hits)return;
    body.stormHits=0;const before=body.hp;this.hit(body,damage*STORM_REFINEMENT.damage,'scatter','storm');
    if(body.hp<before){this.stormFocusBursts++;this.recordStormProof('storm-focus',body);this.stormFocusDamage+=before-body.hp;this.effects.push({type:'capacitor',x:body.x,y:body.y,size:70,weaponKind:'scatter'});}
  }
  aceWins=0;flawlessAceWins=0;readonly certifiedBuilds=new Set<BuildProof>();
  availableProofs(){return (Object.keys(buildProofs) as BuildProof[]).filter(kind=>isStormAugment(kind)?this.build.stormAugment===kind&&this.activeWeapons.includes('scatter')&&this.weaponStage('scatter')>=3:kind==='magnetic'?this.magneticUnlocked()&&!!this.build.magneticAugment:kind==='storm'?this.build.ranks.ballistic>=3&&this.build.ranks.electric>=1:kind==='prism'?this.supportProfile().prism:kind==='fracture'?this.fractureUnlocked():kind==='ion'?this.build.ranks.electric>=3:kind==='ricochet'?hasAmmo(this.build,'ricochet')&&this.activeWeapons.includes('scatter'):this.laserChainUnlocked());}
  proofCount(kind:BuildProof){return isStormAugment(kind)?this.stormProofHits?.[kind]??0:kind==='magnetic'?this.magneticProofHits:kind==='storm'?this.stormLinks:kind==='prism'?this.prismHits:kind==='fracture'?this.fractureBursts:kind==='ion'?this.ionHits:kind==='ricochet'?this.ballisticTotals().ricochets:this.laserArcHits;}
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
    const candidates=[220,500].map((x,i)=>{const b=this.spawn('elite',x,180);b.hp*=hunts.crossfire.durability;b.maxHp=b.hp;b.pattern='fan';b.bountyRound=challenge.round;b.aceRole=i===0?'fan':'needle';return b;});
    if(!safeRoute(this.player.x,this.bodies,this.bullets,22,{phase:this.phase,phaseTime:this.phaseTime})){
      for(const b of candidates){delete b.bountyRound;delete b.aceRole;b.active=false;}this.fallbackCount++;challenge.nextReinforcement=challenge.elapsed+HUNTER.retry;return;
    }
    challenge.reinforcements=2;this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:'双线王牌 · 协同出击',detail:'扇炮＋针炮 · 击破一机后另一机暴走'});
  }
  private spawnProofWave(challenge:Contract){
    if(!challenge.proof||challenge.reinforcements>=PROOF_WAVES.groups||challenge.elapsed<challenge.nextReinforcement)return;
    const troops=proofFormation(challenge.proof.kind);
    if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+troops.length>C.limits.enemies){challenge.nextReinforcement=challenge.elapsed+PROOF_WAVES.retry;return;}
    const candidates=troops.map(t=>{const b=this.spawn(t.kind,t.x,t.y);b.proofTarget=true;if('pattern' in t)b.pattern=t.pattern;if(challenge.proof?.kind==='magnetic'){b.hp*=MAGNETIC_PROOF.durability;b.maxHp=b.hp;}if(challenge.proof&&isStormAugment(challenge.proof.kind)){b.hp*=challenge.proof.kind==='storm-relay'?STORM_PROOF.relayDurability:STORM_PROOF.focusDurability;b.maxHp=b.hp;}if(challenge.proof?.kind==='ricochet'||challenge.proof?.kind==='magnetic'||challenge.proof&&isStormAugment(challenge.proof.kind)){b.proofGroup=challenge.reinforcements+1;b.proofRound=this.round;}b.dropGrace=SWARM.grace;return b;});
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
  readonly rapidBreak = new RapidBreak();
  lockshotSpawns=0;lockshotShots=0;
  shots = 0; hits = 0; kills = 0; cratesBroken = 0; pickups = 0; gatesTaken = 0;
  lastEquipmentPickup?:{id:number;row:number;kind?:WeaponKind;refit:boolean;time:number;x:number;y:number};
  maxStage = 1; peakBodies = 0; peakBullets = 0; fallbackCount = 0; attackDeferrals = 0;
  private nextId = 1;
  private nextRow = 1;
  private fireTimers = new Map<WeaponKind, number>();
  private firingScale=1;
  fireRateScale(){return this.growth.overload>0?OVERLOAD.rate:1;}
  private laserTimer = 0;
  laserCharge(){
    const support=this.supportProfile();
    if(!support.laserUnlocked||this.player.hp<=0||(this.phase!=='running'&&this.phase!=='boss'))return 0;
    return clamp(1-this.laserTimer/support.laserInterval,0,1);
  }
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
  private admitEscorts(troops:readonly EscortTroop[],reserve=false){
    if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+troops.length>C.limits.enemies)return false;
    const candidates=troops.map(t=>{const y=reserve?(t.kind==='guard'?ESCORT.hoverY:t.kind==='charger'?380:320):t.kind==='guard'?ESCORT.hoverY:180;
      const b=this.spawn(t.kind,t.x,y);b.escort=true;
      if(b.kind==='guard'){b.hp*=ESCORT.guardDurability;b.maxHp=b.hp;}
      if(reserve){b.bossReserve=true;b.hp=b.maxHp=C.enemies.elite.hp*enemyHealthScale('elite',this.round)*BOSS_RESERVES.eliteDurability;b.dropGrace=SWARM.grace;if(b.kind==='guard')b.escortHold=BOSS_RESERVES.guardHold;}
      b.pattern=t.pattern;b.lane=t.lane??t.x;
      if(t.pattern==='lockshot'){b.lockX=this.player.x;b.timer=LOCKSHOT.opening;b.lockDamageStart=this.damageTaken;}
      return b;});
    const horizon=Math.max(...candidates.map(b=>Math.max(3,(C.playerY-b.y)/Math.max(1,b.speed)+1)));
    if(!safeRoute(this.player.x,this.bodies,this.bullets,horizon,{phase:this.phase,phaseTime:this.phaseTime})){
      for(const b of candidates)b.active=false;this.fallbackCount++;return false;
    }
    this.escortSpawns+=candidates.length;this.bossEscortSpawns+=candidates.length;
    this.lockshotSpawns+=candidates.filter(b=>b.pattern==='lockshot').length;
    return true;
  }
  private spawnEscorts(){
    const formation=this.bossFormation;if(!formation||!this.bodies.some(b=>b.active&&b.kind==='boss'))return;
    while(this.escortGroup<formation.groups.length){
      const group=formation.groups[this.escortGroup];
      if(this.phaseTime<group.at||this.phaseTime<this.escortRetry)return;
      if(this.phaseTime>group.at+ESCORT.deadline){this.escortGroup++;continue;}
      if(!this.admitEscorts(group.troops)){this.escortRetry=this.phaseTime+ESCORT.retry;return;}
      this.escortGroup++;
      this.effects.push({type:'formation',x:360,y:400,text:formation.name,detail:formation.hint});
    }
    const boss=this.bodies.find(b=>b.active&&b.kind==='boss'),reserve=bossReserveFor(this.round);
    if(!boss||!reserve||boss.bossReserveAt===undefined||boss.bossReserveSpent)return;
    if(this.phaseTime>boss.bossReserveAt+BOSS_RESERVES.deadline){boss.bossReserveSpent=true;return;}
    if(this.phaseTime<boss.bossReserveAt||this.phaseTime<this.escortRetry)return;
    if(!this.admitEscorts(reserve.troops,true)){this.escortRetry=this.phaseTime+ESCORT.retry;return;}
    boss.bossReserveSpent=true;boss.bossReserveSpawns=reserve.troops.length;
    this.effects.push({type:'boss-reserve',x:360,y:400,text:reserve.name,detail:reserve.hint});
  }
  private bossVictory = false;
  private secondChance = false;
  private nextSpawnRetry = 0;
  private readonly seed: number;

  // initialRound supports deterministic replay fixtures; normal UI always starts
  // with the default round 1, T1 and zero bonus.
  constructor(seed = 1337, initialRound = 1,readonly openingWeapon?:OpeningWeapon,readonly battlePlan:BattlePlan=0) {
    this.seed = seed; this.round = Math.max(1, Math.floor(initialRound));
    this.scheduled = timeline(this.round, seed,this.battlePlan);
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
    const arrival=(candidate.pattern==='bankshot'||candidate.pattern==='booster')?Math.max(0,(candidate.pattern==='booster'?BOOSTER.hold:BANKSHOT.hold)-candidate.age)+(C.playerY-candidate.y)/Math.max(1,candidate.speed):candidate.pattern==='fire-control'?Math.max(0,FIRE_CONTROL.hold-candidate.age)+(C.playerY-candidate.y)/Math.max(1,candidate.speed):candidate.kind==='conduit'?Math.max(0,CONDUIT.holdSeconds-candidate.age)+(C.playerY-Math.max(candidate.y,CONDUIT.hoverY))/Math.max(1,candidate.speed)
      :(C.playerY-candidate.y)/Math.max(1,candidate.speed);
    const horizon = Math.max(3,arrival+1+(candidate.convoyHold===undefined?0:Math.max(0,candidate.convoyHold-candidate.age)));
    if (safeRoute(this.player.x, this.bodies, this.bullets, horizon,{reaction:C.spawnSafetyReaction})) return true;
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
        if(s.closing){
          // Wait for every old target, including unclaimed boxes and gates.
          // Old projectiles remain live and participate in admission safety.
          if(this.bodies.some(b=>b.active)){this.scheduleIndex--;break;}
          const group=[s];while(this.scheduled[this.scheduleIndex+group.length-1]?.closing)group.push(this.scheduled[this.scheduleIndex+group.length-1]);
          const units=group.map(spawn=>{
            const b=this.spawn(spawn.kind as EnemyKind,spawn.x,spawn.dropY);
            b.pattern=spawn.pattern;b.lane=spawn.lane??spawn.x;b.forkshot=spawn.forkshot;b.dropGrace=SWARM.grace;b.timer=spawn.opening??.1;
            b.hp*=closingDurability(this.round,b.kind as EnemyKind);b.maxHp=b.hp;
            if(b.pattern==='lockshot'){b.lockX=this.player.x;b.lockDamageStart=this.damageTaken;}
            return b;
          });
          const longest=units.reduce((a,b)=>(C.playerY-a.y)/a.speed>(C.playerY-b.y)/b.speed?a:b);
          if(!this.admit(longest)){for(const b of units)b.active=false;this.scheduleIndex--;break;}
          this.scheduleIndex+=group.length-1;this.dropSpawns+=units.length;
          this.closingIds=new Set(units.map(b=>b.id));this.closingKillIds.clear();this.closingAwarded=false;
          this.lockshotSpawns+=units.filter(b=>b.pattern==='lockshot').length;
          const brief=closingBrief(this.round,this.battlePlan);this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:brief.title,detail:brief.detail+` · 全歼充能+${CLOSING_CLEAR_CHARGE}`});
          continue;
        }
        if(s.pattern==='fire-control'){
          const group=[s];while(this.scheduled[this.scheduleIndex+group.length-1]?.pattern==='fire-control'&&this.scheduled[this.scheduleIndex+group.length-1]?.at===s.at)group.push(this.scheduled[this.scheduleIndex+group.length-1]);
          if(this.bodies.filter(b=>b.active&&b.kind in C.enemies).length+group.length>C.limits.enemies){this.scheduleIndex--;break;}
          const units=group.map(spawn=>{
            const b=this.spawn(spawn.kind as EnemyKind,spawn.x,spawn.dropY);b.pattern='fire-control';b.controlGroup=spawn.breach?-this.round:this.round;if(spawn.kind==='armor'&&(spawn.breach||hasControlShutter(this.round)))b.controlShutter=true;if(spawn.controlPatrol){b.controlPatrol=true;b.controlHomeX=spawn.x;}b.dropGrace=SWARM.grace;b.timer=FIRE_CONTROL.opening;
            b.hp*=b.kind==='armor'?(spawn.breach?BREACH_CONTROL.durability:FIRE_CONTROL.durability):FIRE_CONTROL.relayDurability;b.maxHp=b.hp;
            return b;
          });
          const longest=units.reduce((a,b)=>(C.playerY-a.y)/a.speed>(C.playerY-b.y)/b.speed?a:b);
          if(!this.admit(longest)){for(const b of units)b.active=false;this.scheduleIndex--;break;}
          this.scheduleIndex+=group.length-1;this.dropSpawns+=units.length;
          this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:s.breach?'破阵重炮':units.some(b=>b.controlShutter)?'联动闸甲':units.some(b=>b.controlPatrol)?'游弋火控':'火控中继编队',detail:s.breach?'先拆侧方中继停炮开甲 · 或等开火后强拆':units.some(b=>b.controlShutter)?'供能闭甲减伤80% · 发射后开甲 · 拆中继可强制开甲':units.some(b=>b.controlPatrol)?'后炮横移 · 越界失去增幅 · 中继可拆':'中继增幅双炮 · 击破可停火断供'});
          continue;
        }
        if (s.kind === 'armory') {
          if (!this.rewardSlots(2)) { this.scheduleIndex--; break; }
          const row = this.nextRow++;
          const choices: WeaponKind[][] = this.round > 3 ? [['arc', 'scatter'], ['blast', 'pierce'], ['pulse', 'arc']] : [['scatter', 'pierce'], ['blast', 'arc'], ['pulse', 'blast']];
          const chapterChoices = choices[sectorIndex(this.round)];
          const offered = armoryChoices(this.activeWeapons, chapterChoices,this.round>1?(this.refitTarget??refitFocus(this.activeWeapons,this.weaponKind,this.build.ranks)):undefined);
          const crates = (s.convoy?SUPPLY_CONVOY.lanes:[222,498]).map((x, i) => { const offer=offered[i],stage=offer.refit?Math.min(3,this.weaponStage(offer.kind)+1):Math.max(2,s.stage??2,this.growth.stage);
            const b = this.spawn('crate', x, 180, stage); b.row = row; b.weaponKind = offer.kind;b.refit=offer.refit;if(offer.refit&&this.refitTarget===offer.kind)b.directedRefit=true;if(s.pattern==='drift-supply'){b.pattern=s.pattern;b.dropGrace=DRIFT_SUPPLY.opening;} return b; });
          if (!this.admit(crates[0])) { for (const b of crates) b.active = false; this.scheduleIndex--; break; }
          if(s.pattern==='drift-supply')this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:'滑行军械箱',detail:'护盖0.45秒后开启 · 横移跟枪 · 碎后拾取'});
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
          if(s.flankReserve)candidate.flankReserve=true;
          if(s.heavyReserve)candidate.heavyReserve=true;
          if(this.round===1&&s.at===INTRO_ESCORT.at&&(s.kind==='elite'||s.kind==='guard'))candidate.introEscort=true;
          if(this.round===1&&s.kind==='guard'&&s.pattern==='convoy')candidate.convoyHold=INTRO_ESCORT.hold;
          if(s.pattern==='booster')candidate.timer=BOOSTER.opening;
          if(s.pattern==='minelayer'){candidate.timer=MINELAYER.opening;candidate.hp*=MINELAYER.durability;candidate.maxHp=candidate.hp;candidate.mineDamageStart=this.damageTaken;}
          if(s.pattern==='bankshot'){candidate.timer=BANKSHOT.opening;candidate.hp*=BANKSHOT.durability;candidate.maxHp=candidate.hp;}
          if(s.heavyReserve&&s.kind==='armor'&&s.pattern!=='bankshot'){candidate.hp*=HEAVY_ESCORTS.durability;candidate.maxHp=candidate.hp;}
          if(s.pattern==='battery'&&s.kind==='armor'){candidate.timer=s.at===BATTERY.at?BATTERY.opening:BATTERY.secondOpening;candidate.hp*=BATTERY.durability;candidate.maxHp=candidate.hp;}
          if(s.pattern==='lockshot'){candidate.lockX=this.player.x;candidate.timer=LOCKSHOT.opening;if(this.round===1){candidate.lockWarning=INTRO_LOCKSHOT.warning;candidate.hp*=INTRO_LOCKSHOT.durability;candidate.maxHp=candidate.hp;}if(s.forkshot)candidate.forkshot=true;}
          if(s.pattern==='intercept')candidate.timer=INTERCEPTOR.opening;
          if(s.pattern==='sweep'&&s.kind!=='drone')candidate.timer=SWEEPER.opening;
          if(s.pattern==='relay-screen'){if(s.kind==='guard'&&s.shieldTurn!==undefined)candidate.shieldTurn=s.shieldTurn;candidate.timer=s.kind==='guard'?RELAY_SCREEN.guardOpening+(s.shieldTurn??0)*RELAY_SCREEN.stagger:RELAY_SCREEN.sniperOpening;if(s.kind==='guard'||s.kind==='sniper'){candidate.hp*=RELAY_SCREEN.durability;candidate.maxHp=candidate.hp;}}
          // Authored reserve deployment only; keep the full visible charge and
          // regular recovery. Never derive this delay from the player's build.
          if(s.opening!==undefined)candidate.timer=s.opening;
          // Preserve the queued item; wait with an empty lane, never swallow rewards
          // or cancel any already advertised body/attack to manufacture a safe route.
          if (!this.admit(candidate)) { this.scheduleIndex--; break; }
          if(s.pattern==='minelayer')this.mineTargets.set(candidate.id,candidate);
          if(s.drop)this.dropSpawns++;
          if(s.pattern==='lockshot'){candidate.lockDamageStart=this.damageTaken;this.lockshotSpawns++;}
          if(s.dropNotice)this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:'突降机群',detail:'短暂投送屏障 · 群攻可快速清场'});
          if(s.dropLabel)this.effects.push({type:'drop-wave',x:360,y:C.playerY,text:s.dropLabel,detail:s.dropDetail??(s.kind==='guard'?'前盾后援 · 留意转火角度':s.kind==='sniper'?'两侧哨机 · 优先压制一翼':'装甲纵列 · 集中火力突破')});
        }
      }
      if (this.roundTime >= CLOSING_ASSAULT_AT && this.scheduleIndex >= this.scheduled.length && !this.bodies.some(b => b.active)) {
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
        this.closingIds.clear();this.closingKillIds.clear();this.closingAwarded=false;
        this.scheduleIndex = 0; this.secondChance = this.growth.stage > 1; this.nextSpawnRetry = 0;
        this.scheduled = timeline(this.round, this.seed + this.round * 719,this.battlePlan);
        this.effects.push({type:'round',x:360,y:400,text:`第 ${this.round} 轮 · ${sectorNames[sectorIndex(this.round)]}`,
          detail:`${battleBrief(this.round,this.battlePlan)} · 敌弹+${Math.round((enemyProjectileScale(this.round)-1)*100)}% · 留意实弹`});
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
    if (this.phase === 'boss-entry' || this.phase === 'recovery') { this.fireTimers.clear(); this.laserTimer=0;this.overdriveTimer=0; return; }
    const scale=this.fireRateScale();
    if(scale!==this.firingScale){
      // Keep cooldown progress at both edges; no free salvo or stored shots.
      const ratio=this.firingScale/scale;
      for(const [kind,timer]of this.fireTimers)this.fireTimers.set(kind,timer*ratio);
      this.laserTimer*=ratio;this.firingScale=scale;
    }
    for (const kind of this.activeWeapons) {
    let timer = (this.fireTimers.get(kind) ?? 0) - dt;
    const w = this.profileFor(kind),calibrationBand=calibrationVisualBand(this.weaponCalibration(kind));
    while (timer <= 1e-9) {
      if (this.bullets.filter(b => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error('Player bullet budget exceeded');
      for (let i = 0; i < w.offsets.length; i++) {
        const x = this.player.x + w.offsets[i], y = C.playerY - (w.muzzleY ?? 72);
        const velocity=kind==='arc'?this.arcVelocity(x,y):{vx:w.vx[i],vy:-C.bulletSpeed};
        this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, ...velocity,
          damage: w.damage[i] * (1 + permanentPower(this.growth) / 100) * (this.growth.overload > 0 ? OVERLOAD.damage : 1),
          age: 0, active: true, hostile: false, weaponKind: kind,ammoBranch:isBallisticWeapon(kind)?this.build.ballisticBranch??null:undefined,...(this.build.ammoFusion&&isBallisticWeapon(kind)?{ammoFusion:this.build.ammoFusion}:{}), remainingTargets: w.targets, hitBodies: [], splashRadius: w.splashRadius, chainHops: w.chainHops,
          ...(calibrationBand?{calibrationBand}:{}) });
        this.shots++;
      }
      this.effects.push({type:'fire',x:this.player.x,y:C.playerY-70,size:this.weaponStage(kind),weaponKind:kind});
      timer += 1 / (w.rate*scale);
    }
    this.fireTimers.set(kind, timer);
    }
    const support=this.supportProfile();
    if (support.laserUnlocked) {
      this.laserTimer -= dt;
      if (this.laserTimer <= 0) {
        this.laserTimer += support.laserInterval/scale;
        const start=C.playerY-100,laserDamage=support.laserDamage*(1+permanentPower(this.growth)/100)*(this.growth.overload>0?OVERLOAD.damage:1);
        const opticalBand=laserVisualBand(this.growth.mastery,this.build.ranks.optical);
        const visited=new Set<number>();let origin:{x:number;y:number;id:number}|undefined,mainBlocked=false;
        for(const side of support.prism?[0,-1,1]:[0]) {
          const x=this.player.x+side*42, topX=this.player.x+side*180;
          const beamX=(y:number)=>x+(topX-x)*(start-y)/(start-C.playerShotTop);
          const targets=this.bodies.filter(b=>b.active && b.kind!=='pickup' && (b.kind!=='boss'||this.phase==='boss') && b.y>=C.playerShotTop && b.y<start
            && Math.abs(b.x-beamX(b.y))<=b.width/2+8).sort((a,b)=>b.y-a.y || a.id-b.id);
          let end:number=C.playerShotTop, count=0;
          for(const body of targets){
            const blocked=body.kind==='crate'||body.kind==='gate'||guardClosed(body)||(body.dropGrace??0)>0;
            const damage=support.laserDamage*(side===0?1:.45)*(1+permanentPower(this.growth)/100)*(this.growth.overload>0?OVERLOAD.damage:1);
            visited.add(body.id);if(side===0&&count===0){mainBlocked=blocked;if(!blocked&&body.kind in C.enemies)origin={x:body.x,y:body.y,id:body.id};}
            const before=body.hp,beforeEnergy=body.energy;this.hit(body,damage,'pulse','laser');if(side!==0&&body.kind in C.enemies&&body.hp<before)this.prismHits++;
            if(body.hp<before||body.kind==='gate'&&body.energy>beforeEnergy){const contactY=blocked?Math.min(start,body.y+body.height/2):body.y;this.effects.push({type:'laser-impact',x:body.x,y:body.y,targetX:beamX(contactY),targetY:contactY,opticalBand,prism:side!==0});}
            if(side===0&&count===0&&!blocked)this.opticalSecondary(body,damage);
            if(blocked || ++count>=support.laserTargets){end=Math.min(start,body.y+body.height/2);break;}
          }
          this.effects.push({type:'laser',x,y:start,targetX:beamX(end),targetY:end,prism:side!==0,opticalBand});
        }
        if(hasOptical(this.build,'relay')){const id=this.splitLaser(laserDamage);if(id!==undefined)visited.add(id);}
        if(hasOptical(this.build,'mirror'))this.mirrorLaser(laserDamage);
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
    for(const b of this.bodies)if(b.controlShutter)b.controlLinked=!!fireControlSource(b,this.bodies);
    this.shoot(dt);
    if(this.phase==='running'||this.phase==='boss')this.fireOverdrive(dt);
    for (const b of this.bodies) {
      b.px = b.x; b.py = b.y;
      const previousWarning = b.warning;
      const wasCounter=b.counterfire,wasCounterVolleys=b.counterVolleys??0,wasCounterFiredAt=b.counterFiredAt,wasWeaveFiredAt=b.weaveFiredAt,wasWingFiredAt=b.wingFiredAt,wasBarrageFiredAt=b.barrageFiredAt,wasAceEnraged=b.aceEnraged;
      advanceBody(b, dt, this.phase, this.phaseTime, (x, y, vx, vy) => {
        const before=this.bullets.length;this.hostile(x,y,vx,vy);
        if(this.bullets.length<=before)return;
        this.bullets[this.bullets.length-1].sourceId=b.id;
        if(b.kind==='boss'&&b.attack===0&&b.bossVariant!==1&&b.bossVariant!==2){if(b.weaveFiredAt!==b.age)b.weaveFiredPorts=0;b.weaveFiredPorts=(b.weaveFiredPorts??0)|(x<b.x?1:2);b.weaveShots=(b.weaveShots??0)+1;b.weaveFiredAt=b.age;b.weaveFiredBeat=b.weaveShotBeat??0;b.weaveFiredPhrase=b.weaveShotPhrase??0;}
        if(b.kind==='boss'&&b.attack===3&&b.bossVariant===2){if(b.barrageFiredAt!==b.age)b.barrageFiredPorts=0;b.barrageFiredPorts=(b.barrageFiredPorts??0)|(1<<(b.barrageShotPort??0));b.barrageShots=(b.barrageShots??0)+1;b.barrageFiredAt=b.age;b.barrageFiredBeat=b.barrageShotBeat??0;}
        if(b.kind==='boss'&&b.attack===2&&b.bossVariant===1){b.wingShots=(b.wingShots??0)+1;b.wingFiredAt=b.age;b.wingFiredBeat=b.wingShotBeat??0;}
        if(b.kind==='boss'&&b.attack===4&&(b.bossVariant===1||b.bossVariant===2)){b.counterShots=(b.counterShots??0)+1;b.counterFiredAt=b.age;b.counterFiredBeat=b.counterShotBeat??0;}
        if(b.pattern==='bankshot'){this.bullets[this.bullets.length-1].bankRemaining=1;b.bankShots=(b.bankShots??0)+1;b.bankFiredAt=b.age;this.bankShots=(this.bankShots??0)+1;}
        if(b.pattern==='booster'){const p=this.bullets[this.bullets.length-1];p.boostAfter=BOOSTER.delay;p.boostFactor=BOOSTER.factor;b.boosterShots=(b.boosterShots??0)+1;b.boosterFiredAt=b.age;b.boosterFiredSide=p.x<b.x?-1:1;}
        if(b.pattern==='minelayer'){this.bullets[this.bullets.length-1].mine=true;b.mineShots=(b.mineShots??0)+1;b.mineFiredAt=b.age;}
        if(b.pattern==='rake'){b.rakeShots=(b.rakeShots??0)+1;b.rakeFiredAt=b.age;b.rakeFiredVolley=b.rakeVolley??0;}
        if(b.pattern==='relay-screen')b.formationShots=(b.formationShots??0)+1;
        if(b.pattern==='lockshot'){b.lockAcceptedShots=(b.lockAcceptedShots??0)+1;b.lockFiredAt=b.age;if(b.forkshot)b.lockFiredAngle=Math.atan2(vx??0,vy??280);this.lockshotShots++;}
        if(b.pattern==='battery')b.batteryShots=(b.batteryShots??0)+1;
        if(b.pattern==='fire-control'){b.controlShots=(b.controlShots??0)+1;this.fireControlShots++;if(b.controlLinked){b.controlBoostedShots=(b.controlBoostedShots??0)+1;this.fireControlBoostedShots++;}}
        if(b.proofTarget)b.proofShots=(b.proofShots??0)+1;
        if(b.pattern==='sweep')b.sweeperShots=(b.sweeperShots??0)+1;
        if(b.pattern==='intercept'){
          if(b.burst)b.interceptCoreShots=(b.interceptCoreShots??0)+1;else b.interceptWingShots=(b.interceptWingShots??0)+1;
          b.interceptFiredAt=b.age;b.interceptFireBeat=b.burst?1:0;
        }
        if(b.bountyRound!==undefined){b.bountyShots=(b.bountyShots??0)+1;this.bountyShots++;}
        if(b.aceRole){b.aceFiredAt=b.age;if(b.aceEnraged)b.aceRageShots=(b.aceRageShots??0)+1;}
      },this.bodies);
      pullPickup(b,this.player.x,dt,this.bodies);
      if(b.barrageFiredAt!==wasBarrageFiredAt)this.effects.push({type:'barrage-fire',x:b.x,y:b.y,gain:.5});
      if(b.weaveFiredAt!==wasWeaveFiredAt)this.effects.push({type:'weave-fire',x:b.x,y:b.y,gain:.45});
      if(b.wingFiredAt!==wasWingFiredAt)this.effects.push({type:'wing-fire',x:b.x,y:b.y,gain:.45});
      if(b.aceEnraged&&!wasAceEnraged)this.effects.push({type:'drop-wave',x:b.x,y:C.playerY,text:(b.aceRole==='fan'?'扇炮':'针炮')+'王牌 · 暴走',detail:'搭档被击毁 · 蓄能后加密射击 · 旧弹仍危险'});
      if(b.kind==='boss'&&!wasCounter&&b.counterfire)this.effects.push({type:'boss-counter',x:b.x,y:b.y,text:'首领过热 · '+counterTitle(b.bossVariant),detail:b.bossVariant===1?'双翼错时开火 · 已发敌弹仍危险':b.bossVariant===2?'交剪、直射、外扩三拍 · 已发敌弹仍危险':'双炮加入攻击循环 · 已发敌弹仍危险'});
      if(b.kind==='boss'&&((b.bossVariant===1||b.bossVariant===2)?b.counterFiredAt!==wasCounterFiredAt:(b.counterVolleys??0)>wasCounterVolleys))this.effects.push({type:'counter-fire',x:b.x,y:b.y,...(b.bossVariant===1||b.bossVariant===2?{gain:.65}:{})});
      if (b.kind === 'boss' && previousWarning <= 0 && b.warning > 0
        && !safeRoute(this.player.x, this.bodies, this.bullets, b.attack === 3 ? 8 : 4, { phase: this.phase, phaseTime: this.phaseTime })) {
        // The warning has not been rendered yet. Delay the unannounced attack;
        // once displayed its geometry and duration are never changed.
        if(b.attack===4)b.counterReady=true;
        b.warning = 0; b.timer = 0.3; this.attackDeferrals++;
      }
    }
    const sweptSegments=new Map<number,FlightSegment[]>();
    for (const b of this.bullets) { b.px=b.x;b.py=b.y;const priorBank=b.bankRemaining,segments=advanceProjectile(b,dt);if(segments){sweptSegments.set(b.id,segments);if(priorBank&&b.bankRemaining!==priorBank){this.bankReflections=(this.bankReflections??0)+1;this.lastBankReflection={time:this.time,x:segments[0].x1,y:segments[0].y1,id:b.id};this.effects.push({type:'bank-bounce',x:segments[0].x1,y:segments[0].y1});}} }
    const contacts: Contact[] = [];
    const add = (t: number | null, rank: number, id: number, apply: () => void) => { if (t !== null) contacts.push({ t, rank, id, apply }); };
    this.advanceIon(dt,add);
    for (const bullet of this.bullets) {
      if (bullet.hostile) {
        const shape=hostileContactShape(bullet);
        const segments=sweptSegments.get(bullet.id)??[{x0:bullet.px,y0:bullet.py,x1:bullet.x,y1:bullet.y,from:0,to:1}];
        for(const segment of segments){const dx=this.player.x-this.player.px,t=sweep(segment.x0,segment.y0,segment.x1,segment.y1,segment.from===0?this.player.px:this.player.px+dx*segment.from,C.playerY,segment.to===1?this.player.x:this.player.px+dx*segment.to,C.playerY,shape.x,shape.y);
        add(t===null?null:segment.from+t*(segment.to-segment.from), 1, bullet.id, () => {
          if (!bullet.active || this.player.hp <= 0) return;
          bullet.active = false; this.hurt('bullet');
          if(bullet.mine){const source=this.mineTargets.get(bullet.sourceId!);if(source)source.mineTouched=true;this.effects.push({type:'mine-burst',x:bullet.x,y:bullet.y,size:110});}
        });}
        // A fired bolt is evaded only after it has cleared the entire player
        // collision band. Queue this with damage/kill contacts: a same-time
        // kill or hurt must resolve first, never manufacture a counter window.
        const passY=C.playerY+(bullet.mine?hostileContactShape(bullet).y:40);
        if(bullet.vy>0&&bullet.py<=passY&&bullet.y>passY){
          const source=this.bodies.find(b=>b.active&&b.id===bullet.sourceId&&b.pattern==='lockshot');
          if(source)add((passY-bullet.py)/(bullet.y-bullet.py),4,bullet.id,()=>{
            if(bullet.active&&source.active&&this.player.hp>0&&!this.bossVictory)
              source.lockPassed=Math.min(LOCKSHOT.shots,(source.lockPassed??0)+1);
          });
          const mineSource=bullet.mine?this.mineTargets.get(bullet.sourceId!):undefined;
          if(mineSource)add((passY-bullet.py)/(bullet.y-bullet.py),4,bullet.id,()=>{
            if(bullet.active&&this.player.hp>0&&!this.bossVictory)
              mineSource.minePassed=Math.min(MINE_TACTIC.shots,(mineSource.minePassed??0)+1);
          });
        }
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
          const ammo=bullet.ammoBranch===undefined?this.build.ballisticBranch:bullet.ammoBranch;
          const fusion=bullet.ammoBranch===undefined?this.build.ammoFusion:bullet.ammoFusion;
          const protectedEntry=(body.dropGrace??0)>0;
          if(!protectedEntry&&isBallisticWeapon(bullet.weaponKind)&&(ammo==='penetrator'||fusion==='penetrator')&&body.kind in C.enemies&&(bullet.hitBodies?.length??0)>1){
            if(bullet.weaponKind==='scatter')this.scatterPierces++;else this.attachmentHit(bullet.weaponKind,'pierces');this.effects.push({type:'scatter-pierce',x:body.x,y:body.y,weaponKind:bullet.weaponKind});
          }
          const ionEligible=bullet.weaponKind==='arc'&&body.kind in C.enemies&&!guardClosed(body)&&!protectedEntry;
          const linkEligible=body.kind in C.enemies&&!guardClosed(body)&&!protectedEntry;
          const hpBefore=body.hp;
          this.hit(body, bullet.damage, bullet.weaponKind,bullet.weaponKind??'pulse',bullet.weaponKind==='arc');
          if(protectedEntry)return;
          if(linkEligible&&body.hp<hpBefore&&bullet.weaponKind==='blast')this.leaveMagnetic(body,bullet.damage);
          if(linkEligible&&body.hp<hpBefore&&isBallisticWeapon(bullet.weaponKind)&&(ammo==='ricochet'||fusion==='ricochet')){
            const target=this.bodies.filter(other=>other!==body&&other.active&&other.kind in C.enemies
              &&!(other.dropGrace??0)&&!guardClosed(other)&&!(other.kind==='boss'&&this.phase!=='boss')
              &&other.y>=C.playerShotTop&&other.y<=C.playerY&&Math.abs(other.x-body.x)>=RICOCHET.minSide
              &&Math.hypot(other.x-body.x,other.y-body.y)<=RICOCHET.range)
              .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.id-b.id)[0];
            if(target){const before=target.hp;this.hit(target,bullet.damage*RICOCHET.damage,bullet.weaponKind);
              if(target.hp<before){if(bullet.weaponKind==='scatter')this.scatterRicochets++;else this.attachmentHit(bullet.weaponKind,'ricochets');if(target.proofRound===this.round&&target.proofGroup)this.contract?.recordRicochetGroup(target.proofGroup,this.round);this.effects.push({type:'ricochet',x:body.x,y:body.y,targetX:target.x,targetY:target.y,weaponKind:bullet.weaponKind});}
            }
          }
          if(bullet.weaponKind==='pierce'){
            if(body.kind in C.enemies&&hpBefore>0&&body.hp<=0&&!body.active&&this.build.fractureAugment==='fracture-line')this.fractureWave(body,bullet.damage,true);
            else this.fracture(body,bullet.damage);
          }
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
              const stormRelay=hop>0&&bullet.weaponKind==='scatter'&&this.build.stormAugment==='storm-relay';
              const candidates = this.bodies.filter(other => other.active && !visited.has(other.id)&&(!seeker||!(other.dropGrace??0)) && other.kind in C.enemies
                && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind==='boss'&&this.phase!=='boss')
                && Math.hypot(other.x-origin.x,other.y-origin.y) <= (stormRelay?STORM_REFINEMENT.relayRange:seeker?SEEKER_BRIDGE.range:this.build.ranks.electric>=2?220:160));
              const priority=(target:Body)=>seeker&&!guardClosed(target)&&['sniper','armor','elite','guard','boss'].includes(target.kind)?target.warning>0?2:1:0;
              candidates.sort((a,b) => priority(b)-priority(a)||Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y) || a.id-b.id);
              const next = candidates[0]; if (!next) break;
              visited.add(next.id); damage *= this.build.ranks.electric>=3?0.8:0.65;
              this.effects.push({type:'arc',x:origin.x,y:origin.y,targetX:next.x,targetY:next.y,seeker});
              const before=next.hp,conducts=!guardClosed(next)&&!(next.dropGrace??0);this.hit(next,damage,bullet.weaponKind,bullet.weaponKind==='scatter'?'storm':bullet.weaponKind);if(bullet.weaponKind==='arc'&&next.hp<before){this.arcLinks++;if(seeker)this.seekerLinks++;if(conducts)this.ionImpact(next,damage);}
              if(bullet.weaponKind==='scatter'&&next.hp<before){this.stormLinks++;if(hop>0&&this.build.stormAugment==='storm-relay'){this.stormRelayLinks++;this.recordStormProof('storm-relay',next);}}origin = next;
            }
          }
          if (bullet.splashRadius && body.kind in C.enemies && !(isBallisticWeapon(bullet.weaponKind)&&bullet.weaponKind!=='blast'&&guardClosed(body))) {
            // No secondary explosions, reward charging or off-screen farming.
            if(bullet.weaponKind==='scatter')this.scatterBursts++;
            this.effects.push({type:bullet.weaponKind==='scatter'?'scatter-burst':bullet.weaponKind==='blast'?'blast':'ammo-fragment',x:body.x,y:body.y,size:bullet.splashRadius,weaponKind:bullet.weaponKind});
            for (const other of this.bodies) if (other !== body && other.active && other.kind in C.enemies
              && other.y >= C.playerShotTop && other.y <= C.playerY && !(other.kind==='boss'&&this.phase!=='boss') && !(other.dropGrace??0)
              && Math.hypot(other.x-body.x,other.y-body.y) <= bullet.splashRadius)
              {if(bullet.weaponKind==='scatter')this.scatterSplashHits++;else if(isBallisticWeapon(bullet.weaponKind))this.attachmentHit(bullet.weaponKind,'splashHits');this.hit(other,bullet.damage*BALLISTIC_FORK.splash,bullet.weaponKind);}
          }
          // Complete the original attack before spending at most one stored beam.
          // Derived hits never enter this projectile-contact callback.
          if(linkEligible&&body.hp<hpBefore)this.releaseLaserLink(body);
          if(linkEligible&&body.hp<hpBefore&&bullet.weaponKind==='scatter')this.stormFocus(body,bullet.damage);
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
          this.lastEquipmentPickup={id:b.id,row:b.row,kind:b.weaponKind,refit:!!b.refit,time:this.time,x:b.x,y:b.y};
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
          const chosen = gateAtCrossing(gates,x);
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
    // Resolve after all same-frame contacts; retained sources only live for
    // their actual ordnance, so an early kill cannot erase evasion evidence.
    for(const b of this.mineTargets.values())if(b.mineKilled)this.awardMineTactic(b);
    const liveBoss=this.bodies.find(b=>b.active&&b.kind==='boss');
    if(hadBossShield&&!this.bossShieldActive()&&liveBoss&&this.player.hp>0)this.emit('shield-down',liveBoss.x,liveBoss.y,'护卫屏障瓦解');
    if (this.player.hp <= 0) {
      this.phase = 'dead'; this.emit('death', this.player.x, C.playerY, '本次突围结束', 150);
    } else if (this.bossVictory) {
      this.bossWins++;
      this.bossLootRounds.push(this.round);
      const reserveSpawns=this.bodies.find(b=>b.kind==='boss')?.bossReserveSpawns??0;
      const planned=(this.bossFormation?.groups.reduce((n,g)=>n+g.troops.length,0)??0)+reserveSpawns;
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
    for(const [id,b]of this.mineTargets)if(b.mineAwarded||(!this.bodies.includes(b)&&!this.bullets.some(p=>p.mine&&p.sourceId===id))||this.phase==='dead'||this.phase==='recovery')this.mineTargets.delete(id);
    if(!this.ionLive()){this.ionOrbs=[];this.ionSpears=[];}else{
      this.ionOrbs=this.ionOrbs.filter(p=>p.active&&p.age<ION_ORB.life&&p.y>C.playerShotTop);
      this.ionSpears=this.ionSpears.filter(p=>p.active&&p.age<ION_SPEAR.life&&p.y>C.playerShotTop&&p.x>-40&&p.x<760);
    }
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
  private awardMineTactic(b:Body){
    if(b.mineAwarded||!b.mineKilled||this.player.hp<=0||this.phase==='dead'||this.phase==='recovery'||this.bossVictory)return;
    const tactic=mineTactic(b,this.damageTaken);if(!tactic)return;
    b.mineAwarded=true;
    const charge=tactic==='preempt'?MINE_TACTIC.preemptCharge:MINE_TACTIC.counterCharge;
    if(tactic==='preempt')this.minePreemptWins++;else this.mineCounterWins++;
    const reward=grantGate(this.growth,charge,'energy');if(reward.activated)this.emit('overload',this.player.x,C.playerY);
    this.effects.push({type:'mine-tactic',x:b.x,y:b.y,text:`${tactic==='preempt'?'抢拆布雷':'穿雷反击'} · 充能+${charge}`,detail:this.chargeReceipt(reward.activated)});
  }
  private hit(b: Body, damage: number, weaponKind?: WeaponKind,source:DamageSource=weaponKind??'pulse',capacitorDirect=false) {
    if((b.dropGrace??0)>0){this.effects.push({type:'drop-impact',x:b.x,y:b.y,weaponKind});return;}
    this.hits++; b.hit = 0.07;
    if (b.kind === 'gate') {
      const before = gateValue(b.energy, b.rewardKind); b.energy = Math.min(144, b.energy + damage);
      if (gateValue(b.energy, b.rewardKind) > before) this.emit('gate-level', b.x, b.y, `+${gateValue(b.energy, b.rewardKind)}${b.rewardKind === 'power' ? '%' : ''}`);
      this.emit('impact-gate', b.x, b.y); return;
    }
    const shield=b.kind==='boss'&&this.bossShieldActive()?1-(this.bossFormation?.shieldReduction??0):1;
    const before=b.hp,wasActive=b.active;
    b.hp = Math.max(0, b.hp - damage * guardDamageScale(b)*shield);
    if(wasActive&&b.kind in C.enemies)this.#combatLedger.record(source,before,b.hp);
    if(this.phase==='boss'&&this.player.hp>0&&b.kind==='boss'&&b.active&&b.hp>0&&bossReserveFor(this.round)
      &&b.bossReserveAt===undefined&&before>b.maxHp*BOSS_RESERVES.ratio&&b.hp<=b.maxHp*BOSS_RESERVES.ratio){
      b.bossReserveAt=this.phaseTime+BOSS_RESERVES.delay;
    }
    const plateBreaks=claimBossSalvage(b,before,this.round,this.player.hp>0&&this.phase==='boss');
    if(plateBreaks.length){
      const charge=plateBreaks.length*BOSS_SALVAGE.charge,reward=grantGate(this.growth,charge,'energy');
      if(reward.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'boss-salvage',x:b.x,y:b.y,bossVariant:b.bossVariant,gain:plateBreaks.length,
        text:'首领破甲 '+plateBreaks.length+'段 · 充能+'+charge,detail:this.chargeReceipt(reward.activated)});
    }
    this.effects.push({ type: 'impact', x: b.x, y: b.y, size: b.width, weaponKind });
    if (b.hp > 0) return;
    b.active = false;
    if(wasActive)this.relayCapacitor(b,(b.capacitorHits??0)+(capacitorDirect&&!guardClosed(b)?1:0));
    if (b.kind === 'crate') {
      this.cratesBroken++;
      const pickup = this.spawn('pickup', b.x, b.y, b.stage); pickup.weaponKind = b.weaponKind; pickup.row = b.row;pickup.refit=b.refit;pickup.openingSupply=b.openingSupply;if(b.directedRefit)pickup.directedRefit=true;
      this.effects.push({ type: 'crate-break', x: b.x, y: b.y, text: '靠近领取', size: 110, equipmentStage: b.stage });
    } else {
      if(wasActive&&b.pattern==='minelayer'&&this.phase==='running'&&this.player.hp>0){b.mineKilled=true;if(mineTactic(b,this.damageTaken)==='preempt')this.awardMineTactic(b);}
      if(b.kind==='sniper'&&b.pattern==='lockshot'){
        if(b.warning>0&&!(b.lockAcceptedShots??0))this.lockPreemptWins++;
        if((b.lockAcceptedShots??0)===LOCKSHOT.shots&&(b.lockPassed??0)===LOCKSHOT.shots&&b.lockDamageStart===this.damageTaken)this.lockBaitWins++;
      }
      if(b.dropGrace!==undefined)this.dropKills++;
      if(b.kind==='conduit')this.dischargeConduit(b);
      this.kills++; this.score += C.enemies[b.kind as EnemyKind].score;
      if(wasActive&&this.phase==='running'&&this.player.hp>0&&this.closingIds.has(b.id)&&!this.closingKillIds.has(b.id)){
        this.closingKillIds.add(b.id);
        if(!this.closingAwarded&&this.closingKillIds.size===this.closingIds.size){
          this.closingAwarded=true;this.closingClears++;
          const reward=grantGate(this.growth,CLOSING_CLEAR_CHARGE,'energy');if(reward.activated)this.emit('overload',this.player.x,C.playerY);
          this.effects.push({type:'closing-clear',x:b.x,y:b.y,text:`终线全歼 ${this.closingIds.size}/${this.closingIds.size} · 充能+${CLOSING_CLEAR_CHARGE}`,detail:this.chargeReceipt(reward.activated)});
        }
      }
      if(b.kind!=='boss')this.score += this.rapidBreak.kill(this.time);
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
      if(b.aceRole)for(const partner of this.bodies)if(partner.active&&partner.hp>0&&partner.id!==b.id&&partner.aceRole&&partner.bountyRound===b.bountyRound){partner.aceRagePending=true;if(partner.warning<=0&&!partner.burst)partner.timer=Math.min(partner.timer,ACE_DUO.rageLead);}
      if(b.bountyRound!==undefined&&this.contract?.targetKilled(b.id,b.bountyRound)){
        this.effects.push({type:'bounty-progress',x:b.x,y:b.y,text:`悬赏精英 ${this.contract.targetKills}/2`,detail:this.contract.targetKills<2?'再击破一名领取契约强化':'目标全破 · 即将选择强化'});
      }
    }
  }
}
