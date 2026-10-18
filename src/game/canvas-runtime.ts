import{calibrationGateReward,CALIBRATION_GATE}from'../core/calibration-gate';
import{bossWeaveRig}from'./boss-weave-rig';
import{isWeaveBoss}from'../core/boss-weave';
import{mineGoal,mineTargetLabel}from'./mine-goal';
import {coolingRotors} from './cooling-rotors';
import{bastionBarrageRig}from'./bastion-barrage-rig';
import{wingShearRig}from'./wing-shear-rig';
import {combatCopy,type CombatCopy} from './combat-copy';
import{boosterMount}from'./booster-mount';
import {OVERLOAD} from '../core/overload';
import {combatNoticePosition} from './combat-notice';
import {pickupBeacon,pickupSignal} from './pickup-signal';
import {ammoFragmentLight} from './ammo-fragment';
import {ballisticMechanics} from './ballistic-mechanics';
import {BANKSHOT} from '../core/bankshot';
import {bankshotMount} from './bankshot-mount';
import{rakeMount}from'./rake-mount';
import {bossHullWear,bossWearBand} from './boss-hull-wear';
import {combatContribution} from './combat-contribution';
import {supplyCombinations,supplyCombinationLabel,supplyCombinationClear} from './supply-combinations';
import {shieldLatch} from './shield-latch';
import {guardClosed,guardDamageScale} from '../core/behavior';
import {admitWeaponImpact,trimImpactBudget,type ImpactMarker} from './impact-admission';
import {captureEquipment,equipmentChanges,equipmentReceipt,EquipmentReceiptQueue,type EquipmentChange} from './equipment-receipt';
import {ionEvolutionLight} from './ion-evolution-light';
import {stormMarks} from './storm-marks';
import {achievementBadge}from'./achievement-badge';
import {controlShutter}from'./control-shutter';
import{shutterClosed}from'../core/control-shutter';
import {ammoRack}from'./ammo-rack';
import {isStormAugment,stormAugments} from '../core/storm-refinement';
import {isIonAugment,ionAugments} from '../core/ion-storm';
import {fireControlHolding,fireControlSource} from '../core/fire-control';
import {controlReceiver,controlTransmitter,controlPatrolDrive} from './fire-control-rig';
import {lockshotGoal,lockshotTargetLabel} from './lockshot-goal';
import {lockshotLeaving} from '../core/lockshot';
import {lockshotMount} from './lockshot-mount';
import {hostileShot} from './hostile-shot';
import {DRIFT_SUPPLY} from '../core/drift-supply';
import {driftCarrier} from './drift-carrier';
import {isFractureAugment,fractureAugments} from '../core/combos';
import {isPhotonAugment,photonAugments,laserChainProfile} from '../core/laser-chain';
import {batteryHolding} from '../core/battery';
import {batteryMount} from './battery-mount';
import {equipmentPreview} from './equipment-preview';
import {calibrationVisualBand} from '../core/calibration-visual';
import {calibrationShot,calibrationMount} from './calibration-light';
import {openingWeapons,isOpeningWeapon,parseOpeningWeapon,openingHints} from '../core/opening-plan';
import {battleBrief,battlePlans,battlePlansInfo,isBattlePlan,nextBattlePlan,parseBattlePlan} from '../core/battle-plan';
import {gateMachine,gatePanelBlocked,pairedGate} from './gate-machine';
import {magneticLight} from './magnetic-light';
import {sweeperDirection} from '../core/sweeper';
import {sweeperLight} from './sweeper-light';
import {ricochetLight} from './ricochet-light';
import {reboundState} from '../core/rebound-charger';
import {reboundLight} from './rebound-light';
import {buildReceiptPosition,combatPanelClear,type ReceiptPosition} from './build-receipt';
import {recipes,recipeIds,parseRecipeGoal,recipeStatus,recipePerformance,recipeSupplyMatch,recipeRouteHint,type RecipeGoal} from '../core/recipe-goal';
import {interceptorLight} from './interceptor-light';
import {INTERCEPTOR_ART,interceptorArtFrame} from './interceptor-art';
import {heavyEscortHolding} from '../core/heavy-escorts';
import {BossArmorFragments} from './boss-armor-fragments';
import {BOSS_SALVAGE,bossSalvageCount} from '../core/boss-salvage';
import{bossTacticalStatus}from './boss-tactical-status';
import{CLOSING_CLEAR_CHARGE}from'../core/closing-assault';
import{OVERDRIVE,overdriveForms,isOverdriveForm}from'../core/overdrive';
import{overdriveLance}from'./overdrive-light';
import{MINELAYER}from'../core/minelayer';
import{mineLight,minelayerFlash}from'./mine-light';
import {bossHeatLight} from './boss-heat-light';
import {buildProofs,requiredProofGroups,type BuildProof} from '../core/build-proof';
import {ionStormLight,ionChargeLight} from './ion-storm-light';
import {ION_STORM} from '../core/ion-storm';
import {dropLight} from './drop-light';
import {enemyProjectileScale} from '../core/projectile-pressure';
import {refitLabel} from './refit-label';
import {sentryDirection} from '../core/mobile-sentry';
import {sentryThrust} from './sentry-thrust';
import {buildPreview} from './build-preview';
import {empWave,offlineLight} from './emp-light';
import {runReport} from './run-report';
import { capacitorLight, capacitorMarks, capacitorRelay } from './capacitor-light';
import { formationShield } from './formation-shield';
import { burnLight } from './burn-light';
import { fractureLight, fractureMarks, fractureWaveLight } from './fracture-light';
import { mountedRig,mountedCenter,mountedPose } from './mounted-rig';
import { contracts, hunts, type HuntKind, type ContractKind } from '../core/contracts';
import { achievements, achievementGroups, achievementGroup, achievementProgress, trackAchievement, type AchievementGroup, awardAchievements, parseAchievements } from '../core/achievements';
import { OPTICAL_FUSION,hasOptical,isOpticalFusion,opticalFusionBranch,opticalName,isAmmoFusion,fusionBranch,ammoName,tree, routes, magneticAugments, isMagneticAugment, opticalBranches, electricBranches, ballisticBranches, BALLISTIC_FORK, OPTICAL_FORK, ELECTRIC_FORK, type BuildBranch, type Route } from '../core/build-tree';
import { overloadWake, coilDischarge, chainArc, focusDischarge, energyShot, projectileBody, muzzleLight, detonationLight, detonationSpriteAlpha, sparkLight, impactLight } from './combat-light';
import { C, clamp } from '../core/config';
import { World } from '../core/world';
import type { EffectEvent } from '../core/world';
import { gateValue, previewReward, permanentPower } from '../core/rewards';
import { defaults } from '../ui/storage';
import { FrameWindow } from './frame-window';
import { BossDestruction, BOSS_VISUAL } from './boss-destruction';
import { PlayerMotion } from './player-motion';
import { WeaponMotion } from './weapon-motion';
import type { PlayerPose } from './player-motion';
import { CrateDebris, crateFrame } from './crate-debris';
import { GateFeedback,GATE_RECEIPT,gateReceiptBounds,gateReceiptReadable } from './gate-feedback';
import { contextGuide, weaponGuide } from './context-guide';
import { dossierWeapons, weaponDossier } from './weapon-dossier';
import { supportLight,opticalImpactLight,opticalEmitterLight,opticalChargeLight } from './support-light';
import{MIRROR_LASER,type MirrorSegment}from'../core/mirror-laser';
import{mirrorLight,mirrorMount,dualLensMount}from'./mirror-light';
import {laserVisualBand} from '../core/support-profile';
import { HorizontalKeys } from './horizontal-keys';
import { droneFrame } from './drone-motion';
import { chargerFrame } from './charger-motion';
import { armorFrame } from './armor-motion';
import { eliteFrame } from './elite-motion';
import {aceRig} from './ace-rig';
import { bossFrame } from './boss-motion';
import { EnemyWreck, isWreckKind } from './enemy-wreck';
import type { Save } from '../ui/storage';
import { weaponProfile, weaponNames, weaponColors, ARC_SHOT } from '../core/weapons';
import type { WeaponKind } from '../core/weapons';
import { sectorIndex, sectorNames, SWARM } from '../core/director';

export interface Platform {
  canvas: HTMLCanvasElement;
  image: (src: string) => Promise<HTMLImageElement>;
  read: () => Save;
  write: (save: Save) => void;
  sound: (type: string, stage: number, weapon?: WeaponKind) => void;
  silence: () => void;
  music?: (playing: boolean) => void;
  now: () => number;
  requestFrame: (callback: (time: number) => void) => void;
  openLicenses?: () => void;
  frameContext?: () => {hidden?:boolean;focused?:boolean};
  controls?: (buttons: readonly CanvasControl[], placement: {scale:number;offsetX:number;offsetY:number}) => void;
  width: number; height: number; dpr: number; menuBottom: number;
}
export interface CanvasControl { x: number; y: number; w: number; h: number; label: string; action: string }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; total: number; color: string; hot?:boolean }
interface Blast { reactor?:boolean;ammo?:boolean; ion?:boolean; electric?: boolean; fracture?: boolean; x: number; y: number; size: number; life: number; total: number }
const fonts = '"Microsoft YaHei", "PingFang SC", sans-serif';

