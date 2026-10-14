import { energyShot, muzzleLight, detonationLight, sparkLight, impactLight } from './combat-light';
import { C, clamp } from '../core/config';
import { World } from '../core/world';
import type { EffectEvent } from '../core/world';
import { gateValue, previewReward } from '../core/rewards';
import { bossWarningLanes, fanWarningVelocities } from '../core/behavior';
import { defaults } from '../ui/storage';
import { FrameWindow } from './frame-window';
import { BossDestruction, BOSS_VISUAL } from './boss-destruction';
import { PlayerMotion } from './player-motion';
import type { PlayerPose } from './player-motion';
import { CrateDebris, crateFrame } from './crate-debris';
import { GateFeedback } from './gate-feedback';
import { contextGuide } from './context-guide';
import { HorizontalKeys } from './horizontal-keys';
import { droneFrame } from './drone-motion';
import { chargerFrame } from './charger-motion';
import { armorFrame } from './armor-motion';
import { eliteFrame } from './elite-motion';
import { bossFrame } from './boss-motion';
import { EnemyWreck, isWreckKind } from './enemy-wreck';
import type { Save } from '../ui/storage';
import { weaponProfile, weaponNames, weaponColors } from '../core/weapons';
import type { WeaponKind } from '../core/weapons';
import { sectorIndex, sectorNames } from '../core/director';

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
  width: number; height: number; dpr: number; menuBottom: number;
}
interface Button { x: number; y: number; w: number; h: number; label: string; action: string }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; total: number; color: string }
interface Blast { x: number; y: number; size: number; life: number; total: number }
const fonts = '"Microsoft YaHei", "PingFang SC", sans-serif';

