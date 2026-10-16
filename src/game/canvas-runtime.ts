import {bossHeatLight} from './boss-heat-light';
import {buildProofs,type BuildProof} from '../core/build-proof';
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
import { capacitorLight, capacitorMarks } from './capacitor-light';
import { formationShield } from './formation-shield';
import { burnLight } from './burn-light';
import { fractureLight, fractureMarks } from './fracture-light';
import { FRACTURE } from '../core/combos';
import { mountedRig } from './mounted-rig';
import { contracts, type ContractKind } from '../core/contracts';
import { achievements, awardAchievements, parseAchievements } from '../core/achievements';
import { tree, routes, opticalBranches, electricBranches, ballisticBranches, BALLISTIC_FORK, OPTICAL_FORK, ELECTRIC_FORK, type BuildBranch, type Route } from '../core/build-tree';
import { overloadWake, coilDischarge, chainArc, energyShot, projectileBody, muzzleLight, detonationLight, sparkLight, impactLight } from './combat-light';
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
import { GateFeedback } from './gate-feedback';
import { contextGuide, weaponGuide } from './context-guide';
import { dossierWeapons, weaponDossier } from './weapon-dossier';
import { supportLight } from './support-light';
import { HorizontalKeys } from './horizontal-keys';
import { droneFrame } from './drone-motion';
import { chargerFrame } from './charger-motion';
import { armorFrame } from './armor-motion';
import { eliteFrame } from './elite-motion';
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
interface Particle { x: number; y: number; vx: number; vy: number; life: number; total: number; color: string }
interface Blast { ion?:boolean; electric?: boolean; fracture?: boolean; x: number; y: number; size: number; life: number; total: number }
const fonts = '"Microsoft YaHei", "PingFang SC", sans-serif';