/** Shared production canvas surface for WeChat and the browser compatibility harness. */
export class CanvasRuntime {
  world = new World();
  mode: 'loading' | 'menu' | 'opening' | 'battle-plan' | 'achievements' | 'armory' | 'loadout' | 'contribution' | 'refit-plan' | 'rig' | 'combos' | 'contracts' | 'contract-reward' | 'boss-reward' | 'tree' | 'choice' | 'branch' | 'overdrive' | 'playing' | 'paused' | 'settings' | 'result' | 'error' = 'loading';
  private overdriveReturn:'choice'|'tree'='choice';
  private contributionReturn:'loadout'|'result'='loadout';
  private loadoutReturn:'paused'|'result'='paused';
  private contributionPage=0;
  private proofChoice:BuildProof='ion';
  private huntChoice:HuntKind='staggered';
  private buildFeedback?: {title:string;detail:string;until:number;combo:boolean;closingClear?:boolean;tactic?:boolean;equipment?:EquipmentChange;observedAt?:number;hidden?:boolean};
  private equipmentHud?:{text:string;color:string;until:number};
  private pendingBuildFeedback:Array<NonNullable<CanvasRuntime['buildFeedback']>&{remaining:number}>=[];
  private equipmentFeedback=new EquipmentReceiptQueue();
  private achievementToast = '';
  private achievementUntil = 0;
  private achievementShownAt?:number;
  private contractReturn:'loadout'|'paused'='loadout';
  private treeReturn: 'loadout' | 'choice' = 'loadout';
  private dossierWeapon: WeaponKind = 'pulse';
  private combosReturn:'loadout'|'menu'='loadout';
  private goalWasReady=false;
  private pendingRecipeCompletion:RecipeGoal|null=null;
  save: Save;
  private previousMode: 'menu' | 'paused' = 'menu';
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private runNewBest=false;
  private runAchievements:string[]=[];
  private achievementReturn:'menu'|'result'='menu';
  private achievementTab:AchievementGroup='growth';
  private achievementPage=0;
  private buttons: CanvasControl[] = [];
  private particles: Particle[] = [];
  private sparkPhase=0;
  private blasts: Blast[] = [];
  private impacts: ImpactMarker[] = [];
  private arcs: {x:number;y:number;tx:number;ty:number;life:number;photon?:boolean;focus?:boolean;seeker?:boolean;capacitorRelay?:boolean}[] = [];
  private empWaves:{x:number;y:number;radius:number;life:number}[]=[];
  private supportBeams: {overdrive?:boolean;mirror?:MirrorSegment[];bounced?:boolean;x:number;y:number;tx:number;ty:number;life:number;laser:boolean;prism?:boolean;opticalBand?:number;ricochet?:boolean;fractureWave?:boolean}[] = [];
  private destruction?: BossDestruction;
  private playerMotion = new PlayerMotion();
  private crateDebris = new CrateDebris();
  private bossFragments = new BossArmorFragments();
  private enemyWreck = new EnemyWreck();
  private gateFeedback = new GateFeedback();
  private accumulator = 0;
  private lastTime = 0;
  private visualTime = 0;
  private groundDistance = 0;
  private renderBudget = C.step;
  private renderElapsed = 0;
  private renderedMode: string = '';
  private controlsMode = '';
  private target = 360;
  private pointer: number | null = null;
  private keys = new HorizontalKeys();
  private inputMode: 'touch' | 'keyboard' = 'touch';
  private pointerX = 0;
  private downAction = '';
  private notice = '';
  private noticeDetail = '';
  private noticeY = 277;
  private noticeUntil = 0;
  private copyCache?:{key:string;copy:CombatCopy};
  private presentedCopy:{title:string;detail:string;lines:string[];titleFont:number;detailFont:number;bounds:{left:number;right:number;top:number;bottom:number};rows:{text:string;size:number;y:number;width:number}[]}|null=null;
  private presentedNotice:{text:string;detail:string;y:number;top:number;bottom:number}|null=null;
  private shakeUntil = 0;
  private shieldBreak?:{x:number;y:number;until:number};
  private weaponMotion = new WeaponMotion();
  private mountedMotion=new Map(dossierWeapons.map(kind=>[kind,new WeaponMotion()]));
  private branchRoute:Route='optical';
  private opticalFiredAt=-Infinity;
  private weaponGuideUntil = 0;
  private weaponGuideKind:WeaponKind='pulse';
  private drawCount = 0;
  private callbackCount = 0;
  private framePulses=0;
  private pausePreview = false;
  private upgradeUntil = 0;
  private error = '';
  private started = false;
  private hidden = false;
  private loadAttempt?: { since: number; fail: () => void };
  private frameTimes = new FrameWindow();
  private callbackWork=new FrameWindow(3600);
  private previousCallbackWorkMs=0;
  private maxCallbackWorkMs=0;
  private interruptedFrames:{gapMs:number;previousCallbackWorkMs:number;hidden?:boolean;focused?:boolean}[]=[];
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private hudTop = 28;
  constructor(private platform: Platform) {
    this.ctx = platform.canvas.getContext('2d')!;
    this.save = platform.read();
    this.resize(platform.width, platform.height, platform.dpr, platform.menuBottom);
  }
  resize(width: number, height: number, devicePixelRatio: number, menuBottom = 0) {
    this.cancelTouch();
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) { this.pause('窗口变化，已暂停'); return; }
    this.platform.width = width; this.platform.height = height; this.platform.dpr = devicePixelRatio;
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.platform.canvas.width = Math.round(width * dpr); this.platform.canvas.height = Math.round(height * dpr);
    this.scale = Math.min(width / 720, height / 1280);
    this.offsetX = (width - 720 * this.scale) / 2; this.offsetY = (height - 1280 * this.scale) / 2;
    this.hudTop = Math.max(28, (menuBottom - this.offsetY) / this.scale + 12);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Changing canvas dimensions clears its pixels. Restore the current scene
    // immediately, even when a paused/background tab delays the next rAF.
    this.render(0);
    if (this.mode === 'playing') this.drawCount++;
  }
  async load() {
    this.loadAttempt?.fail();
    let fail = () => {};
    const interrupted = new Promise<never>((_resolve, reject) => { fail = () => reject(new Error('Asset load interrupted')); });
    const attempt = { since: this.platform.now(), fail };
    this.loadAttempt = attempt;
    this.mode = 'loading'; this.error = ''; this.images.clear(); this.buttons = [];
    this.lastTime = this.platform.now();
    if (!this.started) { this.started = true; this.platform.requestFrame(time => this.frame(time)); }
    try {
      const images = await Promise.race([interrupted, Promise.all(['units.png', 'mounted-modules-v1.png', 'scatter-player-v1.png', 'pierce-player-v2.png', 'blast-player-v1.png', 'arc-player-v1.png', 'props.png', 'gate-frame-v1.png', 'runway.jpg', 'cooling-corridor-v2.jpg', 'armored-corridor-v1.jpg', 'explosion-v1.png', 'boss-reactor-v1.png', 'minelayer-v1.png', 'crate-v1.png', 'drone-v1.png', 'charger-v1.png', 'armor-v1.png', 'elite-v1.png', INTERCEPTOR_ART, 'conduit-v1.png', 'sniper-v1.png', 'sniper-wreck-v1.png', 'guard-v1.png', 'guard-wreck-v1.png', 'boss-v1.png', 'boss-flanker-v1.png', 'boss-bastion-v1.png', 'drone-wreck-v1.png', 'charger-wreck-v1.png', 'armor-wreck-v1.png', 'elite-wreck-v1.png'].map(async key => [key, await this.platform.image(`assets/${key}`)] as const))]);
      if (this.loadAttempt !== attempt) return;
      this.images = new Map(images);
      this.mode = 'menu';
    } catch {
      if (this.loadAttempt !== attempt) return;
      this.error = '资源加载未完成，请点击重试'; this.mode = 'error';
    } finally {
      if (this.loadAttempt === attempt) { this.loadAttempt = undefined; this.lastTime = this.platform.now();this.render(0); }
    }
  }
  private frame(_timestamp: number) {
    this.framePulses++;
    const time = this.platform.now(), measuredPlaying=this.mode==='playing';
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    const dt = Math.min(elapsed, 0.1);
    if (!this.hidden && this.loadAttempt && time - this.loadAttempt.since >= 15000) this.loadAttempt.fail();
    if (this.mode === 'playing') {
      this.callbackCount++;
      this.frameTimes.add(elapsed * 1000);
      if (elapsed > 0.25) {
        let context:{hidden?:boolean;focused?:boolean}={};
        try{context=this.platform.frameContext?.()??{};}catch{/* Diagnostics must never affect play. */}
        this.interruptedFrames.push({gapMs:elapsed*1000,previousCallbackWorkMs:this.previousCallbackWorkMs,hidden:context.hidden,focused:context.focused});
        if(this.interruptedFrames.length>12)this.interruptedFrames.shift();
        this.pause('画面更新中断，已暂停');
      }
      else {
        this.accumulator += dt;
        let steps = 0;
        try {
          while (this.accumulator + 1e-9 >= C.step && steps++ < 5 && this.mode === 'playing') {
            if (this.keys.active) this.target = clamp(this.world.player.x + this.keys.direction * C.moveSpeed * C.step, C.minX, C.maxX);
            this.groundDistance += C.step * this.world.scrollSpeed;
            const previousBuildPoints=this.world.buildPoints;
            const equipmentBefore=this.world.bodies.some(b=>b.active&&(b.kind==='pickup'||b.kind==='gate'&&b.calibrationTarget))?captureEquipment(this.world):undefined;
            this.world.step(C.step, this.target); this.accumulator -= C.step;
            const equipmentHandled=equipmentBefore?this.recordEquipment(equipmentBefore):false;
            for (const e of this.world.drainEffects()) this.effect(e,equipmentHandled);
            this.checkRecipeGoal();
            const reveal=this.world.bossRewardRound!==null&&this.world.phase==='recovery'&&this.world.phaseTime<C.bossLootReveal;
            if(this.world.player.hp>0&&!reveal&&this.world.bossRewardRound!==null){this.mode='boss-reward';this.cancelTouch();this.accumulator=0;this.platform.silence();}
            else if(this.world.player.hp>0&&!reveal&&this.world.contractReward){this.mode='contract-reward';this.cancelTouch();this.accumulator=0;this.platform.silence();}
            else if (this.world.player.hp>0 && !reveal && this.world.buildPoints>previousBuildPoints && this.world.build.available(this.world.buildPoints).length) {
              this.mode='choice';this.cancelTouch();this.accumulator=0;this.platform.silence();
            }
            if (this.world.player.hp <= 0) {
              this.mode = 'result'; this.cancelTouch();this.runNewBest=this.world.score>this.save.best; this.save.best = Math.max(this.save.best, this.world.score); this.platform.write(this.save); this.platform.silence();
            }
          }
          if (this.accumulator > C.step * 2) this.pause('设备暂时繁忙，已暂停');
        } catch { this.error = '运行异常，请重新开始'; this.mode = 'error'; this.cancelTouch(); this.platform.silence(); }
      }
    }
    if (this.mode === 'playing' || this.mode === 'menu' || this.mode === 'result') this.visualTime += dt;
    this.updateMusic();
    this.renderBudget += dt;
    this.renderElapsed += dt;
    if (this.renderBudget + 1e-9 >= C.step || this.renderedMode !== this.mode) {
      if (this.mode === 'playing') this.drawCount++;
      this.render(this.mode === 'paused' || this.mode === 'settings' || this.mode === 'choice' ? 0 : Math.min(this.renderElapsed, 0.1));
      this.renderBudget = Math.max(0, this.renderBudget - Math.floor((this.renderBudget + 1e-9) / C.step) * C.step);
      this.renderElapsed = 0;
      this.renderedMode = this.mode;
    }
    this.previousCallbackWorkMs=Math.max(0,this.platform.now()-time);
    if(measuredPlaying){this.callbackWork.add(this.previousCallbackWorkMs);this.maxCallbackWorkMs=Math.max(this.maxCallbackWorkMs,this.previousCallbackWorkMs);}
    this.platform.requestFrame(next => this.frame(next));
  }
  start() {
    this.loadoutReturn='paused';
    this.contributionPage=0;this.contributionReturn='loadout';
    this.buttons=[];
    for(const motion of this.mountedMotion.values())motion.reset();
    this.opticalFiredAt=-Infinity;
    this.buildFeedback=undefined;this.pendingBuildFeedback.length=0;this.equipmentFeedback.clear();this.equipmentHud=undefined;
    this.runNewBest=false;this.runAchievements=[];this.achievementReturn='menu';
    this.achievementUntil=0;this.achievementShownAt=undefined;
    this.supportBeams=[];
    this.pausePreview = false;
    this.groundDistance = 0;
    this.keys.clear(); this.inputMode = 'touch';
    this.gateFeedback.clear();
    this.crateDebris.clear();
    this.bossFragments.clear();
    this.enemyWreck.clear();
    this.playerMotion.reset();
    this.weaponMotion.reset();
    this.weaponGuideUntil = 0;
    this.drawCount = 0; this.callbackCount = 0;
    this.world = new World(1337,1,this.save.openingWeapon,this.save.nextBattlePlan);
    this.save.nextBattlePlan=nextBattlePlan(this.world.battlePlan);this.mode = 'playing'; this.target = 360;
    this.goalWasReady=false;this.pendingRecipeCompletion=null;
    this.accumulator = 0; this.lastTime = this.platform.now(); this.pointer = null;
    this.frameTimes.clear();this.callbackWork.clear();this.maxCallbackWorkMs=0;this.previousCallbackWorkMs=0;this.interruptedFrames=[]; this.downAction = '';
    this.particles = [];this.sparkPhase=0; this.blasts = []; this.impacts = []; this.arcs = []; this.empWaves=[]; this.destruction = undefined; this.notice = ''; this.shakeUntil = 0;this.shieldBreak=undefined; this.upgradeUntil = 0;
    this.platform.silence();
    this.updateMusic();
    this.platform.write(this.save);
  }
  private pauseReason = '';
  pause(message = '暂停') {
    if (this.mode !== 'playing') return;
    this.pausePreview = false;
    this.pauseReason = message === '暂停' ? '准备好了，再继续突围。' : message;
    this.mode = 'paused'; this.cancelTouch(); this.accumulator = 0; this.notify(message); this.platform.silence();
    this.updateMusic();
  }
  hide() { this.platform.write(this.save); this.hidden = true; this.pause('切换至后台，已暂停'); this.cancelTouch(); this.platform.silence(); }
  show() { this.hidden = false; this.lastTime = this.platform.now(); if (this.loadAttempt) this.loadAttempt.since = this.lastTime; this.accumulator = 0; this.cancelTouch(); }
  private updateMusic() {
    try { this.platform.music?.(this.mode === 'playing' && this.save.settings.music); }
    catch { /* An optional platform audio feature must not stop the game. */ }
  }
  keyDown(code: string) {
    if (this.mode !== 'playing' || this.pointer !== null || !this.keys.press(code)) return false;
    this.inputMode = 'keyboard'; return true;
  }
  keyUp(code: string) {
    if (!this.keys.release(code)) return false;
    this.target = this.world.player.x; return true;
  }
  private point(x: number, y: number) { return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale }; }
  touchStart(id: number, x: number, y: number) {
    if (this.pointer !== null) return;
    this.cancelTouch(); this.inputMode = 'touch';
    const p = this.point(x, y); this.pointer = id; this.pointerX = p.x;
    this.downAction = this.buttons.find(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h)?.action ?? '';
  }
  touchMove(id: number, x: number, y: number) {
    if (id !== this.pointer || this.downAction || this.mode !== 'playing') return;
    const p = this.point(x, y); this.target = clamp(this.target + p.x - this.pointerX, C.minX, C.maxX); this.pointerX = p.x;
  }
  touchEnd(id: number, x: number, y: number) {
    if (id !== this.pointer) return;
    const p = this.point(x, y), action = this.buttons.find(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h)?.action;
    const pressed = this.downAction;
    this.cancelTouch();
    if (action && action === pressed) {this.action(action);this.checkRecipeGoal();}
  }
  cancelTouch(id?: number) {
    if (id !== undefined && id !== this.pointer) return;
    this.keys.clear();
    this.pointer = null; this.downAction = ''; this.target = this.world.player.x;
  }
  /** Native back never resumes a paused run or silently abandons a live one. */
  back(): 'stay' | 'exit' {
    this.cancelTouch();
    if(this.mode==='branch'){this.mode='choice';return 'stay';}
    if(this.mode==='overdrive'){this.mode=this.overdriveReturn;return 'stay';}
    if (this.mode === 'choice'||this.mode==='contract-reward'||this.mode==='boss-reward') return 'stay';
    if (this.mode === 'armory'||this.mode==='opening'||this.mode==='battle-plan') { this.mode = 'menu'; return 'stay'; }
    if (this.mode === 'achievements') { this.mode = this.achievementReturn; return 'stay'; }
    if(this.mode==='combos'){this.mode=this.combosReturn;return 'stay';}
    if(this.mode==='contribution'){this.mode=this.contributionReturn;return 'stay';}
    if (this.mode === 'rig') { this.mode='loadout';return 'stay'; }
    if (this.mode === 'contracts') { this.mode=this.contractReturn;return 'stay'; }
    if (this.mode === 'tree') { this.mode = this.treeReturn; return 'stay'; }
    if(this.mode==='refit-plan'){this.mode='loadout';return 'stay';}
    if (this.mode === 'loadout') { this.mode = this.loadoutReturn; return 'stay'; }
    if (this.mode === 'playing') { this.pause(); return 'stay'; }
    if (this.mode === 'settings') { this.action('back'); return 'stay'; }
    if (this.mode === 'paused') { this.pausePreview = false; this.notify('请继续战斗，或选择返回主界面'); return 'stay'; }
    if (this.mode === 'result') { this.action('home'); return 'stay'; }
    return 'exit';
  }
  /** Standard browser controls share the exact same actions as canvas touches. */
  activateControl(action: string): boolean {
    if (this.controlsMode !== this.mode || !this.buttons.some(button => button.action === action)) return false;
    this.cancelTouch();
    this.action(action);
    this.checkRecipeGoal();
    this.render(0);
    return true;
  }
  private selectBuild(route:Route,branch?:BuildBranch){
    const preview=buildPreview(this.world,route,branch);
    const chosenNode=isOpticalFusion(branch)?{name:'双镜复合 · '+opticalBranches[opticalFusionBranch(branch)].name}:isAmmoFusion(branch)?{name:'复合弹芯 · '+ballisticBranches[fusionBranch(branch)].name}:isStormAugment(branch)?stormAugments[branch]:isIonAugment(branch)?ionAugments[branch]:isFractureAugment(branch)?fractureAugments[branch]:isPhotonAugment(branch)?photonAugments[branch]:isMagneticAugment(branch)?magneticAugments[branch]:this.world.build.ranks[route]<3?this.world.build.node(route,this.world.build.ranks[route],branch):this.world.build.next(route);
    const hadPrism=this.world.supportProfile().prism,hadStorm=this.world.build.ranks.ballistic>=3;
    if(!this.world.chooseBuild(route,branch))return;
    this.upgradeUntil=this.world.time+.45;
    if(isStormAugment(branch)&&this.world.contract?.status!=='active')this.proofChoice=branch;
    if(isMagneticAugment(branch)&&this.world.contract?.status!=='active')this.proofChoice='magnetic';
    const earnedEffects=this.world.drainEffects();
    this.checkAchievements();
    const combo=!hadPrism&&this.world.supportProfile().prism?'棱镜激光':!hadStorm&&this.world.build.ranks.ballistic>=3?'雷暴霰射':'';
    this.setBuildFeedback({title:combo?`组合完成 · ${combo}`:`配件强化 · ${chosenNode.name}`,detail:combo==='棱镜激光'?'主束保留 · 两侧追加45%伤害':combo==='雷暴霰射'?'每颗霰弹命中后追加一次跳电':preview.gain,until:this.world.time+4,combo:!!combo});
    if(this.save.settings.sound&&!earnedEffects.some(e=>e.type==='combination'))this.platform.sound('upgrade',this.world.weaponStage(this.world.weaponKind));
    for(const effect of earnedEffects)this.effect(effect);
    this.mode='choice';
    if(!this.world.build.available(this.world.buildPoints).length)this.action('resume');
  }
  private action(action: string) {
    if(action.startsWith('build:') && this.mode==='choice') {
      const route=action.slice(6) as Route;
      if(!routes.includes(route))return;
      if((this.world.build.ranks[route]===1||route==='ballistic'&&(this.world.canRefineFracture()||this.world.canRefineStorm()||this.world.canFuseAmmo())||route==='electric'&&(this.world.canRefineMagnetic()||this.world.canRefineIon())||route==='optical'&&(this.world.canRefinePhoton()||this.world.canFuseOptics()))&&this.world.build.available(this.world.buildPoints).includes(route)){this.branchRoute=route;this.mode='branch';}
      else this.selectBuild(route);
    }
    else if(action==='optic-defer'&&this.mode==='branch'&&this.branchRoute==='optical'&&this.world.canFuseOptics())this.selectBuild('optical');
    else if(action==='overdrive-open'&&(this.mode==='choice'||this.mode==='tree')&&(this.world.growth.mastery??0)>=OVERDRIVE.mastery){this.overdriveReturn=this.mode;this.mode='overdrive';}
    else if(action==='overdrive-back'&&this.mode==='overdrive')this.mode=this.overdriveReturn;
    else if(action.startsWith('overdrive:')&&this.mode==='overdrive'){
      const form=action.slice(10);if(isOverdriveForm(form)&&this.world.chooseOverdrive(form)){for(const e of this.world.drainEffects())this.effect(e);this.mode=this.overdriveReturn;}
    }
    else if(action==='fusion-defer'&&this.mode==='branch'&&this.branchRoute==='ballistic'&&this.world.canFuseAmmo())this.selectBuild('ballistic');
    else if(action==='branch-back'&&this.mode==='branch')this.mode='choice';
    else if(action.startsWith('branch:')&&this.mode==='branch'){
      const branch=action.slice(7) as BuildBranch,route=this.branchRoute;
      if(isIonAugment(branch)&&route==='electric'&&this.world.canRefineIon())this.selectBuild(route,branch);
      else if(isOpticalFusion(branch)&&route==='optical'&&this.world.canFuseOptics())this.selectBuild(route,branch);
      else if(isAmmoFusion(branch)&&route==='ballistic'&&this.world.canFuseAmmo())this.selectBuild(route,branch);
      else if(isStormAugment(branch)&&route==='ballistic'&&this.world.canRefineStorm())this.selectBuild(route,branch);
      else if(isFractureAugment(branch)&&route==='ballistic'&&this.world.canRefineFracture())this.selectBuild(route,branch);
      else if(isPhotonAugment(branch)&&route==='optical'&&(this.world.canRefinePhoton()||this.world.canFuseOptics()))this.selectBuild(route,branch);
      else if(isMagneticAugment(branch)&&route==='electric'&&this.world.canRefineMagnetic())this.selectBuild(route,branch);
      else if(this.world.build.ranks[route]===1&&((route==='ballistic'&&(branch==='penetrator'||branch==='fragment'||branch==='ricochet'))||(route==='optical'&&(branch==='burn'||branch==='relay'||branch==='mirror'))||(route==='electric'&&(branch==='spread'||branch==='capacitor'||branch==='seeker'))))this.selectBuild(route,branch);
    }
    else if (action === 'reload') { this.mode = 'loading'; void this.load(); }
    else if (action === 'start') this.start();
    else if (action === 'achievements'){this.achievementReturn=this.mode==='result'?'result':'menu';const focus=this.achievementReturn==='result'?this.runAchievements.at(-1):this.save.achievements.tracked;if(focus)this.achievementTab=achievementGroup(focus);const ids=achievementGroups[this.achievementTab].ids as readonly string[];this.achievementPage=focus&&ids.length>6?Math.floor(ids.indexOf(focus)/4):0;this.mode='achievements';}
    else if(action.startsWith('achievement-group:')&&this.mode==='achievements'){const group=action.slice(18);if(Object.hasOwn(achievementGroups,group)){this.achievementTab=group as AchievementGroup;this.achievementPage=0;}}
    else if(action==='achievement-page:next'&&this.mode==='achievements')this.achievementPage++;
    else if(action==='achievement-page:previous'&&this.mode==='achievements')this.achievementPage--;
    else if(action.startsWith('track:')&&this.mode==='achievements')trackAchievement(this.save.achievements,action.slice(6));
    else if(action==='track-clear'&&this.mode==='achievements')this.save.achievements.tracked=null;
    else if(action==='achievements-back'&&this.mode==='achievements')this.mode=this.achievementReturn;
    else if(action==='opening-menu'&&this.mode==='menu')this.mode='opening';
    else if(action==='battle-plan-menu'&&this.mode==='menu')this.mode='battle-plan';
    else if(action==='battle-plan-back'&&this.mode==='battle-plan')this.mode='menu';
    else if(action.startsWith('battle-plan:')&&this.mode==='battle-plan'){
      const raw=action.slice(12),plan=Number(raw);if(raw===String(plan)&&isBattlePlan(plan))this.save.nextBattlePlan=plan;
    }
    else if(action==='opening-back'&&this.mode==='opening')this.mode='menu';
    else if(action.startsWith('opening:')&&this.mode==='opening'){const kind=action.slice(8);if(isOpeningWeapon(kind))this.save.openingWeapon=kind;}
    else if (action === 'armory') { this.dossierWeapon = 'pulse'; this.mode = 'armory'; }
    else if (action.startsWith('dossier:')) {
      const weapon = action.slice(8) as WeaponKind;
      if (dossierWeapons.includes(weapon)) this.dossierWeapon = weapon;
    }
    else if (action === 'armory-back') this.mode = 'menu';
    else if(action==='combos'&&this.mode==='loadout'){this.combosReturn='loadout';this.mode='combos';}
    else if(action==='combos-menu'&&this.mode==='menu'){this.combosReturn='menu';this.mode='combos';}
    else if(action==='combos-back')this.mode=this.combosReturn;
    else if(action.startsWith('recipe-goal:')&&this.mode==='combos'){
      const goal=parseRecipeGoal(action.slice(12));
      if(goal){this.save.recipeGoal=this.save.recipeGoal===goal?null:goal;this.pendingRecipeCompletion=null;this.goalWasReady=this.save.recipeGoal?recipeStatus(this.world,this.save.recipeGoal).ready:false;this.platform.write(this.save);}
    }
    else if(action==='contribution'&&(this.mode==='loadout'||this.mode==='result')){this.contributionReturn=this.mode;this.contributionPage=0;this.mode='contribution';}
    else if(action==='contribution-back'&&this.mode==='contribution')this.mode=this.contributionReturn;
    else if(action==='contribution-next'&&this.mode==='contribution')this.contributionPage++;
    else if(action==='contribution-previous'&&this.mode==='contribution')this.contributionPage--;
    else if(action==='rig-view'&&this.mode==='loadout')this.mode='rig';
    else if(action==='rig-back')this.mode='loadout';
    else if(action==='contracts-live'&&this.mode==='playing'){this.pause();this.contractReturn='paused';this.mode='contracts';}
    else if(action==='contracts'){this.contractReturn='loadout';this.mode='contracts';}
    else if(action.startsWith('contract-claim:')&&this.mode==='contract-reward'){
      const kind=action.slice(15) as WeaponKind|'energy';
      const before=captureEquipment(this.world);
      if(this.world.claimContractReward(kind)){
        // The reward has been collected: retire only its old call to action,
        // before processing new reward/research notices from this actual claim.
        if(this.notice==='契约完成 · 选择强化奖励'){this.notice='';this.noticeDetail='';this.noticeUntil=0;}
        const handled=this.recordEquipment(before);for(const e of this.world.drainEffects())this.effect(e,handled);if(this.world.build.available(this.world.buildPoints).length)this.mode='choice';else this.action('resume');
      }
    }
    else if(action.startsWith('boss-claim:')&&this.mode==='boss-reward'){
      const kind=action.slice(11) as WeaponKind|'research';
      const before=captureEquipment(this.world);
      if(this.world.claimBossReward(kind)){
        const handled=this.recordEquipment(before);for(const e of this.world.drainEffects())this.effect(e,handled);
        if(this.world.bossRewardRound!==null)this.mode='boss-reward';
        else if(this.world.contractReward)this.mode='contract-reward';
        else if(this.world.build.available(this.world.buildPoints).length)this.mode='choice';
        else this.action('resume');
      }
    }
    else if(action==='contracts-back')this.mode=this.contractReturn;
    else if(action==='hunt-next'&&this.mode==='contracts'&&this.world.contract?.round!==this.world.round){this.huntChoice=this.huntChoice==='staggered'?'crossfire':'staggered';}
    else if(action==='proof-next'&&this.mode==='contracts'){const options=this.world.availableProofs();if(options.length){const at=options.indexOf(this.proofChoice);this.proofChoice=options[((at<0?0:at)+1)%options.length];}}
    else if(action.startsWith('contract:')&&this.mode==='contracts'){const kind=action.slice(9) as ContractKind;if(kind in contracts){const options=this.world.availableProofs();this.world.acceptContract(kind,kind==='research'?(options.includes(this.proofChoice)?this.proofChoice:options[0]):undefined,kind==='hunter'?this.huntChoice:undefined);}}
    else if (action === 'tree' && (this.mode === 'choice' || this.mode === 'loadout')) { this.treeReturn = this.mode; this.mode = 'tree'; }
    else if (action === 'tree-back') this.mode = this.treeReturn;
    else if(action==='refit-plan'&&this.mode==='loadout')this.mode='refit-plan';
    else if(action==='refit-plan-back'&&this.mode==='refit-plan')this.mode='loadout';
    else if(action==='refit-auto'&&this.mode==='refit-plan')this.world.setRefitTarget();
    else if(action.startsWith('refit-focus:')&&this.mode==='refit-plan'){
      const kind=action.slice('refit-focus:'.length) as WeaponKind;
      if(dossierWeapons.includes(kind))this.world.setRefitTarget(kind);
    }
    else if (action === 'loadout') {this.loadoutReturn=this.mode==='result'?'result':'paused';this.mode = 'loadout';}
    else if (action === 'loadout-back') this.mode = this.loadoutReturn;
    else if (action === 'pause') this.pause();
    else if (action === 'preview') this.pausePreview = true;
    else if (action === 'pause-menu') this.pausePreview = false;
    else if (action === 'resume') { this.pausePreview = false; this.mode = 'playing'; this.accumulator = 0; this.lastTime = this.platform.now(); this.target = this.world.player.x; }
    else if (action === 'home') { this.shieldBreak=undefined;this.equipmentHud=undefined;this.mode = 'menu'; this.world = new World(); this.platform.silence(); this.notice = ''; this.particles = [];this.sparkPhase=0; this.blasts = []; this.impacts = []; this.arcs = []; this.empWaves=[]; this.destruction = undefined; this.crateDebris.clear(); this.enemyWreck.clear();this.bossFragments.clear(); this.gateFeedback.clear(); }
    else if (action === 'settings') { this.previousMode = this.mode === 'menu' ? 'menu' : 'paused'; this.mode = 'settings'; }
    else if (action === 'back') this.mode = this.previousMode;
    else if (action === 'licenses') this.platform.openLicenses?.();
    else if (action === 'effects') this.save.settings.effects = this.save.settings.effects === 'standard' ? 'weak' : 'standard';
    else if (action === 'shake') this.save.settings.shake = !this.save.settings.shake;
    else if (action === 'sound') { this.save.settings.sound = !this.save.settings.sound; this.platform.silence(); }
    else if (action === 'music') this.save.settings.music = !this.save.settings.music;
    if(action!=='start')this.platform.write(this.save);
    this.updateMusic();
  }
  private notify(text: string, y = 277, detail = '') { this.notice = text; this.noticeDetail=detail; this.noticeY = y; this.noticeUntil = this.platform.now() + 2200; }
  private checkRecipeGoal(){
    const goal=this.save.recipeGoal,status=goal?recipeStatus(this.world,goal):null;
    if(status?.ready&&!this.goalWasReady&&this.world.time>0)this.pendingRecipeCompletion=status.id;
    this.goalWasReady=status?.ready??false;
  }
  private checkAchievements() {
    const beforeCertifications=this.save.achievements.certifiedBuilds.length,beforeMagnetic=this.save.achievements.magneticCertifications.length;
    const fresh=awardAchievements(this.save.achievements,this.world.build.ranks,this.world.activeWeapons.length,this.world.fractureBursts,this.world.tacticalWins,this.world.conduitTacticalWins,this.world.proofWins,{aceWins:this.world.aceWins,flawlessAceWins:this.world.flawlessAceWins,certifiedBuilds:[...this.world.certifiedBuilds],interceptorBreaks:this.world.interceptorBreaks,minePreemptWins:this.world.minePreemptWins,mineCounterWins:this.world.mineCounterWins,lockPreemptWins:this.world.lockPreemptWins,lockBaitWins:this.world.lockBaitWins,mirrorDoubleHits:this.world.mirrorDoubleHits,magneticCertifications:[...this.world.magneticCertifications]});
    if(fresh.length){this.runAchievements.push(...fresh.map(a=>a.id));this.achievementToast=fresh.map(a=>a.name).join(' · ');this.achievementUntil=this.world.time+4;this.achievementShownAt=undefined;}
    if(fresh.length||beforeCertifications!==this.save.achievements.certifiedBuilds.length||beforeMagnetic!==this.save.achievements.magneticCertifications.length)this.platform.write(this.save);
  }
  private recordEquipment(before:ReturnType<typeof captureEquipment>){
    const changes=equipmentChanges(before,this.world);
    for(const change of changes){
      const a=change.before,b=change.after;
      this.equipmentHud={text:`收获 · ${weaponNames[change.kind]}${!a?' T'+b.stage:a.stage!==b.stage?' T'+a.stage+'→'+b.stage:' 精校+'+(b.calibration-a.calibration)}`,color:weaponColors[change.kind],until:this.world.time+3.2};
      const current=this.buildFeedback;
      if(current?.equipment?.kind===change.kind&&this.world.time<current.until){
        const equipment={...change,before:current.equipment.before};
        this.buildFeedback={...equipmentReceipt(equipment),equipment,until:this.world.time+3.2,combo:false};
      }else this.equipmentFeedback.push(change);
    }
    return changes.length>0;
  }
  private setBuildFeedback(feedback:NonNullable<CanvasRuntime['buildFeedback']>){
    const current=this.buildFeedback;
    if((current?.combo||current?.closingClear||current?.tactic)&&this.world.time<current.until){
      if(feedback.combo&&current.title.replace(/^目标成形 /,'组合完成 ')===feedback.title.replace(/^目标成形 /,'组合完成 ')){
        this.buildFeedback={...feedback,until:current.until,observedAt:current.observedAt,hidden:current.hidden};return;
      }
      const queued={...feedback,remaining:Math.max(.1,feedback.until-this.world.time)};
      const duplicate=this.pendingBuildFeedback.findIndex(f=>f.title===queued.title);
      if(duplicate>=0)this.pendingBuildFeedback[duplicate]=queued;else{
        if(this.pendingBuildFeedback.length>=2){const ordinary=this.pendingBuildFeedback.findIndex(f=>!f.combo&&!f.closingClear&&!f.tactic);this.pendingBuildFeedback.splice(ordinary<0?0:ordinary,1);}
        this.pendingBuildFeedback.push(queued);
      }
      return;
    }
    if(current?.equipment&&this.world.time<current.until)this.equipmentFeedback.interrupt(current.equipment,Math.max(.1,current.until-this.world.time));
    this.buildFeedback=feedback;
  }
  private effect(e: EffectEvent,equipmentHandled=false) {
    if(e.type==='overdrive-ready'){this.setBuildFeedback({title:e.text??'超载协议已装载',detail:e.detail??'',until:this.world.time+4,combo:true});return;}
    if(e.type==='overdrive-lance'&&e.targetX!==undefined&&e.targetY!==undefined){
      if(this.supportBeams.length>=16)this.supportBeams.shift();this.supportBeams.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.28,laser:false,overdrive:true});if(this.save.settings.sound)this.platform.sound('laser',3);return;
    }
    if(e.type==='overdrive-arc'&&e.targetX!==undefined&&e.targetY!==undefined){
      if(this.arcs.length>=12)this.arcs.shift();this.arcs.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.24,photon:true});if(this.save.settings.sound)this.platform.sound('refract',2);return;
    }
    if(e.type==='boss-salvage'){
      const weak=this.save.settings.effects==='weak';this.bossFragments.burst(e.x,e.y,e.bossVariant??0,weak);this.crateDebris.trim(9-this.bossFragments.pieces.length);this.enemyWreck.trim(9-this.crateDebris.pieces.length-this.bossFragments.pieces.length);
      if(this.blasts.length<4)this.blasts.push({x:e.x-50,y:e.y+10,size:65,life:.24,total:.24});
      this.notify(e.text??'首领破甲',1195,e.detail);if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;
    }
    if(e.type==='fracture-wave'){if(this.supportBeams.length>=16)this.supportBeams.shift();this.supportBeams.push({x:e.x,y:e.y,tx:e.targetX??e.x,ty:e.targetY??e.y,life:.24,laser:false,fractureWave:true});return;}
    if(e.type==='counter-fire'||e.type==='wing-fire'||e.type==='barrage-fire'||e.type==='weave-fire'){if(this.save.settings.sound)this.platform.sound('boss-volley',e.gain??1);return;}
    if(e.type==='boss-counter'){this.notify(e.text??'首领过热',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;}
    if(e.type==='round'){this.notify(e.text??'下一轮',1195,e.detail);if(this.save.settings.sound)this.platform.sound('round',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.type==='emp'){
      if(this.empWaves.length>=2)this.empWaves.shift();this.empWaves.push({x:e.x,y:e.y,radius:e.size??300,life:.5});
      this.notify(e.text??'中继击破',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;
    }
    if(e.type==='drop-wave'){this.notify(e.text??'突降机群',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;}
    if(e.type==='bounty-progress'){this.notify(e.text??'悬赏推进',1195,e.detail);if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.type==='mine-tactic'){this.checkAchievements();this.setBuildFeedback({title:e.text??'布雷战术',detail:e.detail??'',until:this.world.time+3,combo:false,tactic:true});if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.type==='closing-clear'){this.setBuildFeedback({title:e.text??'终线全歼',detail:e.detail??'',until:this.world.time+3,combo:false,closingClear:true});if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.escortReward){this.notify(e.text??'编队击破',1195,e.detail);if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}

    if(e.type==='formation'||e.type==='boss-reserve'){
      if(e.type==='boss-reserve')this.notify(e.text??'首领回援',1195,e.detail);
      if(this.save.settings.sound)this.platform.sound('alert',this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if(e.type==='shield-down'){
      this.shieldBreak={x:e.x,y:e.y+BOSS_VISUAL.offsetY,until:this.world.time+.45};
      if(this.save.settings.sound)this.platform.sound('shield-down',this.world.weaponStage(this.world.weaponKind));
      return;
    }

    if(e.type==='combination'){
      this.setBuildFeedback({title:e.text??'组合完成',detail:e.detail??'',until:this.world.time+4,combo:true});
      if(this.save.settings.sound)this.platform.sound('upgrade',this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if(e.type==='kill'||e.type==='boss-kill')this.save.achievements.kills++;
    if(e.type==='boss-kill')this.save.achievements.bosses++;
    if(['contract','formation-clear','fracture','kill','boss-kill','pickup','upgrade'].includes(e.type))this.checkAchievements();
    if(e.type==='ammo-fragment'){if(!this.blasts.some(b=>b.ammo&&Math.hypot(b.x-e.x,b.y-e.y)<72)&&this.blasts.length<4)this.blasts.push({x:e.x,y:e.y,size:70,life:.18,total:.18,ammo:true});return;}
    if(e.type==='ricochet'&&e.targetX!==undefined&&e.targetY!==undefined){
      if(this.supportBeams.length<16)this.supportBeams.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.2,laser:false,ricochet:true});
      return;
    }
    if(e.type==='scatter-pierce'&&this.supportBeams.length<16)this.supportBeams.push({x:e.x,y:e.y+25,tx:e.x,ty:e.y-35,life:.12,laser:false});
    if(e.type==='laser')this.opticalFiredAt=this.world.time;
    if(e.type==='mirror-laser'&&e.segments){
      if(this.supportBeams.length>=16)this.supportBeams.shift();
      this.supportBeams.push({x:e.x,y:e.y,tx:e.x,ty:e.y,life:MIRROR_LASER.life,laser:false,mirror:e.segments.map(s=>({...s})),bounced:e.bounced});return;
    }
    if ((e.type==='laser'||e.type==='refract') && e.targetX!==undefined && e.targetY!==undefined) {
      if(this.save.settings.sound)this.platform.sound(e.type,this.world.weaponStage(this.world.weaponKind));
      if(this.supportBeams.length<16)this.supportBeams.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:e.type==='laser' ? .32 : .12,laser:e.type==='laser',prism:e.prism,opticalBand:e.opticalBand});
      return;
    }
    if(e.type==='laser-impact'){
      const marker={x:e.targetX??e.x,y:e.targetY??e.y,kind:'pulse' as const,life:.22,opticalBand:e.opticalBand??1,prism:e.prism};
      const old=this.impacts.find(hit=>Math.hypot(hit.x-e.x,hit.y-e.y)<28);
      if(old)Object.assign(old,marker);else if(this.impacts.length<(this.save.settings.effects==='weak'?4:12))this.impacts.push(marker);
      else{const index=this.impacts.findIndex(hit=>!hit.opticalBand);if(index>=0)this.impacts[index]=marker;}
      return;
    }
    if(e.type==='laser-focus'){
      if(this.arcs.length>=12){const index=this.arcs.findIndex(a=>!a.photon);this.arcs.splice(index<0?0:index,1);}
      this.arcs.push({x:e.x,y:e.y,tx:e.x,ty:e.y,life:.32,photon:true,focus:true});
      if(this.save.settings.sound)this.platform.sound('refract',1);return;
    }
    if(e.type==='laser-arc'&&e.targetX!==undefined&&e.targetY!==undefined){
      if(this.arcs.length>=12){const index=this.arcs.findIndex(a=>!a.photon);this.arcs.splice(index<0?0:index,1);}
      this.arcs.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.24,photon:true});
      if(this.save.settings.sound)this.platform.sound('refract',1);return;
    }
    if(e.type==='capacitor-relay'&&e.targetX!==undefined&&e.targetY!==undefined){if(this.arcs.length<12)this.arcs.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.24,capacitorRelay:true});return;}
    if (this.save.settings.sound) this.platform.sound(e.type, this.world.weaponStage(e.weaponKind ?? this.world.weaponKind), e.weaponKind ?? this.world.weaponKind);
    if ((e.type === 'arc'||e.type==='magnetic-link') && e.targetX !== undefined && e.targetY !== undefined && this.arcs.length < 12) this.arcs.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.16,seeker:e.seeker});
    if (e.type === 'fire') { const kind=e.weaponKind??this.world.weaponKind;this.mountedMotion.get(kind)?.fire(kind,this.world.weaponStage(kind),this.world.time);if (!e.weaponKind || e.weaponKind === this.world.weaponKind) this.weaponMotion.fire(this.world.weaponKind, this.world.weaponStage(this.world.weaponKind), this.world.time); return; }
    if (e.type === 'weapon' || e.type === 'upgrade') {this.weaponGuideUntil = this.world.time + 5;this.weaponGuideKind=e.weaponKind??this.world.weaponKind;}
    if (e.type === 'upgrade' || e.type === 'overload' || e.type === 'weapon') this.upgradeUntil = this.world.time + .45;
    if (e.type === 'gate-taken') this.gateFeedback.claim(e.x, e.y, e.text ?? '已领取', e.size);
    if (e.text && !(equipmentHandled&&(e.type==='upgrade'||e.type==='pickup'&&e.text.startsWith('新增'))) && !e.type.startsWith('impact') && e.type !== 'gate-level' && e.type !== 'gate-taken' && e.type !== 'crate-break') {
      if(e.type==='upgrade')this.setBuildFeedback({title:e.text,detail:e.detail??'',until:this.world.time+4,combo:false});
      else this.notify(e.text,e.type==='victory'?820:277,e.detail);
    }
    // A coalesced pellet reuses its existing material response and legacy sparks.
    if(e.type==='impact'&&!admitWeaponImpact(this.impacts,e.x,e.y,e.weaponKind??this.world.weaponKind,this.save.settings.effects==='weak'))return;
    const explosion = ['mine-burst','ion-storm','scatter-burst', 'capacitor', 'fracture', 'blast', 'kill', 'crate-break', 'boss-kill', 'crash', 'death'].includes(e.type);
    if (e.type === 'crate-break') { this.crateDebris.burst(e.x, e.y);this.crateDebris.trim(9-this.bossFragments.pieces.length); this.enemyWreck.trim(9 - this.crateDebris.pieces.length-this.bossFragments.pieces.length); }
    if (e.type === 'kill' && isWreckKind(e.enemyKind)) this.enemyWreck.burst(e.x, e.y, Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length-this.bossFragments.pieces.length), e.enemyKind);
    if (e.type === 'boss-kill') {this.bossFragments.clear();this.destruction = new BossDestruction(e.x, e.y, e.bossVariant);}
    else if(explosion){
      // A combination gets a readable burst even when ordinary explosions fill the budget.
      if((e.type==='ion-storm'||e.type==='fracture'||e.type==='capacitor'||e.type==='scatter-burst')&&this.blasts.length>=4){const ordinary=this.blasts.findIndex(b=>!b.fracture&&!b.electric&&!b.ion);this.blasts.splice(ordinary<0?0:ordinary,1);}
      if(this.blasts.length<4)this.blasts.push({ion:e.type==='ion-storm',electric:e.type==='capacitor',fracture:e.type==='fracture',x:e.x,y:e.y,size:e.size??80,life:.45,total:.45});
    }
    if ((e.type === 'hurt' || e.type === 'boss-kill') && this.save.settings.shake) this.shakeUntil = this.platform.now() + 100;
    const cap = this.save.settings.effects === 'weak' ? 50 : 160;
    const amount = explosion ? (this.save.settings.effects === 'weak' ? 14 : 32) : e.type.startsWith('impact') ? 4 : 7;
    for (let i = 0; i < amount && this.particles.length < cap; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (explosion ? 130 : 75) + Math.random() * (explosion ? 330 : 180), life = 0.18 + Math.random() * 0.4;
      const hot=this.sparkPhase===0;this.sparkPhase=(this.sparkPhase+1)%4;
      this.particles.push({ hot,x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color: e.type==='bank-bounce'?'#ff9470':e.type==='drop-impact'?'#b6efff':(e.type==='capacitor'||e.type==='ion-storm')?(i%3===0?'#efffff':i%2?'#c5a9ff':'#80ffd1'):explosion ? (i % 4 === 0 ? '#99ddff' : i % 3 === 0 ? '#ffe2a0' : '#ffad42') : weaponColors[e.weaponKind ?? this.world.weaponKind] });
    }
  }
  private gateText(text:string,x:number,y:number,size:number,color:string,bold=false){
    const c=this.ctx;c.save();c.font=`${bold?'700 ':''}${size}px ${fonts}`;c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#020b13';c.lineWidth=Math.max(2,size*.09);c.lineJoin='round';c.strokeText(text,x,y);this.text(text,x,y,size,color,'center',bold);c.restore();
  }
  private text(text: string, x: number, y: number, size: number, color = '#ecf7ff', align: CanvasTextAlign = 'center', bold = false) {
    const c = this.ctx; c.fillStyle = color; c.font = `${bold ? '700 ' : ''}${size}px ${fonts}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(text, x, y);
  }
  private drawCombatCopy(title:string,detail:string,top:number,height:number,bottom:boolean,color:string){
    const key=JSON.stringify([title,detail,bottom]);
    if(this.copyCache?.key!==key){
      const measure=(text:string,size:number,bold:boolean)=>{
        this.ctx.font=`${bold?'700 ':''}${size}px ${fonts}`;
        // Conservative bound for headless canvas shims without font metrics.
        const width=this.ctx.measureText(text)?.width;
        return Number.isFinite(width)?width:Array.from(text).length*size;
      };
      this.copyCache={key,copy:combatCopy(title,detail,bottom,measure)};
    }
    const copy=this.copyCache.copy,two=copy.lines.length===2;
    const titleY=top+(!detail?height/2:two?(bottom?23:26):(bottom?28:32));
    this.text(title,360,titleY,copy.titleFont,color,'center',true);
    const offsets=two?(bottom?[52,75]:[61,85]):[bottom?63:76];
    const rows=[{text:title,size:copy.titleFont,y:titleY,width:copy.titleWidth}];
    copy.lines.forEach((line,i)=>{const y=top+offsets[i];this.text(line,360,y,copy.detailFont,'#f2d598');rows.push({text:line,size:copy.detailFont,y,width:copy.widths[i]});});
    this.presentedCopy={title,detail,lines:[...copy.lines],titleFont:copy.titleFont,detailFont:copy.detailFont,bounds:{left:58,right:662,top,bottom:top+height},rows};
  }
  private rect(x: number, y: number, width: number, height: number, color: string) { this.ctx.fillStyle = color; this.ctx.fillRect(x, y, width, height); }
  private frameSprite(key: string, frame: number, columns: number, x: number, y: number, width: number, height: number, rows = 2) {
    const img = this.images.get(key); if (!img) return;
    const sw = img.width / columns, sh = img.height / rows;
    this.ctx.drawImage(img, (frame % columns) * sw, Math.floor(frame / columns) * sh, sw, sh, x - width / 2, y - height / 2, width, height);
  }
  /** Reuse the actual sprite alpha: no rectangular flash or extra atlas. */
  private hitSprite(key: string, frame: number, columns: number, x: number, y: number, width: number, height: number, remaining: number, duration = 0.07, rows = 2) {
    if (remaining <= 0) return;
    const c = this.ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= Math.min(1, remaining / duration) * (this.save.settings.effects === 'weak' ? 0.18 : 0.48);
    this.frameSprite(key, frame, columns, x, y, width, height, rows);
    c.restore();
  }
  private playerSprite(frame: number, x: number, y: number, pose: PlayerPose, recoil: number) {
    const dedicated = this.world.weaponKind !== 'pulse';
    const key = this.world.weaponKind === 'arc' ? 'arc-player-v1.png' : this.world.weaponKind === 'blast' ? 'blast-player-v1.png' : this.world.weaponKind === 'scatter' ? 'scatter-player-v1.png' : this.world.weaponKind === 'pierce' ? 'pierce-player-v2.png' : 'units.png';
    const img = this.images.get(key); if (!img) return;
    const c = this.ctx, sw = img.width / (dedicated ? 3 : 4), sh = img.height / (dedicated ? 1 : 2);
    const width = 160, height = 213, left = x - width / 2, top = y - height / 2;
    // Original legs overlap the torso by 16 source pixels; torso is drawn last
    // to cover the seam while preserving the original perspective and alpha.
    for (let leg = 0; leg < 2; leg++) {
      c.drawImage(img, frame * sw + leg * sw / 2, sh * 0.625, sw / 2, sh * 0.375,
        left + leg * width / 2, top + height * 0.625 + (leg ? pose.right : pose.left), width / 2, height * 0.375);
    }
    c.drawImage(img, frame * sw, 0, sw, sh * 0.6875, left, top + pose.bob + recoil, width, height * 0.6875);
  }
  private drawMountedRig(y:number,pose:PlayerPose) {
    const w=this.world;
    for(const kind of w.activeWeapons){
      if(kind===w.weaponKind)continue;
      const mount=mountedRig[kind],stage=w.weaponStage(kind),band=calibrationVisualBand(w.weaponCalibration(kind));
      const motion=this.calibratedRecoil(kind,this.mountedMotion.get(kind)!)*.65;
      const size=mount.size*(1+(stage-1)*.07)*(1+band*.05);
      const c=this.ctx,px=w.player.x+Math.sign(mount.x)*25,py=y-24+pose.bob;
      const socket=mountedPose(w.player.x,mount,size),mx=socket.x,my=y+socket.y+pose.bob+motion;
      const tx=mx,ty=my+size*.22;
      c.save();c.lineCap='round';
      for(const [width,color] of [[10,'#101b25'],[5,'#9aaab4'],[1,'#e0e6df']] as const){
        c.lineWidth=width;c.strokeStyle=color;c.beginPath();c.moveTo(px,py);if(socket.fold>0&&mount.y>-60)c.lineTo(px,py-50);c.lineTo(tx,ty);c.stroke();
      }
      c.fillStyle='#d0d7d3';c.beginPath();c.arc(tx,ty,3,0,Math.PI*2);c.fill();c.restore();
      this.frameSprite('mounted-modules-v1.png',mount.frame,3,mx,my,size,size,2);
      calibrationMount(c,mx,my-size*.12,size*.75,kind,band,this.mountedMotion.get(kind)!.flash(kind,stage,w.time),this.save.settings.effects==='weak');
    }
  }
  private drawOpticalRig(y:number,pose:PlayerPose) {
    const w=this.world,support=w.supportProfile();if(!support.laserUnlocked)return;
    const band=laserVisualBand(w.growth.mastery,w.build.ranks.optical),pulse=Math.max(0,1-(w.time-this.opticalFiredAt)/.22),kick=pulse*(3+band),charge=w.laserCharge();const size=50+band*6;
    for(const side of support.prism?[-1,0,1]:[0]){
      const c=this.ctx,x=w.player.x+side*42;
      c.save();c.lineWidth=4;c.strokeStyle='#9aaab4';c.beginPath();c.moveTo(w.player.x,y-72+pose.bob);c.lineTo(x,y-82+pose.bob+kick);c.stroke();c.restore();
      this.frameSprite('mounted-modules-v1.png',5,3,w.player.x+side*42,y-100+pose.bob+kick,side===0?size:42,side===0?size:42,2);
      opticalChargeLight(this.ctx,x,y-100+pose.bob+kick-(side===0?size:42)*.25,charge,side===0?band:1,this.save.settings.effects==='weak',side!==0);
      opticalEmitterLight(this.ctx,x,y-100+pose.bob+kick-(side===0?size:42)*.25,pulse,side===0?band:1,this.save.settings.effects==='weak');
    }
    if(hasOptical(w.build,'mirror'))mirrorMount(this.ctx,w.player.x,y-100+pose.bob+kick,pulse);
    if(w.build.opticalFusion)dualLensMount(this.ctx,w.player.x,y-100+pose.bob+kick,[w.build.opticalBranch!,w.build.opticalFusion].map(k=>({burn:'#ffc187',relay:'#a3efff',mirror:'#c5bcff'})[k]),pulse);
  }
  private drawCalibrationRig(y:number,pose:PlayerPose,recoil:number){
    const w=this.world,kind=w.weaponKind,band=calibrationVisualBand(w.weaponCalibration(kind));calibrationMount(this.ctx,w.player.x,y-(w.profileFor(kind).muzzleY??78)+pose.bob+recoil,96*(1+band*.07),kind,band,this.weaponMotion.flash(kind,w.weaponStage(kind),w.time),this.save.settings.effects==='weak');
  }
  private calibratedRecoil(kind:WeaponKind,motion=this.weaponMotion){return motion.sample(kind,this.world.weaponStage(kind),this.world.time)*(1+calibrationVisualBand(this.world.weaponCalibration(kind))*.12);}
  private bar(x: number, y: number, width: number, ratio: number, color: string) {
    this.rect(x - width / 2 - 2, y - 2, width + 4, 12, '#07121b');
    this.rect(x - width / 2, y, width, 8, '#314852'); this.rect(x - width / 2, y, width * clamp(ratio, 0, 1), 8, color);
  }
  private button(label: string, y: number, action: string, primary = false) {
    const b = { x: 112, y, w: 496, h: 86, action, label }; this.buttons.push(b);
    this.rect(b.x, b.y, b.w, b.h, primary ? '#77d6f6' : '#1a2d3c');
    this.ctx.strokeStyle = primary ? '#a1e7ff' : '#47667a'; this.ctx.lineWidth = 1; this.ctx.strokeRect(b.x, b.y, b.w, b.h);
    this.text(label, 360, y + 43, 32, primary ? '#0a1823' : '#d8eaf5', 'center', true);
  }
  private render(dt: number) {
    this.renderFrame(dt);
    this.controlsMode = this.mode;
    try {
      this.platform.controls?.(this.buttons.map(button => ({...button})), {scale:this.scale,offsetX:this.offsetX,offsetY:this.offsetY});
    } catch { /* A browser accessibility adapter must never stop the game loop. */ }
  }
  private renderFrame(dt: number) {
    const c = this.ctx, p = this.platform, w = this.world;
    this.presentedNotice=null;this.presentedCopy=null;
    c.save(); c.fillStyle = '#0a1119'; c.fillRect(0, 0, p.width, p.height);
    c.translate(this.offsetX, this.offsetY); c.scale(this.scale, this.scale);
    c.beginPath(); c.rect(0, 0, 720, 1280); c.clip();
    this.buttons = [];
    if (this.mode === 'loading' || this.mode === 'error') {
      this.text(this.mode === 'error' ? this.error : '装载火力中…', 360, 570, 32);
      if (this.mode === 'error') this.button('重新加载', 700, 'reload', true);
      c.restore(); return;
    }
    if (this.mode === 'achievements') { this.drawAchievements(); c.restore(); return; }
    if(this.mode==='opening'){this.drawOpening();c.restore();return;}
    if(this.mode==='battle-plan'){this.drawBattlePlan();c.restore();return;}
    if (this.mode === 'armory') { this.drawArmory(); c.restore(); return; }
    if(this.mode==='contribution'){this.drawContribution();c.restore();return;}
    if (this.mode === 'rig') { this.drawRigView();c.restore();return; }
    if (this.mode === 'combos') {this.drawCombos();c.restore();return;}
    if(this.mode==='branch'){this.drawBuildBranch();c.restore();return;}
    if(this.mode==='overdrive'){this.drawOverdrive();c.restore();return;}
    if(this.mode==='contract-reward'){this.drawContractReward();c.restore();return;}
    if(this.mode==='boss-reward'){this.drawBossReward();c.restore();return;}
    if (this.mode === 'contracts') { this.drawContracts();c.restore();return; }
    if(this.mode==='refit-plan'){this.drawRefitPlan();c.restore();return;}
    if (this.mode === 'loadout') { this.drawLoadout(); c.restore(); return; }
    if (this.mode === 'tree') { this.drawBuildTree(); c.restore(); return; }
    const sector = this.mode === 'menu' ? 0 : sectorIndex(w.round);
    const ground = this.images.get(['runway.jpg', 'cooling-corridor-v2.jpg', 'armored-corridor-v1.jpg'][sector])!;
    const h = ground.height / ground.width * 720;
    const distance = this.mode === 'menu' ? this.visualTime * 12 : this.groundDistance;
    if (sector !== 0) {
      // Alternate reflection makes adjacent boundaries share the exact same edge.
      // Keep parity across the two-tile period, including modulo wraparound.
      const scroll = distance % (h * 2);
      for (let tile = -2; tile <= Math.ceil(1280 / h); tile++) {
        const y = scroll + tile * h;
        if (y >= 1280 || y + h <= 0) continue;
        c.save();
        if (tile % 2 !== 0) { c.translate(0, y + h); c.scale(1, -1); }
        else c.translate(0, y);
        c.drawImage(ground, 0, 0, 720, h);
        if(sector===1)coolingRotors(c,h,w.time,this.save.settings.effects==='weak');
        c.restore();
      }
    } else {
      const scroll = distance % h;
      c.drawImage(ground, 0, scroll - h, 720, h); c.drawImage(ground, 0, scroll, 720, h);
    }
    this.rect(0, 0, 720, 1280, '#07111b25');
    c.save();
    if (this.platform.now() < this.shakeUntil) c.translate(Math.sin(this.platform.now()) * 3, Math.cos(this.platform.now()) * 3);
    this.drawWorld(dt);
    c.restore();
    if(this.mode==='playing'&&this.pendingRecipeCompletion&&this.save.recipeGoal===this.pendingRecipeCompletion){
      const completed=recipeStatus(w,this.pendingRecipeCompletion);
      if(completed.ready)this.setBuildFeedback({title:`目标成形 · ${completed.name}`,detail:completed.effect,until:w.time+4,combo:true});
      this.pendingRecipeCompletion=null;
    }
    let f=this.buildFeedback;
    if(f&&this.mode==='playing'){
      // Only time actually spent displaying the receipt consumes its reading window.
      if(f.hidden&&f.observedAt!==undefined)f.until+=Math.max(0,w.time-f.observedAt);
      f.observedAt=w.time;
    }
    if(this.mode==='playing'&&(!f||w.time>=f.until)&&this.pendingBuildFeedback.length){
      const {remaining,...queued}=this.pendingBuildFeedback.shift()!;f={...queued,until:w.time+remaining,observedAt:w.time};this.buildFeedback=f;
    }
    if(this.mode==='playing'&&(!f||w.time>=f.until)){
      const equipment=this.equipmentFeedback.take();
      if(equipment){f={...equipmentReceipt(equipment),equipment,until:w.time+equipment.remaining,combo:false,observedAt:w.time};this.buildFeedback=f;}
    }
    const receiptPosition=f?this.buildReceiptLocation():null;
    if(f)f.hidden=w.time<f.until&&receiptPosition===null;
    const activeBuild=this.mode==='playing'&&this.buildFeedback&&w.time<this.buildFeedback.until&&receiptPosition!==null;
    const noticePlacement=this.noticePlacement();
    const noticeVisible=noticePlacement!==null&&!activeBuild;
    const bottomNotice=noticePlacement?.y===1208;
    const bottomBusy=(activeBuild&&receiptPosition!==240)||(noticeVisible&&bottomNotice);
    const badgeBlocked=!combatPanelClear(w,{left:40,right:680,top:1150,bottom:1256});
    // Preserve a newly earned achievement until the preceding combat receipt can be read.
    if(bottomBusy&&w.time<this.achievementUntil)this.achievementUntil=Math.max(this.achievementUntil,
      activeBuild?this.buildFeedback!.until+3:w.time+(this.noticeUntil-this.platform.now())/1000+3);
    if(this.mode==='playing'&&badgeBlocked&&w.time<this.achievementUntil)
      this.achievementUntil=Math.max(this.achievementUntil,w.time+3);
    if (this.mode === 'menu') this.drawMenu();
    else {
      this.drawHud();
      if(noticeVisible&&noticePlacement){
        const {y,top,bottom}=noticePlacement;
        this.presentedNotice={text:this.notice,detail:this.noticeDetail,y,top,bottom};
        this.rect(58,top,604,bottom-top,'#0a1c2af0');
        this.drawCombatCopy(this.notice,this.noticeDetail,top,bottom-top,bottomNotice,'#d2f2ff');
      }
    }
    if(activeBuild&&receiptPosition!==null){
      const f=this.buildFeedback!,top=receiptPosition,bottom=top===1180,height=bottom?88:104;
      this.rect(58,top,604,height,'#0a1c2af0');this.rect(58,top,5,height,f.equipment?weaponColors[f.equipment.kind]:(f.closingClear||f.tactic)?'#ffd67d':f.combo?'#d3a3ff':'#7fe4ff');
      this.drawCombatCopy(f.title,f.detail,top,height,bottom,f.equipment?weaponColors[f.equipment.kind]:(f.closingClear||f.tactic)?'#ffe3a0':f.combo?'#e1bfff':'#d2f2ff');
    }
    if(this.mode==='choice')this.drawBuildChoices();
    const contract=w.contract;
    if(this.mode==='playing'&&contract?.status==='active'){
      const y=w.bodies.some(b=>b.active&&b.kind==='boss')?1130:this.hudTop+164;
      const progress=contract.kind==='research'&&contract.proof?`${buildProofs[contract.proof.kind].name} ${Math.min(contract.proofProgress,buildProofs[contract.proof.kind].goal)}/${buildProofs[contract.proof.kind].goal}${requiredProofGroups(contract.proof.kind)?' · 批次'+Math.min(contract.proofGroupCount,requiredProofGroups(contract.proof.kind))+'/'+requiredProofGroups(contract.proof.kind):''}`:contract.kind==='hunter'?`${contract.targetKills}/2精英`:`${Math.min(15,w.kills-contract.startKills)}/15敌`;
      this.rect(40,y,640,44,'#102330');this.text(`${contracts[contract.kind].name} · ${Math.max(0,Math.ceil(30-contract.elapsed))}秒 · ${progress}`,360,y+22,24,'#ffdc8a');
    }
    if(this.mode==='playing' && w.time<this.achievementUntil&&!bottomBusy&&!badgeBlocked){this.achievementShownAt??=w.time;achievementBadge(c,this.achievementToast,w.time-this.achievementShownAt,this.save.settings.effects==='weak');}
    if (this.mode === 'paused' || this.mode === 'settings' || this.mode === 'result') this.drawDialog();
    c.restore();
  }
  private drawWorld(dt: number) {
    const c = this.ctx, w = this.world;
    for(const beam of this.supportBeams)beam.life-=dt;
    this.supportBeams=this.supportBeams.filter(beam=>beam.life>0);
    this.gateFeedback.sync(w.bodies, w.time);
    const hasReceipt=this.buildFeedback&&w.time<this.buildFeedback.until&&this.buildReceiptLocation()!==null;
    const noticeBlocking=!hasReceipt?this.noticePlacement()??undefined:undefined;
    this.gateFeedback.advance(this.mode==='playing'?dt:0,r=>this.mode==='playing'&&gateReceiptReadable(r,w.bodies,w.bullets,noticeBlocking));
    this.drawGuide();
    this.drawDestruction(dt);
    this.enemyWreck.trim(Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length-this.bossFragments.pieces.length));
    this.enemyWreck.advance(dt);
    for (const piece of this.enemyWreck.pieces) {
      const wreckImage = this.images.get(piece.kind==='conduit'?'conduit-v1.png':`${piece.kind}-wreck-v1.png`);
      if (!wreckImage) continue;
      c.save(); c.translate(piece.x, piece.y); c.rotate(piece.angle);
      c.globalAlpha = Math.min(1, (piece.life - piece.age) / .22) * (this.save.settings.effects === 'weak' ? .5 : .85);
      c.drawImage(wreckImage, piece.from * wreckImage.width, 0, piece.width * wreckImage.width, wreckImage.height,
        -piece.width * piece.w / 2, -piece.h / 2, piece.width * piece.w, piece.h); c.restore();
    }
    this.crateDebris.advance(dt);
    for (const piece of this.crateDebris.pieces) {
      c.save(); c.translate(piece.x, piece.y); c.rotate(piece.angle);
      c.globalAlpha = Math.min(1, (piece.life - piece.age) / 0.3) * (this.save.settings.effects === 'weak' ? 0.55 : 0.9);
      this.frameSprite('crate-v1.png', piece.frame, 3, 0, 0, piece.size, piece.size, 3); c.restore();
    }
    this.bossFragments.advance(dt);
    // Physical reward frames sit below enemy art; the number panel is later.
    ionEvolutionLight(c,w.ionOrbs,w.ionSpears,this.save.settings.effects==='weak');
    for(const field of w.magneticFields)magneticLight(c,field,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.kind==='gate'){
      const value=previewReward(w.growth,gateValue(b.energy,b.rewardKind),b.rewardKind),image=this.images.get('gate-frame-v1.png');
      if(image)gateMachine(c,image,b,!!b.calibrationTarget||value.power>0&&value.energy>0,this.gateFeedback.pulse(b.id,w.time),this.save.settings.effects==='weak',pairedGate(b,w.bodies));
    }
    for (const b of w.bodies) {
      if(b.kind==='gate')continue;
      c.fillStyle = '#0005'; c.beginPath(); c.ellipse(b.x + 5, b.y + b.height * 0.3, b.width * 0.45, b.height * 0.2, 0, 0, Math.PI * 2); c.fill();
      if (b.kind === 'crate') {
        const frame = crateFrame(b.hp, b.maxHp);
        if(b.pattern==='drift-supply')driftCarrier(c,b.x,b.y,b.age,this.save.settings.effects==='weak');
        this.frameSprite('crate-v1.png', frame, 3, b.x, b.y, 148, 154, 3);
        this.hitSprite('crate-v1.png', frame, 3, b.x, b.y, 148, 154, b.hit, 0.07, 3);
      }
      else if (b.kind === 'pickup') continue;
      else {
        const y = b.y + (b.kind === 'boss' ? BOSS_VISUAL.offsetY : 0);
        const width = b.kind === 'boss' ? BOSS_VISUAL.width : b.width * 1.4;
        const height = b.kind === 'boss' ? BOSS_VISUAL.height : b.height * 1.55;
        if (b.kind === 'drone') {
          const frame = droneFrame(b.age), side = b.width * 1.65;
          const direction=sweeperDirection(b),bank=direction*Math.min(1,b.age/.12,Math.abs(b.lane-b.x)/36);
          c.save();c.translate(b.x,y);c.rotate(-bank*.14);sweeperLight(c,direction,b.age,this.save.settings.effects==='weak');
          this.frameSprite('drone-v1.png', frame, 3, 0, 0, side, side, 1);
          this.hitSprite('drone-v1.png', frame, 3, 0, 0, side, side, b.hit, 0.07, 1);c.restore();
        } else if (b.kind === 'charger') {
          const frame = chargerFrame(b), side = b.height * 1.35;
          const local=b.pattern==='rebound';c.save();if(local){c.translate(b.x,y);c.rotate(reboundState(b).direction*.14);}
          this.frameSprite('charger-v1.png', frame, 3, local?0:b.x, local?0:y, side, side, 1);
          this.hitSprite('charger-v1.png', frame, 3, local?0:b.x, local?0:y, side, side, b.hit, 0.07, 1);c.restore();
        } else if (b.kind === 'armor'&&b.pattern==='minelayer') {
          const frame=b.mineFiredAt!==undefined&&b.age-b.mineFiredAt<.22?2:b.warning>0?1:0;
          this.frameSprite('minelayer-v1.png',frame,3,b.x,y,b.width*1.3,b.height*1.3,2);
          this.hitSprite('minelayer-v1.png',frame,3,b.x,y,b.width*1.3,b.height*1.3,b.hit,.07,2);minelayerFlash(c,b,this.save.settings.effects==='weak');
        } else if (b.kind === 'armor') {
          const braced=heavyEscortHolding(b)||batteryHolding(b)||fireControlHolding(b)||(b.pattern==='bankshot'&&b.age<BANKSHOT.hold),frame = armorFrame(b,braced), width = b.width * 1.45, height = b.height * 1.38,direction=sweeperDirection(b);
          c.save();c.translate(b.x,y);c.rotate(-direction*.08);sweeperLight(c,direction,b.age,this.save.settings.effects==='weak',width*.4);
          if(b.controlPatrol)controlPatrolDrive(c,b.age,this.save.settings.effects==='weak',(b.controlHomeX??b.x)<360?-1:1);
          if(braced&&!b.controlPatrol)batteryMount(c,b.warning,(b.empRemaining??0)>0,this.save.settings.effects==='weak');
          if(b.pattern==='fire-control')controlReceiver(c,b.age,!!fireControlSource(b,w.bodies),(b.empRemaining??0)>0,this.save.settings.effects==='weak');
          this.frameSprite('armor-v1.png', frame, 3, 0, 0, width, height, 1);
          this.hitSprite('armor-v1.png', frame, 3, 0, 0, width, height, b.hit, 0.07, 1);if(b.pattern==='bankshot')bankshotMount(c,b,this.save.settings.effects==='weak');if(b.pattern==='rake')rakeMount(c,b,this.save.settings.effects==='weak');if(b.pattern==='booster')boosterMount(c,b,this.save.settings.effects==='weak');controlShutter(c,b);c.restore();
        } else if(b.kind==='conduit'){
          const bob=Math.sin(b.age*3)*2;
          if(b.pattern==='fire-control'){c.save();c.translate(b.x,y+bob);controlTransmitter(c,b.age,w.bodies.filter(g=>fireControlSource(g,w.bodies)?.id===b.id).length,this.save.settings.effects==='weak');c.restore();}
          this.frameSprite('conduit-v1.png',0,1,b.x,y+bob,150,165,1);this.hitSprite('conduit-v1.png',0,1,b.x,y+bob,150,165,b.hit,.07,1);
          c.save();c.globalAlpha=.35+.3*Math.sin(b.age*6)**2;c.fillStyle='#ffd889';for(const side of [-1,1])c.fillRect(b.x+side*24-2,y-35+bob,4,6);c.restore();
        } else if (b.kind === 'guard') {
          const frame = b.burst > 0 || (b.empRemaining??0)>0 ? 1 : 0;
          this.frameSprite('guard-v1.png', frame, 3, b.x, y, 160, 160, 1);
          this.hitSprite('guard-v1.png', frame, 3, b.x, y, 160, 160, b.hit, 0.07, 1);
          if(b.shieldTurn!==undefined){c.save();c.translate(b.x,y);shieldLatch(c,b);c.restore();}
        } else if (b.kind === 'sniper') {
          const frame = b.warning > 0 ? 1 : 0;
          const direction=sentryDirection(b);c.save();c.translate(b.x,y);c.rotate(direction*.07);
          sentryThrust(c,direction,b.age,this.save.settings.effects==='weak');
          this.frameSprite('sniper-v1.png', frame, 3, 0, 0, 140, 140, 1);
          this.hitSprite('sniper-v1.png', frame, 3, 0, 0, 140, 140, b.hit, 0.07, 1);c.restore();
          if(b.pattern==='lockshot')lockshotMount(c,b,this.save.settings.effects==='weak');
        } else if (b.kind === 'elite') {
          const frame = b.pattern==='intercept'?interceptorArtFrame(b):eliteFrame(b),eliteArt=b.pattern==='intercept'?INTERCEPTOR_ART:'elite-v1.png', width = b.width * 1.68, height = b.height * 1.36,direction=sweeperDirection(b);
          c.save();c.translate(b.x,y);c.rotate(-direction*.08);sweeperLight(c,direction,b.age,this.save.settings.effects==='weak',width*.4);
          this.frameSprite(eliteArt, frame, 3, 0, 0, width, height, 1);
          this.hitSprite(eliteArt, frame, 3, 0, 0, width, height, b.hit, 0.07, 1);aceRig(c,b,this.save.settings.effects==='weak');c.restore();
        } else {
          const frame = bossFrame(b), bossArt = b.bossVariant === 2 ? 'boss-bastion-v1.png' : b.bossVariant === 1 ? 'boss-flanker-v1.png' : 'boss-v1.png';
          this.frameSprite(bossArt, frame, 3, b.x, y, width, height, 1);
          this.hitSprite(bossArt, frame, 3, b.x, y, width, height, b.hit*.5, 0.07, 1);
          bossHullWear(c,b,this.save.settings.effects==='weak');
          if(b.counterfire)bossHeatLight(c,b,this.save.settings.effects==='weak');
          bossWeaveRig(c,b,this.save.settings.effects==='weak');
          wingShearRig(c,b,this.save.settings.effects==='weak');
          bastionBarrageRig(c,b,this.save.settings.effects==='weak');
        }
      }
    }
    this.bossFragments.draw(c,key=>this.images.get(key),this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&b.proofTarget&&w.contract?.kind==='research'&&w.contract.status==='active')this.text(b.proofGroup?`验证·第${b.proofGroup}批`:'验证目标',b.x,b.y-b.height/2-24,20,'#a9f4d7');
    for(const b of w.bodies)if(b.active&&(b.dropGrace??0)>0)dropLight(c,b.x,b.y,(b.dropGrace??0)/SWARM.grace,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&(b.empRemaining??0)>0)offlineLight(c,b.x,b.y,b.width,b.empRemaining??0);
    const protectedBoss=w.bodies.find(b=>b.active&&b.kind==='boss');
    if(protectedBoss&&w.bossShieldActive())formationShield(c,protectedBoss.x,protectedBoss.y+BOSS_VISUAL.offsetY,w.time,0,this.save.settings.effects==='weak');
    if(this.shieldBreak&&w.time<this.shieldBreak.until)formationShield(c,this.shieldBreak.x,this.shieldBreak.y,w.time,1-(this.shieldBreak.until-w.time)/.45,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&b.bountyRound===w.contract?.round&&w.contract?.kind==='hunter'&&w.contract.status==='active'){
      c.save();c.strokeStyle='#ffd884';c.lineWidth=3;c.globalAlpha=.7+.2*Math.sin(w.time*7);
      for(const side of [-1,1]){const x=b.x+side*b.width*.65;c.beginPath();c.moveTo(x-side*14,b.y-24);c.lineTo(x,b.y-14);c.lineTo(x,b.y+14);c.lineTo(x-side*14,b.y+24);c.stroke();}c.restore();
    }
    for(const b of w.bodies)if(b.active&&b.stormHits)stormMarks(c,b.x,b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0),b.width,b.stormHits);
    for(const b of w.bodies)if(b.active&&b.capacitorHits)capacitorMarks(c,b.x,b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0),b.width,b.capacitorHits,w.time);
    for(const b of w.bodies)if(b.active&&b.burnTicks)burnLight(c,b.x,b.y,b.width,b.height,w.time,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&b.fractureHits)fractureMarks(c,b.x,b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0),b.width,b.fractureHits,w.fractureProfile().hits);
    for (const b of w.bullets.filter(b => !b.hostile)) {
      energyShot(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? 'pulse', w.time, this.save.settings.effects === 'weak');
    }
    for(const beam of this.supportBeams) if(this.mode!=='menu'){if(beam.overdrive)overdriveLance(c,beam.x,beam.y,beam.tx,beam.ty,beam.life,this.save.settings.effects==='weak');else if(beam.mirror)mirrorLight(c,beam.mirror,beam.life,!!beam.bounced,this.save.settings.effects==='weak');else if(beam.fractureWave)fractureWaveLight(c,beam.x,beam.y,beam.tx,beam.ty,beam.life,this.save.settings.effects==='weak');else if(beam.ricochet)ricochetLight(c,beam.x,beam.y,beam.tx,beam.ty,beam.life,this.save.settings.effects==='weak');else supportLight(c,beam.x,beam.y,beam.tx,beam.ty,beam.life,beam.laser,this.save.settings.effects==='weak',beam.prism,beam.opticalBand);}
    for(const b of w.bullets) if(!b.hostile){
      calibrationShot(c,b.x,b.y,b.vx,b.vy,b.weaponKind??'pulse',b.calibrationBand??0,b.age,this.save.settings.effects==='weak');
      projectileBody(c,b.x,b.y,b.vx,b.vy,b.weaponKind??'pulse');
    }
    const playerY = this.mode === 'menu' ? 570 : C.playerY;
    if ((this.mode === 'playing' || this.mode === 'paused') && w.player.hp > 0)
      overloadWake(c, w.player.x, playerY, w.time, w.growth.overload, this.save.settings.effects === 'weak');
    c.fillStyle = '#0005'; c.beginPath(); c.ellipse(this.mode==='menu'?365:w.player.x+5, playerY + 32, 53, 30, 0, 0, Math.PI * 2); c.fill();
    c.save();
    if (w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0) c.globalAlpha = 0.65;
    const recoil = this.calibratedRecoil(w.weaponKind);
    const pose = this.playerMotion.sample(w.player.x, w.time);
    if (w.player.hp > 0||this.mode==='menu') {
      if (this.mode === 'menu') this.frameSprite(weaponDossier[this.save.openingWeapon].asset,1,3,360,playerY,110,147,1);
      else {
        this.drawMountedRig(playerY,pose);
        this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, playerY, pose, recoil);
        this.drawCalibrationRig(playerY,pose,recoil);
        if(w.build.ammoFusion&&w.build.ballisticBranch)ammoRack(c,mountedCenter(w.player.x,51,64),playerY+23+pose.bob,w.build.ballisticBranch,w.build.ammoFusion,Math.max(...[...this.mountedMotion].map(([k,m])=>m.flash(k,w.weaponStage(k),w.time))));
        this.drawOpticalRig(playerY,pose);
        const remaining = w.player.invulnerable - (C.invulnerability - 0.12);
        if (remaining > 0) {
          c.save(); c.globalCompositeOperation = 'lighter';
          c.globalAlpha *= Math.min(1, remaining / 0.12) * (this.save.settings.effects === 'weak' ? 0.18 : 0.48);
          this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, playerY, pose, recoil); c.restore();
        }
      }
    }
    c.restore();
    if(w.build.ranks.electric>=3&&(this.mode==='playing'||this.mode==='paused'))ionChargeLight(c,w.player.x,C.playerY-117,w.ionCharge,w.build.ionAugment);
    if(w.laserChainUnlocked()&&w.laserChainReady&&(this.mode==='playing'||this.mode==='paused')){c.save();c.strokeStyle='#a7e7ff';c.lineWidth=2;c.beginPath();c.moveTo(w.player.x,C.playerY-157);c.lineTo(w.player.x+7,C.playerY-148);c.lineTo(w.player.x,C.playerY-139);c.lineTo(w.player.x-7,C.playerY-148);c.closePath();c.stroke();c.restore();}
    const flash = this.weaponMotion.flash(w.weaponKind, w.weaponStage(w.weaponKind), w.time);
    if ((this.mode === 'playing' || this.mode === 'paused') && w.player.hp > 0) {
      const discharge = this.weaponMotion.discharge(w.weaponKind, w.weaponStage(w.weaponKind), w.time);
      if (discharge > 0) coilDischarge(c, w.player.x, C.playerY - (weaponProfile(w.weaponKind, w.weaponStage(w.weaponKind)).muzzleY ?? 78) + pose.bob + recoil,
        discharge, w.weaponStage(w.weaponKind), this.save.settings.effects === 'weak');
    }
    if ((this.mode === 'playing' || this.mode === 'paused') && w.player.hp > 0 && flash > 0) {
      const weapon = weaponProfile(w.weaponKind, w.weaponStage(w.weaponKind));
      for (const offset of weapon.offsets) {
        const x = w.player.x + offset, y = C.playerY - (weapon.muzzleY ?? 78) + pose.bob + recoil;
        muzzleLight(c, x, y, w.weaponKind, flash, this.save.settings.effects === 'weak');
      }
    }
    if (this.mode === 'playing' && w.time < this.upgradeUntil) {
      const remaining = (this.upgradeUntil - w.time) / .45;
      c.save(); c.globalAlpha = remaining * 0.8; c.strokeStyle = '#80e4ff'; c.lineWidth = 3;
      c.beginPath(); c.arc(w.player.x, C.playerY, 48 + (1 - remaining) * 100, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    for (const e of this.blasts) {
      e.life -= dt; const age = 1 - e.life / e.total;
      if(e.reactor){c.save();c.globalAlpha=(this.save.settings.effects==='weak'?.55:.9)*Math.max(0,Math.min(1,(1-age)/.2));
        this.frameSprite('boss-reactor-v1.png',Math.min(5,Math.floor(age*6)),3,e.x,e.y,e.size*2,e.size*2,2);c.restore();continue;}
      if(e.ammo){ammoFragmentLight(c,e.x,e.y,age,this.save.settings.effects==='weak');continue;}
      if(e.ion){ionStormLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');continue;}
      if(e.electric){capacitorLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');continue;}
      c.save(); c.globalAlpha = detonationSpriteAlpha(age,this.save.settings.effects==='weak');
      this.frameSprite('explosion-v1.png', Math.min(8, Math.floor(age * 9)), 3, e.x, e.y, e.size * 2, e.size * 2, 3); c.restore();
      detonationLight(c, e.x, e.y, e.size, age, this.save.settings.effects === 'weak');
      if(e.fracture)fractureLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');
    }
    this.blasts = this.blasts.filter(e => e.life > 0);
    // Embers sit behind settled hit materials so additive sparks cannot bleach steel faces.
    for (const s of this.particles) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 70 * dt;
      sparkLight(c, s.x, s.y, s.vx, s.vy, s.color, s.life / s.total, this.save.settings.effects === 'weak',s.hot!==false);
    }
    this.particles = this.particles.filter(s => s.life > 0);
    for(const e of this.empWaves){e.life-=dt;empWave(c,e.x,e.y,e.radius,1-e.life/.5,this.save.settings.effects==='weak');}
    this.empWaves=this.empWaves.filter(e=>e.life>0);
    for (const arc of this.arcs) { arc.life -= dt;if(arc.capacitorRelay)capacitorRelay(c,arc.x,arc.y,arc.tx,arc.ty,arc.life,this.save.settings.effects==='weak');else if(arc.focus)focusDischarge(c,arc.x,arc.y,arc.life,this.save.settings.effects==='weak');else chainArc(c,arc.x,arc.y,arc.tx,arc.ty,arc.life,this.save.settings.effects === 'weak',arc.photon,arc.seeker); }
    this.arcs = this.arcs.filter(arc=>arc.life>0);
    trimImpactBudget(this.impacts,this.save.settings.effects==='weak');
    for (const hit of this.impacts) { hit.life -= dt;if(hit.opticalBand)opticalImpactLight(c,hit.x,hit.y,hit.life,hit.opticalBand,this.save.settings.effects==='weak',hit.prism);else impactLight(c, hit.x, hit.y, hit.kind, 1 - hit.life / (hit.total??0.14), this.save.settings.effects === 'weak'); }
    this.impacts = this.impacts.filter(hit => hit.life > 0);

    for (const receipt of this.gateFeedback.receipts) {
      if(!receipt.visible)continue;
      const {y,height}=gateReceiptBounds(receipt);
      c.save(); c.globalAlpha = Math.min(1, (GATE_RECEIPT.reading - receipt.age) / GATE_RECEIPT.fade);
      this.rect(receipt.x - receipt.width / 2 + 8, y - height / 2, receipt.width - 16, height, '#102d3bf0');
      this.text('穿门已领取', receipt.x, y - height / 2 + 20, 28, '#b1e8f7');
      receipt.lines.forEach((line, i) => this.text(line, receipt.x, y - height / 2 + 52 + i * 32, 30, '#effaff', 'center', true));
      c.restore();
    }
    // Breaking is not collecting: keep the physical module visible above smoke.
    for (const b of w.bodies) if (b.kind === 'pickup') {
      pickupBeacon(c,b,w.time,this.save.settings.effects==='weak');
      c.save();if(!pickupSignal(b)?.collectible)c.globalAlpha=.3;
      this.frameSprite('props.png', 2, 3, b.x, b.y, 65, 65);c.restore();
    }
    for (const b of w.bodies) {
      if(b.pattern==='rebound')reboundLight(c,b,this.save.settings.effects==='weak');
      if(b.pattern==='intercept')interceptorLight(c,b,this.save.settings.effects==='weak');
      if (b.warning > 0 && b.pattern!=='lockshot' && b.pattern!=='intercept' && b.pattern!=='rake' && b.pattern!=='booster' && !(b.kind==='boss'&&(b.attack===4||b.bossVariant===1&&b.attack===2||b.bossVariant===2&&b.attack===3))) {
        // The enemy telegraphs its action locally; never preview future bullet paths.
        const charge = .65 + Math.sin(w.time * 22) * .2;
        const muzzleY = b.y + b.height * .32;
        c.save(); c.globalAlpha = charge; c.strokeStyle = '#ffbc76'; c.lineWidth = 2;
        c.beginPath(); c.arc(b.x, muzzleY, b.kind === 'boss' ? 22 : 10, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#ffe4aa'; c.beginPath(); c.arc(b.x, muzzleY, 3, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      if (b.kind === 'crate') {
        if (b.weaponKind) {
          const choice = b.openingSupply?'预定':w.activeWeapons.includes(b.weaponKind) ? '强化' : '叠加';
          const role = b.weaponKind === 'pulse' ? '高速集中火力' : b.weaponKind === 'scatter' ? '近距聚弹 · 扇面覆盖' : b.weaponKind === 'blast' ? '命中敌人 · 范围爆破' : b.weaponKind === 'arc' ? '前方索敌 · 命中跳电' : `贯穿${weaponProfile('pierce', b.stage).targets}个敌人`;
          // Enter below the crate until the full panel fits beneath the HUD.
          const panelY = b.y - 158 >= this.hudTop + 172 ? b.y - 158 : Math.max(this.hudTop + 172, b.y + 70);
          const goalSupply=recipeSupplyMatch(w,this.save.recipeGoal,b);
          this.rect(b.x - 118, panelY, 236, 100, '#0b1723ef');
          this.text(b.refit?`${b.directedRefit?'定向':''}${w.weaponStage(b.weaponKind)>=3?'精校':'改装'} ${weaponNames[b.weaponKind]}`:`${choice} ${weaponNames[b.weaponKind]} T${b.stage}`, b.x-(goalSupply?18:0), panelY + 23, goalSupply?23:25, weaponColors[b.weaponKind], 'center', true);
          if(goalSupply){c.strokeStyle='#ffe19a';c.lineWidth=2;c.strokeRect(b.x-118,panelY,236,100);this.text('目标',b.x+108,panelY+23,18,'#ffe19a','right',true);}
          const combination=supplyCombinationLabel(supplyCombinations(w,b,this.save.recipeGoal));
          this.text(combination??(b.refit?refitLabel(w,b.weaponKind):role), b.x, panelY + 51, combination?21:b.refit?21:24, combination?'#ffe2a1':'#cfdee9');
          this.text(b.pattern==='drift-supply'?`${(b.dropGrace??0)>0?'护盖':b.age<DRIFT_SUPPLY.settle?'滑行':'停稳'} · 碎后拾取 ${Math.ceil(b.hp)}`:`打碎再拾取 · ${Math.ceil(b.hp)}`, b.x, panelY + 78, b.pattern==='drift-supply'?21:23, '#fff0c8');
          this.bar(b.x, b.y - 52, 102, b.hp / b.maxHp, '#e5b96a');
        } else {
          this.rect(b.x - 105, b.y - 110, 210, 40, '#0b1723df');
          this.text(`T${b.stage} ${w.weaponStage(w.weaponKind) >= b.stage ? '充能+30' : '装备'} · ${Math.ceil(b.hp)}`, b.x, b.y - 90, 28, '#fff0c8', 'center', true);
          this.bar(b.x, b.y - 64, 102, b.hp / b.maxHp, '#e5b96a');
        }
      } else if (b.kind === 'pickup') {
        const signal=pickupSignal(b);if(!signal?.collectible)continue;
        const target=recipeSupplyMatch(w,this.save.recipeGoal,b),width=target?264:232,x=clamp(b.x,width/2+12,720-width/2-12);
        // Keep the real reward readable over friendly fire; hostile shots are
        // still drawn after every native label and panel below.
        const behindEnemy=w.bodies.some(other=>other.active&&other.kind in C.enemies
          &&Math.abs(x-other.x)<width/2+Math.max(80,other.width*.85)
          &&Math.abs(b.y-54-other.y)<20+Math.max(84,other.height*.8)+40);
        const combination=supplyCombinationLabel(supplyCombinations(w,b,this.save.recipeGoal));
        const showCombination=!!combination&&supplyCombinationClear(w,x,b.y,width,noticeBlocking);
        if(!behindEnemy)this.rect(x-width/2,b.y-74,width,showCombination?70:40,'#0b1723f7');
        const verb=signal.pulling?'回收中':signal.urgent?'快拾取':'拾取';
        this.text((target?'目标·':'')+(b.weaponKind ? `${verb}${b.refit?'改装':w.activeWeapons.includes(b.weaponKind) ? '强化' : '叠加'}${weaponNames[b.weaponKind]}` : `${verb} T${b.stage}`),x,b.y-54,24,signal.urgent?'#ffd186':'#ffe7b1','center',true);
        if(showCombination)this.text(combination!,x,b.y-24,21,'#ffe2a1','center',true);
      }
      else if (b.kind === 'gate') {
        const calibration=calibrationGateReward(b);
        if(calibration){
          const paired=pairedGate(b,w.bodies),width=b.width-(paired?60:10),color='#d4b4ff';
          if(!gatePanelBlocked(b,w.bodies,true))this.rect(b.x-width/2,b.y-80,width,164,'#13172bf5');
          this.gateText(`${weaponNames[calibration.kind]}·精校门`,b.x,b.y-60,21,color);
          this.gateText(calibration.ready?'精校 +1':`充能 +${calibration.charge}`,b.x,b.y-18,calibration.ready?38:34,'#f0e7ff',true);
          this.gateText(calibration.ready?`充能 +${calibration.charge}`:`射至${CALIBRATION_GATE.threshold} · 精校+1`,b.x,b.y+25,calibration.ready?27:20,'#ffdcaa');
          const current=100+w.weaponCalibration(calibration.kind)*50;
          this.gateText(calibration.ready?(current<=9999?`系数${current}→${current+50}%`:'系数 +50百分点'):'穿过才领取',b.x,b.y+53,19,'#cbb5dc');
          this.bar(b.x,b.y+72,width-22,Math.min(1,b.energy/C.thresholds[C.thresholds.length-1]),color);continue;
        }
        const value = previewReward(w.growth, gateValue(b.energy, b.rewardKind), b.rewardKind);
        const mixed = value.power > 0 && value.energy > 0;
        const paired=pairedGate(b,w.bodies),panelWidth=b.width-(paired?60:10);
        const pulse = this.gateFeedback.pulse(b.id, w.time);
        const numberScale = 1 + Math.sin(pulse * Math.PI) * (this.save.settings.effects === 'weak' ? 0.03 : 0.08);
        if(!gatePanelBlocked(b,w.bodies,mixed))this.rect(b.x-panelWidth/2, b.y - (mixed ? 80 : 54), panelWidth, mixed ? 164 : 108, '#071927f5');
        this.gateText(mixed ? '穿过领取' : value.power ? '穿过领取 · 火力' : value.energy ? '穿过领取 · 充能' : '储能已满', b.x, b.y - (mixed ? 60 : 33), paired?23:25, b.rewardKind==='energy'?'#e7c789':'#a4d6e9');
        if (mixed) {
          this.gateText(`+${value.power}%`, b.x, b.y - 18, 50 * numberScale, '#effaff', true);
          this.gateText(`充能 +${value.energy}`, b.x, b.y + 32, 36 * numberScale, '#ffe4ac', true);
        } else this.gateText(`+${value.power || value.energy}${value.power ? '%' : ''}`, b.x, b.y + 8, 50 * numberScale, '#effaff', true);
        const tier = C.thresholds.findIndex(t => t > b.energy);
        const progress = tier < 0 ? 1 : (b.energy - C.thresholds[tier - 1]) / (C.thresholds[tier] - C.thresholds[tier - 1]);
        this.bar(b.x, b.y + (mixed ? 72 : 46), panelWidth - 22, progress, b.rewardKind === 'power' ? '#5bddff' : '#e5b96a');
      } else if (b.kind === 'boss') {
        // Boss status is drawn after the HUD background in drawHud.
      } else if((b.empRemaining??0)>0){
        this.bar(b.x,b.y-b.height/2-14,b.width,b.hp/b.maxHp,'#8bdce9');
        if(b.pattern==='fire-control')this.text('火控·停火',b.x,b.y-b.height/2-36,21,'#b5f4ff','center',true);
        else this.text('停火',b.x,b.y-b.height/2-34,22,'#b5f4ff','center',true);
      } else if (b.kind === 'guard') {
        this.bar(b.introEscort?650:b.x, b.introEscort?b.y+35:b.y-88, b.introEscort?68:b.width, b.hp / b.maxHp, !guardClosed(b) ? '#ffb45d' : '#87c7de');
        if(b.introEscort){this.gateText('前盾',650,b.y-12,21,'#c2eaf2',true);this.gateText(!guardClosed(b)?'开盾':'闭盾',650,b.y+14,19,!guardClosed(b)?'#ffd99b':'#c2eaf2',true);}
        else
        this.text(!guardClosed(b) ? (b.shieldTurn!==undefined?'轮换前盾 · 暴露':'弱点暴露') : b.shieldTurn!==undefined?`轮换重盾 · 减伤${Math.round((1-guardDamageScale(b))*100)}%`: b.pattern==='convoy'?(w.round===1?'护炮前盾':'补给护卫'):b.pattern==='relay-screen'?'哨阵前盾':b.escort&&w.bossFormation?.id==='bulwark'?'供能护卫':'装甲减伤', b.x, b.y - 106, 23, !guardClosed(b) ? '#ffd99b' : '#d0eaff', 'center', true);
      } else if(b.kind==='conduit'){
        this.bar(b.x,b.y-b.height/2-14,b.width,b.hp/b.maxHp,'#7de4ed');this.text(b.pattern==='fire-control'?`火控中继 · 增幅${w.bodies.filter(g=>fireControlSource(g,w.bodies)?.id===b.id).length}台`:b.pattern==='relay-screen'?'中继·停火开盾':'中继·击破停火',b.x,b.y+92,21,'#a5f2fb','center',true);
      } else if(b.pattern==='rebound'){
        const state=reboundState(b);this.text(state.phase==='turn'?'折返·再蓄能':state.phase==='return'?'折返·冲刺':'折返冲锋',b.x,b.y-82,20,state.phase==='turn'?'#ffb59b':'#a7edff','center',true);
      } else if (b.kind === 'armor' || b.kind === 'elite' || b.kind === 'sniper') {
        this.bar(b.introEscort?350:b.x,b.introEscort?b.y+35:b.y-b.height/2-14,b.introEscort?68:b.width,b.hp/b.maxHp,'#f39b69');
        if(b.introEscort){this.gateText('后炮',350,b.y-12,21,'#ffcf93',true);this.gateText(b.warning>0?'蓄能':'扇射',350,b.y+14,19,'#ffcf93',true);}
        if(b.controlShutter)this.text(shutterClosed(b)?'闭甲 · 减伤80%':'开甲 · 集火',b.x+(b.x>360?72:-72),b.y-b.height/2-36,19,shutterClosed(b)?'#a5d6e3':'#ffcd83',b.x>360?'left':'right',true);
        else if(b.pattern==='fire-control')this.text((b.controlPatrol?'游弋·':'')+((b.empRemaining??0)>0?'火控·停火':fireControlSource(b,w.bodies)?b.warning>0?'增幅·蓄能':'增幅·扇射':'断供·单线'),b.x,b.y-b.height/2-36,21,(b.empRemaining??0)>0?'#adf0ff':'#ffd49a','center',true);
        if(b.pattern==='bankshot')this.text((b.empRemaining??0)>0?'折返炮·停火':b.warning>0?'折返炮·蓄能':'折返炮·反弹一次',b.x,b.y-b.height/2-36,21,'#ffc7a1','center',true);
        if(b.pattern==='booster')this.text((b.empRemaining??0)>0?'火箭·停火':b.warning>0?'火箭·蓄能':b.burst?'火箭·续发':b.boosterSpent?'火箭·撤离':'火箭·缓行→加速',b.x,b.y-b.height/2-36,21,'#ffcf9d','center',true);
        if(b.pattern==='minelayer')this.text((!this.save.achievements.unlocked.includes(this.save.achievements.tracked??'')?mineTargetLabel(w,b,this.save.achievements.tracked):null)??((b.empRemaining??0)>0?'布雷·停火':b.warning>0?'布雷·蓄能':b.mineSpent?'布雷·撤离':'布雷机'),b.x,b.y-b.height/2-36,21,'#ffb59d','center',true);
        if(b.pattern==='rake')this.text((b.empRemaining??0)>0?'旋扫·停火':b.warning>0?'旋扫·蓄能':b.rakeFiring?`旋扫·${(b.rakeVolley??0)+1}/3`:'三拍旋扫',b.x,b.y-b.height/2-36,21,'#ffcf9d','center',true);
        if(b.pattern==='relay-screen')this.text(b.warning>0?'后哨·蓄能':'后排哨机',b.x,b.y-b.height/2-36,21,'#b8eaff','center',true);
        if(b.pattern==='lockshot'){
          const target=!this.save.achievements.unlocked.includes(this.save.achievements.tracked??'')?lockshotTargetLabel(w,b,this.save.achievements.tracked):null;
          this.text(target??(b.forkshot?(lockshotLeaving(b)?'三角·撤离':(b.empRemaining??0)>0?'三角·停火':b.warning>0?'三角·蓄能':'三角哨机'):(lockshotLeaving(b)?'斜射·撤离':(b.empRemaining??0)>0?'斜射·停火':b.warning>0?'斜射·蓄能':'斜射哨机')),b.x,b.y-b.height/2-36,22,target?'#adf0ff':'#ffce9b','center',true);
        }
        if(b.pattern==='relocate')this.text(sentryDirection(b)?'换位中':b.warning>0?'机动·蓄能':'机动哨机',b.x,b.y+92,21,'#b8eaff','center',true);
        if(b.pattern==='intercept')this.text(b.warning>0?(b.burst?'截击·核心蓄能':'截击·翼炮蓄能'):(b.interceptCoreRemaining??0)>0?'截击·核心连射':'截击精英',b.x,b.y-b.height*.68-20,21,b.burst?'#ffb19c':'#ffe1a7','center',true);
        if(b.bountyRound===w.contract?.round&&w.contract?.kind==='hunter'&&w.contract.status==='active'){
          if(b.aceRole){const x=b.x<360?70:650,color=b.aceEnraged?'#ffa27b':'#ffd884';this.gateText(b.aceRole==='fan'?'扇炮':'针炮',x,b.y-12,20,color,true);this.gateText(b.aceEnraged?'暴走':b.aceRagePending?'蓄势':'王牌',x,b.y+14,18,color,true);}
          else this.text('悬赏精英',b.x,b.y-b.height/2-42,23,'#ffd884','center',true);
        }
      }
    }
    for(const b of w.bodies)if(b.active&&b.bossReserve){
      const x=b.x+(b.x<360?-1:1)*(b.width/2+48),y=b.y;this.rect(x-38,y-13,76,26,'#17232dec');
      this.text('回援',x,y,20,'#ffcf9c','center',true);
    }
    // Hostile projectiles must remain visible over reward panels as well as explosions.
    for (const b of w.bullets.filter(b => b.hostile)) {
      if(b.mine)mineLight(c,b,this.images.get('minelayer-v1.png')!,this.save.settings.effects==='weak');else hostileShot(c,b,this.save.settings.effects==='weak');
    }
  }
  private drawDestruction(dt: number) {
    const wreck = this.destruction;
    if (!wreck) return;
    for (const burst of wreck.advance(dt)) {
      // Prefer the boss's authored beats over the oldest decorative blast.
      if (this.blasts.length >= 4) this.blasts.shift();
      const life=burst.reactor?.72:.6;this.blasts.push({ ...burst,life,total:life });
    }
    if (wreck.finished) { this.destruction = undefined; return; }
    const img = this.images.get(wreck.variant === 2 ? 'boss-bastion-v1.png' : wreck.variant === 1 ? 'boss-flanker-v1.png' : 'boss-v1.png'); if (!img) return;
    const c = this.ctx, sw = img.width / 3, sh = img.height;
    for (const piece of wreck.pieces) {
      c.save(); c.globalAlpha = piece.alpha;
      c.translate(wreck.x + (piece.from + piece.width / 2 - 0.5) * BOSS_VISUAL.width + piece.dx, wreck.y + BOSS_VISUAL.offsetY + piece.dy);
      c.rotate(piece.angle);
      c.drawImage(img, (2 + piece.from) * sw, 0, piece.width * sw, sh, -piece.width * BOSS_VISUAL.width / 2, -BOSS_VISUAL.height / 2, piece.width * BOSS_VISUAL.width, BOSS_VISUAL.height);
      c.restore();
    }
  }
  private drawHud() {
    const y = this.hudTop, w = this.world;
    const boss=w.bodies.find(b=>b.active&&b.kind==='boss');
    const closing=this.mode==='playing'&&w.phase==='running'&&w.closingStatus.total>0&&w.contract?.status!=='active';
    this.rect(0, 0, 720, y + (boss?210:closing?194:162), '#08131be8');
    const equipmentHud=this.mode==='playing'&&this.equipmentHud&&w.time<this.equipmentHud.until?this.equipmentHud:null;
    this.text(equipmentHud?.text??'分数',30,y+6,equipmentHud?19:20,equipmentHud?.color??'#91adbf','left');
    const score=w.score.toString().padStart(6,'0');
    this.text(score,28,y+43,score.length<=6?42:Math.max(12,260/score.length),'#e9f6ff','left',true);
    const rapid=w.rapidBreak.readout(w.time);
    if(rapid){
      const c=this.ctx,x=216,top=y+14,width=142,height=48;
      c.save();const metal=c.createLinearGradient(x,top,x,top+height);metal.addColorStop(0,'#5d4c32');metal.addColorStop(.15,'#253541');metal.addColorStop(.6,'#101e2a');metal.addColorStop(1,'#3c423d');c.fillStyle=metal;
      c.beginPath();c.moveTo(x+7,top);c.lineTo(x+width,top);c.lineTo(x+width,top+height-7);c.lineTo(x+width-7,top+height);c.lineTo(x,top+height);c.lineTo(x,top+7);c.closePath();c.fill();c.strokeStyle='#b79351';c.lineWidth=1.5;c.stroke();
      for(let i=0;i<3;i++)this.rect(x+12+i*41,top+4,32,2,rapid.count>=[3,6,9][i]?'#ffd67d':'#536068');
      this.text(`${rapid.count}连破 +${rapid.bonus}`,x+width/2,top+27,21,'#ffe3a0','center',true);c.restore();
    }
    this.text('◈ '.repeat(w.player.hp) + '◇ '.repeat(3 - w.player.hp), 430, y + 35, 34, '#82deff');
    this.rect(624, y + 2, 64, 64, '#1a2e3e'); this.text('Ⅱ', 656, y + 34, 36);
    this.buttons.push({ x: 624, y: y + 2, w: 64, h: 64, label: '暂停', action: 'pause' });
    this.text(`T${w.weaponStage(w.weaponKind)} · ${w.activeWeapons.length}种武器叠加`, 30, y + 88, 25, weaponColors[w.weaponKind], 'left', true);
    this.text(`火力 +${permanentPower(w.growth)}%`, 300, y + 88, 24, '#74dcff', 'left', true);
    this.text(`${w.round}轮·${boss&&w.bossFormation?w.bossFormation.name:w.round>1?battleBrief(w.round,w.battlePlan):sectorNames[sectorIndex(w.round)]}`, 686, y + 88, 26, '#b0c4d1', 'right');
    this.bar(360, y + 115, 660, w.growth.overload > 0 ? w.growth.overload / OVERLOAD.duration : w.growth.energy / 100, w.growth.overload > 0 ? '#ffc66b' : '#5bddff');
    this.text(w.growth.overload > 0 ? `超载${w.overdriveForm?'·'+overdriveForms[w.overdriveForm].name:''} 伤×${OVERLOAD.damage} / 速×${OVERLOAD.rate} · ${w.growth.overload.toFixed(1)}秒 · 储能${Math.floor(w.growth.energy)}/100`
      : w.canChooseOverdrive()?`充能 ${Math.floor(w.growth.energy)}/100 · 超载协议待选：暂停→技能树`:`充能 ${Math.floor(w.growth.energy)}/100 · 满100：火力+10% · 增伤提速${OVERLOAD.duration}秒`, 360, y + 144, 22, '#d4e8ee');
    if(this.mode==='playing'&&w.phase==='running'&&w.roundTime<=40&&!w.contractReward&&w.contract?.status!=='active'&&w.contract?.round!==w.round&&!w.bodies.some(b=>b.active&&Math.abs(b.x-585)<b.width/2+125&&Math.abs(b.y-(y+200))<b.height/2+48)){
      this.rect(480,y+170,210,44,'#213d4d');this.text('挑战契约　›',585,y+192,24,'#ffd598');
      this.buttons.push({x:480,y:y+170,w:210,h:44,action:'contracts-live',label:'挑战契约'});
    }
    if(boss){
      this.text(`${boss.bossVariant===2?'封锁堡垒':boss.bossVariant===1?'双翼压制者':'重装首领'}${isWeaveBoss(boss)&&boss.attack===0?'·交织':''}${boss.counterfire?'·过热':''}${w.bossShieldActive()?'·屏障45%':''}　${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`,360,y+172,25,'#ffd59e');
      this.bar(360,y+196,620,boss.hp/boss.maxHp,w.bossShieldActive()?'#82dfff':'#ff925d');
      if((w as World&{bossSalvageEnabled?:boolean}).bossSalvageEnabled&&w.round>=BOSS_SALVAGE.fromRound){
        for(const ratio of BOSS_SALVAGE.ratios)this.rect(49+620*ratio,y+190,2,12,'#ffedd1');
        const tactic=bossTacticalStatus(w.round,boss,w.bodies);
        this.rect(50,y+206,620,28,'#102330');this.text(`破甲 ${bossSalvageCount(boss)}/4 · 每段充能+${BOSS_SALVAGE.charge}${tactic?' · '+tactic:''}`,360,y+220,19,tactic?'#fff0cf':'#ffdf9e');
      }
    }
    if(closing){const s=w.closingStatus;this.rect(50,y+162,620,28,'#102330');this.text(`终线全歼 ${s.kills}/${s.total} · 全破充能+${CLOSING_CLEAR_CHARGE} · 首领即将接近`,360,y+176,20,'#ffdf9e');}
  }
  private noticePlacement(){
    return this.mode==='playing'&&this.notice&&this.platform.now()<this.noticeUntil
      ?combatNoticePosition(this.world,this.noticeY,!!this.noticeDetail):null;
  }
  private buildReceiptLocation(): ReceiptPosition | null {
    if(this.buildFeedback?.equipment&&this.noticePlacement()?.y===1208)return null;
    const w=this.world,position=buildReceiptPosition(w);
    const combat=w.bodies.some(b=>b.active&&(b.kind==='boss'||b.bountyRound!==undefined));
    // A current instruction (break, collect, cross, or dodge) wins the shared
    // bottom area. Keep the earned receipt queued until it has its own space.
    const guide=contextGuide(w),weaponBrief=guide.kind==='move'&&w.phase==='running'&&w.time<this.weaponGuideUntil;
    if(position===1180&&!combat&&(guide.kind!=='move'||weaponBrief))return null;
    return position;
  }
  private drawGuide() {
    if (this.mode !== 'playing') return;
    if(this.world.time<this.achievementUntil)return;
    if(this.buildFeedback&&this.world.time<this.buildFeedback.until&&this.buildReceiptLocation()===1180)return;
    const activeReceipt=this.buildFeedback&&this.world.time<this.buildFeedback.until&&this.buildReceiptLocation()!==null;
    if(!activeReceipt&&this.noticePlacement()?.y===1208)return;
    // Optional help is below all entities, effects, projectiles and native labels.
    // Briefly omit it while a passing body occupies the help area: neither its
    // silhouette nor the instruction should become an unreadable composite.
    if (this.world.bodies.some(b => b.active && b.y + b.height * 0.8 >= 1150 && b.y - b.height * 0.8 <= 1256)) return;
    if(this.world.bullets.some(b=>b.active&&b.hostile&&b.x+(b.mine?48:8)>=44&&b.x-(b.mine?48:8)<=676&&b.y+(b.mine?48:12)>=1150&&b.y-(b.mine?48:7)<=1256))return;
    let guide = contextGuide(this.world);
    if(this.world.phase==='boss'&&this.world.phaseTime<8&&this.world.bossFormation)
      guide=this.world.activeEscorts.length
        ?{kind:'boss',title:this.world.bossFormation.name,detail:this.world.bossFormation.hint}
        :{kind:'boss',title:'首领火力窗口',detail:'持续输出首领 · 留意仍在飞行的实弹'};
    const weaveBoss=this.world.bodies.find(b=>b.active&&b.kind==='boss'&&isWeaveBoss(b)&&b.attack===0&&(b.warning>0||b.burst));
    if(this.world.phase==='boss'&&weaveBoss&&!this.world.activeEscorts.length)guide={kind:'boss',title:'双炮三拍交织',detail:'弹幕由外向内，下一轮反向 · 观察实弹换位'};
    if (guide.kind === 'move' && this.world.phase === 'running' && this.world.time < this.weaponGuideUntil)
      guide = weaponGuide(this.weaponGuideKind, this.world.weaponStage(this.weaponGuideKind),this.world.profileFor(this.weaponGuideKind));
    const goal=this.save.recipeGoal;
    if(goal&&this.world.phase==='running'){
      const status=recipeStatus(this.world,goal);
      const supplies=this.world.bodies.filter(b=>recipeSupplyMatch(this.world,goal,b)&&b.y>=160&&b.y<=C.playerY+(b.kind==='pickup'?52:0));
      if(supplies.length&&(guide.kind==='crate'||guide.kind==='pickup')){
        const drops=supplies.filter(b=>b.kind==='pickup'),shown=drops.length?drops:supplies;
        const names=[...new Set(shown.map(b=>weaponNames[b.weaponKind!]))].join(' / ');
        guide={kind:guide.kind,title:`目标补给 · ${status.name}`,detail:`${names} · ${drops.length?'靠近拾取':'打碎再拾取'} · 同排只领一件`};
      }else if(guide.kind==='move')guide={kind:'move',title:`构筑目标 · ${status.name}${status.ready?' · 已成形':''}`,detail:status.ready?'按配方条件触发 · 暂停可选择新目标':status.need};
    }
    const tactic=!this.save.achievements.unlocked.includes(this.save.achievements.tracked??'')&&this.world.phase==='running'?(mineGoal(this.world,this.save.achievements.tracked)??lockshotGoal(this.world,this.save.achievements.tracked)):null;
    if(tactic&&(guide.kind==='move'||(guide.kind==='enemy'&&(guide.title.startsWith('斜射')||guide.title.startsWith('布雷')))))guide=tactic;
    if (guide.detail) {
      this.rect(44, 1150, 632, 106, '#081a25df');
      this.text(guide.title, 360, 1180, 28, '#e3f4ff', 'center', true);
      this.text(guide.detail, 360, 1224, 25, '#b8d4e3');
    } else this.text(this.inputMode === 'keyboard' ? '‹　A/D 或 ←/→ · 自动开火　›' : '‹　左右拖动 · 自动开火　›', 360, 1230, 24, '#b8d4e3');
  }
  private drawMenu() {
    this.rect(0, 0, 720, 510, '#07111b88'); this.rect(0, 920, 720, 360, '#07111bea');
    this.text('火力突围', 360, 290, 82, '#e5f3fa', 'center', true);
    this.text('G A T E  S H O O T E R', 360, 370, 27, '#72cde9');
    this.rect(280, 420, 160, 2, '#5bddff'); this.text('把奖励打高。把火力打满。', 360, 475, 29, '#c2dbe8');
    this.text(`最高分　${this.save.best}`, 360, 890, 26, '#e8c98d');
    this.rect(176,650,368,96,'#173442');const openingLabel=`首箱预定 · ${weaponNames[this.save.openingWeapon]} T2　›`;this.text(openingLabel,360,685,25,weaponColors[this.save.openingWeapon],'center',true);
    this.buttons.push({x:176,y:650,w:368,h:96,action:'opening-menu',label:openingLabel});this.text('8秒投送 · 击碎后拾取',360,734,21,'#b8d4e3');
    this.rect(80,754,272,114,'#173442');const goal=this.save.recipeGoal;
    const goalLabel=goal?`构筑目标 · ${recipes[goal].name}`:'选择构筑目标　›';this.text('构筑目标',216,787,22,'#b8cbb5');this.text(goal?recipes[goal].name:'选择组合　›',216,830,25,'#d3e9b7','center',true);
    this.buttons.push({x:80,y:754,w:272,h:114,action:'combos-menu',label:goalLabel});
    this.rect(368,754,272,114,'#173442');const battleLabel=`战况预定 · ${battlePlansInfo[this.save.nextBattlePlan].name}　›`;
    this.text('战况预定',504,787,22,'#9bbfce');this.text(battlePlansInfo[this.save.nextBattlePlan].name+'　›',504,830,25,'#b8e5f5','center',true);this.buttons.push({x:368,y:754,w:272,h:114,action:'battle-plan-menu',label:battleLabel});
    this.button('开始突围　›', 932, 'start', true);
    this.button('武器档案', 1030, 'armory');
    for(const [i,label] of ['成就','设置'].entries()){const x=112+i*258;this.rect(x,1128,238,86,'#1a2d3c');this.text(label, x+119,1171,30,'#d8eaf5');this.buttons.push({x,y:1128,w:238,h:86,label,action:i?'settings':'achievements'});}
    const tracked=achievements.find(a=>a.id===this.save.achievements.tracked);
    this.text(tracked?`${this.save.achievements.unlocked.includes(tracked.id)?'已达成':'下局目标'} · ${tracked.name} · 到成就页查看`:'射击装备，再走位领取强化', 360, 1230, 23, '#99b6c9');
  }
  private drawBattlePlan(){
    this.rect(40,100,640,1100,'#102330');this.text('战况预定',360,165,44,'#e7f5ff','center',true);
    this.text('首轮第2/3章预览 · 配合首箱规划打法',360,220,23,'#bdd8e7');
    for(const [i,plan]of battlePlans.entries()){
      const y=260+i*235,selected=this.save.nextBattlePlan===plan,info=battlePlansInfo[plan],c=this.ctx;
      const metal=c.createLinearGradient(65,y,655,y+215);metal.addColorStop(0,selected?'#345768':'#223b4c');metal.addColorStop(.25,selected?'#1d3d50':'#142c3d');metal.addColorStop(1,'#0b1c29');c.fillStyle=metal;c.fillRect(65,y,590,215);
      c.strokeStyle=selected?'#9cddf4':'#426171';c.lineWidth=selected?2:1;c.strokeRect(65,y,590,215);
      for(const x of[76,644])for(const py of[y+11,y+204]){c.fillStyle='#889da6';c.fillRect(x-2,py-2,4,4);}
      this.rect(65,y+14,4,187,selected?'#b8edff':'#516b78');
      this.text(info.name,88,y+36,30,selected?'#d6f5ff':'#e1edf5','left',true);
      this.text(selected?'已预定':'选择 ›',630,y+36,23,selected?'#ffdfa0':'#b6cbd8','right');
      this.frameSprite(info.asset,0,3,132,y+112,76,78,1);
      this.frameSprite('armor-v1.png',0,3,132,y+175,58,61,1);
      this.text(`侧翼 · ${battleBrief(2,plan)}`,205,y+84,26,'#c9efff','left',true);
      this.text(`重装 · ${battleBrief(3,plan)}`,205,y+124,25,'#ffdcaa','left');
      this.text(info.tactic,205,y+173,21,'#bad2df','left');
      this.buttons.push({x:65,y,w:590,h:215,action:`battle-plan:${plan}`,label:`预定${info.name}${selected?' · 已预定':''}`});
    }
    this.text('首章教学相同 · 后续循环继续变阵',360,1000,22,'#bdd8e7');
    this.button('确认战况 · 返回主界面',1045,'battle-plan-back',true);
    this.text('下局自动轮换战况，也可再次预定',360,1166,21,'#9fbccf');
  }
  private drawOpening(){
    this.rect(40,100,640,1100,'#102330');this.text('首箱预定',360,180,44,'#e7f5ff','center',true);
    this.text('决定早期配件 · 后续仍可自由叠加',360,235,24,'#bdd8e7');
    for(const [i,kind]of openingWeapons.entries()){
      const y=270+i*180,selected=this.save.openingWeapon===kind,color=weaponColors[kind],entry=weaponDossier[kind];
      this.rect(65,y,590,160,selected?'#2a4b59':'#1a3242');this.rect(65,y,5,160,color);
      this.frameSprite(entry.asset,1,3,139,y+80,100,133,1);
      this.text(`${weaponNames[kind]} T2`,220,y+38,31,color,'left',true);
      this.text(selected?'已预定':'选择 ›',625,y+38,23,selected?'#f5dfa0':'#c5e0ec','right');
      this.text(entry.role,220,y+82,24,'#e5f3fa','left');
      this.text(openingHints[kind],220,y+124,22,'#bdd8e7','left');
      this.buttons.push({x:65,y,w:590,h:160,action:`opening:${kind}`,label:`预定${weaponNames[kind]}`});
    }
    this.text('8秒首箱 · 打碎后仍需拾取 · 开局不直接发枪',360,1040,23,'#e2c994');
    this.button('返回主界面',1100,'opening-back',true);
  }
  private drawAchievements() {
    this.rect(40,90,640,1120,'#102330');this.text('突围成就',360,155,42,'#effaff','center',true);
    const state=this.save.achievements;
    this.text(`已达成 ${state.unlocked.length}/${achievements.length} · 构筑认证 ${state.certifiedBuilds.length}/${Object.keys(buildProofs).length}`,360,210,25,'#bdd8e7');
    for(const [i,group] of (Object.keys(achievementGroups) as AchievementGroup[]).entries()){
      const x=65+i*198,selected=group===this.achievementTab;this.rect(x,245,186,66,selected?'#31556a':'#1a2d3c');this.text(achievementGroups[group].name,x+93,278,27,selected?'#bceeff':'#d1e0e8');
      this.buttons.push({x,y:245,w:186,h:66,label:achievementGroups[group].name,action:`achievement-group:${group}`});
    }
    const ids=achievementGroups[this.achievementTab].ids as readonly string[];
    const all=achievements.filter(a=>ids.includes(a.id)),paged=all.length>6,pages=paged?Math.ceil(all.length/4):1;
    this.achievementPage=Math.max(0,Math.min(pages-1,this.achievementPage));
    const items=paged?all.slice(this.achievementPage*4,this.achievementPage*4+4):all,compact=items.length>5,step=compact?108:130,height=compact?98:120;
    for(const [i,a] of items.entries()){
      const y=335+i*step,done=state.unlocked.includes(a.id),tracked=state.tracked===a.id;
      this.rect(65,y,590,height,done?'#263d43':tracked?'#203f52':'#142b39');if(tracked)this.rect(65,y,4,height,'#7fe4ff');
      this.text(a.name,85,y+(compact?24:29),compact?27:29,done?'#ffdc8a':'#effaff','left',true);
      this.text(done?this.achievementReturn==='result'&&this.runAchievements.includes(a.id)?'本局新达成':'已达成':tracked?'追踪中':'设为目标',635,y+(compact?24:29),22,done?'#ffdc8a':'#8bddf5','right');
      this.text(a.detail,85,y+(compact?52:66),compact?22:23,'#c6dce9','left');this.text(achievementProgress(a.id,state),85,y+(compact?80:100),compact?18:20,'#9fbccf','left');
      if(!done)this.buttons.push({x:65,y,w:590,h:height,label:`追踪${a.name}`,action:`track:${a.id}`});
    }
    if(paged){
      this.text(`${this.achievementPage+1}/${pages}页`,360,920,23,'#bceeff');
      for(const [offset,label,x] of [[-1,'上一页',85],[1,'下一页',475]] as const){
        const page=this.achievementPage+offset;if(page<0||page>=pages)continue;
        this.rect(x,889,160,62,'#21414b');this.text(label,x+80,920,24,'#d1e8ee');
        this.buttons.push({x,y:889,w:160,h:62,label,action:offset<0?'achievement-page:previous':'achievement-page:next'});
      }
    }
    const target=achievements.find(a=>a.id===state.tracked);
    this.text(target?`已追踪：${target.name}`:'点选未达成成就，设为下局目标',target?85:360,1025,23,'#bceeff',target?'left':'center');
    if(target){this.rect(480,995,170,58,'#21414b');this.text('取消追踪',565,1024,23,'#d1e8ee');this.buttons.push({x:480,y:995,w:170,h:58,label:'取消追踪',action:'track-clear'});}
    this.button(this.achievementReturn==='result'?'返回本局战绩':'返回主界面',1070,'achievements-back',true);
    this.text('记录保存在本机 · 不增加局外伤害',360,1184,21,'#9fbccf');
  }
  private drawArmory() {
    const kind = this.dossierWeapon, entry = weaponDossier[kind], color = weaponColors[kind];
    this.rect(40, 90, 640, 1130, '#102330');
    this.text('武器档案', 360, 156, 46, '#e7f5ff', 'center', true);
    this.text('认清火力，再选择你的突破方式', 360, 205, 24, '#a5c4d6');
    for (const [i, weapon] of dossierWeapons.entries()) {
      const x = 56 + i * 122;
      this.rect(x, 246, 120, 70, weapon === kind ? '#2d5368' : '#172f40');
      this.text(weaponNames[weapon], x + 60, 281, 26, weaponColors[weapon], 'center', true);
      if (weapon === kind) this.rect(x + 12, 311, 96, 3, color);
      this.buttons.push({x, y:246, w:120, h:70, action:`dossier:${weapon}`, label:weaponNames[weapon]});
    }
    for (let tier = 0; tier < 3; tier++) {
      const x = 170 + tier * 190;
      this.rect(x - 84, 350, 168, 276, '#091723');
      this.frameSprite(entry.asset, tier, kind === 'pulse' ? 4 : 3, x, 480, 160, 213, kind === 'pulse' ? 2 : 1);
      this.text(`T${tier + 1}`, x, 603, 25, color, 'center', true);
    }
    this.text(entry.role, 360, 684, 32, color, 'center', true);
    if(kind!=='arc')this.text('弹道弹芯可追加贯穿、爆破或侧跳',360,718,22,'#c6d9c5');
    this.text('适合这样打', 92, 756, 25, '#f0d19a', 'left', true);
    this.text(entry.strength, 92, 803, 25, '#d6e7f0', 'left');
    this.text('留意取舍', 92, 868, 25, '#f0d19a', 'left', true);
    this.text(entry.tradeoff, 92, 915, 25, '#d6e7f0', 'left');
    this.rect(86, 963, 548, 1, '#355064');
    this.text('击碎后拾取 · 新武器与已有武器共同开火', 360, 1004, 25, '#b8d4e3');
    this.text('同排选一种奖励 · 旧能力保留到本局结束', 360, 1045, 25, '#b8d4e3');
    this.button('返回主界面', 1100, 'armory-back', true);
  }
  private drawRefitPlan(){
    const w=this.world;this.rect(40,100,640,1100,'#102330');
    this.text('军械补给 · 改装目标',360,165,38,'#effaff','center',true);
    this.text('影响后续改装箱/精校门 · 已投送的不变',360,222,23,'#bdd8e7');
    this.text('同排仍选一个 · 打碎后拾取才升级',360,260,23,'#f0d19a');
    for(const [i,kind] of w.activeWeapons.entries()){
      const y=292+i*134,preview=equipmentPreview(w,kind)!,chosen=w.refitTarget===kind;
      this.rect(66,y,588,124,chosen?'#26475a':'#132d3c');this.rect(66,y,4,124,preview.color);
      const entry=weaponDossier[kind];this.frameSprite(entry.asset,w.weaponStage(kind)-1,kind==='pulse'?4:3,126,y+62,76,100,kind==='pulse'?2:1);
      this.text(preview.title,182,y+29,26,preview.color,'left',true);
      this.text(chosen?'已指定':'选择',632,y+29,21,chosen?'#ffe19a':'#bdd8e7','right',chosen);
      this.text(preview.detail,182,y+67,23,'#e1f7ff','left');
      this.text(preview.hint,182,y+103,21,'#c4dca9','left');
      this.buttons.push({x:66,y,w:588,h:124,action:`refit-focus:${kind}`,label:`指定改装${weaponNames[kind]}`});
    }
    this.text('精校门仅匹配T3 · 未达T3则自动选其他配件',360,964,21,'#d4b4ff');
    this.text('直伤不计超载、命中率与派生 · 本局有效',360,1004,21,'#bdd8e7');
    this.rect(120,1030,480,66,'#203e50');this.text(w.refitTarget?'恢复自动改装':'自动改装 · 当前生效',360,1063,26,'#d8eaf5');
    this.buttons.push({x:120,y:1030,w:480,h:66,action:'refit-auto',label:'恢复自动改装'});
    this.button('返回当前火力',1130,'refit-plan-back');
  }
  private drawLoadout() {
    const w = this.world, power = permanentPower(w.growth),debrief=this.loadoutReturn==='result';
    this.rect(40, 100, 640, 1100, '#102330');
    this.text(debrief?'本局火力复盘':'当前火力', debrief?300:330, 165, debrief?34:46, '#e7f5ff', 'center', true);
    this.rect(490,135,160,60,'#203e50');this.text('查看机甲',570,165,25,'#80e4ff');
    this.buttons.push({x:490,y:135,w:160,h:60,action:'rig-view',label:'查看机甲'});
    this.text(`已叠加 ${w.activeWeapons.length} 种武器`,82,228,25,'#a5d9ed','left');
    if(debrief)this.text('本局只读 · 结束时状态',474,229,22,'#a6c8d9');
    else{this.rect(300,202,348,54,'#203e50');this.text(`改装目标 · ${w.refitTarget?weaponNames[w.refitTarget]:'自动'}　›`,474,229,24,'#ffe19a');
      this.buttons.push({x:300,y:202,w:348,h:54,action:'refit-plan',label:'选择改装目标'});}
    this.text(debrief?`常驻 +${power}% · 门${w.growth.bonus}% / 突破${(w.growth.mastery??0)*10}%`:`常态火力 +${power}% · 超载：伤×${OVERLOAD.damage} / 速×${OVERLOAD.rate}`, 360, 278, 22, '#f0d19a');
    this.text(debrief?`研发${w.researchPoints}点 · 突破${w.growth.mastery??0}次 · 精校${w.activeWeapons.reduce((n,k)=>n+w.weaponCalibration(k),0)}次`:`技能点：可用${w.buildPoints-w.build.spent} · 研发${w.researchPoints} ＋ 充能突破${w.growth.mastery??0}`,360,310,21,'#bdd8e7');
    for (const [index, kind] of w.activeWeapons.entries()) {
      const profile = w.profileFor(kind), y = 342 + index * 102;
      const damage = profile.damage.map(n => +(n * (1 + power / 100)).toFixed(1));
      this.rect(72, y, 576, 94, '#091723');
      this.text(`${weaponNames[kind]} T${w.weaponStage(kind)}${kind==='arc'&&w.build.electricBranch==='capacitor'?' · 蓄爆':kind==='arc'&&w.build.electricBranch==='spread'?' · 扩散':kind==='arc'&&w.build.electricBranch==='seeker'?' · 猎隼':''}${w.weaponCalibration(kind)?' · 精校'+w.weaponCalibration(kind):''}`, 92, y + 22, 25, weaponColors[kind], 'left', true);
      this.text(kind==='arc'?`${w.build.electricBranch==='seeker'?'首跳340':'索敌'+ARC_SHOT.aimWidth} · 跳电${profile.chainHops}×${w.build.ranks.electric>=3?80:65}%`:ballisticMechanics(w,kind),92,y+49,20,'#a9c9d9','left');
      if(kind==='arc'&&w.build.electricBranch==='capacitor')this.text(`接力${w.capacitorTransfers} · 蓄爆${w.capacitorBursts}`,625,y+23,18,'#d7c2ff','right');
      const perShot = Math.min(...damage) === Math.max(...damage) ? `${damage[0]}` : `${Math.min(...damage)}–${Math.max(...damage)}`;
      this.text(`常态 ${profile.rate}轮/秒 · 每轮${profile.offsets.length}发 · 单发伤害${perShot}`, 92, y + 77, 22, '#d6e7f0', 'left');
    }
    const support=w.supportProfile(),compactOptics=hasOptical(w.build,'mirror')||!!w.build.opticalFusion;
    this.text(support.laserUnlocked?`激光${w.build.opticalFusion?'·'+opticalName(w.build):w.build.opticalBranch==='burn'?'·灼热':w.build.opticalBranch==='relay'?'·分光':hasOptical(w.build,'mirror')?'·折返':''}：每${support.laserInterval}秒${+(support.laserDamage*(1+power/100)).toFixed(1)}伤害 · 贯穿${support.laserTargets}敌`:(debrief?'本局未解锁激光':'第3次充能突破：追加贯穿激光'),360,890,w.build.opticalFusion?20:hasOptical(w.build,'mirror')?22:24,'#7fe4ff');
    this.text(support.refractionTargets>0?`折射：命中后追加${support.refractionTargets}敌 · 各60%伤害`:(debrief?'本局未解锁弹丸折射':'第5次充能突破：追加弹丸折射'),360,compactOptics?923:930,compactOptics?20:23,'#a2f9ed');
    if(w.build.opticalFusion)this.text([hasOptical(w.build,'burn')?'灼烧3×25%':'',hasOptical(w.build,'relay')?'分光65%/180':'',hasOptical(w.build,'mirror')?'折返65%/2敌':''].filter(Boolean).join(' · '),360,949,20,'#c5bcff');
    else if(hasOptical(w.build,'mirror'))this.text(`折返束：65% / 最多2敌 · 一次反射 · 命中${w.mirrorHits}`,360,949,20,'#c5bcff');
    this.text(w.laserChainUnlocked()?`光链${laserChainProfile(w.build.photonAugment).hops}跳/${laserChainProfile(w.build.photonAugment).range} · 聚能${Math.round(laserChainProfile(w.build.photonAugment).focus*100)}%${support.prism?' · 棱镜45%':''}`:support.prism?'棱镜双束：两侧各45%伤害 · 主束保留':(debrief?'常驻数值 · 不含临时超载与派生伤害':`数值含永久加成；超载伤×${OVERLOAD.damage} / 速×${OVERLOAD.rate}`), 360, compactOptics?978:970, compactOptics?20:23, '#c7deeb');
    this.text(w.build.ammoFusion?'复合弹芯 · '+ammoName(w.build):w.build.stormAugment?`雷暴 · ${stormAugments[w.build.stormAugment].name} · ${w.build.stormAugment==='storm-focus'?w.stormFocusBursts+'次破核':w.stormLinks+'次跳伤'}${w.build.ranks.electric>=3?' · 离子'+w.ionCharge+'/6':''}`:w.build.ranks.electric>=3?w.build.ionAugment?`离子 ${w.ionCharge}/6 · ${ionAugments[w.build.ionAugment].name} · 追加命中${w.ionOrbHits+w.ionSpearHits}`:`离子风暴 ${w.ionCharge}/${ION_STORM.hits} · 范围${ION_STORM.radius} · ${ION_STORM.damage*100}%伤害`:`技能 ${w.build.baseSpent}/9 · 精调 ${w.build.spent-w.build.baseSpent}次`, 360, compactOptics?1007:1004, compactOptics?20:23, '#f0d19a');
    if(debrief)this.button('实战贡献',1030,'contribution');
    else for(const [i,label] of [(w.growth.mastery??0)>=OVERDRIVE.mastery?'技能/协议':'技能树','组合配方','挑战契约','实战贡献'].entries()){const x=72+i*146;this.rect(x,1030,138,86,'#1a2d3c');this.text(label,x+69,1073,23,'#d8eaf5');this.buttons.push({x,y:1030,w:138,h:86,label,action:['tree','combos','contracts','contribution'][i]});}
    this.button(debrief?'返回本局战绩':'返回暂停菜单', 1130, 'loadout-back');
  }
  private drawContribution(){
    const report=combatContribution(this.world),pages=Math.max(1,Math.ceil(report.rows.length/6));
    this.contributionPage=clamp(this.contributionPage,0,pages-1);
    this.rect(35,90,650,1140,'#102330');
    this.text('本局实战贡献',360,155,40,'#effaff','center',true);
    this.text(`敌方血量削减 ${report.total.toFixed(1)}`,360,218,30,'#ffdc8a','center',true);
    this.text('累计实际伤害 · 不计箱门、过杀与减伤挡下部分',360,263,20,'#bdd8e7');
    for(const [i,row]of report.rows.slice(this.contributionPage*6,this.contributionPage*6+6).entries()){
      const y=295+i*110;
      this.rect(65,y,590,102,'#17303f');this.rect(65,y,4,102,row.color);
      this.text(row.name,90,y+25,26,row.color,'left',true);
      this.text(`${row.damage.toFixed(1)} · ${(row.share*100).toFixed(1)}%`,625,y+25,24,'#effaff','right',true);
      this.rect(90,y+49,535,5,'#304957');this.rect(90,y+49,535*row.share,5,row.color);
      this.text(`${row.contacts}次有效作用 · ${row.kills}次最后一击`,90,y+72,20,'#d7e8f1','left');
      this.text(row.role,90,y+93,20,'#b3cfde','left');
    }
    this.text(report.total?'武器和派生分开计 · 装备时间不同，占比不代表强弱':'尚无有效伤害 · 继续瞄准敌机',360,986,21,'#bdd8e7');
    this.text('首击起0.8秒：3/6/9连破奖10/25/50分',360,1016,20,'#bdd8e7');
    this.text(`${this.contributionPage+1}/${pages}页`,360,1059,21,'#c7deeb');
    if(this.contributionPage>0){this.rect(65,1030,145,58,'#244653');this.text('上一页',137,1059,23);this.buttons.push({x:65,y:1030,w:145,h:58,action:'contribution-previous',label:'上一页贡献'});}
    if(this.contributionPage<pages-1){this.rect(510,1030,145,58,'#244653');this.text('下一页',582,1059,23);this.buttons.push({x:510,y:1030,w:145,h:58,action:'contribution-next',label:'下一页贡献'});}
    this.button(this.contributionReturn==='result'?'返回本局战绩':'返回当前火力',1120,'contribution-back',true);
  }
  private drawCombos(){
    const w=this.world,goal=this.save.recipeGoal,tracked=goal?recipeStatus(w,goal):null;
    this.rect(35,90,650,1120,'#102330');
    this.text('构筑目标与配方',360,150,40,'#effaff','center',true);
    this.text(tracked?`已追踪 · ${tracked.name}`:'先选目标，再寻找需要的补给与升级',360,207,24,'#d4e7ad');
    this.text(tracked?(tracked.ready?'已成形 · 按配方条件触发':tracked.need):'打碎后仍需拾取 · 同排只领一件',360,237,20,'#bdd8e7');
    for(const [i,id] of recipeIds.entries()){
      const row=recipeStatus(w,id),performance=recipePerformance(w,id),selected=goal===id,y=260+i*128;
      this.rect(65,y,590,120,selected?'#294b4c':'#203e50');this.rect(65,y,5,120,row.color);
      this.text(row.name,90,y+28,28,row.color,'left',true);
      this.text(performance.label,470,y+28,18,performance.ready?(performance.count?'#a2ffbb':'#f0d19a'):'#b9cad6','right');
      this.rect(492,y+7,146,42,selected?'#46614c':'#112a39');
      const label=selected?'取消目标':'设为目标';this.text(label,565,y+28,21,selected?'#ffdf93':'#c4e8f5','center',true);
      this.buttons.push({x:492,y:y+7,w:146,h:42,action:`recipe-goal:${id}`,label:`${label} · ${row.name}`});
      this.text(row.progress,90,y+58,id==='photon'?18:20,'#effaff','left');
      this.text(row.effect,90,y+83,21,'#dbeaf3','left');
      this.text(row.hint,90,y+107,19,'#bdd8e7','left');
    }
    this.text(`裂甲引爆 ${w.fractureBursts}次 · 跳伤 ${w.laserArcHits}次 · 聚能 ${w.laserFocusHits}次`,360,1055,23,'#ffca8b');
    this.button(this.combosReturn==='menu'?'返回主界面':'返回当前火力',1100,'combos-back',true);
  }
  private drawRigView() {
    const w=this.world,c=this.ctx;
    this.rect(35,90,650,1120,'#102330');
    this.text('本局机甲',360,150,42,'#effaff','center',true);
    this.text(`${w.activeWeapons.length}种武器叠加 · 机体与挂载保留`,360,208,25,'#bdd8e7');
    const ground=this.images.get('runway.jpg');
    if(ground)c.drawImage(ground,70,260,580,660);
    this.rect(70,260,580,660,'#06121c55');
    c.save();c.translate(360,610);c.scale(2.25,2.25);c.translate(-w.player.x,-C.playerY);
    const pose=this.playerMotion.sample(w.player.x,w.time);
    this.drawMountedRig(C.playerY,pose);
    this.playerSprite(w.weaponStage(w.weaponKind)-1,w.player.x,C.playerY,pose,this.calibratedRecoil(w.weaponKind));
    this.drawCalibrationRig(C.playerY,pose,this.calibratedRecoil(w.weaponKind));
    this.drawOpticalRig(C.playerY,pose);c.restore();
    this.text(w.activeWeapons.map(kind=>`${weaponNames[kind]}T${w.weaponStage(kind)}`).join(' · '),360,965,22,'#d6e7f0');
    const combinations=[w.build.ranks.ballistic>=3?'雷暴霰射':'',w.supportProfile().prism?'棱镜激光':'',w.fractureUnlocked()?'裂甲爆破':'',w.laserChainUnlocked()?'电光连锁':'',w.magneticUnlocked()?'磁暴榴弹':''].filter(Boolean);
    this.text(combinations.length?`组合：${combinations.slice(0,3).join(' · ')}`:'已有配件随真实射击独立回弹',360,1000,25,'#d6b5ff');
    if(combinations.length>3)this.text(combinations.slice(3).join(' · '),360,1031,25,'#d6b5ff');
    this.text(w.supportProfile().laserUnlocked?`镜组蓄能 ${Math.round(w.laserCharge()*100)}% · 战斗时间已暂停`:(this.loadoutReturn==='result'?'结束时挂载与等级 · 复盘不推进战斗':'检查挂载与等级 · 战斗时间已暂停'),360,1065,22,'#a6c5d7');
    this.button('返回当前火力',1100,'rig-back',true);
  }
  private weaponUpgradeOptions(){
    return this.world.activeWeapons.map(kind=>equipmentPreview(this.world,kind)!);
  }
  private drawRewardOption(o:{kind:WeaponKind|'research'|'energy';title:string;detail:string;hint:string;color:string;toTier?:number},y:number,prefix:'boss-claim'|'contract-claim'){
    this.rect(65,y,590,118,'#203e50');this.rect(65,y,4,118,o.color);this.rect(81,y+7,91,104,'#102733');
    if(o.kind==='research'||o.kind==='energy'){
      const c=this.ctx;c.save();c.strokeStyle=o.color;c.lineWidth=2;c.beginPath();c.moveTo(101,y+22);c.lineTo(140,y+22);c.lineTo(155,y+37);c.lineTo(155,y+92);c.lineTo(101,y+92);c.closePath();c.stroke();c.beginPath();c.moveTo(140,y+22);c.lineTo(140,y+37);c.lineTo(155,y+37);c.stroke();c.restore();
      this.text(o.kind==='research'?'+1':'ϟ',128,y+61,30,o.color,'center',true);
    }else{const entry=weaponDossier[o.kind];this.frameSprite(entry.asset,(o.toTier??this.world.weaponStage(o.kind))-1,o.kind==='pulse'?4:3,126,y+59,78,104,o.kind==='pulse'?2:1);}
    this.text(o.title,190,y+29,27,o.color,'left',true);this.text(o.detail,190,y+64,22,'#e1f1f8','left');this.text(o.hint,190,y+96,20,'#bdd8e7','left');this.text('›',632,y+56,30,o.color,'right');
    this.buttons.push({x:65,y,w:590,h:118,action:`${prefix}:${o.kind}`,label:o.title});
  }
  private drawBossReward(){
    const w=this.world;if(w.bossRewardRound===null)return;
    this.rect(35,120,650,1080,'#102330');
    this.text(`第${w.bossRewardRound}轮首领战利品`,360,184,38,'#ffdc8a','center',true);
    this.text('全弹命中时的直伤 · 不含超载与派生',360,237,22,'#bdd8e7');
    this.text(`首领充能+50已结算 · 当前装甲 ${w.player.hp}/3`,360,271,21,'#9db8c8');
    const points=w.buildPoints-w.build.spent;
    const options=[{kind:'research' as const,title:'研发蓝图 · 技能点+1',detail:`可用技能点 ${points} → ${points+1}`,hint:'领取后选择升级路线 · 不改变充能',color:'#9fe7ff'},...this.weaponUpgradeOptions()];
    for(const [i,o] of options.entries()){
      this.drawRewardOption(o,300+i*130,'boss-claim');
    }
    this.text('仅领取一次 · 其他武器与已有能力保留',360,1135,23,'#bdd8e7');
  }
  private drawContractReward() {
    const w=this.world,reward=w.contractReward;if(!reward)return;
    this.rect(35,120,650,1080,'#102330');
    const proof=w.contract?.proof?buildProofs[w.contract.proof.kind]:undefined;
    this.text(proof?`${proof.name} · 检验通过`:'契约完成 · 选择强化',360,190,38,'#ffdc8a','center',true);
    this.text(proof?`${Math.min(w.contract!.proofProgress,proof.goal)}/${proof.goal}${proof.unit} · 任选一项，旧能力保留`:'任选一项 · 其他武器与能力全部保留',360,245,24,'#bdd8e7');
    if(w.contract?.proof?.kind==='magnetic'&&w.build.magneticAugment)this.text(`本局认证：${magneticAugments[w.build.magneticAugment].name} · 另一精研可跨局完成`,360,278,21,'#aee8ce');
    if(isStormAugment(w.contract?.proof?.kind))this.text('精研已认证 · 另一流派可在下一局选择',360,278,21,'#aee8ce');
    const total=w.growth.energy+reward.charge;
    const options=[{kind:'energy' as const,title:`充能 +${reward.charge}`,detail:`充能 ${Math.floor(w.growth.energy)} → ${Math.floor(total%100)} · 突破${Math.floor(total/100)}次`,hint:'满100：本局火力+10% · 超载6秒',color:'#7fe4ff'},
      ...this.weaponUpgradeOptions()];
    for(const [i,option] of options.entries()){
      this.drawRewardOption(option,300+i*130,'contract-claim');
    }
    this.text('全弹命中时的直伤 · 不含超载与派生',360,1093,21,'#9db8c8');
    this.text(reward.research?'任选一项，额外研发+1同时领取':'战斗已暂停 · 选择后继续',360,1135,24,'#bdd8e7');
  }
  private drawContracts() {
    const w=this.world,current=w.contract?.round===w.round?w.contract:undefined,proofs=w.availableProofs();
    const hunt=hunts[current?.kind==='hunter'?current.hunt:this.huntChoice];
    const chosen=proofs.includes(this.proofChoice)?this.proofChoice:proofs[0],proof=chosen?buildProofs[chosen]:undefined;
    this.rect(35,120,650,1080,'#102330');
    this.text('挑战契约',360,180,42,'#effaff','center',true);
    this.text('每轮前40秒可选 · 接取后目标锁定',360,235,24,'#bdd8e7');
    for(const [i,kind] of (Object.keys(contracts) as ContractKind[]).entries()){
      const entry=contracts[kind],y=285+i*160,can=w.canAcceptContract(kind,kind==='research'?chosen:undefined);
      const needTier=kind==='hunter'&&!w.activeWeapons.some(k=>w.weaponStage(k)>=2);
      this.rect(65,y,590,148,can?'#203e50':'#172c3b');
      this.text(kind==='hunter'?`${entry.name} · ${hunt.name}`:entry.name,90,y+26,28,'#ffdc8a','left',true);
      const proofDetail=chosen==='storm-relay'?'串联电桥 · 30秒第二跳6次/2批敌阵':chosen==='storm-focus'?'聚雷破核 · 30秒破核4次/2批重装':chosen==='magnetic'?`${w.build.magneticAugment==='field-wide'?'广域扩圈':'分流桥击'} · 30秒命中6次/2批强化精英`:proof?`${proof.name} · ${proof.detail}`:'先形成组合或选择跳弹分支';
      this.text(kind==='research'?proofDetail:kind==='hunter'?hunt.detail:entry.detail,90,y+62,22,'#effaff','left');
      this.text(`成功：充能+${entry.charge} 或强化已有配件${kind==='hunter'&&hunt.research?' ＋研发1点':''}`,90,y+96,21,'#bdd8e7','left');
      this.text(can?'接取契约　›':needTier?'需要任一T2配件':kind==='research'&&!proof?'尚无可检验构筑':'本轮已接取或当前不可接取',625,y+127,21,can?'#80e4ff':'#97adbd','right');
      if(kind==='research'){
        if(can)this.buttons.push({x:65,y,w:590,h:148,label:`接取构筑检验：${proof!.name}`,action:'contract:research'});
      }else if(can)this.buttons.push({x:65,y,w:590,h:148,label:kind==='hunter'?`${entry.name}：${hunt.name}`:entry.name,action:`contract:${kind}`});
    }
    const proofProgress=current?.proof?` ${buildProofs[current.proof.kind].name} ${Math.min(current.proofProgress,buildProofs[current.proof.kind].goal)}/${buildProofs[current.proof.kind].goal}${requiredProofGroups(current.proof.kind)?' · 批次'+Math.min(current.proofGroupCount,requiredProofGroups(current.proof.kind))+'/'+requiredProofGroups(current.proof.kind):''}`:'';
    if(!current){
      this.rect(65,935,282,82,'#214a4e');this.text('切换狩猎目标 ↻',206,976,24,'#ffdc8a','center',true);this.buttons.push({x:65,y:935,w:282,h:82,label:'切换狩猎目标',action:'hunt-next'});
      if(proofs.length>1){this.rect(359,935,296,82,'#214a4e');this.text('切换检验目标 ↻',507,976,24,'#b9ffe1','center',true);this.buttons.push({x:359,y:935,w:296,h:82,label:'切换检验目标',action:'proof-next'});}else this.text('目标在接取后锁定',507,976,21,'#bdd8e7');
    }else{
    this.text(current?`${contracts[current.kind].name} · ${current.status==='active'?'进行中'+(current.kind==='hunter'?` ${current.targetKills}/2`:proofProgress):current.status==='won'?'已完成'+proofProgress:'失败：'+current.reason}`:'每轮前40秒可接取 · 构筑检验只计接取后触发',360,950,22,'#ffdc8a');
    this.text(current?.kind==='hunter'?hunts[current.hunt].detail:current?.kind==='research'?'最多6组验证敌阵 · 效果达标立即选强化':'猎手追加精英 · 构筑检验追加对应敌阵',360,992,22,'#bdd8e7');
    }
    this.button(current?.status==='active'?'继续挑战':this.contractReturn==='paused'?'返回暂停菜单':'返回当前火力',1080,current?.status==='active'?'resume':'contracts-back',true);
  }
  private drawBuildTree() {
    this.rect(35,90,650,1120,'#102330');
    this.text('本局技能树',360,145,40,'#effaff','center',true);
    this.text(`技能 ${this.world.build.baseSpent}/9 · 可用${this.world.buildPoints-this.world.build.spent}点 · 精调${this.world.build.spent-this.world.build.baseSpent}次`,360,192,24,'#bdd8e7');
    for(const [i,route] of routes.entries()) {
      const rank=this.world.build.ranks[route], top=235+i*265;
      const color=['#ffd28a','#c6a1ff','#7fe4ff'][i];
      this.text(`${['弹道','雷电','光学'][i]}路线 · 精调${this.world.build.refinements[route]}次${route==='ballistic'&&this.world.build.stormAugment?' · '+stormAugments[this.world.build.stormAugment].name:route==='ballistic'&&this.world.build.fractureAugment?' · '+fractureAugments[this.world.build.fractureAugment].name:''}${route==='electric'&&this.world.build.ionAugment?' · '+ionAugments[this.world.build.ionAugment].name:route==='electric'&&this.world.build.magneticAugment?' · '+magneticAugments[this.world.build.magneticAugment].name:''}${route==='optical'&&this.world.build.photonAugment?' · '+photonAugments[this.world.build.photonAugment].name:''}`,72,top,27,color,'left',true);
      this.rect(85,top+28,2,155,'#456478');
      for(const j of tree[route].keys()) {
        const node=this.world.build.node(route,j);
        const y=top+42+j*68, owned=j<rank;
        const locked=route==='ballistic' && j===2 && this.world.build.ranks.electric===0;
        const status=owned?'已生效':locked?'需导电线圈':j===rank?'下一节点':'前置未完成';
        this.rect(77,y-8,18,18,owned?color:'#456478');
        this.text(node.name,110,y,26,owned?color:'#e1edf5','left',true);
        this.text(status,645,y,22,owned?color:'#a5bac8','right');
        this.text(node.detail,110,y+29,21,'#bdd8e7','left');
      }
    }
    this.text(this.world.build.opticalFusion?'双镜复合 · '+opticalName(this.world.build):this.world.canFuseOptics()?'双镜复合可选 · 原镜组保留，再追加一种':this.world.build.ranks.optical>=3&&this.world.build.refinements.optical>=this.world.build.refinements.ballistic?'双镜复合：光学精调 '+Math.min(OPTICAL_FUSION.refinements,this.world.build.refinements.optical)+'/'+OPTICAL_FUSION.refinements+' · 原镜组保留':this.world.build.ammoFusion?'复合弹芯 · '+ammoName(this.world.build):this.world.canFuseAmmo()?'复合弹芯可选 · 保留原弹芯，追加一种':this.world.build.refinements.ballistic>=5?'复合弹芯：弹道3＋精调10＋任一T3弹道':this.world.build.stormAugment?'雷暴精研 · '+stormAugments[this.world.build.stormAugment].name+'已生效':'雷暴精研：弹道3 + 精调5 + T3霰射',360,1025,22,'#bdd8e7');
    this.text(this.world.build.ionAugment?'离子精研已生效 · 原放电与常规精调保留':'离子精研：雷电3 + 精调2 + T3电弧',360,1055,23,'#bdd8e7');
    const back=this.treeReturn==='choice'?'返回升级选择':'返回当前火力';if((this.world.growth.mastery??0)>=OVERDRIVE.mastery)this.overdriveFooter(back,'tree-back',1100);else this.button(back,1100,'tree-back',true);
  }
  private drawBuildBranch(){
    if(this.branchRoute==='optical'&&this.world.canFuseOptics()){this.drawOpticalFusion();return;}
    if(this.branchRoute==='ballistic'&&this.world.canFuseAmmo()){this.drawAmmoFusion();return;}
    if(this.branchRoute==='ballistic'&&this.world.canRefineStorm()){this.drawStormBranch();return;}
    if(this.branchRoute==='ballistic'&&this.world.canRefineFracture()){this.drawFractureBranch();return;}
    if(this.branchRoute==='optical'&&this.world.canRefinePhoton()){this.drawPhotonBranch();return;}
    if(this.branchRoute==='electric'){if(this.world.canRefineMagnetic())this.drawMagneticBranch();else if(this.world.canRefineIon())this.drawIonBranch();else this.drawElectricBranch();return;}
    if(this.branchRoute==='ballistic'){this.drawBallisticBranch();return;}
    this.rect(35,120,650,1080,'#102330');
    this.text('光学改造 · 三选一',360,190,40,'#effaff','center',true);
    this.text('都保留原激光 · 发射间隔缩短25%',360,250,25,'#bdd8e7');
    for(const [i,branch] of (['burn','relay','mirror'] as const).entries()){
      const node=opticalBranches[branch],y=290+i*235,color=branch==='burn'?'#ffc187':branch==='mirror'?'#c5bcff':'#a3efff';
      this.rect(65,y,590,215,'#203e50');this.rect(65,y,5,215,color);
      this.text(node.name,90,y+34,30,color,'left',true);this.text(node.role,90,y+75,22,'#effaff','left');
      this.text(branch==='burn'?'主束首敌追加3次灼烧':branch==='relay'?'主束保留 · 额外瞄准一名侧翼敌人':'主束保留 · 追加45°斜光，沿场边折返',90,y+113,22,'#d9e8f1','left');
      this.text(branch==='burn'?`每${OPTICAL_FORK.burnInterval}秒${OPTICAL_FORK.burnDamage*100}%伤害 · 不叠层`:branch==='relay'?`横距${OPTICAL_FORK.relayRange} · ${OPTICAL_FORK.relayDamage*100}%伤害 · 不递归`:`${MIRROR_LASER.damage*100}%伤害 / 最多${MIRROR_LASER.targets}敌 · 箱门闭盾可截停`,90,y+150,20,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+192,24,color,'right');
      this.buttons.push({x:65,y,w:590,h:215,action:`branch:${branch}`,label:node.name});
    }
    this.text('本局选定不可切换 · 三阶棱镜与旧武器保留',360,1020,22,'#f0d19a');
    this.button('返回升级选择',1100,'branch-back');
  }
  private drawOpticalFusion(){
    const w=this.world;this.rect(35,120,650,1080,'#102330');
    this.text('双镜复合 · 二选一',360,190,40,'#effaff','center',true);
    this.text('已装 '+opticalName(w.build)+' · 保留原镜组，再追加一种',360,250,24,'#bdd8e7');
    const choices=(['burn','relay','mirror'] as const).filter(b=>b!==w.build.opticalBranch);
    for(const [i,kind]of choices.entries()){
      const branch=`optic-${kind}` as const,node=opticalBranches[kind],preview=buildPreview(w,'optical',branch),y=315+i*290,color=kind==='burn'?'#ffc187':kind==='mirror'?'#c5bcff':'#a3efff';
      this.rect(65,y,590,250,'#203e50');this.rect(65,y,5,250,color);
      this.text('追加 '+node.name,90,y+42,34,color,'left',true);this.text(node.role,90,y+88,23,'#effaff','left');
      this.text(kind==='burn'?'主束首敌追加3次25%灼烧':kind==='relay'?'追加65%独立侧束 · 横距180':'追加65%斜束 · 反射1次 / 最多2敌',90,y+130,22,'#bdd8e7','left');
      this.text(preview.gain.split(' · ')[0],90,y+173,22,'#d4e7ad','left');
      this.text('选择复合　›',625,y+219,25,color,'right');this.buttons.push({x:65,y,w:590,h:250,label:'追加'+node.name,action:'branch:'+branch});
    }
    this.text('消耗1点 · 含本次常规精调 · 本局仅双镜一次',360,945,23,'#f0d19a');this.button('仅做常规精调，稍后复合',1015,'optic-defer');this.button('返回升级选择',1130,'branch-back');
  }
  private drawAmmoFusion(){
    const w=this.world;this.rect(35,120,650,1080,'#102330');
    this.text('复合弹芯 · 二选一',360,190,40,'#effaff','center',true);
    this.text('已装 '+ammoName(w.build)+' · 保留原能力，再追加一种',360,250,25,'#bdd8e7');
    const choices=(['penetrator','fragment','ricochet'] as const).filter(b=>b!==w.build.ballisticBranch);
    for(const [i,kind]of choices.entries()){
      const branch=`fuse-${kind}` as const,node=ballisticBranches[kind],preview=buildPreview(w,'ballistic',branch),y=315+i*290,color=kind==='ricochet'?'#ffe3a4':kind==='fragment'?'#ffd092':'#aee6ff';
      this.rect(65,y,590,250,'#203e50');this.rect(65,y,5,250,color);
      this.text('追加 '+node.name,90,y+42,34,color,'left',true);this.text(node.role,90,y+88,23,'#effaff','left');
      this.text(kind==='penetrator'?'至少贯穿2敌 · 原较高上限保留':kind==='fragment'?'范围至少140 · 50%邻伤 · 原爆炸取大':'直击后侧跳280 · 55%伤害 · 不递归',90,y+130,22,'#bdd8e7','left');
      this.text(preview.gain.replace(' · 追加'+node.name,''),90,y+173,22,'#d4e7ad','left');
      this.text('选择复合　›',625,y+219,25,color,'right');this.buttons.push({x:65,y,w:590,h:250,label:'追加'+node.name,action:'branch:'+branch});
    }
    this.text('消耗1点 · 含本次常规精调 · 本局仅复合一次',360,945,23,'#f0d19a');this.button('仅做常规精调，稍后复合',1015,'fusion-defer');this.button('返回升级选择',1130,'branch-back');
  }
  private drawBallisticBranch(){
    this.rect(35,120,650,1080,'#102330');
    this.text('弹道改造 · 三选一',360,190,40,'#effaff','center',true);
    this.text('四种弹道系数130% · 原有火力保留',360,250,24,'#bdd8e7');
    this.text('本次受益：'+buildPreview(this.world,'ballistic').weaponGains.map(r=>r.name).join(' / '),360,279,20,'#d4e7ad');
    for(const [i,branch] of (['penetrator','fragment','ricochet'] as const).entries()){
      const node=ballisticBranches[branch],y=300+i*215,color=branch==='penetrator'?'#aee6ff':branch==='ricochet'?'#ffe3a4':'#ffd092';
      this.rect(65,y,590,200,'#203e50');this.rect(65,y,5,200,color);
      this.text(node.name,90,y+35,32,color,'left',true);this.text(node.role,90,y+68,24,'#effaff','left');
      this.text(branch==='penetrator'?'至少贯穿两敌 · 原有更高贯穿保留':branch==='ricochet'?'各武器直击后追加280范围侧击':`爆破范围至少${BALLISTIC_FORK.radius} · 原爆炸取较大值`,90,y+105,23,'#d9e8f1','left');
      this.text(branch==='penetrator'?'箱子、数字门与闭合护盾会截断':branch==='ricochet'?'横距至少80 · 55%伤害 · 不递归/不充门':`${BALLISTIC_FORK.splash*100}%邻敌伤害 · 不充门 · 原爆炸保留`,90,y+141,22,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+177,24,color,'right');
      this.buttons.push({x:65,y,w:590,h:200,action:`branch:${branch}`,label:node.name});
    }
    this.text('现有与后续弹道配件共用 · 已有能力保留',360,985,23,'#f0d19a');
    this.button('返回升级选择',1050,'branch-back');
  }
  private drawStormBranch(){
    this.rect(35,120,650,1080,'#102330');this.text('雷暴精研 · 二选一',360,190,40,'#effaff','center',true);
    this.text('原武器、跳电与弹道增伤全部保留',360,250,24,'#bdd8e7');
    for(const [i,branch] of (['storm-relay','storm-focus'] as const).entries()){
      const node=stormAugments[branch],y=325+i*305,color=i?'#ffe0a3':'#b7fff0';
      this.rect(65,y,590,275,'#203e50');this.rect(65,y,5,275,color);
      this.text(node.name,90,y+38,34,color,'left',true);this.text(node.role,90,y+82,22,'#effaff','left');
      this.text(node.detail,90,y+126,22,'#d9e8f1','left');
      this.text(i?'每目标独立计数 · 击破不转移':'首跳保留 · 第二跳340 · 不回跳同敌',90,y+166,22,'#bdd8e7','left');
      this.text(i?'仅霰弹直击计数 · 箱门/闭盾不蓄雷':'单独首领没有额外目标 · 不充箱门',90,y+207,21,'#bdd8e7','left');
      this.text('选此精研　›',625,y+244,25,color,'right');this.buttons.push({x:65,y,w:590,h:275,action:'branch:'+branch,label:node.name});
    }
    this.text('精研后：挑战契约 → 本流派实战检验',360,950,22,'#b7e4db');
    this.text('花费1技能点 · 弹道系数+10% · 本局不改选',360,1000,22,'#f0d19a');this.button('返回升级选择',1080,'branch-back');
  }
  private drawFractureBranch(){
    this.rect(35,120,650,1080,'#102330');this.text('裂甲精研 · 二选一',360,190,40,'#effaff','center',true);
    this.text(`原${ammoName(this.world.build)||'标准'}弹芯保留 · 本次裂甲继续叠加`,360,250,23,'#bdd8e7');
    for(const [i,branch] of (['fracture-quick','fracture-line'] as const).entries()){
      const node=fractureAugments[branch],y=325+i*305,color=i?'#ffb57f':'#ffe0a3';
      this.rect(65,y,590,275,'#203e50');this.rect(65,y,5,275,color);
      this.text(node.name,90,y+38,34,color,'left',true);this.text(node.role,90,y+82,23,'#effaff','left');
      this.text(node.detail,90,y+126,23,'#d9e8f1','left');
      this.text(i?'向上320 · 宽240 · 最多2敌各75%':'额外200%直伤 · 邻敌75% / 范围120',90,y+166,22,'#bdd8e7','left');
      this.text(i?'箱门/保护阻断 · 闭盾减伤后阻断':'每目标冷却0.35秒 · 不递归引爆',90,y+207,22,'#bdd8e7','left');
      this.text('选此精研　›',625,y+244,25,color,'right');this.buttons.push({x:65,y,w:590,h:275,action:`branch:${branch}`,label:node.name});
    }
    this.text(`花费1技能点 · 弹道系数+10% · 本局不改选`,360,1000,22,'#f0d19a');this.button('返回升级选择',1080,'branch-back');
  }
  private drawIonBranch(){
    this.rect(35,120,650,1080,'#102330');this.text('离子精研 · 二选一',360,190,40,'#effaff','center',true);
    this.text('原6击放电保留 · 本次电弧精调仍增伤',360,250,23,'#bdd8e7');
    for(const [i,branch] of (['ion-orb','ion-spear'] as const).entries()){
      const node=ionAugments[branch],y=325+i*305,color=i?'#b8dcff':'#b7fff0',preview=buildPreview(this.world,'electric',branch),power=1+permanentPower(this.world.growth)/100;
      this.rect(65,y,590,275,'#203e50');this.rect(65,y,5,275,color);
      this.text(node.name,90,y+38,34,color,'left',true);this.text(node.role,90,y+82,21,'#effaff','left');
      this.text(node.detail,90,y+126,22,'#d9e8f1','left');
      this.text(i?'寻敌400 · 单矛回击75% · 箱门/闭盾阻挡':'持续1秒 · 向前漂移260 · 箱门/闭盾阻挡',90,y+166,21,'#bdd8e7','left');
      this.text(`电弧直击 ${+(preview.before.damage[0]*power).toFixed(1)} → ${+(preview.after.damage[0]*power).toFixed(1)}`,90,y+207,22,'#bdd8e7','left');
      this.text('选此精研　›',625,y+244,25,color,'right');this.buttons.push({x:65,y,w:590,h:275,action:`branch:${branch}`,label:node.name});
    }
    this.text('花费1技能点 · 本局不改选 · 后续仍可精调',360,1000,22,'#f0d19a');this.button('返回升级选择',1080,'branch-back');
  }
  private drawPhotonBranch(){
    this.rect(35,120,650,1080,'#102330');this.text('光链精研 · 二选一',360,190,40,'#effaff','center',true);
    this.text('常规精调照常增伤 · 旧激光、光链与聚能保留',360,250,23,'#bdd8e7');
    for(const [i,branch] of (['photon-reach','photon-focus'] as const).entries()){
      const node=photonAugments[branch],y=325+i*305,color=i?'#e7b7ff':'#9defff',preview=buildPreview(this.world,'optical',branch),power=1+permanentPower(this.world.growth)/100;
      this.rect(65,y,590,275,'#203e50');this.rect(65,y,5,275,color);
      this.text(node.name,90,y+38,34,color,'left',true);this.text(node.role,90,y+82,23,'#effaff','left');
      this.text(node.detail,90,y+126,23,'#d9e8f1','left');
      this.text(i?'无邻敌才聚能 · 不绕过护盾与保护':'跳伤80% / 64% / 51.2% · 不重复命中',90,y+166,22,'#bdd8e7','left');
      this.text(`激光直伤 ${+(preview.laserBefore.laserDamage*power).toFixed(1)} → ${+(preview.laserAfter.laserDamage*power).toFixed(1)}`,90,y+207,22,'#bdd8e7','left');
      this.text('选此精研　›',625,y+244,25,color,'right');this.buttons.push({x:65,y,w:590,h:275,action:`branch:${branch}`,label:node.name});
    }
    this.text('花费1技能点 · 本局不改选 · 后续仍可精调',360,1000,22,'#f0d19a');
    this.button('返回升级选择',1080,'branch-back');
  }
  private drawMagneticBranch(){
    this.rect(35,120,650,1080,'#102330');this.text('磁暴精研 · 二选一',360,190,40,'#effaff','center',true);
    this.text('电弧精调照常生效 · 原三拍与旧武器保留',360,250,23,'#bdd8e7');
    for(const [i,branch] of (['field-wide','field-link'] as const).entries()){
      const power=1+permanentPower(this.world.growth)/100,node=magneticAugments[branch],y=325+i*305,preview=buildPreview(this.world,'electric',branch),color=i?'#b6dbff':'#9df5e5';
      this.rect(65,y,590,275,'#203e50');this.rect(65,y,5,275,color);
      this.text(node.name,90,y+38,34,color,'left',true);this.text(node.role,90,y+82,23,'#effaff','left');
      this.text(node.detail,90,y+126,23,'#d9e8f1','left');
      this.text(i?'每拍场外一敌 · 不递归、不充箱门':'每拍35%→50% · 场内压制与覆盖兼顾',90,y+166,22,'#bdd8e7','left');
      this.text(`电弧直击 ${+(preview.before.damage[0]*power).toFixed(1)} → ${+(preview.after.damage[0]*power).toFixed(1)}`,90,y+207,22,'#bdd8e7','left');
      this.text('选此精研　›',625,y+244,25,color,'right');this.buttons.push({x:65,y,w:590,h:275,action:`branch:${branch}`,label:node.name});
    }
    this.text('花费1技能点 · 本局选定不改选 · 后续仍可精调',360,1000,22,'#f0d19a');
    this.button('返回升级选择',1080,'branch-back');
  }
  private drawElectricBranch(){
    this.rect(35,120,650,1080,'#102330');
    this.text('雷电改造 · 三选一',360,190,40,'#effaff','center',true);
    this.text('原电弧保留 · 都将跳电范围提升至220',360,250,25,'#bdd8e7');
    for(const [i,branch] of (['spread','capacitor','seeker'] as const).entries()){
      const node=electricBranches[branch],y=295+i*215,color=branch==='spread'?'#adf3bf':branch==='seeker'?'#ffda92':'#c7b1ff';
      this.rect(65,y,590,200,'#203e50');this.rect(65,y,5,200,color);
      this.text(node.name,90,y+32,31,color,'left',true);this.text(node.role,90,y+68,24,'#effaff','left');
      this.text(branch==='spread'?'每发电弧额外多跳一名敌人':branch==='seeker'?'首跳340 · 优先蓄能射手，再普通射手':`${ELECTRIC_FORK.hits}格蓄爆追加${ELECTRIC_FORK.damage*100}% · 链电不积层`,90,y+105,23,'#d9e8f1','left');
      this.text(branch==='spread'?'伤害与原跳数保留 · 适合密集群敌':branch==='seeker'?'原伤害与跳数保留 · 后续跳距220':'击破带电目标接力220内 · 最多留2格',90,y+141,22,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+177,24,color,'right');
      this.buttons.push({x:65,y,w:590,h:200,action:`branch:${branch}`,label:node.name});
    }
    this.text('本局选定不可切换 · 后续风暴与旧武器保留',360,965,23,'#f0d19a');
    this.button('返回升级选择',1050,'branch-back');
  }
  private overdriveFooter(back:string,action:string,y:number){
    for(const [i,item]of [{label:back,action},{label:this.world.overdriveForm?'超载协议 · 已装载':'超载协议 · 二选一',action:'overdrive-open'}].entries()){
      const x=65+i*300;this.rect(x,y,290,78,i?'#3c3c38':'#203e50');this.text(item.label,x+145,y+39,24,i?'#ffe2a0':'#d8eaf5','center',true);this.buttons.push({x,y,w:290,h:78,label:item.label,action:item.action});
    }
  }
  private drawOverdrive(){
    const w=this.world,chosen=w.overdriveForm,power=1+permanentPower(w.growth)/100;
    this.rect(35,115,650,1080,'#102330');this.text('超载协议 · 二选一',360,185,38,'#ffe2a0','center',true);
    this.text(`第${OVERDRIVE.mastery}次突破解锁 · 本局免费 · 不消耗技能点`,360,245,23,'#bdd8e7');
    this.text('原武器、激光与超载增伤提速全部保留',360,287,23,'#c4dca9');
    for(const [i,kind]of (['lance','circuit']as const).entries()){
      const info=overdriveForms[kind],y=345+i*290,owned=chosen===kind,enabled=!chosen&&w.canChooseOverdrive();
      this.rect(65,y,590,264,owned?'#35433f':'#203e50');this.rect(65,y,5,264,kind==='lance'?'#ffd28a':'#91e5ff');
      this.text(info.name+(owned?' · 已装载':''),92,y+44,32,kind==='lance'?'#ffe2a0':'#a6ecff','left',true);
      this.text(info.role,92,y+92,24,'#effaff','left');
      this.text(`超载中每${OVERDRIVE.interval}秒 · 首击${+(info.damage*power*OVERLOAD.damage).toFixed(1)}伤害`,92,y+139,23,'#f2d598','left');
      this.text(info.detail,92,y+182,22,'#bdd8e7','left');
      this.text(kind==='lance'?'伤害90×常驻火力×超载1.35 · 最多3敌':`首击范围${OVERDRIVE.range} · 后跳范围${OVERDRIVE.chainRange} · 闭盾截链`,92,y+221,20,'#a9c9dc','left');
      if(enabled)this.buttons.push({x:65,y,w:590,h:264,label:'装载'+info.name,action:'overdrive:'+kind});
    }
    this.text(chosen?'本局选择已锁定 · 后续每次超载自动追加':'可以稍后再选 · 选定后本局锁定',360,983,24,'#f0d19a');
    this.button(chosen?'返回':'稍后选择',1060,'overdrive-back',true);
  }
  private drawBuildChoices() {
    this.buttons=[];
    this.rect(35,150,650,1000,'#102330');
    this.text((this.world.growth.mastery??0)===0&&this.world.researchPoints>0?'装备研发 · 选择升级路线':'战地改造 · 选择升级路线',360,220,34,'#effaff','center',true);
    this.text(`可用${this.world.buildPoints-this.world.build.spent}点 · 研发${this.world.researchPoints} + 充能突破${this.world.growth.mastery??0}`,360,270,24,'#b8d4e3');
    this.text('直伤含常驻火力 · 不计超载、命中率与派生',360,305,20,'#bdd8e7');
    const available=this.world.build.available(this.world.buildPoints);
    for(const [i,route] of routes.entries()){
      const rank=this.world.build.ranks[route],y=330+i*235,node=route==='ballistic'&&this.world.canFuseAmmo()?{name:'复合弹芯 · 二选一'}:route==='ballistic'&&this.world.canRefineStorm()?{name:'雷暴精研 · 二选一'}:route==='ballistic'&&this.world.canRefineFracture()?{name:'裂甲精研 · 二选一'}:route==='optical'&&this.world.canFuseOptics()?{name:'双镜复合 · 二选一'}:route==='optical'&&this.world.canRefinePhoton()?{name:'光链精研 · 二选一'}:route==='electric'&&this.world.canRefineMagnetic()?{name:'磁暴精研 · 二选一'}:route==='electric'&&this.world.canRefineIon()?{name:'离子精研 · 二选一'}:this.world.build.next(route);
      const enabled=available.includes(route);
      const preview=buildPreview(this.world,route),color=['#ffd28a','#c6a1ff','#7fe4ff'][i],goalHint=recipeRouteHint(this.world,this.save.recipeGoal,route);
      this.rect(65,y,590,205,enabled?'#203e50':'#15232e');
      this.rect(65,y,4,205,enabled?color:'#435462');
      this.text(`${['弹道','雷电','光学'][i]}路线 · ${rank}/3 · 精调${this.world.build.refinements[route]}`,90,y+35,26,color,'left');
      this.text(node?.name??'路线已完成',90,y+83,30,enabled?'#effaff':'#8396a2','left',true);
      this.text(preview.gain,90,y+128,23,enabled?'#e1f7ff':'#8396a2','left');
      this.text(goalHint?.text??preview.plan,90,y+174,21,enabled?'#c4dca9':'#8396a2','left');
      if(goalHint?.advances)this.text('目标所需',625,y+35,20,'#ffe19a','right',true);
      if(enabled)this.text('›',625,y+80,32,color,'right',true);
      if(enabled)this.buttons.push({x:65,y,w:590,h:205,action:`build:${route}`,label:node!.name});
    }
    if((this.world.growth.mastery??0)>=OVERDRIVE.mastery)this.overdriveFooter('查看技能树','tree',1050);else this.button('查看完整技能树',1050,'tree');
  }
  private drawRunReport(){
    const w=this.world,r=runReport(w,this.runAchievements,this.save.achievements.unlocked,this.save.achievements.tracked);
    this.buttons=[];this.rect(0,0,720,1280,'#050e18dd');this.rect(35,90,650,1140,'#102330');
    this.text('本局战绩',360,145,34,'#effaff','center',true);this.text(w.score.toString(),360,205,62,'#eff8ff','center',true);
    this.rect(70,110,160,60,'#244653');this.text('火力复盘',150,140,24,'#ffe1a4');this.buttons.push({x:70,y:110,w:160,h:60,action:'loadout',label:'火力复盘'});
    this.rect(490,110,160,60,'#244653');this.text('实战贡献',570,140,24,'#80e4ff');this.buttons.push({x:490,y:110,w:160,h:60,action:'contribution',label:'实战贡献'});
    this.text(r.rapid,360,252,20,'#ffd99a');
    this.text(`${this.runNewBest?'刷新最高分':'最高分'} ${this.save.best}`,360,284,22,'#e8c88b');
    this.text(`存活 ${Math.floor(w.time/60)}:${Math.floor(w.time%60).toString().padStart(2,'0')} · 第${w.round}轮 · 火力叠加${w.activeWeapons.length}种`,360,319,23,'#bdd8e7');
    this.text(r.power.label,360,345,26,'#ffdc8a','center',true);
    for(let i=0;i<2;i++)this.text(r.weapons.slice(i*3,i*3+3).join(' / '),360,374+i*34,23,'#c2edff');
    for(const [i,line] of r.routes.entries())this.text(line,78,450+i*36,23,['#ffd28a','#c6a1ff','#7fe4ff'][i],'left');
    this.text(r.combat,360,577,24,'#effaff');this.text(r.contracts,360,614,23,'#bdd8e7');
    for(const [i,line] of r.mechanics.entries())this.text(line,360,r.mechanics.length>2?644+i*28:655+i*34,22,'#cddfea');
    const goal=this.save.recipeGoal?recipeStatus(w,this.save.recipeGoal):null;
    const next=goal?goal.ready?`${goal.name}已成形 · 下局可换目标或挑战构筑检验`:`继续${goal.name}：${goal.need}`:r.next;
    this.text(r.fresh,360,737,23,'#ffdc8a');this.text('下一局目标',360,786,24,'#aee7ff','center',true);this.text(next,360,824,goal?20:22,'#d6e7f0');
    if(w.lastDamageCause)this.text({bullet:'敌弹击毁 · 留意已发射子弹的空隙',enemy:'碰撞敌机 · 留出横向避让空间',crate:'撞上箱体 · 先击碎再拾取'}[w.lastDamageCause],360,873,22,'#edbc98');
    this.button('再次突围　›',920,'start',true);this.button('查看成就',1020,'achievements');this.button('返回主界面',1120,'home');
  }
  private drawDialog() {
    if(this.mode==='result'){this.drawRunReport();return;}
    if (this.mode === 'paused' && this.pausePreview) {
      this.buttons = [];
      const bannerY=this.world.phase==='boss'||this.world.phase==='boss-entry'?980:170;
      this.rect(80, bannerY, 560, 64, '#081a25ee');
      this.text('战场已冻结 · 看清危险再继续', 360, bannerY+32, 27, '#e3f4ff', 'center', true);
      this.button('继续战斗', 1070, 'resume', true);
      this.button('返回暂停菜单', 1170, 'pause-menu');
      return;
    }
    this.rect(0, 0, 720, 1280, '#050e18cc'); this.rect(70, 340, 580, this.mode === 'settings' ? this.platform.openLicenses ? 800 : 710 : this.mode === 'paused' ? 790 : 640, '#122331f5');
    this.buttons = [];
    if (this.mode === 'paused') {
      this.text('暂停', 360, 420, 48, '#eff8ff', 'center', true); this.text(this.pauseReason || '准备好了，再继续突围。', 360, 490, 26, '#a9bfce');
      this.button('继续战斗', 560, 'resume', true); this.button('设置', 670, 'settings'); this.button('返回主界面', 780, 'home');
      this.button('查看战场', 890, 'preview');
      this.button('当前火力与参数', 1000, 'loadout');
    } else if (this.mode === 'settings') {
      const s = this.save.settings;
      this.text('设置', 360, 415, 48, '#eff8ff', 'center', true);
      this.button(`特效　${s.effects === 'standard' ? '标准' : '弱化'}`, 490, 'effects');
      this.button(`屏幕震动　${s.shake ? '开' : '关'}`, 600, 'shake'); this.button(`音效　${s.sound ? '开' : '关'}`, 710, 'sound');
      this.button(`音乐　${s.music ? '开' : '关'}`, 810, 'music');
      if (this.platform.openLicenses) {
        this.button('开源许可', 910, 'licenses');
        this.button('返回', 1010, 'back', true);
      } else this.button('返回', 920, 'back', true);
    }
  }
  diagnostics() {
    return { drawCount: this.drawCount, callbackCount: this.callbackCount,
      minelayers:this.world.bodies.filter(b=>b.active&&b.pattern==='minelayer').map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,hp:b.hp,maxHp:b.maxHp,warning:b.warning,shots:b.mineShots??0,passed:b.minePassed??0,touched:!!b.mineTouched,damageStart:b.mineDamageStart,firedAt:b.mineFiredAt})),mines:this.world.bullets.filter(b=>b.hostile&&b.mine).map(b=>({id:b.id,source:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy,age:b.age,radius:MINELAYER.radius})),
      closingStatus:this.world.closingStatus,closingClears:this.world.closingClears,overdriveForm:this.world.overdriveForm??null,overdriveShots:this.world.overdriveShots,overdriveHits:this.world.overdriveHits,
      bossWeave:this.world.bodies.filter(b=>b.active&&b.kind==='boss'&&isWeaveBoss(b)).map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,attack:b.attack,warning:b.warning,beat:b.weaveBeat??0,volleys:b.weaveVolleys??0,shots:b.weaveShots??0,firedAt:b.weaveFiredAt,firedBeat:b.weaveFiredBeat,ports:b.weaveFiredPorts??0})),bossPlateFragments:this.bossFragments.pieces.length,bossSalvage:this.world.bodies.filter(b=>b.active&&b.kind==='boss').map(b=>({id:b.id,count:bossSalvageCount(b),hp:b.hp,maxHp:b.maxHp})),
      combatCopy:this.presentedCopy?{...this.presentedCopy,lines:[...this.presentedCopy.lines],rows:this.presentedCopy.rows.map(r=>({...r})),bounds:{...this.presentedCopy.bounds}}:null,
      combatNotice:this.presentedNotice?{...this.presentedNotice}:null,
      pickupSignals:this.world.bodies.filter(b=>b.kind==='pickup').map(b=>({id:b.id,x:b.x,y:b.y,...pickupSignal(b)})),
      mode: this.mode, time: this.world.time,roundTime:this.world.roundTime,phaseTime:this.world.phaseTime, round: this.world.round, phase: this.world.phase, buildRanks:{...this.world.build.ranks}, buildRefinements:{...this.world.build.refinements}, activeWeapons:this.world.activeWeapons,
      supportBeams:this.supportBeams.length,laserCharge:this.world.laserCharge(),lastLaserAt:Number.isFinite(this.opticalFiredAt)?this.opticalFiredAt:null,opticalBand:laserVisualBand(this.world.growth.mastery,this.world.build.ranks.optical),laserBands:this.supportBeams.filter(b=>b.laser).map(b=>b.opticalBand??1),opticalImpacts:this.impacts.filter(i=>i.opticalBand).length,
      weaponLevels:Object.fromEntries(this.world.activeWeapons.map(kind=>[kind,this.world.weaponStage(kind)])),
      weaponCalibrations:Object.fromEntries(this.world.activeWeapons.map(kind=>[kind,this.world.weaponCalibration(kind)])),
      calibrationBands:Object.fromEntries(this.world.activeWeapons.map(kind=>[kind,calibrationVisualBand(this.world.weaponCalibration(kind))])),calibratedShots:this.world.bullets.filter(b=>!b.hostile&&b.calibrationBand).map(b=>({id:b.id,kind:b.weaponKind,band:b.calibrationBand})),
      contractStatus:this.world.contract?.status??null,contractRewardPending:!!this.world.contractReward,bossRewardRound:this.world.bossRewardRound,bossLootStats:{...this.world.bossLootStats},
      battlePlan:this.world.battlePlan,battleBrief:battleBrief(this.world.round,this.world.battlePlan),nextBattlePlan:this.save.nextBattlePlan,openingWeapon:this.world.openingWeapon??null,savedOpeningWeapon:this.save.openingWeapon,openingSupplies:this.world.bodies.filter(b=>b.active&&b.openingSupply).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,weapon:b.weaponKind,stage:b.stage})),score: this.world.score, hp: this.world.player.hp, growth: { ...this.world.growth }, weaponKind: this.world.weaponKind,
      playerX: this.world.player.x,
      inputMode: this.inputMode,
      bankShots:this.world.bankShots??0,bankReflections:this.world.bankReflections??0,lastBankReflection:this.world.lastBankReflection,bankGuns:this.world.bodies.filter(b=>b.pattern==='bankshot').map(b=>({id:b.id,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,shots:b.bankShots??0,firedAt:b.bankFiredAt})),bankProjectiles:this.world.bullets.filter(b=>b.bankRemaining!==undefined).map(b=>({id:b.id,x:b.x,y:b.y,vx:b.vx,vy:b.vy,remaining:b.bankRemaining,source:b.sourceId})),
      combatContribution:combatContribution(this.world),
      magneticProofTargets:this.world.bodies.filter(b=>b.active&&b.proofTarget&&b.proofRound===this.world.round).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,group:b.proofGroup,shots:b.proofShots??0})),magneticProofHits:this.world.magneticProofHits,magneticCertifications:[...this.world.magneticCertifications],savedMagneticCertifications:[...this.save.achievements.magneticCertifications],proofKind:this.world.contract?.proof?.kind??null,proofGroupCount:this.world.contract?.proofGroupCount??0,proofProgress:this.world.contract?.proofProgress??0,proofWins:this.world.proofWins,aceWins:this.world.aceWins,flawlessAceWins:this.world.flawlessAceWins,certifiedBuilds:[...this.world.certifiedBuilds],trackedAchievement:this.save.achievements.tracked,savedCertifications:[...this.save.achievements.certifiedBuilds],stormAugment:this.world.build.stormAugment??null,stormRelayLinks:this.world.stormRelayLinks,stormFocusBursts:this.world.stormFocusBursts,stormFocusDamage:this.world.stormFocusDamage,stormProofRelay:this.world.proofCount('storm-relay'),stormProofFocus:this.world.proofCount('storm-focus'),stormCharges:this.world.bodies.filter(b=>b.active&&b.stormHits).map(b=>({id:b.id,x:b.x,y:b.y,hits:b.stormHits})),stormLinks:this.world.stormLinks,prismHits:this.world.prismHits,
      contractKind:this.world.contract?.kind??null,huntChoice:this.huntChoice,huntKind:this.world.contract?.kind==='hunter'?this.world.contract.hunt:null,bountyShots:this.world.bountyShots,bountyEnemies:this.world.bodies.filter(b=>b.active&&b.bountyRound!==undefined).map(b=>({id:b.id,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,warning:b.warning,shots:b.bountyShots??0,pattern:b.pattern,aceRole:b.aceRole,rage:b.aceEnraged??false,ragePending:b.aceRagePending??false,rageShots:b.aceRageShots??0})),bountyKills:this.world.contract?.targetKills??0,bountyTargets:this.world.bodies.filter(b=>b.active&&b.bountyRound!==undefined&&b.bountyRound===this.world.contract?.round).length,
      sectorGround:{asset:['runway.jpg','cooling-corridor-v2.jpg','armored-corridor-v1.jpg'][this.mode==='menu'?0:sectorIndex(this.world.round)],distance:this.groundDistance,rotorTime:this.world.time,rotors:this.mode!=='menu'&&sectorIndex(this.world.round)===1?6:0},flankHunters:this.world.bodies.filter(b=>b.active&&b.flankReserve).map(b=>({id:b.id,kind:b.kind,pattern:b.pattern,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,lane:b.lane,lockX:b.lockX})),bastionBarrage:this.world.bodies.filter(b=>b.active&&b.kind==='boss'&&b.bossVariant===2).map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,attack:b.attack,beat:b.barrageBeat??0,lane:b.barrageLane??b.lane,firedBeat:b.barrageFiredBeat??null,firedAt:b.barrageFiredAt??null,ports:b.barrageFiredPorts??0,shots:b.barrageShots??0,volleys:b.barrageVolleys??0,warning:b.warning,timer:b.timer})),wingShear:this.world.bodies.filter(b=>b.active&&b.kind==='boss'&&b.bossVariant===1).map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,attack:b.attack,beat:b.wingBeat??0,firedBeat:b.wingFiredBeat??null,firedAt:b.wingFiredAt??null,shots:b.wingShots??0,volleys:b.wingVolleys??0,warning:b.warning,timer:b.timer})),bossCounterfire:this.world.bodies.some(b=>b.active&&b.kind==='boss'&&b.counterfire),bossCounterShots:this.world.bodies.find(b=>b.active&&b.kind==='boss')?.counterShots??0,bossCounterVolleys:this.world.bodies.find(b=>b.active&&b.kind==='boss')?.counterVolleys??0,
      bossFormation:this.world.bossFormation?.id??null,activeEscorts:this.world.activeEscorts.length,escortSpawns:this.world.escortSpawns,escortKills:this.world.escortKills,tacticalWins:this.world.tacticalWins,bossShield:this.world.bossShieldActive(),
      dropSpawns:this.world.dropSpawns,dropKills:this.world.dropKills,arcLinks:this.world.arcLinks,protectedDrops:this.world.bodies.filter(b=>b.active&&(b.dropGrace??0)>0).length,
      fireControlShots:this.world.fireControlShots,fireControlBoostedShots:this.world.fireControlBoostedShots,lastFireControlBreak:this.world.lastFireControlBreak,fireControlUnits:this.world.bodies.filter(b=>b.active&&b.pattern==='fire-control').map(b=>({id:b.id,kind:b.kind,shutter:!!b.controlShutter,closed:shutterClosed(b),patrol:!!b.controlPatrol,home:b.controlHomeX,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,group:b.controlGroup,source:fireControlSource(b,this.world.bodies)?.id,emp:b.empRemaining??0,shots:b.controlShots??0,boosted:b.controlBoostedShots??0})),
      relayScreen:this.world.bodies.filter(b=>b.active&&b.pattern==='relay-screen').map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,closed:guardClosed(b),shieldTurn:b.shieldTurn,empRemaining:b.empRemaining??0,shots:b.formationShots??0})),conduitBursts:this.world.conduitBursts,empTargets:this.world.empTargets,conduitTacticalWins:this.world.conduitTacticalWins,offlineEnemies:this.world.bodies.filter(b=>b.active&&(b.empRemaining??0)>0).length,empWaves:this.empWaves.length,
      recipeGoal:this.save.recipeGoal?recipeStatus(this.world,this.save.recipeGoal):null,goalSupplies:this.world.bodies.filter(b=>recipeSupplyMatch(this.world,this.save.recipeGoal,b)).map(b=>({id:b.id,kind:b.kind,weapon:b.weaponKind,stage:b.stage,refit:!!b.refit})),mobileSentries:this.world.bodies.filter(b=>b.active&&b.pattern==='relocate').map(b=>({x:b.x,y:b.y,lane:b.lane,age:b.age,warning:b.warning,volleys:b.sentryVolleys??0,direction:sentryDirection(b)})),
      interceptorBreaks:this.world.interceptorBreaks,interceptors:this.world.bodies.filter(b=>b.active&&b.pattern==='intercept').map(b=>({id:b.id,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,warning:b.warning,beat:b.burst,wingShots:b.interceptWingShots??0,coreShots:b.interceptCoreShots??0})),
      refitsClaimed:this.world.refitsClaimed,
      enemyProjectileScale:enemyProjectileScale(this.world.round),
      framePulses:this.framePulses,renderedMode:this.renderedMode,imageCount:this.images.size,
      runNewBest:this.runNewBest,bossWins:this.world.bossWins,contractStats:{...this.world.contractStats},runAchievements:[...this.runAchievements],
      researchPoints:this.world.researchPoints,buildPoints:this.world.buildPoints,unspentBuildPoints:this.world.buildPoints-this.world.build.spent,
      ballisticReactions:this.world.ballisticReactions(),ballisticTotals:this.world.ballisticTotals(),ballisticBranch:this.world.build.ballisticBranch??null,scatterRicochets:this.world.scatterRicochets,ricochetTraces:this.supportBeams.filter(b=>b.ricochet).length,scatterPierces:this.world.scatterPierces,scatterBursts:this.world.scatterBursts,scatterSplashHits:this.world.scatterSplashHits,
      weaponImpacts:this.impacts.filter(h=>!h.opticalBand).map(h=>({...h})),
      equipmentHud:this.equipmentHud&&this.world.time<this.equipmentHud.until?{text:this.equipmentHud.text,remaining:this.equipmentHud.until-this.world.time}:null,
      upgradePulseRemaining:Math.max(0,this.upgradeUntil-this.world.time),combatFeedback:this.buildFeedback?{title:this.buildFeedback.title,combo:this.buildFeedback.combo,remaining:Math.max(0,this.buildFeedback.until-this.world.time),hidden:this.buildFeedback.hidden}:null,pendingCombatFeedback:this.pendingBuildFeedback.map(f=>({title:f.title,combo:f.combo,remaining:f.remaining})),
      equipmentReceipts:this.equipmentFeedback.pending.map(r=>({...r})),equipmentReceipt:this.buildFeedback?.equipment?{...this.buildFeedback}:null,
      ionAugment:this.world.build.ionAugment??null,ionOrbSpawns:this.world.ionOrbSpawns,ionOrbHits:this.world.ionOrbHits,ionSpearShots:this.world.ionSpearShots,ionSpearHits:this.world.ionSpearHits,ionBonusDamage:this.world.ionBonusDamage,ionOrbs:this.world.ionOrbs,ionSpears:this.world.ionSpears,
      ionCharge:this.world.ionCharge,ionBursts:this.world.ionBursts,ionHits:this.world.ionHits,
      electricBranch:this.world.build.electricBranch??null,seekerLinks:this.world.seekerLinks,capacitorBursts:this.world.capacitorBursts,capacitorTransfers:this.world.capacitorTransfers,capacitorRecovered:this.world.capacitorRecovered,
      opticalBranch:this.world.build.opticalBranch??null,opticalFusion:this.world.build.opticalFusion??null,burnHits:this.world.burnHits,relayHits:this.world.relayHits,mirrorShots:this.world.mirrorShots,mirrorHits:this.world.mirrorHits,mirrorBounces:this.world.mirrorBounces,mirrorDoubleHits:this.world.mirrorDoubleHits,mirrorBeams:this.supportBeams.filter(b=>b.mirror).length,
      photonAugment:this.world.build.photonAugment??null,laserChainProfile:laserChainProfile(this.world.build.photonAugment),laserChainUnlocked:this.world.laserChainUnlocked(),laserChainReady:this.world.laserChainReady,laserArcHits:this.world.laserArcHits,laserFocusHits:this.world.laserFocusHits,laserArcBeams:this.arcs.filter(a=>a.photon&&!a.focus).length,laserFocusBeams:this.arcs.filter(a=>a.focus).length,
      fractureAugment:this.world.build.fractureAugment??null,fractureProfile:this.world.fractureProfile(),fractureFinishWaves:this.world.fractureFinishWaves,fractureFinishHits:this.world.fractureFinishHits,fractureWaveDamage:this.world.fractureWaveDamage,lastFractureWaveHit:this.world.lastFractureWaveHit,fractureWaves:this.world.fractureWaves,fractureWaveHits:this.world.fractureWaveHits,fractureWaveBeams:this.supportBeams.filter(b=>b.fractureWave).length,fractureUnlocked:this.world.fractureUnlocked(),fractureBursts:this.world.fractureBursts,
      lastMagneticHit:this.world.lastMagneticHit,lastMagneticRefinementHit:this.world.lastMagneticRefinementHit,magneticWideHits:this.world.magneticWideHits,magneticAugment:this.world.build.magneticAugment??null,magneticLinkHits:this.world.magneticLinkHits,magneticUnlocked:this.world.magneticUnlocked(),magneticBursts:this.world.magneticBursts,magneticHits:this.world.magneticHits,magneticFields:this.world.magneticFields.map(f=>({...f})),
      boosterGuns:this.world.bodies.filter(b=>b.active&&b.pattern==='booster').map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,hp:b.hp,maxHp:b.maxHp,warning:b.warning,shots:b.boosterShots??0,firedAt:b.boosterFiredAt,spent:!!b.boosterSpent})),boosterProjectiles:this.world.bullets.filter(b=>b.boostFactor!==undefined).map(b=>({id:b.id,source:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy,age:b.age,boostAfter:b.boostAfter??null,factor:b.boostFactor})),
      rakeGuns:this.world.bodies.filter(b=>b.active&&b.pattern==='rake').map(b=>({id:b.id,x:b.x,y:b.y,hp:b.hp,warning:b.warning,volley:b.rakeVolley??0,shots:b.rakeShots??0,firedVolley:b.rakeFiredVolley,firedAt:b.rakeFiredAt})),
      sweepers:this.world.bodies.filter(b=>b.active&&b.pattern==='sweep').map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,age:b.age,lane:b.lane,dropGrace:b.dropGrace,hp:b.hp,warning:b.warning,shots:b.sweeperShots??0,direction:sweeperDirection(b)})),
      pendingMineCounter:this.world.pendingMineCounter,minePreemptWins:this.world.minePreemptWins,mineCounterWins:this.world.mineCounterWins,lockPreemptWins:this.world.lockPreemptWins,lockBaitWins:this.world.lockBaitWins,lockshotSpawns:this.world.lockshotSpawns,lockshotShots:this.world.lockshotShots,lockshotEnemies:this.world.bodies.filter(b=>b.active&&b.pattern==='lockshot').map(b=>({id:b.id,x:b.x,y:b.y,age:b.age,hp:b.hp,lockedX:b.lockX,warning:b.warning,attempted:b.lockShots??0,accepted:b.lockAcceptedShots??0,passed:b.lockPassed??0,damageAtAdmission:b.lockDamageStart,firedAt:b.lockFiredAt,emp:b.empRemaining??0})),hostileProjectiles:this.world.bullets.filter(b=>b.hostile).map(b=>({id:b.id,source:b.sourceId,x:b.x,y:b.y,vx:b.vx,vy:b.vy})),refitTarget:this.world.refitTarget??null,directedSupplies:this.world.bodies.filter(b=>b.active&&b.directedRefit).map(b=>({id:b.id,kind:b.kind,weapon:b.weaponKind,row:b.row,x:b.x,y:b.y})),lastEquipmentPickup:this.world.lastEquipmentPickup,driftSupplies:this.world.bodies.filter(b=>b.active&&b.pattern==='drift-supply').map(b=>({id:b.id,row:b.row,x:b.x,y:b.y,age:b.age,hp:b.hp,maxHp:b.maxHp,kind:b.weaponKind,refit:b.refit,settled:b.age>=DRIFT_SUPPLY.settle})),bodies: this.world.bodies.length, bullets: this.world.bullets.length, particles: this.particles.length,hotParticles:this.particles.filter(p=>p.hot!==false).length, ammoFragments:this.blasts.filter(b=>b.ammo).length,blasts: this.blasts.length,arcs:this.arcs.length,
      effectsMode:this.save.settings.effects,bossDestructionAge: this.destruction?.age ?? null,
      crateFragments: this.crateDebris.pieces.length,
      droneFragments: this.enemyWreck.pieces.filter(p => p.kind === 'drone').length,
      enemyFragments: this.enemyWreck.pieces.length,
      supplyCombinations:this.world.bodies.filter(b=>b.active&&(b.kind==='crate'||b.kind==='pickup')).map(b=>({id:b.id,kind:b.kind,weapon:b.weaponKind??this.world.weaponKind,row:b.row,x:b.x,y:b.y,combinations:supplyCombinations(this.world,b,this.save.recipeGoal)})),bossWear:this.world.bodies.filter(b=>b.active&&b.kind==='boss').map(b=>({id:b.id,variant:b.bossVariant??0,band:bossWearBand(b),hp:b.hp,maxHp:b.maxHp,hit:b.hit})),gateReceipts: this.gateFeedback.receipts.length,gateReceiptDetails:this.gateFeedback.receipts.map(r=>({...r,lines:[...r.lines]})),
      callbackWork:{...this.callbackWork.snapshot(),maxMs:this.maxCallbackWorkMs},interruptedFrames:this.interruptedFrames.map(frame=>({...frame})),
      ...this.frameTimes.snapshot() };
  }
}

export function parseSave(value: unknown): Save {
  const result = defaults();
  if (typeof value !== 'object' || value === null) return result;
  const data = value as Partial<Save>;
  if (data.version !== 1) return result;
  result.achievements = parseAchievements(data.achievements);
  result.recipeGoal=parseRecipeGoal(data.recipeGoal);result.openingWeapon=parseOpeningWeapon(data.openingWeapon);
  result.nextBattlePlan=parseBattlePlan(data.nextBattlePlan);
  if (Number.isFinite(data.best) && data.best! >= 0) result.best = Math.floor(data.best!);
  if (data.settings?.effects === 'weak') result.settings.effects = 'weak';
  for (const key of ['shake', 'sound', 'music'] as const) if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
  return result;
}