/** Shared production canvas surface for WeChat and the browser compatibility harness. */
export class CanvasRuntime {
  world = new World();
  mode: 'loading' | 'menu' | 'playing' | 'paused' | 'settings' | 'result' | 'error' = 'loading';
  save: Save;
  private previousMode: 'menu' | 'paused' = 'menu';
  private ctx: CanvasRenderingContext2D;
  private images = new Map<string, HTMLImageElement>();
  private buttons: Button[] = [];
  private particles: Particle[] = [];
  private blasts: Blast[] = [];
  private impacts: { x: number; y: number; kind: WeaponKind; life: number }[] = [];
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
  private target = 360;
  private pointer: number | null = null;
  private keys = new HorizontalKeys();
  private inputMode: 'touch' | 'keyboard' = 'touch';
  private pointerX = 0;
  private downAction = '';
  private notice = '';
  private noticeY = 277;
  private noticeUntil = 0;
  private shakeUntil = 0;
  private muzzleUntil = 0;
  private recoilUntil = 0;
  private upgradeUntil = 0;
  private error = '';
  private started = false;
  private hidden = false;
  private loadAttempt?: { since: number; fail: () => void };
  private frameTimes = new FrameWindow();
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
      const images = await Promise.race([interrupted, Promise.all(['units.png', 'scatter-player-v1.png', 'props.png', 'runway.jpg', 'cooling-corridor-v1.jpg', 'armored-corridor-v1.jpg', 'explosion-v1.png', 'crate-v1.png', 'drone-v1.png', 'charger-v1.png', 'armor-v1.png', 'elite-v1.png', 'boss-v1.png', 'drone-wreck-v1.png', 'charger-wreck-v1.png', 'armor-wreck-v1.png', 'elite-wreck-v1.png'].map(async key => [key, await this.platform.image(`assets/${key}`)] as const))]);
      if (this.loadAttempt !== attempt) return;
      this.images = new Map(images);
      this.mode = 'menu';
    } catch {
      if (this.loadAttempt !== attempt) return;
      this.error = '资源加载未完成，请点击重试'; this.mode = 'error';
    } finally {
      if (this.loadAttempt === attempt) { this.loadAttempt = undefined; this.lastTime = this.platform.now(); }
    }
  }
  private frame(_timestamp: number) {
    const time = this.platform.now();
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    const dt = Math.min(elapsed, 0.1);
    if (!this.hidden && this.loadAttempt && time - this.loadAttempt.since >= 15000) this.loadAttempt.fail();
    if (this.mode === 'playing') {
      this.frameTimes.add(elapsed * 1000);
      if (elapsed > 0.25) this.pause('运行中断，已暂停');
      else {
        this.accumulator += dt;
        let steps = 0;
        try {
          while (this.accumulator + 1e-9 >= C.step && steps++ < 5 && this.mode === 'playing') {
            if (this.keys.active) this.target = clamp(this.world.player.x + this.keys.direction * C.moveSpeed * C.step, C.minX, C.maxX);
            this.groundDistance += C.step * this.world.scrollSpeed;
            this.world.step(C.step, this.target); this.accumulator -= C.step;
            for (const e of this.world.drainEffects()) this.effect(e);
            if (this.world.player.hp <= 0) {
              this.mode = 'result'; this.cancelTouch(); this.save.best = Math.max(this.save.best, this.world.score); this.platform.write(this.save); this.platform.silence();
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
      this.render(this.mode === 'paused' || this.mode === 'settings' ? 0 : Math.min(this.renderElapsed, 0.1));
      this.renderBudget = Math.max(0, this.renderBudget - Math.floor((this.renderBudget + 1e-9) / C.step) * C.step);
      this.renderElapsed = 0;
      this.renderedMode = this.mode;
    }
    this.platform.requestFrame(next => this.frame(next));
  }
  start() {
    this.groundDistance = 0;
    this.keys.clear(); this.inputMode = 'touch';
    this.gateFeedback.clear();
    this.crateDebris.clear();
    this.enemyWreck.clear();
    this.playerMotion.reset();
    this.recoilUntil = 0;
    this.world = new World(1337); this.mode = 'playing'; this.target = 360;
    this.accumulator = 0; this.lastTime = this.platform.now(); this.pointer = null;
    this.frameTimes.clear(); this.downAction = '';
    this.particles = []; this.blasts = []; this.impacts = []; this.destruction = undefined; this.notice = ''; this.shakeUntil = 0; this.muzzleUntil = 0; this.upgradeUntil = 0;
    this.platform.silence();
    this.updateMusic();
  }
  pause(message = '暂停') {
    if (this.mode !== 'playing') return;
    this.mode = 'paused'; this.cancelTouch(); this.accumulator = 0; this.notify(message); this.platform.silence();
    this.updateMusic();
  }
  hide() { this.hidden = true; this.pause('切换至后台，已暂停'); this.cancelTouch(); this.platform.silence(); }
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
    if (this.mode === 'playing') { this.pause(); return 'stay'; }
    if (this.mode === 'settings') { this.action('back'); return 'stay'; }
    if (this.mode === 'paused') { this.notify('请继续战斗，或选择返回主界面'); return 'stay'; }
    if (this.mode === 'result') { this.action('home'); return 'stay'; }
    return 'exit';
  }
  private action(action: string) {
    if (action === 'reload') { this.mode = 'loading'; void this.load(); }
    else if (action === 'start') this.start();
    else if (action === 'pause') this.pause();
    else if (action === 'resume') { this.mode = 'playing'; this.accumulator = 0; this.lastTime = this.platform.now(); this.target = this.world.player.x; }
    else if (action === 'home') { this.mode = 'menu'; this.world = new World(); this.platform.silence(); this.notice = ''; this.particles = []; this.blasts = []; this.impacts = []; this.destruction = undefined; this.crateDebris.clear(); this.enemyWreck.clear(); this.gateFeedback.clear(); }
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
  private notify(text: string, y = 277) { this.notice = text; this.noticeY = y; this.noticeUntil = this.platform.now() + 2200; }
  private effect(e: EffectEvent) {
    if (this.save.settings.sound) this.platform.sound(e.type, this.world.growth.stage, this.world.weaponKind);
    if (e.type === 'fire') { this.muzzleUntil = this.platform.now() + 80; this.recoilUntil = this.world.time + 0.048; return; }
    if (e.type === 'upgrade' || e.type === 'overload' || e.type === 'weapon') this.upgradeUntil = this.platform.now() + 450;
    if (e.type === 'gate-taken') this.gateFeedback.claim(e.x, e.y, e.text ?? '已领取', e.size);
    if (e.text && !e.type.startsWith('impact') && e.type !== 'gate-level' && e.type !== 'gate-taken' && e.type !== 'crate-break') this.notify(e.text, e.type === 'victory' ? 820 : 277);
    if (e.type === 'impact' && !this.impacts.some(hit => Math.hypot(hit.x - e.x, hit.y - e.y) < 28) && this.impacts.length < (this.save.settings.effects === 'weak' ? 4 : 12)) this.impacts.push({ x: e.x, y: e.y, kind: e.weaponKind ?? this.world.weaponKind, life: 0.14 });
    const explosion = ['kill', 'crate-break', 'boss-kill', 'crash', 'death'].includes(e.type);
    if (e.type === 'crate-break') { this.crateDebris.burst(e.x, e.y); this.enemyWreck.trim(9 - this.crateDebris.pieces.length); }
    if (e.type === 'kill' && isWreckKind(e.enemyKind)) this.enemyWreck.burst(e.x, e.y, Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length), e.enemyKind);
    if (e.type === 'boss-kill') this.destruction = new BossDestruction(e.x, e.y);
    else if (explosion && this.blasts.length < 4) this.blasts.push({ x: e.x, y: e.y, size: e.size ?? 80, life: 0.45, total: 0.45 });
    if ((e.type === 'hurt' || e.type === 'boss-kill') && this.save.settings.shake) this.shakeUntil = this.platform.now() + 100;
    const cap = this.save.settings.effects === 'weak' ? 50 : 160;
    const amount = explosion ? (this.save.settings.effects === 'weak' ? 14 : 32) : e.type.startsWith('impact') ? 4 : 7;
    for (let i = 0; i < amount && this.particles.length < cap; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (explosion ? 130 : 75) + Math.random() * (explosion ? 330 : 180), life = 0.18 + Math.random() * 0.4;
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color: explosion ? (i % 4 === 0 ? '#99ddff' : i % 3 === 0 ? '#ffe2a0' : '#ffad42') : weaponColors[e.weaponKind ?? this.world.weaponKind] });
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
    const scatter = this.world.weaponKind === 'scatter';
    const img = this.images.get(scatter ? 'scatter-player-v1.png' : 'units.png'); if (!img) return;
    const c = this.ctx, sw = img.width / (scatter ? 3 : 4), sh = img.height / (scatter ? 1 : 2);
    const width = 160, height = 213, left = x - width / 2, top = y - height / 2;
    // Original legs overlap the torso by 16 source pixels; torso is drawn last
    // to cover the seam while preserving the original perspective and alpha.
    for (let leg = 0; leg < 2; leg++) {
      c.drawImage(img, frame * sw + leg * sw / 2, sh * 0.625, sw / 2, sh * 0.375,
        left + leg * width / 2, top + height * 0.625 + (leg ? pose.right : pose.left), width / 2, height * 0.375);
    }
    c.drawImage(img, frame * sw, 0, sw, sh * 0.6875, left, top + pose.bob + recoil, width, height * 0.6875);
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
    if (this.mode === 'menu') this.drawMenu();
    else {
      this.drawHud();
      if (this.notice && this.platform.now() < this.noticeUntil && this.mode === 'playing') {
        this.rect(58, this.noticeY - 31, 604, 62, '#0a1c2af0'); this.text(this.notice, 360, this.noticeY, 28, '#d2f2ff');
      }
    }
    if (this.mode === 'paused' || this.mode === 'settings' || this.mode === 'result') this.drawDialog();
    c.restore();
  }
  private drawWorld(dt: number) {
    const c = this.ctx, w = this.world;
    this.gateFeedback.sync(w.bodies, w.time);
    this.gateFeedback.advance(dt);
    this.drawGuide();
    this.drawDestruction(dt);
    this.enemyWreck.trim(Math.min(this.save.settings.effects === 'weak' ? 3 : 6, 9 - this.crateDebris.pieces.length));
    this.enemyWreck.advance(dt);
    for (const piece of this.enemyWreck.pieces) {
      const wreckImage = this.images.get(`${piece.kind}-wreck-v1.png`);
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
        } else if (b.kind === 'elite') {
          const frame = eliteFrame(b), width = b.width * 1.68, height = b.height * 1.36;
          this.frameSprite('elite-v1.png', frame, 3, b.x, y, width, height, 1);
          this.hitSprite('elite-v1.png', frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
        } else {
          const frame = bossFrame(b);
          this.frameSprite('boss-v1.png', frame, 3, b.x, y, width, height, 1);
          this.hitSprite('boss-v1.png', frame, 3, b.x, y, width, height, b.hit, 0.07, 1);
        }
      }
    }
    for (const b of w.bullets.filter(b => !b.hostile)) {
      energyShot(c, b.x, b.y, b.vx, b.vy, b.weaponKind ?? 'pulse', w.time, this.save.settings.effects === 'weak');
    }
    const playerY = this.mode === 'menu' ? 750 : C.playerY;
    c.fillStyle = '#0005'; c.beginPath(); c.ellipse(w.player.x + 5, playerY + 32, 53, 30, 0, 0, Math.PI * 2); c.fill();
    c.save();
    if (w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0) c.globalAlpha = 0.65;
    const recoil = w.time < this.recoilUntil ? 2.5 : 0;
    const pose = this.playerMotion.sample(w.player.x, w.time);
    if (w.player.hp > 0) {
      if (this.mode === 'menu') this.frameSprite('units.png', 2, 4, w.player.x, playerY, 200, 267);
      else {
        this.playerSprite(w.growth.stage - 1, w.player.x, playerY, pose, recoil);
        const remaining = w.player.invulnerable - (C.invulnerability - 0.12);
        if (remaining > 0) {
          c.save(); c.globalCompositeOperation = 'lighter';
          c.globalAlpha *= Math.min(1, remaining / 0.12) * (this.save.settings.effects === 'weak' ? 0.18 : 0.48);
          this.playerSprite(w.growth.stage - 1, w.player.x, playerY, pose, recoil); c.restore();
        }
      }
    }
    c.restore();
    if (this.mode === 'playing' && w.player.hp > 0 && this.platform.now() < this.muzzleUntil) {
      for (const offset of weaponProfile(w.weaponKind, w.growth.stage).offsets) {
        const x = w.player.x + offset, y = C.playerY - 78;
        muzzleLight(c, x, y, w.weaponKind, Math.max(0, (this.muzzleUntil - this.platform.now()) / 80), this.save.settings.effects === 'weak');
      }
    }
    if (this.mode === 'playing' && this.platform.now() < this.upgradeUntil) {
      const remaining = (this.upgradeUntil - this.platform.now()) / 450;
      c.save(); c.globalAlpha = remaining * 0.8; c.strokeStyle = '#80e4ff'; c.lineWidth = 3;
      c.beginPath(); c.arc(w.player.x, C.playerY, 48 + (1 - remaining) * 100, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    for (const e of this.blasts) {
      e.life -= dt; const age = 1 - e.life / e.total;
      c.save(); c.globalAlpha = Math.pow(Math.max(0, 1 - age), 0.65) * (this.save.settings.effects === 'weak' ? 0.5 : 0.9);
      this.frameSprite('explosion-v1.png', Math.min(8, Math.floor(age * 9)), 3, e.x, e.y, e.size * 2, e.size * 2, 3); c.restore();
      detonationLight(c, e.x, e.y, e.size, age, this.save.settings.effects === 'weak');
    }
    this.blasts = this.blasts.filter(e => e.life > 0);
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
      if (b.warning > 0) {
        const lanes = b.kind === 'boss' ? bossWarningLanes(b) : [b.x];
        if (b.kind === 'charger' && b.pattern === 'flank') {
          const startY = b.y + Math.max(0, C.chargerBehavior.dashAge - b.age) * b.speed;
          const timeToLane = Math.abs(b.lane - b.x) / 240;
          const kneeY = startY + timeToLane * C.chargerBehavior.dashSpeed;
          const endY = Math.min(C.playerY + 50, kneeY);
          const endX = b.x + (b.lane - b.x) * Math.min(1, Math.max(0, (endY - startY) / Math.max(1, kneeY - startY)));
          c.save(); c.strokeStyle = '#ff775633'; c.lineWidth = 62; c.beginPath(); c.moveTo(b.x, b.y + 30); c.lineTo(b.x, startY); c.lineTo(endX, endY); if (kneeY < C.playerY) c.lineTo(b.lane, C.playerY + 50); c.stroke();
          c.strokeStyle = '#ffb18c'; c.lineWidth = 2; c.stroke(); c.restore();
        } else if (b.pattern === 'fan') {
          const originY = b.y + b.speed * Math.max(0, b.timer) + b.height / 2;
          c.save(); c.strokeStyle = '#ffb18caa'; c.lineWidth = 2;
          for (const vx of fanWarningVelocities(b)) { const shotY = originY + (b.kind === 'elite' && !b.burst && Math.abs(vx) === 50 ? b.speed * 0.6 : 0); c.beginPath(); c.moveTo(b.x, shotY); c.lineTo(b.x + vx * (C.playerY - shotY) / 280, C.playerY); c.stroke(); }
          c.restore();
        } else if (b.kind === 'boss' || b.kind === 'charger') for (const x of lanes) {
          this.rect(x - 36, b.y + 60, 72, 1110 - b.y, '#ff775620');
          c.strokeStyle = '#ff986eaa'; c.lineWidth = 2; c.strokeRect(x - 36, b.y + 60, 72, 1110 - b.y);
          if (b.kind === 'boss') {
            if (b.attack === 3) {
              if (x === lanes[0]) {
                this.rect(b.lane - 42, b.y + 132, 84, 38, '#0b1723ef');
                this.text('缺口', b.lane, b.y + 151, 24, '#d9f4ff', 'center', true);
                this.text('封锁', x, b.y + 151, 24, '#ffe1c8', 'center', true);
              }
              continue;
            }
            const label = b.attack === 3 ? '封锁' : b.attack === 2 ? '齐射' : b.attack ? x === 360 ? '第2拍' : '第1拍' : '锁定';
            this.rect(x - 35, b.y + 132, 70, 38, '#241c1eef');
            this.text(label, x, b.y + 151, 24, '#ffe1c8', 'center', true);
          }
        } else this.rect(b.x - 5, b.y + b.height / 2, 10, 14, '#ffe1a2');
      }
      if (b.kind === 'crate') {
        if (b.weaponKind) {
          const choice = b.weaponKind === w.weaponKind ? '保留' : '换装';
          const role = b.weaponKind === 'pulse' ? '高速集中火力' : b.weaponKind === 'scatter' ? '扇面覆盖' : `贯穿${weaponProfile('pierce', b.stage).targets}个敌人`;
          // Enter below the crate until the full panel fits beneath the HUD.
          const panelY = b.y - 158 >= this.hudTop + 128 ? b.y - 158 : Math.max(this.hudTop + 128, b.y + 70);
          this.rect(b.x - 118, panelY, 236, 100, '#0b1723ef');
          this.text(`${choice} ${weaponNames[b.weaponKind]} T${b.stage}`, b.x, panelY + 23, 25, weaponColors[b.weaponKind], 'center', true);
          this.text(role, b.x, panelY + 51, 24, '#cfdee9');
          this.text(`打碎再拾取 · ${Math.ceil(b.hp)}`, b.x, panelY + 78, 23, '#fff0c8');
          this.bar(b.x, b.y - 52, 102, b.hp / b.maxHp, '#e5b96a');
        } else {
          this.rect(b.x - 105, b.y - 110, 210, 40, '#0b1723df');
          this.text(`T${b.stage} ${w.growth.stage >= b.stage ? '充能+30' : '装备'} · ${Math.ceil(b.hp)}`, b.x, b.y - 90, 28, '#fff0c8', 'center', true);
          this.bar(b.x, b.y - 64, 102, b.hp / b.maxHp, '#e5b96a');
        }
      } else if (b.kind === 'pickup') this.text(b.weaponKind ? `拾取${b.weaponKind === w.weaponKind ? '保留' : '换装'}${weaponNames[b.weaponKind]}` : `拾取 T${b.stage}`, b.x, b.y - 50, b.weaponKind ? 26 : 28, '#ffe7b1', 'center', true);
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
        this.text(`重装首领　${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`, 360, this.hudTop + 145, 25, '#ffd59e');
        this.bar(360, this.hudTop + 166, 430, b.hp / b.maxHp, '#ff925d');
      } else if (b.kind === 'armor' || b.kind === 'elite') this.bar(b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, '#f39b69');
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
    const img = this.images.get('boss-v1.png'); if (!img) return;
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
    this.rect(0, 0, 720, y + 118, '#08131be8');
    this.text('分数', 30, y + 6, 20, '#91adbf', 'left');
    this.text(w.score.toString().padStart(6, '0'), 28, y + 43, 42, '#e9f6ff', 'left', true);
    this.text('◈ '.repeat(w.player.hp) + '◇ '.repeat(3 - w.player.hp), 430, y + 35, 34, '#82deff');
    this.rect(624, y + 2, 64, 64, '#1a2e3e'); this.text('Ⅱ', 656, y + 34, 36);
    this.buttons.push({ x: 624, y: y + 2, w: 64, h: 64, label: '暂停', action: 'pause' });
    this.text(`T${w.growth.stage} ${weaponNames[w.weaponKind]}`, 30, y + 88, 26, weaponColors[w.weaponKind], 'left', true);
    this.text(w.growth.overload > 0 ? `超载 ${w.growth.overload.toFixed(1)}s` : `火力 +${w.growth.bonus}%`, 280, y + 88, 26, '#74dcff', 'left', true);
    this.text(`${w.round}轮·${sectorNames[sectorIndex(w.round)]}`, 686, y + 88, 26, '#b0c4d1', 'right');
    this.bar(360, y + 115, 660, w.growth.overload > 0 ? w.growth.overload / 6 : w.growth.energy / 100, w.growth.overload > 0 ? '#ffc66b' : '#5bddff');
  }
  private drawGuide() {
    if (this.mode !== 'playing') return;
    // Optional help is below all entities, effects, projectiles and native labels.
    // Briefly omit it while a passing body occupies the help area: neither its
    // silhouette nor the instruction should become an unreadable composite.
    if (this.world.bodies.some(b => b.active && b.y + b.height * 0.8 >= 1150 && b.y - b.height * 0.8 <= 1256)) return;
    const guide = contextGuide(this.world);
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
    this.text(`最高分　${this.save.best}`, 360, 955, 26, '#e8c98d');
    this.button('开始突围　›', 998, 'start', true); this.button('设置', 1102, 'settings');
    this.text('射击装备，再走位领取强化', 360, 1230, 23, '#99b6c9');
  }
  private drawDialog() {
    const w = this.world;
    this.rect(0, 0, 720, 1280, '#050e18cc'); this.rect(70, 340, 580, this.mode === 'settings' ? this.platform.openLicenses ? 800 : 710 : 640, '#122331f5');
    this.buttons = [];
    if (this.mode === 'paused') {
      this.text('暂停', 360, 420, 48, '#eff8ff', 'center', true); this.text('准备好了，再继续突围。', 360, 490, 26, '#a9bfce');
      this.button('继续战斗', 560, 'resume', true); this.button('设置', 670, 'settings'); this.button('返回主界面', 780, 'home');
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
    } else {
      this.text('本次突围结束', 360, 415, 30, '#b6d2e2'); this.text(w.score.toString(), 360, 510, 94, '#eff8ff', 'center', true);
      this.text(`最高分 ${this.save.best}`, 360, 585, 26, '#e8c88b');
      this.text(`存活 ${Math.floor(w.time / 60)}:${Math.floor(w.time % 60).toString().padStart(2, '0')}　/　T${w.maxStage}　/　第${w.round}轮`, 360, 660, 26, '#bcd5e4');
      this.button('再次突围　›', 740, 'start', true); this.button('返回主界面', 850, 'home');
    }
  }
  diagnostics() {
    return { mode: this.mode, time: this.world.time, round: this.world.round, phase: this.world.phase,
      score: this.world.score, hp: this.world.player.hp, growth: { ...this.world.growth }, weaponKind: this.world.weaponKind,
      playerX: this.world.player.x,
      inputMode: this.inputMode,
      bodies: this.world.bodies.length, bullets: this.world.bullets.length, particles: this.particles.length, blasts: this.blasts.length,
      bossDestructionAge: this.destruction?.age ?? null,
      crateFragments: this.crateDebris.pieces.length,
      droneFragments: this.enemyWreck.pieces.filter(p => p.kind === 'drone').length,
      enemyFragments: this.enemyWreck.pieces.length,
      gateReceipts: this.gateFeedback.receipts.length,
      ...this.frameTimes.snapshot() };
  }
}

export function parseSave(value: unknown): Save {
  const result = defaults();
  if (typeof value !== 'object' || value === null) return result;
  const data = value as Partial<Save>;
  if (data.version !== 1) return result;
  if (Number.isFinite(data.best) && data.best! >= 0) result.best = Math.floor(data.best!);
  if (data.settings?.effects === 'weak') result.settings.effects = 'weak';
  for (const key of ['shake', 'sound', 'music'] as const) if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
  return result;
}
