import { C, clamp } from '../core/config';
import { World } from '../core/world';
import type { EffectEvent } from '../core/world';
import { gateValue, previewReward } from '../core/rewards';
import { bossWarningLanes } from '../core/behavior';
import { defaults } from '../ui/storage';
import { FrameWindow } from './frame-window';
import { BossDestruction, BOSS_VISUAL } from './boss-destruction';
import type { Save } from '../ui/storage';

export interface Platform {
  canvas: HTMLCanvasElement;
  image: (src: string) => Promise<HTMLImageElement>;
  read: () => Save;
  write: (save: Save) => void;
  sound: (type: string, stage: number) => void;
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
const unitFrames: Record<string, number> = { drone: 3, charger: 4, armor: 5, elite: 6, boss: 7 };
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
  private destruction?: BossDestruction;
  private accumulator = 0;
  private lastTime = 0;
  private visualTime = 0;
  private target = 360;
  private pointer: number | null = null;
  private pointerX = 0;
  private downAction = '';
  private notice = '';
  private noticeY = 277;
  private noticeUntil = 0;
  private shakeUntil = 0;
  private muzzleUntil = 0;
  private upgradeUntil = 0;
  private error = '';
  private started = false;
  private lastTutorial = '';
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
    try {
      await Promise.all(['units.png', 'props.png', 'runway.jpg', 'explosion-v1.png'].map(async key => this.images.set(key, await this.platform.image(`assets/${key}`))));
      this.mode = 'menu';
    } catch { this.error = '资源加载失败，请重新进入游戏'; this.mode = 'error'; }
    this.lastTime = this.platform.now();
    if (!this.started) { this.started = true; this.platform.requestFrame(time => this.frame(time)); }
  }
  private frame(_timestamp: number) {
    const time = this.platform.now();
    const elapsed = Math.max(0, (time - this.lastTime) / 1000); this.lastTime = time;
    const dt = Math.min(elapsed, 0.1);
    if (this.mode === 'playing') {
      this.frameTimes.add(elapsed * 1000);
      if (elapsed > 0.25) this.pause('运行中断，已暂停');
      else {
        this.accumulator += dt;
        let steps = 0;
        try {
          while (this.accumulator + 1e-9 >= C.step && steps++ < 5 && this.mode === 'playing') {
            this.world.step(C.step, this.target); this.accumulator -= C.step;
            for (const e of this.world.drainEffects()) this.effect(e);
            if (this.world.player.hp <= 0) {
              this.mode = 'result'; this.cancelTouch(); this.save.best = Math.max(this.save.best, this.world.score); this.platform.write(this.save); this.platform.silence();
            }
          }
          if (this.accumulator > C.step * 2) this.pause('设备暂时繁忙，已暂停');
        } catch { this.error = '运行异常，请重新开始'; this.mode = 'error'; this.platform.silence(); }
        const t = this.world.time;
        const tutorial = t < 2 ? '左右拖动 · 自动开火' : t > 8 && t < 10 ? '打碎装备箱，再靠近领取' : t > 20 && t < 22 ? '把奖励打高，穿过数字门领取' : '';
        if (tutorial && tutorial !== this.lastTutorial) { this.lastTutorial = tutorial; this.notify(tutorial); }
      }
    }
    if (this.mode === 'playing' || this.mode === 'menu' || this.mode === 'result') this.visualTime += dt;
    this.updateMusic();
    this.render(this.mode === 'paused' || this.mode === 'settings' ? 0 : dt);
    this.platform.requestFrame(next => this.frame(next));
  }
  start() {
    this.world = new World(1337); this.mode = 'playing'; this.target = 360;
    this.accumulator = 0; this.lastTime = this.platform.now(); this.pointer = null;
    this.frameTimes.clear(); this.downAction = '';
    this.particles = []; this.blasts = []; this.destruction = undefined; this.lastTutorial = ''; this.notice = ''; this.shakeUntil = 0; this.muzzleUntil = 0; this.upgradeUntil = 0;
    this.platform.silence();
    this.updateMusic();
  }
  pause(message = '暂停') {
    if (this.mode !== 'playing') return;
    this.mode = 'paused'; this.cancelTouch(); this.accumulator = 0; this.notify(message); this.platform.silence();
    this.updateMusic();
  }
  hide() { this.pause('切换至后台，已暂停'); this.cancelTouch(); this.platform.silence(); }
  show() { this.lastTime = this.platform.now(); this.accumulator = 0; this.cancelTouch(); }
  private updateMusic() {
    try { this.platform.music?.(this.mode === 'playing' && this.save.settings.music); }
    catch { /* An optional platform audio feature must not stop the game. */ }
  }
  moveKeyboard(direction: number, dt: number) { if (this.mode === 'playing') this.target = clamp(this.world.player.x + direction * C.moveSpeed * dt, C.minX, C.maxX); }
  private point(x: number, y: number) { return { x: (x - this.offsetX) / this.scale, y: (y - this.offsetY) / this.scale }; }
  touchStart(id: number, x: number, y: number) {
    if (this.pointer !== null) return;
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
    else if (action === 'home') { this.mode = 'menu'; this.world = new World(); this.platform.silence(); this.notice = ''; this.particles = []; this.blasts = []; this.destruction = undefined; }
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
    if (this.save.settings.sound) this.platform.sound(e.type, this.world.growth.stage);
    if (e.type === 'fire') { this.muzzleUntil = this.platform.now() + 48; return; }
    if (e.type === 'upgrade' || e.type === 'overload') this.upgradeUntil = this.platform.now() + 450;
    if (e.text && !e.type.startsWith('impact') && e.type !== 'gate-level') this.notify(e.text, e.type === 'victory' ? 820 : 277);
    const explosion = ['kill', 'crate-break', 'boss-kill', 'crash', 'death'].includes(e.type);
    if (e.type === 'boss-kill') this.destruction = new BossDestruction(e.x, e.y);
    else if (explosion && this.blasts.length < 4) this.blasts.push({ x: e.x, y: e.y, size: e.size ?? 80, life: 0.45, total: 0.45 });
    if ((e.type === 'hurt' || e.type === 'boss-kill') && this.save.settings.shake) this.shakeUntil = this.platform.now() + 100;
    const cap = this.save.settings.effects === 'weak' ? 50 : 160;
    const amount = explosion ? 14 : e.type.startsWith('impact') ? 2 : 7;
    for (let i = 0; i < amount && this.particles.length < cap; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 60 + Math.random() * 160, life = 0.2 + Math.random() * 0.4;
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color: explosion ? '#ffb260' : '#7ae2ff' });
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
    const ground = this.images.get('runway.jpg')!;
    const h = ground.height / ground.width * 720;
    const scroll = ((this.mode === 'menu' ? this.visualTime * 12 : w.time * w.scrollSpeed) % h);
    c.drawImage(ground, 0, scroll - h, 720, h); c.drawImage(ground, 0, scroll, 720, h);
    this.rect(0, 0, 720, 1280, '#07111b25');
    c.save();
    if (this.platform.now() < this.shakeUntil) c.translate(Math.sin(this.platform.now()) * 3, Math.cos(this.platform.now()) * 3);
    this.drawWorld(dt);
    c.restore();
    if (this.mode === 'menu') this.drawMenu();
    else {
      this.drawHud();
      if (this.mode === 'playing') this.text('‹　左右拖动 · 自动开火　›', 360, 1230, 24, '#b8d4e3');
      if (this.notice && this.platform.now() < this.noticeUntil && this.mode === 'playing') {
        this.rect(58, this.noticeY - 31, 604, 62, '#0a1c2af0'); this.text(this.notice, 360, this.noticeY, 28, '#d2f2ff');
      }
    }
    if (this.mode === 'paused' || this.mode === 'settings' || this.mode === 'result') this.drawDialog();
    c.restore();
  }
  private drawWorld(dt: number) {
    const c = this.ctx, w = this.world;
    this.drawDestruction(dt);
    for (const b of w.bodies) {
      c.fillStyle = '#0005'; c.beginPath(); c.ellipse(b.x + 5, b.y + b.height * 0.3, b.width * 0.45, b.height * 0.2, 0, 0, Math.PI * 2); c.fill();
      if (b.kind === 'gate') {
        this.frameSprite('props.png', b.rewardKind === 'energy' ? 4 : 3, 3, b.x, b.y, b.width + 72, 225);
        this.rect(b.x - b.width / 2 + 5, b.y - 54, b.width - 10, 108, '#071927f5');
      } else if (b.kind === 'crate') this.frameSprite('props.png', b.hp < b.maxHp * 0.55 ? 1 : 0, 3, b.x, b.y, 124, 134);
      else if (b.kind === 'pickup') this.frameSprite('props.png', 2, 3, b.x, b.y, 65, 65);
      else this.frameSprite('units.png', unitFrames[b.kind], 4, b.x, b.y + (b.kind === 'boss' ? BOSS_VISUAL.offsetY : 0), b.kind === 'boss' ? BOSS_VISUAL.width : b.width * 1.4, b.kind === 'boss' ? BOSS_VISUAL.height : b.height * 1.55);
    }
    for (const b of w.bullets.filter(b => !b.hostile)) {
      c.strokeStyle = '#62dcff44'; c.lineWidth = 10; c.beginPath(); c.moveTo(b.x, b.y + 22); c.lineTo(b.x, b.y - 10); c.stroke();
      c.strokeStyle = w.growth.overload > 0 ? '#ffcd76' : '#73e3ff'; c.lineWidth = 4; c.stroke();
      c.strokeStyle = '#e6fcff'; c.lineWidth = 1.5; c.stroke();
    }
    const playerY = this.mode === 'menu' ? 750 : C.playerY;
    c.fillStyle = '#0005'; c.beginPath(); c.ellipse(w.player.x + 5, playerY + 32, 53, 30, 0, 0, Math.PI * 2); c.fill();
    c.save();
    if (w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0) c.globalAlpha = 0.35;
    const recoil = this.mode === 'playing' && this.platform.now() < this.muzzleUntil ? 2.5 : 0;
    if (w.player.hp > 0) this.frameSprite('units.png', this.mode === 'menu' ? 2 : w.growth.stage - 1, 4, w.player.x, playerY + recoil, this.mode === 'menu' ? 200 : 160, this.mode === 'menu' ? 267 : 213);
    c.restore();
    if (this.mode === 'playing' && w.player.hp > 0 && this.platform.now() < this.muzzleUntil) {
      for (const offset of C.weapon[w.growth.stage - 1].offsets) {
        const x = w.player.x + offset, y = C.playerY - 78;
        c.fillStyle = '#62dcff77'; c.beginPath(); c.ellipse(x, y, 10, 20, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#eaffff'; c.beginPath(); c.ellipse(x, y - 3, 3, 10, 0, 0, Math.PI * 2); c.fill();
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
    }
    this.blasts = this.blasts.filter(e => e.life > 0);
    for (const s of this.particles) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 70 * dt;
      c.save(); c.globalAlpha = Math.max(0, s.life / s.total); c.strokeStyle = s.color; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); c.stroke(); c.restore();
    }
    this.particles = this.particles.filter(s => s.life > 0);
    // Dangerous projectiles and native labels are always above visual explosions.
    for (const b of w.bullets.filter(b => b.hostile)) {
      c.fillStyle = '#ff7756'; c.strokeStyle = '#1a171d'; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x - 8, b.y - 7); c.lineTo(b.x + 8, b.y - 7); c.lineTo(b.x, b.y + 12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffead7'; c.fillRect(b.x - 2, b.y - 5, 4, 8);
    }
    for (const b of w.bodies) {
      if (b.warning > 0) {
        const lanes = b.kind === 'boss' ? bossWarningLanes(b) : [b.x];
        if (b.kind === 'boss' || b.kind === 'charger') for (const x of lanes) {
          this.rect(x - 36, b.y + 60, 72, 1110 - b.y, '#ff775620');
          c.strokeStyle = '#ff986eaa'; c.lineWidth = 2; c.strokeRect(x - 36, b.y + 60, 72, 1110 - b.y);
          if (b.kind === 'boss') {
            const label = b.attack ? x === 360 ? '第2拍' : '第1拍' : '锁定';
            this.rect(x - 35, b.y + 132, 70, 38, '#241c1eef');
            this.text(label, x, b.y + 151, 24, '#ffe1c8', 'center', true);
          }
        } else this.rect(b.x - 5, b.y + b.height / 2, 10, 14, '#ffe1a2');
      }
      if (b.kind === 'crate') {
        this.rect(b.x - 105, b.y - 110, 210, 40, '#0b1723df');
        this.text(`T${b.stage} ${w.growth.stage >= b.stage ? '充能+30' : '装备'} · ${Math.ceil(b.hp)}`, b.x, b.y - 90, 28, '#fff0c8', 'center', true);
        this.bar(b.x, b.y - 64, 102, b.hp / b.maxHp, '#e5b96a');
      } else if (b.kind === 'pickup') this.text(`拾取 T${b.stage}`, b.x, b.y - 50, 28, '#ffe7b1', 'center', true);
      else if (b.kind === 'gate') {
        const value = previewReward(w.growth, gateValue(b.energy), b.rewardKind);
        const mixed = value.power > 0 && value.energy > 0;
        this.rect(b.x - b.width / 2 + 5, b.y - (mixed ? 80 : 54), b.width - 10, mixed ? 164 : 108, '#071927f5');
        this.text(mixed ? '穿过领取' : value.power ? '穿过领取 · 火力' : value.energy ? '穿过领取 · 超载' : '储能已满', b.x, b.y - (mixed ? 60 : 33), 25, '#a4d6e9');
        if (mixed) {
          this.text(`+${value.power}%`, b.x, b.y - 18, 50, '#effaff', 'center', true);
          this.text(`充能 +${value.energy}`, b.x, b.y + 32, 36, '#ffe4ac', 'center', true);
        } else this.text(`+${value.power || value.energy}${value.power ? '%' : ''}`, b.x, b.y + 8, 50, '#effaff', 'center', true);
        const tier = C.thresholds.findIndex(t => t > b.energy);
        const progress = tier < 0 ? 1 : (b.energy - C.thresholds[tier - 1]) / (C.thresholds[tier] - C.thresholds[tier - 1]);
        this.bar(b.x, b.y + (mixed ? 72 : 46), b.width - 32, progress, b.rewardKind === 'power' ? '#5bddff' : '#e5b96a');
      } else if (b.kind === 'boss') {
        this.text(`重装首领　${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`, 360, this.hudTop + 145, 25, '#ffd59e');
        this.bar(360, this.hudTop + 166, 430, b.hp / b.maxHp, '#ff925d');
      } else if (b.kind === 'armor' || b.kind === 'elite') this.bar(b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, '#f39b69');
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
    const img = this.images.get('units.png'); if (!img) return;
    const c = this.ctx, sw = img.width / 4, sh = img.height / 2;
    for (const piece of wreck.pieces) {
      c.save(); c.globalAlpha = piece.alpha;
      c.translate(wreck.x + (piece.from + piece.width / 2 - 0.5) * BOSS_VISUAL.width + piece.dx, wreck.y + BOSS_VISUAL.offsetY + piece.dy);
      c.rotate(piece.angle);
      c.drawImage(img, (3 + piece.from) * sw, sh, piece.width * sw, sh, -piece.width * BOSS_VISUAL.width / 2, -BOSS_VISUAL.height / 2, piece.width * BOSS_VISUAL.width, BOSS_VISUAL.height);
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
    this.text(`T${w.growth.stage} ${['单管', '双管', '重炮'][w.growth.stage - 1]}`, 30, y + 88, 26, '#74dcff', 'left', true);
    this.text(w.growth.overload > 0 ? `超载 ${w.growth.overload.toFixed(1)}s` : `火力 +${w.growth.bonus}%`, 280, y + 88, 26, '#74dcff', 'left', true);
    this.text(`第${w.round}轮`, 686, y + 88, 23, '#b0c4d1', 'right');
    this.bar(360, y + 115, 660, w.growth.overload > 0 ? w.growth.overload / 6 : w.growth.energy / 100, w.growth.overload > 0 ? '#ffc66b' : '#5bddff');
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
      score: this.world.score, hp: this.world.player.hp, growth: { ...this.world.growth },
      playerX: this.world.player.x,
      bodies: this.world.bodies.length, bullets: this.world.bullets.length, particles: this.particles.length, blasts: this.blasts.length,
      bossDestructionAge: this.destruction?.age ?? null,
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