/** Shared production canvas surface for WeChat and the browser compatibility harness. */
export class CanvasRuntime {
  world = new World();
  mode: 'loading' | 'menu' | 'achievements' | 'armory' | 'loadout' | 'rig' | 'combos' | 'contracts' | 'contract-reward' | 'boss-reward' | 'tree' | 'choice' | 'branch' | 'playing' | 'paused' | 'settings' | 'result' | 'error' = 'loading';
  private proofChoice:BuildProof='ion';
  private buildFeedback?: {title:string;detail:string;until:number;combo:boolean};
  private achievementToast = '';
  private achievementUntil = 0;
  private contractReturn:'loadout'|'paused'='loadout';
  private treeReturn: 'loadout' | 'choice' = 'loadout';
  private dossierWeapon: WeaponKind = 'pulse';
  save: Save;
  private previousMode: 'menu' | 'paused' = 'menu';
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private runNewBest=false;
  private runAchievements:string[]=[];
  private achievementReturn:'menu'|'result'='menu';
  private buttons: CanvasControl[] = [];
  private particles: Particle[] = [];
  private blasts: Blast[] = [];
  private impacts: { x: number; y: number; kind: WeaponKind; life: number }[] = [];
  private arcs: {x:number;y:number;tx:number;ty:number;life:number}[] = [];
  private empWaves:{x:number;y:number;radius:number;life:number}[]=[];
  private supportBeams: {x:number;y:number;tx:number;ty:number;life:number;laser:boolean;prism?:boolean}[] = [];
  private destruction?: BossDestruction;
  private playerMotion = new PlayerMotion();
  private crateDebris = new CrateDebris();
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
      const images = await Promise.race([interrupted, Promise.all(['units.png', 'mounted-modules-v1.png', 'scatter-player-v1.png', 'pierce-player-v2.png', 'blast-player-v1.png', 'arc-player-v1.png', 'props.png', 'runway.jpg', 'cooling-corridor-v1.jpg', 'armored-corridor-v1.jpg', 'explosion-v1.png', 'crate-v1.png', 'drone-v1.png', 'charger-v1.png', 'armor-v1.png', 'elite-v1.png', 'conduit-v1.png', 'sniper-v1.png', 'sniper-wreck-v1.png', 'guard-v1.png', 'guard-wreck-v1.png', 'boss-v1.png', 'boss-flanker-v1.png', 'boss-bastion-v1.png', 'drone-wreck-v1.png', 'charger-wreck-v1.png', 'armor-wreck-v1.png', 'elite-wreck-v1.png'].map(async key => [key, await this.platform.image(`assets/${key}`)] as const))]);
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
            this.world.step(C.step, this.target); this.accumulator -= C.step;
            for (const e of this.world.drainEffects()) this.effect(e);
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
    this.buttons=[];
    for(const motion of this.mountedMotion.values())motion.reset();
    this.opticalFiredAt=-Infinity;
    this.buildFeedback=undefined;
    this.runNewBest=false;this.runAchievements=[];this.achievementReturn='menu';
    this.achievementUntil=0;
    this.supportBeams=[];
    this.pausePreview = false;
    this.groundDistance = 0;
    this.keys.clear(); this.inputMode = 'touch';
    this.gateFeedback.clear();
    this.crateDebris.clear();
    this.enemyWreck.clear();
    this.playerMotion.reset();
    this.weaponMotion.reset();
    this.weaponGuideUntil = 0;
    this.drawCount = 0; this.callbackCount = 0;
    this.world = new World(1337); this.mode = 'playing'; this.target = 360;
    this.accumulator = 0; this.lastTime = this.platform.now(); this.pointer = null;
    this.frameTimes.clear();this.callbackWork.clear();this.maxCallbackWorkMs=0;this.previousCallbackWorkMs=0;this.interruptedFrames=[]; this.downAction = '';
    this.particles = []; this.blasts = []; this.impacts = []; this.arcs = []; this.empWaves=[]; this.destruction = undefined; this.notice = ''; this.shakeUntil = 0;this.shieldBreak=undefined; this.upgradeUntil = 0;
    this.platform.silence();
    this.updateMusic();
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
    if (action && action === pressed) this.action(action);
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
    if (this.mode === 'choice'||this.mode==='contract-reward'||this.mode==='boss-reward') return 'stay';
    if (this.mode === 'armory') { this.mode = 'menu'; return 'stay'; }
    if (this.mode === 'achievements') { this.mode = this.achievementReturn; return 'stay'; }
    if (this.mode === 'rig'||this.mode==='combos') { this.mode='loadout';return 'stay'; }
    if (this.mode === 'contracts') { this.mode=this.contractReturn;return 'stay'; }
    if (this.mode === 'tree') { this.mode = this.treeReturn; return 'stay'; }
    if (this.mode === 'loadout') { this.mode = 'paused'; return 'stay'; }
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
    this.render(0);
    return true;
  }
  private selectBuild(route:Route,branch?:BuildBranch){
    const preview=buildPreview(this.world,route,branch);
    const chosenNode=this.world.build.ranks[route]<3?this.world.build.node(route,this.world.build.ranks[route],branch):this.world.build.next(route);
    const hadPrism=this.world.supportProfile().prism,hadStorm=this.world.build.ranks.ballistic>=3;
    if(!this.world.chooseBuild(route,branch))return;
    this.checkAchievements();
    const combo=!hadPrism&&this.world.supportProfile().prism?'棱镜激光':!hadStorm&&this.world.build.ranks.ballistic>=3?'雷暴霰射':'';
    this.buildFeedback={title:combo?`组合完成 · ${combo}`:`配件强化 · ${chosenNode.name}`,detail:combo==='棱镜激光'?'主束保留 · 两侧追加45%伤害':combo==='雷暴霰射'?'每颗霰弹命中后追加一次跳电':preview.gain,until:this.world.time+4,combo:!!combo};
    if(this.save.settings.sound)this.platform.sound('upgrade',this.world.weaponStage(this.world.weaponKind));
    this.mode='choice';
    if(!this.world.build.available(this.world.buildPoints).length)this.action('resume');
  }
  private action(action: string) {
    if(action.startsWith('build:') && this.mode==='choice') {
      const route=action.slice(6) as Route;
      if(!routes.includes(route))return;
      if(this.world.build.ranks[route]===1&&this.world.build.available(this.world.buildPoints).includes(route)){this.branchRoute=route;this.mode='branch';}
      else this.selectBuild(route);
    }
    else if(action==='branch-back'&&this.mode==='branch')this.mode='choice';
    else if(action.startsWith('branch:')&&this.mode==='branch'){
      const branch=action.slice(7) as BuildBranch,route=this.branchRoute;
      if(this.world.build.ranks[route]===1&&((route==='ballistic'&&(branch==='penetrator'||branch==='fragment'))||(route==='optical'&&(branch==='burn'||branch==='relay'))||(route==='electric'&&(branch==='spread'||branch==='capacitor'))))this.selectBuild(route,branch);
    }
    else if (action === 'reload') { this.mode = 'loading'; void this.load(); }
    else if (action === 'start') this.start();
    else if (action === 'achievements'){this.achievementReturn=this.mode==='result'?'result':'menu';this.mode='achievements';}
    else if(action==='achievements-back'&&this.mode==='achievements')this.mode=this.achievementReturn;
    else if (action === 'armory') { this.dossierWeapon = 'pulse'; this.mode = 'armory'; }
    else if (action.startsWith('dossier:')) {
      const weapon = action.slice(8) as WeaponKind;
      if (dossierWeapons.includes(weapon)) this.dossierWeapon = weapon;
    }
    else if (action === 'armory-back') this.mode = 'menu';
    else if(action==='combos'&&this.mode==='loadout')this.mode='combos';
    else if(action==='combos-back')this.mode='loadout';
    else if(action==='rig-view'&&this.mode==='loadout')this.mode='rig';
    else if(action==='rig-back')this.mode='loadout';
    else if(action==='contracts-live'&&this.mode==='playing'){this.pause();this.contractReturn='paused';this.mode='contracts';}
    else if(action==='contracts'){this.contractReturn='loadout';this.mode='contracts';}
    else if(action.startsWith('contract-claim:')&&this.mode==='contract-reward'){
      const kind=action.slice(15) as WeaponKind|'energy';
      if(this.world.claimContractReward(kind)){for(const e of this.world.drainEffects())this.effect(e);if(this.world.build.available(this.world.buildPoints).length)this.mode='choice';else this.action('resume');}
    }
    else if(action.startsWith('boss-claim:')&&this.mode==='boss-reward'){
      const kind=action.slice(11) as WeaponKind|'research';
      if(this.world.claimBossReward(kind)){
        for(const e of this.world.drainEffects())this.effect(e);
        if(this.world.bossRewardRound!==null)this.mode='boss-reward';
        else if(this.world.contractReward)this.mode='contract-reward';
        else if(this.world.build.available(this.world.buildPoints).length)this.mode='choice';
        else this.action('resume');
      }
    }
    else if(action==='contracts-back')this.mode=this.contractReturn;
    else if(action==='proof-next'&&this.mode==='contracts'){const options=this.world.availableProofs();if(options.length){const at=options.indexOf(this.proofChoice);this.proofChoice=options[((at<0?0:at)+1)%options.length];}}
    else if(action.startsWith('contract:')&&this.mode==='contracts'){const kind=action.slice(9) as ContractKind;if(kind in contracts){const options=this.world.availableProofs();this.world.acceptContract(kind,kind==='research'?(options.includes(this.proofChoice)?this.proofChoice:options[0]):undefined);}}
    else if (action === 'tree' && (this.mode === 'choice' || this.mode === 'loadout')) { this.treeReturn = this.mode; this.mode = 'tree'; }
    else if (action === 'tree-back') this.mode = this.treeReturn;
    else if (action === 'loadout') this.mode = 'loadout';
    else if (action === 'loadout-back') this.mode = 'paused';
    else if (action === 'pause') this.pause();
    else if (action === 'preview') this.pausePreview = true;
    else if (action === 'pause-menu') this.pausePreview = false;
    else if (action === 'resume') { this.pausePreview = false; this.mode = 'playing'; this.accumulator = 0; this.lastTime = this.platform.now(); this.target = this.world.player.x; }
    else if (action === 'home') { this.shieldBreak=undefined;this.mode = 'menu'; this.world = new World(); this.platform.silence(); this.notice = ''; this.particles = []; this.blasts = []; this.impacts = []; this.arcs = []; this.empWaves=[]; this.destruction = undefined; this.crateDebris.clear(); this.enemyWreck.clear(); this.gateFeedback.clear(); }
    else if (action === 'settings') { this.previousMode = this.mode === 'menu' ? 'menu' : 'paused'; this.mode = 'settings'; }
    else if (action === 'back') this.mode = this.previousMode;
    else if (action === 'licenses') this.platform.openLicenses?.();
    else if (action === 'effects') this.save.settings.effects = this.save.settings.effects === 'standard' ? 'weak' : 'standard';
    else if (action === 'shake') this.save.settings.shake = !this.save.settings.shake;
    else if (action === 'sound') { this.save.settings.sound = !this.save.settings.sound; this.platform.silence(); }
    else if (action === 'music') this.save.settings.music = !this.save.settings.music;
    this.platform.write(this.save);
    this.updateMusic();
  }
  private notify(text: string, y = 277, detail = '') { this.notice = text; this.noticeDetail=detail; this.noticeY = y; this.noticeUntil = this.platform.now() + 2200; }
  private checkAchievements() {
    const fresh=awardAchievements(this.save.achievements,this.world.build.ranks,this.world.activeWeapons.length,this.world.fractureBursts,this.world.tacticalWins,this.world.conduitTacticalWins,this.world.proofWins);
    if(fresh.length){this.runAchievements.push(...fresh.map(a=>a.id));this.achievementToast=fresh.map(a=>a.name).join(' · ');this.achievementUntil=this.world.time+4;this.platform.write(this.save);}
  }
  private effect(e: EffectEvent) {
    if(e.type==='counter-fire'){if(this.save.settings.sound)this.platform.sound('boss-volley',1);return;}
    if(e.type==='boss-counter'){this.notify(e.text??'首领过热',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;}
    if(e.type==='round'){this.notify(e.text??'下一轮',1195,e.detail);if(this.save.settings.sound)this.platform.sound('round',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.type==='emp'){
      if(this.empWaves.length>=2)this.empWaves.shift();this.empWaves.push({x:e.x,y:e.y,radius:e.size??300,life:.5});
      this.notify(e.text??'中继击破',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;
    }
    if(e.type==='drop-wave'){this.notify(e.text??'突降机群',1195,e.detail);if(this.save.settings.sound)this.platform.sound('alert',1);return;}
    if(e.type==='bounty-progress'){this.notify(e.text??'悬赏推进',1195,e.detail);if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}
    if(e.escortReward){this.notify(e.text??'编队击破',1195,e.detail);if(this.save.settings.sound)this.platform.sound('pickup',this.world.weaponStage(this.world.weaponKind));return;}

    if(e.type==='formation'){
      if(this.save.settings.sound)this.platform.sound('alert',this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if(e.type==='shield-down'){
      this.shieldBreak={x:e.x,y:e.y+BOSS_VISUAL.offsetY,until:this.world.time+.45};
      if(this.save.settings.sound)this.platform.sound('shield-down',this.world.weaponStage(this.world.weaponKind));
      return;
    }

    if(e.type==='combination'){
      this.buildFeedback={title:e.text??'组合完成',detail:e.detail??'',until:this.world.time+4,combo:true};
      if(this.save.settings.sound)this.platform.sound('upgrade',this.world.weaponStage(this.world.weaponKind));
      return;
    }
    if(e.type==='kill'||e.type==='boss-kill')this.save.achievements.kills++;
    if(e.type==='boss-kill')this.save.achievements.bosses++;
    if(['contract','formation-clear','fracture','kill','boss-kill','pickup','upgrade'].includes(e.type))this.checkAchievements();
    if(e.type==='scatter-pierce'&&this.supportBeams.length<16)this.supportBeams.push({x:e.x,y:e.y+25,tx:e.x,ty:e.y-35,life:.12,laser:false});
    if(e.type==='laser')this.opticalFiredAt=this.world.time;
    if ((e.type==='laser'||e.type==='refract') && e.targetX!==undefined && e.targetY!==undefined) {
      if(this.save.settings.sound)this.platform.sound(e.type,this.world.weaponStage(this.world.weaponKind));
      if(this.supportBeams.length<16)this.supportBeams.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:e.type==='laser' ? .32 : .12,laser:e.type==='laser',prism:e.prism});
      return;
    }
    if (this.save.settings.sound) this.platform.sound(e.type, this.world.weaponStage(e.weaponKind ?? this.world.weaponKind), e.weaponKind ?? this.world.weaponKind);
    if (e.type === 'arc' && e.targetX !== undefined && e.targetY !== undefined && this.arcs.length < 12) this.arcs.push({x:e.x,y:e.y,tx:e.targetX,ty:e.targetY,life:.16});
    if (e.type === 'fire') { const kind=e.weaponKind??this.world.weaponKind;this.mountedMotion.get(kind)?.fire(kind,this.world.weaponStage(kind),this.world.time);if (!e.weaponKind || e.weaponKind === this.world.weaponKind) this.weaponMotion.fire(this.world.weaponKind, this.world.weaponStage(this.world.weaponKind), this.world.time); return; }
    if (e.type === 'weapon' || e.type === 'upgrade') {this.weaponGuideUntil = this.world.time + 5;this.weaponGuideKind=e.weaponKind??this.world.weaponKind;}
    if (e.type === 'upgrade' || e.type === 'overload' || e.type === 'weapon') this.upgradeUntil = this.platform.now() + 450;
    if (e.type === 'gate-taken') this.gateFeedback.claim(e.x, e.y, e.text ?? '已领取', e.size);
    if (e.text && !e.type.startsWith('impact') && e.type !== 'gate-level' && e.type !== 'gate-taken' && e.type !== 'crate-break') this.notify(e.text, e.type === 'victory' ? 820 : 277, e.detail);
    if (e.type === 'impact' && !this.impacts.some(hit => Math.hypot(hit.x - e.x, hit.y - e.y) < 28) && this.impacts.length < (this.save.settings.effects === 'weak' ? 4 : 12)) this.impacts.push({ x: e.x, y: e.y, kind: e.weaponKind ?? this.world.weaponKind, life: 0.14 });
    const explosion = ['ion-storm','scatter-burst', 'capacitor', 'fracture', 'blast', 'kill', 'crate-break', 'boss-kill', 'crash', 'death'].includes(e.type);
    if (e.type === 'crate-break') { this.crateDebris.burst(e.x, e.y); this.enemyWreck.trim(9 - this.crateDebris.pieces.length); }
    if (e.type === 'kill' && isWreckKind(e.enemyKind)) this.enemyWreck.burst(e.x, e.y, Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length), e.enemyKind);
    if (e.type === 'boss-kill') this.destruction = new BossDestruction(e.x, e.y, e.bossVariant);
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
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color: e.type==='drop-impact'?'#b6efff':(e.type==='capacitor'||e.type==='ion-storm')?(i%3===0?'#efffff':i%2?'#c5a9ff':'#80ffd1'):explosion ? (i % 4 === 0 ? '#99ddff' : i % 3 === 0 ? '#ffe2a0' : '#ffad42') : weaponColors[e.weaponKind ?? this.world.weaponKind] });
    }
  }
  private text(text: string, x: number, y: number, size: number, color = '#ecf7ff', align: CanvasTextAlign = 'center', bold = false) {
    const c = this.ctx; c.fillStyle = color; c.font = `${bold ? '700 ' : ''}${size}px ${fonts}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(text, x, y);
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
      const mount=mountedRig[kind],stage=w.weaponStage(kind);
      const motion=this.mountedMotion.get(kind)!.sample(kind,stage,w.time)*.65;
      const size=mount.size*(1+(stage-1)*.07);
      const c=this.ctx,px=w.player.x+Math.sign(mount.x)*25,py=y-24+pose.bob;
      const tx=w.player.x+mount.x,ty=y+mount.y+pose.bob+motion+size*.22;
      c.save();c.lineCap='round';
      for(const [width,color] of [[10,'#101b25'],[5,'#9aaab4'],[1,'#e0e6df']] as const){
        c.lineWidth=width;c.strokeStyle=color;c.beginPath();c.moveTo(px,py);c.lineTo(tx,ty);c.stroke();
      }
      c.fillStyle='#d0d7d3';c.beginPath();c.arc(tx,ty,3,0,Math.PI*2);c.fill();c.restore();
      this.frameSprite('mounted-modules-v1.png',mount.frame,3,w.player.x+mount.x,y+mount.y+pose.bob+motion,size,size,2);
    }
  }
  private drawOpticalRig(y:number,pose:PlayerPose) {
    const w=this.world,support=w.supportProfile();if(!support.laserUnlocked)return;
    const kick=Math.max(0,1-(w.time-this.opticalFiredAt)/.2)*3;
    for(const side of support.prism?[-1,0,1]:[0]){
      const c=this.ctx,x=w.player.x+side*42;
      c.save();c.lineWidth=4;c.strokeStyle='#9aaab4';c.beginPath();c.moveTo(w.player.x,y-72+pose.bob);c.lineTo(x,y-82+pose.bob+kick);c.stroke();c.restore();
      this.frameSprite('mounted-modules-v1.png',5,3,w.player.x+side*42,y-100+pose.bob+kick,side===0?46:38,side===0?46:38,2);
    }
  }
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
    if (this.mode === 'armory') { this.drawArmory(); c.restore(); return; }
    if (this.mode === 'rig') { this.drawRigView();c.restore();return; }
    if (this.mode === 'combos') {this.drawCombos();c.restore();return;}
    if(this.mode==='branch'){this.drawBuildBranch();c.restore();return;}
    if(this.mode==='contract-reward'){this.drawContractReward();c.restore();return;}
    if(this.mode==='boss-reward'){this.drawBossReward();c.restore();return;}
    if (this.mode === 'contracts') { this.drawContracts();c.restore();return; }
    if (this.mode === 'loadout') { this.drawLoadout(); c.restore(); return; }
    if (this.mode === 'tree') { this.drawBuildTree(); c.restore(); return; }
    const sector = this.mode === 'menu' ? 0 : sectorIndex(w.round);
    const ground = this.images.get(['runway.jpg', 'cooling-corridor-v1.jpg', 'armored-corridor-v1.jpg'][sector])!;
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
        c.drawImage(ground, 0, 0, 720, h); c.restore();
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
    const bossLive=w.bodies.some(b=>b.active&&b.kind==='boss');
    const activeBuild=this.mode==='playing'&&this.buildFeedback&&w.time<this.buildFeedback.until;
    const noticeVisible=this.mode==='playing'&&this.notice&&this.platform.now()<this.noticeUntil&&!activeBuild;
    const bottomNotice=bossLive||this.noticeY===1195;
    const bottomBusy=(activeBuild&&bossLive)||(noticeVisible&&bottomNotice);
    // Preserve a newly earned achievement until the preceding combat receipt can be read.
    if(bottomBusy&&w.time<this.achievementUntil)this.achievementUntil=Math.max(this.achievementUntil,
      activeBuild?this.buildFeedback!.until+3:w.time+(this.noticeUntil-this.platform.now())/1000+3);
    if (this.mode === 'menu') this.drawMenu();
    else {
      this.drawHud();
      if(noticeVisible){
        const y=bottomNotice?1208:this.noticeY;
        this.rect(58,y-31,604,this.noticeDetail?(bottomNotice?94:104):62,'#0a1c2af0');this.text(this.notice,360,y,28,'#d2f2ff');
        if(this.noticeDetail)this.text(this.noticeDetail,360,y+(bottomNotice?37:43),bottomNotice?22:24,'#f2d598');
      }
    }
    if(activeBuild){
      const f=this.buildFeedback!,top=bossLive?1180:240,height=bossLive?88:104;
      this.rect(58,top,604,height,'#0a1c2af0');this.rect(58,top,5,height,f.combo?'#d3a3ff':'#7fe4ff');
      this.text(f.title,360,top+(bossLive?28:32),bossLive?28:30,f.combo?'#e1bfff':'#d2f2ff','center',true);
      this.text(f.detail,360,top+(bossLive?63:76),bossLive?22:23,'#f2d598');
    }
    if(this.mode==='choice')this.drawBuildChoices();
    const contract=w.contract;
    if(this.mode==='playing'&&contract?.status==='active'){
      const y=w.bodies.some(b=>b.active&&b.kind==='boss')?1130:this.hudTop+164;
      const progress=contract.kind==='research'&&contract.proof?`${buildProofs[contract.proof.kind].name} ${Math.min(contract.proofProgress,buildProofs[contract.proof.kind].goal)}/${buildProofs[contract.proof.kind].goal}`:contract.kind==='hunter'?`${contract.targetKills}/2精英`:`${Math.min(15,w.kills-contract.startKills)}/15敌`;
      this.rect(40,y,640,44,'#102330');this.text(`${contracts[contract.kind].name} · ${Math.max(0,Math.ceil(30-contract.elapsed))}秒 · ${progress}`,360,y+22,24,'#ffdc8a');
    }
    if(this.mode==='playing' && w.time<this.achievementUntil&&!bottomBusy){this.rect(40,1190,640,55,'#102330');this.text(`成就达成 · ${this.achievementToast}`,360,1218,24,'#ffdc8a');}
    if (this.mode === 'paused' || this.mode === 'settings' || this.mode === 'result') this.drawDialog();
    c.restore();
  }
  private drawWorld(dt: number) {
    const c = this.ctx, w = this.world;
    for(const beam of this.supportBeams)beam.life-=dt;
    this.supportBeams=this.supportBeams.filter(beam=>beam.life>0);
    this.gateFeedback.sync(w.bodies, w.time);
    this.gateFeedback.advance(dt);
    this.drawGuide();
    this.drawDestruction(dt);
    this.enemyWreck.trim(Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length));
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
    for (const b of w.bodies) {
      c.fillStyle = '#0005'; c.beginPath(); c.ellipse(b.x + 5, b.y + b.height * 0.3, b.width * 0.45, b.height * 0.2, 0, 0, Math.PI * 2); c.fill();
      if (b.kind === 'gate') {
        this.frameSprite('props.png', b.rewardKind === 'energy' ? 4 : 3, 3, b.x, b.y, b.width + 72, 225);
        this.hitSprite('props.png', b.rewardKind === 'energy' ? 4 : 3, 3, b.x, b.y, b.width + 72, 225, Math.max(b.hit, this.gateFeedback.pulse(b.id, w.time) * 0.07));
        this.rect(b.x - b.width / 2 + 5, b.y - 54, b.width - 10, 108, '#071927f5');
      } else if (b.kind === 'crate') {
        const frame = crateFrame(b.hp, b.maxHp);
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
          this.frameSprite('drone-v1.png', frame, 3, b.x, y, side, side, 1);
          this.hitSprite('drone-v1.png', frame, 3, b.x, y, side, side, b.hit, 0.07, 1);
        } else if (b.kind === 'charger') {
          const frame = chargerFrame(b), side = b.height * 1.35;
          this.frameSprite('charger-v1.png', frame, 3, b.x, y, side, side, 1);
          this.hitSprite('charger-v1.png', frame, 3, b.x, y, side, side, b.hit, 0.07, 1);
        } else if (b.kind === 'armor') {
          const frame = armorFrame(b), width = b.width * 1.45, height = b.height * 1.38;
          this.frameSprite('armor-v1.png', frame, 3, b.x, y, width, height, 1);
          this.hitSprite('armor-v1.png', frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
        } else if(b.kind==='conduit'){
          const bob=Math.sin(b.age*3)*2;
          this.frameSprite('conduit-v1.png',0,1,b.x,y+bob,150,165,1);this.hitSprite('conduit-v1.png',0,1,b.x,y+bob,150,165,b.hit,.07,1);
          c.save();c.globalAlpha=.35+.3*Math.sin(b.age*6)**2;c.fillStyle='#ffd889';for(const side of [-1,1])c.fillRect(b.x+side*24-2,y-35+bob,4,6);c.restore();
        } else if (b.kind === 'guard') {
          const frame = b.burst > 0 || (b.empRemaining??0)>0 ? 1 : 0;
          this.frameSprite('guard-v1.png', frame, 3, b.x, y, 160, 160, 1);
          this.hitSprite('guard-v1.png', frame, 3, b.x, y, 160, 160, b.hit, 0.07, 1);
        } else if (b.kind === 'sniper') {
          const frame = b.warning > 0 ? 1 : 0;
          const direction=sentryDirection(b);c.save();c.translate(b.x,y);c.rotate(direction*.07);
          sentryThrust(c,direction,b.age,this.save.settings.effects==='weak');
          this.frameSprite('sniper-v1.png', frame, 3, 0, 0, 140, 140, 1);
          this.hitSprite('sniper-v1.png', frame, 3, 0, 0, 140, 140, b.hit, 0.07, 1);c.restore();
        } else if (b.kind === 'elite') {
          const frame = eliteFrame(b), width = b.width * 1.68, height = b.height * 1.36;
          this.frameSprite('elite-v1.png', frame, 3, b.x, y, width, height, 1);
          this.hitSprite('elite-v1.png', frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
        } else {
          const frame = bossFrame(b), bossArt = b.bossVariant === 2 ? 'boss-bastion-v1.png' : b.bossVariant === 1 ? 'boss-flanker-v1.png' : 'boss-v1.png';
          this.frameSprite(bossArt, frame, 3, b.x, y, width, height, 1);
          this.hitSprite(bossArt, frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
          if(b.counterfire)bossHeatLight(c,b,this.save.settings.effects==='weak');
        }
      }
    }
    for(const b of w.bodies)if(b.active&&b.proofTarget&&w.contract?.kind==='research'&&w.contract.status==='active')this.text('验证目标',b.x,b.y-b.height/2-24,20,'#a9f4d7');
    for(const b of w.bodies)if(b.active&&(b.dropGrace??0)>0)dropLight(c,b.x,b.y,(b.dropGrace??0)/SWARM.grace,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&(b.empRemaining??0)>0)offlineLight(c,b.x,b.y,b.width,b.empRemaining??0);
    const protectedBoss=w.bodies.find(b=>b.active&&b.kind==='boss');
    if(protectedBoss&&w.bossShieldActive())formationShield(c,protectedBoss.x,protectedBoss.y+BOSS_VISUAL.offsetY,w.time,0,this.save.settings.effects==='weak');
    if(this.shieldBreak&&w.time<this.shieldBreak.until)formationShield(c,this.shieldBreak.x,this.shieldBreak.y,w.time,1-(this.shieldBreak.until-w.time)/.45,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&b.bountyRound===w.contract?.round&&w.contract?.kind==='hunter'&&w.contract.status==='active'){
      c.save();c.strokeStyle='#ffd884';c.lineWidth=3;c.globalAlpha=.7+.2*Math.sin(w.time*7);
      for(const side of [-1,1]){const x=b.x+side*b.width*.65;c.beginPath();c.moveTo(x-side*14,b.y-24);c.lineTo(x,b.y-14);c.lineTo(x,b.y+14);c.lineTo(x-side*14,b.y+24);c.stroke();}c.restore();
    }
    for(const b of w.bodies)if(b.active&&b.capacitorHits)capacitorMarks(c,b.x,b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0),b.width,b.capacitorHits,w.time);
    for(const b of w.bodies)if(b.active&&b.burnTicks)burnLight(c,b.x,b.y,b.width,b.height,w.time,this.save.settings.effects==='weak');
    for(const b of w.bodies)if(b.active&&b.fractureHits)fractureMarks(c,b.x,b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0),b.width,b.fractureHits);
    for (const b of w.bullets.filter(b => !b.hostile)) {
      energyShot(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? 'pulse', w.time, this.save.settings.effects === 'weak');
    }
    for(const beam of this.supportBeams) if(this.mode!=='menu')supportLight(c,beam.x,beam.y,beam.tx,beam.ty,beam.life,beam.laser,this.save.settings.effects==='weak',beam.prism);
    for(const b of w.bullets) if(!b.hostile) projectileBody(c,b.x,b.y,b.vx,b.vy,b.weaponKind??'pulse');
    const playerY = this.mode === 'menu' ? 750 : C.playerY;
    if ((this.mode === 'playing' || this.mode === 'paused') && w.player.hp > 0)
      overloadWake(c, w.player.x, playerY, w.time, w.growth.overload, this.save.settings.effects === 'weak');
    c.fillStyle = '#0005'; c.beginPath(); c.ellipse(w.player.x + 5, playerY + 32, 53, 30, 0, 0, Math.PI * 2); c.fill();
    c.save();
    if (w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0) c.globalAlpha = 0.65;
    const recoil = this.weaponMotion.sample(w.weaponKind, w.weaponStage(w.weaponKind), w.time);
    const pose = this.playerMotion.sample(w.player.x, w.time);
    if (w.player.hp > 0) {
      if (this.mode === 'menu') this.frameSprite('units.png', 2, 4, w.player.x, playerY, 200, 267);
      else {
        this.drawMountedRig(playerY,pose);
        this.playerSprite(w.weaponStage(w.weaponKind) - 1, w.player.x, playerY, pose, recoil);
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
    if(w.build.ranks.electric>=3&&(this.mode==='playing'||this.mode==='paused'))ionChargeLight(c,w.player.x,C.playerY-117,w.ionCharge);
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
    if (this.mode === 'playing' && this.platform.now() < this.upgradeUntil) {
      const remaining = (this.upgradeUntil - this.platform.now()) / 450;
      c.save(); c.globalAlpha = remaining * 0.8; c.strokeStyle = '#80e4ff'; c.lineWidth = 3;
      c.beginPath(); c.arc(w.player.x, C.playerY, 48 + (1 - remaining) * 100, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    for (const e of this.blasts) {
      e.life -= dt; const age = 1 - e.life / e.total;
      if(e.ion){ionStormLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');continue;}
      if(e.electric){capacitorLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');continue;}
      c.save(); c.globalAlpha = Math.pow(Math.max(0, 1 - age), 0.65) * (this.save.settings.effects === 'weak' ? 0.5 : 0.9);
      this.frameSprite('explosion-v1.png', Math.min(8, Math.floor(age * 9)), 3, e.x, e.y, e.size * 2, e.size * 2, 3); c.restore();
      detonationLight(c, e.x, e.y, e.size, age, this.save.settings.effects === 'weak');
      if(e.fracture)fractureLight(c,e.x,e.y,e.size,age,this.save.settings.effects==='weak');
    }
    this.blasts = this.blasts.filter(e => e.life > 0);
    for(const e of this.empWaves){e.life-=dt;empWave(c,e.x,e.y,e.radius,1-e.life/.5,this.save.settings.effects==='weak');}
    this.empWaves=this.empWaves.filter(e=>e.life>0);
    for (const arc of this.arcs) { arc.life -= dt; chainArc(c,arc.x,arc.y,arc.tx,arc.ty,arc.life,this.save.settings.effects === 'weak'); }
    this.arcs = this.arcs.filter(arc=>arc.life>0);
    for (const hit of this.impacts) { hit.life -= dt; impactLight(c, hit.x, hit.y, hit.kind, 1 - hit.life / 0.14, this.save.settings.effects === 'weak'); }
    this.impacts = this.impacts.filter(hit => hit.life > 0);
    for (const s of this.particles) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 70 * dt;
      sparkLight(c, s.x, s.y, s.vx, s.vy, s.color, s.life / s.total, this.save.settings.effects === 'weak');
    }
    this.particles = this.particles.filter(s => s.life > 0);
    for (const receipt of this.gateFeedback.receipts) {
      const y = receipt.y - receipt.age * 18, height = receipt.lines.length > 1 ? 116 : 84;
      // Omit this optional feedback while it overlaps a live entity or its label.
      // Enemy bodies and other reward panels must remain identifiable too.
      if (w.bodies.some(b => Math.abs(receipt.x - b.x) < (receipt.width + b.width * 1.4 + 40) / 2
        && Math.abs(y - b.y - (b.kind === 'boss' ? BOSS_VISUAL.offsetY : 0)) < (height + b.height * 1.55 + 140) / 2)) continue;
      c.save(); c.globalAlpha = Math.min(1, (0.8 - receipt.age) / 0.25);
      this.rect(receipt.x - receipt.width / 2 + 8, y - height / 2, receipt.width - 16, height, '#102d3bf0');
      this.text('已领取', receipt.x, y - height / 2 + 20, 28, '#b1e8f7');
      receipt.lines.forEach((line, i) => this.text(line, receipt.x, y - height / 2 + 52 + i * 32, 30, '#effaff', 'center', true));
      c.restore();
    }
    // Breaking is not collecting: keep the physical module visible above smoke.
    for (const b of w.bodies) if (b.kind === 'pickup') this.frameSprite('props.png', 2, 3, b.x, b.y, 65, 65);
    for (const b of w.bodies) {
      if (b.warning > 0 && !(b.kind==='boss'&&b.attack===4)) {
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
          const choice = w.activeWeapons.includes(b.weaponKind) ? '强化' : '叠加';
          const role = b.weaponKind === 'pulse' ? '高速集中火力' : b.weaponKind === 'scatter' ? '近距聚弹 · 扇面覆盖' : b.weaponKind === 'blast' ? '命中敌人 · 范围爆破' : b.weaponKind === 'arc' ? '前方索敌 · 命中跳电' : `贯穿${weaponProfile('pierce', b.stage).targets}个敌人`;
          // Enter below the crate until the full panel fits beneath the HUD.
          const panelY = b.y - 158 >= this.hudTop + 172 ? b.y - 158 : Math.max(this.hudTop + 172, b.y + 70);
          this.rect(b.x - 118, panelY, 236, 100, '#0b1723ef');
          this.text(b.refit?`${w.weaponStage(b.weaponKind)>=3?'精校':'改装'} ${weaponNames[b.weaponKind]}`:`${choice} ${weaponNames[b.weaponKind]} T${b.stage}`, b.x, panelY + 23, 25, weaponColors[b.weaponKind], 'center', true);
          this.text(b.refit?refitLabel(w,b.weaponKind):role, b.x, panelY + 51, b.refit?21:24, '#cfdee9');
          this.text(`打碎再拾取 · ${Math.ceil(b.hp)}`, b.x, panelY + 78, 23, '#fff0c8');
          this.bar(b.x, b.y - 52, 102, b.hp / b.maxHp, '#e5b96a');
        } else {
          this.rect(b.x - 105, b.y - 110, 210, 40, '#0b1723df');
          this.text(`T${b.stage} ${w.weaponStage(w.weaponKind) >= b.stage ? '充能+30' : '装备'} · ${Math.ceil(b.hp)}`, b.x, b.y - 90, 28, '#fff0c8', 'center', true);
          this.bar(b.x, b.y - 64, 102, b.hp / b.maxHp, '#e5b96a');
        }
      } else if (b.kind === 'pickup') this.text(b.weaponKind ? `拾取${b.refit?'改装':w.activeWeapons.includes(b.weaponKind) ? '强化' : '叠加'}${weaponNames[b.weaponKind]}` : `拾取 T${b.stage}`, b.x, b.y - 50, b.weaponKind ? 26 : 28, '#ffe7b1', 'center', true);
      else if (b.kind === 'gate') {
        const value = previewReward(w.growth, gateValue(b.energy, b.rewardKind), b.rewardKind);
        const mixed = value.power > 0 && value.energy > 0;
        const pulse = this.gateFeedback.pulse(b.id, w.time);
        const numberScale = 1 + Math.sin(pulse * Math.PI) * (this.save.settings.effects === 'weak' ? 0.03 : 0.08);
        this.rect(b.x - b.width / 2 + 5, b.y - (mixed ? 80 : 54), b.width - 10, mixed ? 164 : 108, '#071927f5');
        this.text(mixed ? '穿过领取' : value.power ? '穿过领取 · 火力' : value.energy ? '穿过领取 · 充能' : '储能已满', b.x, b.y - (mixed ? 60 : 33), 25, '#a4d6e9');
        if (mixed) {
          this.text(`+${value.power}%`, b.x, b.y - 18, 50 * numberScale, '#effaff', 'center', true);
          this.text(`充能 +${value.energy}`, b.x, b.y + 32, 36 * numberScale, '#ffe4ac', 'center', true);
        } else this.text(`+${value.power || value.energy}${value.power ? '%' : ''}`, b.x, b.y + 8, 50 * numberScale, '#effaff', 'center', true);
        const tier = C.thresholds.findIndex(t => t > b.energy);
        const progress = tier < 0 ? 1 : (b.energy - C.thresholds[tier - 1]) / (C.thresholds[tier] - C.thresholds[tier - 1]);
        this.bar(b.x, b.y + (mixed ? 72 : 46), b.width - 32, progress, b.rewardKind === 'power' ? '#5bddff' : '#e5b96a');
      } else if (b.kind === 'boss') {
        // Boss status is drawn after the HUD background in drawHud.
      } else if((b.empRemaining??0)>0){
        this.bar(b.x,b.y-b.height/2-14,b.width,b.hp/b.maxHp,'#8bdce9');this.text('停火',b.x,b.y-b.height/2-34,22,'#b5f4ff','center',true);
      } else if (b.kind === 'guard') {
        this.bar(b.x, b.y - 88, b.width, b.hp / b.maxHp, b.burst ? '#ffb45d' : '#87c7de');
        this.text(b.burst ? '弱点暴露' : b.escort&&w.bossFormation?.id==='bulwark'?'供能护卫':'装甲减伤', b.x, b.y - 106, 23, b.burst ? '#ffd99b' : '#d0eaff', 'center', true);
      } else if(b.kind==='conduit'){
        this.bar(b.x,b.y-b.height/2-14,b.width,b.hp/b.maxHp,'#7de4ed');this.text('中继·击破停火',b.x,b.y+92,21,'#a5f2fb','center',true);
      } else if (b.kind === 'armor' || b.kind === 'elite' || b.kind === 'sniper') {
        this.bar(b.x,b.y-b.height/2-14,b.width,b.hp/b.maxHp,'#f39b69');
        if(b.pattern==='relocate')this.text(sentryDirection(b)?'换位中':b.warning>0?'机动·蓄能':'机动哨机',b.x,b.y+92,21,'#b8eaff','center',true);
        if(b.bountyRound===w.contract?.round&&w.contract?.kind==='hunter'&&w.contract.status==='active')this.text('悬赏精英',b.x,b.y-b.height/2-42,23,'#ffd884','center',true);
      }
    }
    // Hostile projectiles must remain visible over reward panels as well as explosions.
    for (const b of w.bullets.filter(b => b.hostile)) {
      c.fillStyle = '#ff7756'; c.strokeStyle = '#1a171d'; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x - 8, b.y - 7); c.lineTo(b.x + 8, b.y - 7); c.lineTo(b.x, b.y + 12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffead7'; c.fillRect(b.x - 2, b.y - 5, 4, 8);
    }
  }
  private drawDestruction(dt: number) {
    const wreck = this.destruction;
    if (!wreck) return;
    for (const burst of wreck.advance(dt)) {
      // Prefer the boss's authored beats over the oldest decorative blast.
      if (this.blasts.length >= 4) this.blasts.shift();
      this.blasts.push({ ...burst, life: 0.6, total: 0.6 });
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
    this.rect(0, 0, 720, y + (boss?210:162), '#08131be8');
    this.text('分数', 30, y + 6, 20, '#91adbf', 'left');
    this.text(w.score.toString().padStart(6, '0'), 28, y + 43, 42, '#e9f6ff', 'left', true);
    this.text('◈ '.repeat(w.player.hp) + '◇ '.repeat(3 - w.player.hp), 430, y + 35, 34, '#82deff');
    this.rect(624, y + 2, 64, 64, '#1a2e3e'); this.text('Ⅱ', 656, y + 34, 36);
    this.buttons.push({ x: 624, y: y + 2, w: 64, h: 64, label: '暂停', action: 'pause' });
    this.text(`T${w.weaponStage(w.weaponKind)} · ${w.activeWeapons.length}种武器叠加`, 30, y + 88, 25, weaponColors[w.weaponKind], 'left', true);
    this.text(`火力 +${permanentPower(w.growth)}%`, 300, y + 88, 24, '#74dcff', 'left', true);
    this.text(`${w.round}轮·${boss&&w.bossFormation?w.bossFormation.name:sectorNames[sectorIndex(w.round)]}`, 686, y + 88, 26, '#b0c4d1', 'right');
    this.bar(360, y + 115, 660, w.growth.overload > 0 ? w.growth.overload / 6 : w.growth.energy / 100, w.growth.overload > 0 ? '#ffc66b' : '#5bddff');
    this.text(w.growth.overload > 0 ? `超载×1.35 · ${w.growth.overload.toFixed(1)}秒  |  再充能 ${Math.floor(w.growth.energy)}/100`
      : `充能 ${Math.floor(w.growth.energy)}/100 · 满100：本局火力+10% / 超载6秒`, 360, y + 144, 22, '#d4e8ee');
    if(this.mode==='playing'&&w.phase==='running'&&w.roundTime<=40&&!w.contractReward&&w.contract?.status!=='active'&&w.contract?.round!==w.round&&!w.bodies.some(b=>b.active&&Math.abs(b.x-585)<b.width/2+125&&Math.abs(b.y-(y+200))<b.height/2+48)){
      this.rect(480,y+170,210,44,'#213d4d');this.text('挑战契约　›',585,y+192,24,'#ffd598');
      this.buttons.push({x:480,y:y+170,w:210,h:44,action:'contracts-live',label:'挑战契约'});
    }
    if(boss){
      this.text(`${boss.bossVariant===2?'封锁堡垒':boss.bossVariant===1?'双翼压制者':'重装首领'}${boss.counterfire?'·过热':''}${w.bossShieldActive()?'·屏障45%':''}　${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`,360,y+172,25,'#ffd59e');
      this.bar(360,y+196,620,boss.hp/boss.maxHp,w.bossShieldActive()?'#82dfff':'#ff925d');
    }
  }
  private drawGuide() {
    if (this.mode !== 'playing') return;
    const bossLive=this.world.bodies.some(b=>b.active&&b.kind==='boss');
    if(this.world.time<this.achievementUntil)return;
    if(bossLive&&this.buildFeedback&&this.world.time<this.buildFeedback.until)return;
    if(this.notice&&(this.noticeY===1195||bossLive)&&this.platform.now()<this.noticeUntil)return;
    // Optional help is below all entities, effects, projectiles and native labels.
    // Briefly omit it while a passing body occupies the help area: neither its
    // silhouette nor the instruction should become an unreadable composite.
    if (this.world.bodies.some(b => b.active && b.y + b.height * 0.8 >= 1150 && b.y - b.height * 0.8 <= 1256)) return;
    let guide = contextGuide(this.world);
    if(this.world.phase==='boss'&&this.world.phaseTime<8&&this.world.bossFormation)guide={kind:'move',title:this.world.bossFormation.name,detail:this.world.bossFormation.hint};
    if (guide.kind === 'move' && this.world.phase === 'running' && this.world.time < this.weaponGuideUntil)
      guide = weaponGuide(this.weaponGuideKind, this.world.weaponStage(this.weaponGuideKind));
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
    this.button('开始突围　›', 932, 'start', true);
    this.button('武器档案', 1030, 'armory');
    for(const [i,label] of ['成就','设置'].entries()){const x=112+i*258;this.rect(x,1128,238,86,'#1a2d3c');this.text(label, x+119,1171,30,'#d8eaf5');this.buttons.push({x,y:1128,w:238,h:86,label,action:i?'settings':'achievements'});}
    this.text('射击装备，再走位领取强化', 360, 1230, 23, '#99b6c9');
  }
  private drawAchievements() {
    this.rect(40,90,640,1120,'#102330');
    this.text('突围成就',360,155,42,'#effaff','center',true);
    const state=this.save.achievements;
    this.text(`已达成 ${state.unlocked.length}/${achievements.length} · 选择留下战绩`,360,210,25,'#bdd8e7');
    const rowStep=Math.min(94,Math.floor(770/achievements.length));
    for(const [i,a] of achievements.entries()){const y=255+i*rowStep,done=state.unlocked.includes(a.id);
      this.rect(65,y,590,rowStep-4,done?'#263d43':'#142b39');
      this.text(a.name,85,y+(rowStep<82?26:30),27,done?'#ffdc8a':'#effaff','left',true);
      this.text(done?this.achievementReturn==='result'&&this.runAchievements.includes(a.id)?'本局新达成':'已达成':a.id==='hunter'?`${Math.min(state.kills,100)}/100`:'未达成',635,y+(rowStep<82?26:30),23,done?'#ffdc8a':'#a5bac8','right');
      this.text(a.detail,85,y+(rowStep<82?56:65),22,'#bdd8e7','left');
    }
    this.text('成就保存在本机 · 不增加局外伤害',360,1040,23,'#bdd8e7');
    this.button(this.achievementReturn==='result'?'返回本局战绩':'返回主界面',1100,'achievements-back',true);
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
    this.text('适合这样打', 92, 756, 25, '#f0d19a', 'left', true);
    this.text(entry.strength, 92, 803, 25, '#d6e7f0', 'left');
    this.text('留意取舍', 92, 868, 25, '#f0d19a', 'left', true);
    this.text(entry.tradeoff, 92, 915, 25, '#d6e7f0', 'left');
    this.rect(86, 963, 548, 1, '#355064');
    this.text('击碎后拾取 · 新武器与已有武器共同开火', 360, 1004, 25, '#b8d4e3');
    this.text('同排选一种奖励 · 旧能力保留到本局结束', 360, 1045, 25, '#b8d4e3');
    this.button('返回主界面', 1100, 'armory-back', true);
  }
  private drawLoadout() {
    const w = this.world, power = permanentPower(w.growth);
    this.rect(40, 100, 640, 1100, '#102330');
    this.text('当前火力', 330, 165, 46, '#e7f5ff', 'center', true);
    this.rect(490,135,160,60,'#203e50');this.text('查看机甲',570,165,25,'#80e4ff');
    this.buttons.push({x:490,y:135,w:160,h:60,action:'rig-view',label:'查看机甲'});
    this.text(`T${w.weaponStage(w.weaponKind)} · 已叠加 ${w.activeWeapons.length} 种武器`, 360, 228, 28, '#a5d9ed');
    this.text(`本局火力 +${power}% · 充能突破 ${w.growth.mastery ?? 0} 次`, 360, 278, 27, '#f0d19a');
    this.text(`技能点：可用${w.buildPoints-w.build.spent} · 研发${w.researchPoints} ＋ 充能突破${w.growth.mastery??0}`,360,310,21,'#bdd8e7');
    for (const [index, kind] of w.activeWeapons.entries()) {
      const profile = w.profileFor(kind), y = 342 + index * 102;
      const damage = profile.damage.map(n => +(n * (1 + power / 100)).toFixed(1));
      this.rect(72, y, 576, 94, '#091723');
      this.text(`${weaponNames[kind]} T${w.weaponStage(kind)}${kind==='arc'&&w.build.electricBranch==='capacitor'?' · 蓄爆':kind==='arc'&&w.build.electricBranch==='spread'?' · 扩散':''}${w.weaponCalibration(kind)?' · 精校'+w.weaponCalibration(kind):''}`, 92, y + 28, 28, weaponColors[kind], 'left', true);
      this.text(kind === 'arc' ? `索敌${ARC_SHOT.aimWidth} · 跳电${profile.chainHops}×${w.build.ranks.electric>=3?80:65}%` : kind === 'blast' ? `爆炸范围${profile.splashRadius}`
        : kind === 'pierce' ? `贯穿${profile.targets}敌` : kind === 'scatter' ? w.build.ballisticBranch==='penetrator'?'贯穿2敌':w.build.ballisticBranch==='fragment'?'140范围 · 50%溅射':'近距聚弹' : '集中直射', 628, y + 28, 23, '#a9c9d9', 'right');
      const perShot = Math.min(...damage) === Math.max(...damage) ? `${damage[0]}` : `${Math.min(...damage)}–${Math.max(...damage)}`;
      this.text(`${profile.rate}轮/秒 · 每轮${profile.offsets.length}发 · 单发伤害${perShot}`, 92, y + 68, 23, '#d6e7f0', 'left');
    }
    const support=w.supportProfile();
    this.text(support.laserUnlocked?`激光${w.build.opticalBranch==='burn'?'·灼热':w.build.opticalBranch==='relay'?'·分光':''}：每${support.laserInterval}秒${+(support.laserDamage*(1+power/100)).toFixed(1)}伤害 · 贯穿${support.laserTargets}敌`:'第3次充能突破：追加贯穿激光',360,890,24,'#7fe4ff');
    this.text(support.refractionTargets>0?`折射：命中后追加${support.refractionTargets}敌 · 各60%伤害`:'第5次充能突破：追加弹丸折射',360,930,23,'#a2f9ed');
    this.text(support.prism?'棱镜双束：两侧各45%伤害 · 主束保留':'数值含永久加成；超载时额外×1.35', 360, 970, 24, '#c7deeb');
    this.text(w.build.ranks.electric>=3?`离子风暴 ${w.ionCharge}/${ION_STORM.hits} · 范围${ION_STORM.radius} · ${ION_STORM.damage*100}%伤害`:`技能 ${w.build.baseSpent}/9 · 精调 ${w.build.spent-w.build.baseSpent}次`, 360, 1004, 23, '#f0d19a');
    for(const [i,label] of ['技能树','组合配方','挑战契约'].entries()){const x=72+i*198;this.rect(x,1030,180,86,'#1a2d3c');this.text(label,x+90,1073,25,'#d8eaf5');this.buttons.push({x,y:1030,w:180,h:86,label,action:['tree','combos','contracts'][i]});}
    this.button('返回暂停菜单', 1130, 'loadout-back');
  }
  private drawCombos(){
    const w=this.world;
    this.rect(35,90,650,1120,'#102330');
    this.text('配件组合',360,150,42,'#effaff','center',true);
    this.text('满足配方自动生效 · 旧武器与伤害保留',360,207,24,'#bdd8e7');
    const rows=[
      {name:'雷暴霰射',on:w.build.ranks.ballistic>=3&&w.build.ranks.electric>=1,
        need:`弹道路线 ${w.build.ranks.ballistic}/3 ＋ 雷电路线 ${Math.min(1,w.build.ranks.electric)}/1`,
        effect:'霰弹命中后追加一次跳电',hint:'适合近距聚弹与密集敌群',color:'#b4ffb5'},
      {name:'棱镜激光',on:w.supportProfile().prism,
        need:`光学路线 ${w.build.ranks.optical}/3 ＋ 弹道路线 ${Math.min(1,w.build.ranks.ballistic)}/1`,
        effect:'主束保留 · 两侧各追加45%伤害',hint:'横移对齐侧束，扩大清场覆盖',color:'#d7b1ff'},
      {name:'裂甲爆破',on:w.fractureUnlocked(),
        need:`穿甲炮 ${w.activeWeapons.includes('pierce')?'T'+w.weaponStage('pierce'):'未持有'}/T2 ＋ 爆裂炮 ${w.activeWeapons.includes('blast')?'T'+w.weaponStage('blast'):'未持有'}/T2`,
        effect:`同敌${FRACTURE.hits}次穿甲命中：额外${FRACTURE.direct*100}%爆破`,hint:`邻敌${FRACTURE.splash*100}%伤害 · 范围${FRACTURE.radius} · 冷却${FRACTURE.cooldown}秒`,color:'#ffca8b'},
    ];
    for(const [i,row] of rows.entries()){
      const y=260+i*250;this.rect(65,y,590,225,'#203e50');this.rect(65,y,5,225,row.color);
      this.text(row.name,90,y+40,32,row.color,'left',true);
      this.text(row.on?'已生效':'待组合',625,y+40,24,row.on?'#a2ffbb':'#b9cad6','right');
      this.text(row.need,90,y+87,23,'#effaff','left');
      this.text(row.effect,90,y+132,24,'#dbeaf3','left');
      this.text(row.hint,90,y+178,22,'#bdd8e7','left');
    }
    this.text(`裂甲爆破已触发 ${w.fractureBursts} 次 · 闭合盾不积裂口`,360,1055,23,'#ffca8b');
    this.button('返回当前火力',1100,'combos-back',true);
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
    this.playerSprite(w.weaponStage(w.weaponKind)-1,w.player.x,C.playerY,pose,this.weaponMotion.sample(w.weaponKind,w.weaponStage(w.weaponKind),w.time));
    this.drawOpticalRig(C.playerY,pose);c.restore();
    this.text(w.activeWeapons.map(kind=>`${weaponNames[kind]}T${w.weaponStage(kind)}`).join(' · '),360,965,22,'#d6e7f0');
    const combinations=[w.build.ranks.ballistic>=3?'雷暴霰射':'',w.supportProfile().prism?'棱镜激光':'',w.fractureUnlocked()?'裂甲爆破':''].filter(Boolean);
    this.text(combinations.length?`组合：${combinations.join(' · ')}`:'已有配件随真实射击独立回弹',360,1010,25,'#d6b5ff');
    this.text('检查挂载与等级 · 战斗时间已暂停',360,1054,22,'#a6c5d7');
    this.button('返回当前火力',1100,'rig-back',true);
  }
  private weaponUpgradeOptions(){
    const w=this.world;
    return w.activeWeapons.map(kind=>{const stage=w.weaponStage(kind),n=w.weaponCalibration(kind);return {kind,title:stage<3?`${weaponNames[kind]} T${stage} → T${stage+1}`:`${weaponNames[kind]} · 专属精校${n+1}`,detail:stage<3?'升一阶，其他配件等级保留':`该武器伤害系数 ${100+n*50}% → ${150+n*50}%`,color:weaponColors[kind]};});
  }
  private drawBossReward(){
    const w=this.world;if(w.bossRewardRound===null)return;
    this.rect(35,120,650,1080,'#102330');
    this.text(`第${w.bossRewardRound}轮首领战利品`,360,184,38,'#ffdc8a','center',true);
    this.text('任选一项 · 蓝图进技能树，配件强现有武器',360,237,23,'#bdd8e7');
    this.text(`首领充能+50已结算 · 当前装甲 ${w.player.hp}/3`,360,271,21,'#9db8c8');
    const points=w.buildPoints-w.build.spent;
    const options=[{kind:'research',title:'研发蓝图 · 技能点+1',detail:`可用技能点 ${points} → ${points+1} · 不改变充能`,color:'#9fe7ff'},...this.weaponUpgradeOptions()];
    for(const [i,o] of options.entries()){
      const y=306+i*125;this.rect(65,y,590,110,'#203e50');this.text(o.title,90,y+34,28,o.color,'left',true);
      this.text(o.detail,90,y+78,23,'#d6e7f0','left');this.text('›',625,y+50,32,o.color,'right');
      this.buttons.push({x:65,y,w:590,h:110,action:`boss-claim:${o.kind}`,label:o.title});
    }
    this.text('战斗已暂停 · 本轮仅领取一次',360,1135,24,'#bdd8e7');
  }
  private drawContractReward() {
    const w=this.world,reward=w.contractReward;if(!reward)return;
    this.rect(35,120,650,1080,'#102330');
    const proof=w.contract?.proof?buildProofs[w.contract.proof.kind]:undefined;
    this.text(proof?`${proof.name} · 检验通过`:'契约完成 · 选择强化',360,190,38,'#ffdc8a','center',true);
    this.text(proof?`${Math.min(w.contract!.proofProgress,proof.goal)}/${proof.goal}${proof.unit} · 任选一项，旧能力保留`:'任选一项 · 其他武器与能力全部保留',360,245,24,'#bdd8e7');
    const total=w.growth.energy+reward.charge;
    const options=[{kind:'energy',title:`充能 +${reward.charge}`,detail:`充能 ${Math.floor(w.growth.energy)} → ${Math.floor(total%100)} · 额外突破 ${Math.floor(total/100)}次`,color:'#7fe4ff'},
      ...this.weaponUpgradeOptions()];
    for(const [i,option] of options.entries()){
      const y=290+i*125;this.rect(65,y,590,110,'#203e50');
      this.text(option.title,90,y+33,28,option.color,'left',true);
      this.text(option.detail,90,y+78,23,'#d6e7f0','left');
      this.text('›',625,y+50,32,option.color,'right');
      this.buttons.push({x:65,y,w:590,h:110,action:`contract-claim:${option.kind}`,label:option.title});
    }
    this.text('战斗已暂停 · 选择后继续',360,1135,24,'#bdd8e7');
  }
  private drawContracts() {
    const w=this.world,current=w.contract?.round===w.round?w.contract:undefined,proofs=w.availableProofs();
    const chosen=proofs.includes(this.proofChoice)?this.proofChoice:proofs[0],proof=chosen?buildProofs[chosen]:undefined;
    this.rect(35,120,650,1080,'#102330');
    this.text('挑战契约',360,180,42,'#effaff','center',true);
    this.text('自选限制、狩猎或构筑检验 · 每轮一次',360,235,24,'#bdd8e7');
    for(const [i,kind] of (Object.keys(contracts) as ContractKind[]).entries()){
      const entry=contracts[kind],y=285+i*160,can=w.canAcceptContract(kind,kind==='research'?chosen:undefined);
      const needTier=kind==='hunter'&&!w.activeWeapons.some(k=>w.weaponStage(k)>=2);
      this.rect(65,y,590,148,can?'#203e50':'#172c3b');
      this.text(entry.name,90,y+26,28,'#ffdc8a','left',true);
      this.text(kind==='research'?(proof?`${proof.name} · ${proof.detail}`:'先成型雷暴、棱镜、裂甲或离子风暴'):entry.detail,90,y+62,22,'#effaff','left');
      this.text(`成功：充能+${entry.charge} 或强化已有配件`,90,y+96,21,'#bdd8e7','left');
      this.text(can?'接取契约　›':needTier?'需要任一T2配件':kind==='research'&&!proof?'尚无可检验组合':'本轮已接取或当前不可接取',625,y+127,21,can?'#80e4ff':'#97adbd','right');
      if(kind==='research'){
        if(can)this.buttons.push({x:65,y,w:590,h:148,label:`接取构筑检验：${proof!.name}`,action:'contract:research'});
      }else if(can)this.buttons.push({x:65,y,w:590,h:148,label:entry.name,action:`contract:${kind}`});
    }
    const proofProgress=current?.proof?` ${buildProofs[current.proof.kind].name} ${Math.min(current.proofProgress,buildProofs[current.proof.kind].goal)}/${buildProofs[current.proof.kind].goal}`:'';
    if(proofs.length>1&&!current){
      this.rect(65,935,590,82,'#214a4e');this.text('切换检验目标 ↻',360,976,27,'#b9ffe1','center',true);
      this.buttons.push({x:65,y:935,w:590,h:82,label:'切换检验目标',action:'proof-next'});
    }else{
    this.text(current?`${contracts[current.kind].name} · ${current.status==='active'?'进行中'+(current.kind==='hunter'?` ${current.targetKills}/2`:proofProgress):current.status==='won'?'已完成'+proofProgress:'失败：'+current.reason}`:'每轮前40秒可接取 · 构筑检验只计接取后触发',360,950,22,'#ffdc8a');
    this.text(current?.kind==='hunter'?'追加2名驻留精英 · 全破立即选强化':current?.kind==='research'?'最多6组验证敌阵 · 效果达标立即选强化':'猎手追加精英 · 构筑检验追加对应敌阵',360,992,22,'#bdd8e7');
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
      this.text(`${['弹道','雷电','光学'][i]}路线 · 精调${this.world.build.refinements[route]}次`,72,top,27,color,'left',true);
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
    this.text('路线点满后可持续精调 · 能力保留',360,1055,23,'#bdd8e7');
    this.button(this.treeReturn==='choice'?'返回升级选择':'返回当前火力',1100,'tree-back',true);
  }
  private drawBuildBranch(){
    if(this.branchRoute==='electric'){this.drawElectricBranch();return;}
    if(this.branchRoute==='ballistic'){this.drawBallisticBranch();return;}
    this.rect(35,120,650,1080,'#102330');
    this.text('光学改造 · 二选一',360,190,40,'#effaff','center',true);
    this.text('都保留原激光 · 发射间隔缩短25%',360,250,25,'#bdd8e7');
    for(const [i,branch] of (['burn','relay'] as const).entries()){
      const node=opticalBranches[branch],y=315+i*290,color=branch==='burn'?'#ffc187':'#a3efff';
      this.rect(65,y,590,250,'#203e50');this.rect(65,y,5,250,color);
      this.text(node.name,90,y+42,34,color,'left',true);this.text(node.role,90,y+88,25,'#effaff','left');
      this.text(branch==='burn'?'主束首敌追加3次灼烧':'主束保留 · 额外瞄准一名侧翼敌人',90,y+133,24,'#d9e8f1','left');
      this.text(branch==='burn'?`每${OPTICAL_FORK.burnInterval}秒${OPTICAL_FORK.burnDamage*100}%伤害 · 不叠层`:`横距${OPTICAL_FORK.relayRange} · ${OPTICAL_FORK.relayDamage*100}%伤害 · 不递归`,90,y+175,23,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+219,25,color,'right');
      this.buttons.push({x:65,y,w:590,h:250,action:`branch:${branch}`,label:node.name});
    }
    this.text('本局选定不可切换 · 三阶棱镜与旧武器保留',360,965,23,'#f0d19a');
    this.button('返回升级选择',1050,'branch-back');
  }
  private drawBallisticBranch(){
    this.rect(35,120,650,1080,'#102330');
    this.text('弹道改造 · 二选一',360,190,40,'#effaff','center',true);
    this.text('都保留霰射总伤害+30% · 弹数与扇角不变',360,250,24,'#bdd8e7');
    for(const [i,branch] of (['penetrator','fragment'] as const).entries()){
      const node=ballisticBranches[branch],y=315+i*290,color=branch==='penetrator'?'#aee6ff':'#ffd092';
      this.rect(65,y,590,250,'#203e50');this.rect(65,y,5,250,color);
      this.text(node.name,90,y+42,34,color,'left',true);this.text(node.role,90,y+88,25,'#effaff','left');
      this.text(branch==='penetrator'?'每颗霰弹最多命中两敌，直伤保留':`命中敌人后追加${BALLISTIC_FORK.radius}范围邻敌爆破`,90,y+133,24,'#d9e8f1','left');
      this.text(branch==='penetrator'?'箱子、数字门与闭合护盾会截断':`${BALLISTIC_FORK.splash*100}%伤害 · 不充门 · 闭盾不扩散`,90,y+175,23,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+219,25,color,'right');
      this.buttons.push({x:65,y,w:590,h:250,action:`branch:${branch}`,label:node.name});
    }
    this.text('本局选定不可切换 · 雷暴组合与旧武器保留',360,965,23,'#f0d19a');
    this.button('返回升级选择',1050,'branch-back');
  }
  private drawElectricBranch(){
    this.rect(35,120,650,1080,'#102330');
    this.text('雷电改造 · 二选一',360,190,40,'#effaff','center',true);
    this.text('原电弧保留 · 都将跳电范围提升至220',360,250,25,'#bdd8e7');
    for(const [i,branch] of (['spread','capacitor'] as const).entries()){
      const node=electricBranches[branch],y=315+i*290,color=branch==='spread'?'#adf3bf':'#c7b1ff';
      this.rect(65,y,590,250,'#203e50');this.rect(65,y,5,250,color);
      this.text(node.name,90,y+42,34,color,'left',true);this.text(node.role,90,y+88,25,'#effaff','left');
      this.text(branch==='spread'?'每发电弧额外多跳一名敌人':'同一敌人累计3次电弧直击后放电',90,y+133,24,'#d9e8f1','left');
      this.text(branch==='spread'?'伤害与原跳数保留 · 适合密集群敌':`追加${ELECTRIC_FORK.damage*100}%直击伤害 · 链电不积层`,90,y+175,23,'#bdd8e7','left');
      this.text('选择此改造　›',625,y+219,25,color,'right');
      this.buttons.push({x:65,y,w:590,h:250,action:`branch:${branch}`,label:node.name});
    }
    this.text('本局选定不可切换 · 后续风暴与旧武器保留',360,965,23,'#f0d19a');
    this.button('返回升级选择',1050,'branch-back');
  }
  private drawBuildChoices() {
    this.buttons=[];
    this.rect(35,150,650,1000,'#102330');
    this.text((this.world.growth.mastery??0)===0&&this.world.researchPoints>0?'装备研发 · 选择升级路线':'战地改造 · 选择升级路线',360,220,34,'#effaff','center',true);
    this.text(`可用${this.world.buildPoints-this.world.build.spent}点 · 研发${this.world.researchPoints} + 充能突破${this.world.growth.mastery??0}`,360,270,24,'#b8d4e3');
    this.text('直伤含常驻火力 · 不计超载、命中率与派生',360,305,20,'#bdd8e7');
    const available=this.world.build.available(this.world.buildPoints);
    for(const [i,route] of routes.entries()){
      const rank=this.world.build.ranks[route],y=330+i*235,node=this.world.build.next(route);
      const enabled=available.includes(route);
      const preview=buildPreview(this.world,route),color=['#ffd28a','#c6a1ff','#7fe4ff'][i];
      this.rect(65,y,590,205,enabled?'#203e50':'#15232e');
      this.rect(65,y,4,205,enabled?color:'#435462');
      this.text(`${['弹道','雷电','光学'][i]}路线 · ${rank}/3 · 精调${this.world.build.refinements[route]}`,90,y+35,26,color,'left');
      this.text(node?.name??'路线已完成',90,y+83,30,enabled?'#effaff':'#8396a2','left',true);
      this.text(preview.gain,90,y+128,23,enabled?'#e1f7ff':'#8396a2','left');
      this.text(preview.plan,90,y+174,21,enabled?'#c4dca9':'#8396a2','left');
      if(enabled)this.text('›',625,y+80,32,color,'right',true);
      if(enabled)this.buttons.push({x:65,y,w:590,h:205,action:`build:${route}`,label:node!.name});
    }
    this.button('查看完整技能树',1050,'tree');
  }
  private drawRunReport(){
    const w=this.world,r=runReport(w,this.runAchievements,this.save.achievements.unlocked);
    this.buttons=[];this.rect(0,0,720,1280,'#050e18dd');this.rect(35,90,650,1140,'#102330');
    this.text('本局战绩',360,145,34,'#effaff','center',true);this.text(w.score.toString(),360,218,68,'#eff8ff','center',true);
    this.text(`${this.runNewBest?'刷新最高分':'最高分'} ${this.save.best}`,360,276,23,'#e8c88b');
    this.text(`存活 ${Math.floor(w.time/60)}:${Math.floor(w.time%60).toString().padStart(2,'0')} · 第${w.round}轮 · 火力叠加${w.activeWeapons.length}种`,360,319,23,'#bdd8e7');
    this.text(r.growth,360,344,20,'#bdd8e7');
    for(let i=0;i<2;i++)this.text(r.weapons.slice(i*3,i*3+3).join(' / '),360,374+i*34,23,'#c2edff');
    for(const [i,line] of r.routes.entries())this.text(line,78,450+i*36,23,['#ffd28a','#c6a1ff','#7fe4ff'][i],'left');
    this.text(r.combat,360,577,24,'#effaff');this.text(r.contracts,360,614,23,'#bdd8e7');
    for(const [i,line] of r.mechanics.entries())this.text(line,360,655+i*34,22,'#cddfea');
    this.text(r.fresh,360,737,23,'#ffdc8a');this.text('下一局目标',360,786,24,'#aee7ff','center',true);this.text(r.next,360,824,22,'#d6e7f0');
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
      mode: this.mode, time: this.world.time,roundTime:this.world.roundTime,phaseTime:this.world.phaseTime, round: this.world.round, phase: this.world.phase, buildRanks:{...this.world.build.ranks}, buildRefinements:{...this.world.build.refinements}, activeWeapons:this.world.activeWeapons,
      supportBeams:this.supportBeams.length,
      weaponLevels:Object.fromEntries(this.world.activeWeapons.map(kind=>[kind,this.world.weaponStage(kind)])),
      weaponCalibrations:Object.fromEntries(this.world.activeWeapons.map(kind=>[kind,this.world.weaponCalibration(kind)])),
      contractStatus:this.world.contract?.status??null,contractRewardPending:!!this.world.contractReward,bossRewardRound:this.world.bossRewardRound,bossLootStats:{...this.world.bossLootStats},
      score: this.world.score, hp: this.world.player.hp, growth: { ...this.world.growth }, weaponKind: this.world.weaponKind,
      playerX: this.world.player.x,
      inputMode: this.inputMode,
      proofKind:this.world.contract?.proof?.kind??null,proofProgress:this.world.contract?.proofProgress??0,proofWins:this.world.proofWins,stormLinks:this.world.stormLinks,prismHits:this.world.prismHits,
      contractKind:this.world.contract?.kind??null,bountyKills:this.world.contract?.targetKills??0,bountyTargets:this.world.bodies.filter(b=>b.active&&b.bountyRound!==undefined&&b.bountyRound===this.world.contract?.round).length,
      bossCounterfire:this.world.bodies.some(b=>b.active&&b.kind==='boss'&&b.counterfire),bossCounterVolleys:this.world.bodies.find(b=>b.active&&b.kind==='boss')?.counterVolleys??0,
      bossFormation:this.world.bossFormation?.id??null,activeEscorts:this.world.activeEscorts.length,escortSpawns:this.world.escortSpawns,escortKills:this.world.escortKills,tacticalWins:this.world.tacticalWins,bossShield:this.world.bossShieldActive(),
      dropSpawns:this.world.dropSpawns,dropKills:this.world.dropKills,arcLinks:this.world.arcLinks,protectedDrops:this.world.bodies.filter(b=>b.active&&(b.dropGrace??0)>0).length,
      conduitBursts:this.world.conduitBursts,empTargets:this.world.empTargets,conduitTacticalWins:this.world.conduitTacticalWins,offlineEnemies:this.world.bodies.filter(b=>b.active&&(b.empRemaining??0)>0).length,empWaves:this.empWaves.length,
      mobileSentries:this.world.bodies.filter(b=>b.active&&b.pattern==='relocate').map(b=>({x:b.x,y:b.y,lane:b.lane,age:b.age,warning:b.warning,volleys:b.sentryVolleys??0,direction:sentryDirection(b)})),
      refitsClaimed:this.world.refitsClaimed,
      enemyProjectileScale:enemyProjectileScale(this.world.round),
      framePulses:this.framePulses,renderedMode:this.renderedMode,imageCount:this.images.size,
      runNewBest:this.runNewBest,bossWins:this.world.bossWins,contractStats:{...this.world.contractStats},runAchievements:[...this.runAchievements],
      researchPoints:this.world.researchPoints,buildPoints:this.world.buildPoints,unspentBuildPoints:this.world.buildPoints-this.world.build.spent,
      ballisticBranch:this.world.build.ballisticBranch??null,scatterPierces:this.world.scatterPierces,scatterBursts:this.world.scatterBursts,scatterSplashHits:this.world.scatterSplashHits,
      ionCharge:this.world.ionCharge,ionBursts:this.world.ionBursts,ionHits:this.world.ionHits,
      electricBranch:this.world.build.electricBranch??null,capacitorBursts:this.world.capacitorBursts,
      opticalBranch:this.world.build.opticalBranch??null,burnHits:this.world.burnHits,relayHits:this.world.relayHits,
      fractureUnlocked:this.world.fractureUnlocked(),fractureBursts:this.world.fractureBursts,
      bodies: this.world.bodies.length, bullets: this.world.bullets.length, particles: this.particles.length, blasts: this.blasts.length,
      bossDestructionAge: this.destruction?.age ?? null,
      crateFragments: this.crateDebris.pieces.length,
      droneFragments: this.enemyWreck.pieces.filter(p => p.kind === 'drone').length,
      enemyFragments: this.enemyWreck.pieces.length,
      gateReceipts: this.gateFeedback.receipts.length,
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
  if (Number.isFinite(data.best) && data.best! >= 0) result.best = Math.floor(data.best!);
  if (data.settings?.effects === 'weak') result.settings.effects = 'weak';
  for (const key of ['shake', 'sound', 'music'] as const) if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
  return result;
}



