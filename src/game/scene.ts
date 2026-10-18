import Phaser from 'phaser';
import{calibrationGateReward,CALIBRATION_GATE}from'../core/calibration-gate';
import{weaponNames}from'../core/weapons';
import { C, clamp } from '../core/config';
import { World } from '../core/world';
import type { Body, EffectEvent } from '../core/world';
import { gateValue, previewReward } from '../core/rewards';
import { GameAudio } from './audio';
import { Interface } from '../ui/interface';
import type { Settings } from '../ui/storage';

interface View { sprite: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse; label?: Phaser.GameObjects.Text; sub?: Phaser.GameObjects.Text; bar?: Phaser.GameObjects.Graphics; plate?: Phaser.GameObjects.Rectangle }
interface Burst { x: number; y: number; vx: number; vy: number; life: number; total: number; size: number; color: number }
interface Explosion { image: Phaser.GameObjects.Image; age: number; size: number; life: number }
const font = 'Segoe UI, Microsoft YaHei, sans-serif';

export class BattleScene extends Phaser.Scene {
  world = new World();
  ui!: Interface;
  readonly audio = new GameAudio();
  running = false;
  private paused = false;
  private accumulator = 0;
  private targetX = 360;
  private views = new Map<number, View>();
  private player!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private ground!: Phaser.GameObjects.TileSprite;
  private effectsGraphics!: Phaser.GameObjects.Graphics;
  private bulletsGraphics!: Phaser.GameObjects.Graphics;
  private dangerGraphics!: Phaser.GameObjects.Graphics;
  private muzzleGraphics!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.Text;
  private bursts: Burst[] = [];
  private explosions: Explosion[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private activePointer = -1;
  private pointerX = 0;
  private settings!: Settings;
  private flashTime = 0;
  private lastTutorial = '';
  private shotGlow = 0;
  private frameTimes: number[] = [];
  constructor() { super('Battle'); }
  preload() {
    this.load.spritesheet('units', 'assets/units.png', { frameWidth: 192, frameHeight: 256 });
    this.load.spritesheet('props', 'assets/props.png', { frameWidth: 256, frameHeight: 256 });
    this.load.image('runway', 'assets/runway.jpg');
    this.load.image('conduit','assets/conduit-v1.png');
    this.load.on('loaderror', () => document.dispatchEvent(new CustomEvent('game-failure', { detail: '资源加载失败，请检查连接后刷新。' })));
  }
  create() {
    const source = this.textures.get('runway').getSourceImage() as HTMLImageElement;
    this.ground = this.add.tileSprite(360, 640, 720, 1280, 'runway').setDepth(0);
    this.ground.setTileScale(720 / source.width);
    this.add.rectangle(360, 640, 720, 1280, 0x08121d, 0.18).setDepth(1);
    this.playerShadow = this.add.ellipse(365, C.playerY + 20, 105, 65, 0x000000, 0.42).setDepth(9);
    this.player = this.add.image(360, C.playerY, 'units', 0).setDisplaySize(132, 176).setDepth(30);
    this.effectsGraphics = this.add.graphics().setDepth(45);
    this.bulletsGraphics = this.add.graphics().setDepth(40);
    this.dangerGraphics = this.add.graphics().setDepth(65);
    this.muzzleGraphics = this.add.graphics().setDepth(42);
    this.bossLabel = this.add.text(360, 162, '', { fontFamily: font, fontSize: '25px', color: '#ffd69c', stroke: '#08131b', strokeThickness: 5 }).setOrigin(0.5).setDepth(90);
    this.ui = new Interface({
      start: () => this.startRun(), pause: () => this.pauseRun(), resume: () => this.resumeRun(), home: () => this.home(),
      settings: value => { this.settings = value; this.audio.enabled = value.sound; },
    });
    this.settings = this.ui.save.settings; this.audio.enabled = this.settings.sound;
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,ESC,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-ESC', () => { if (this.running) this.paused ? this.resumeRun() : this.pauseRun(); });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.running || this.paused || this.activePointer !== -1) return;
      this.activePointer = p.id; this.pointerX = p.x;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.activePointer !== p.id || !p.isDown || !this.running || this.paused) return;
      this.targetX = clamp(this.targetX + p.x - this.pointerX, C.minX, C.maxX); this.pointerX = p.x;
    });
    const release = () => { this.activePointer = -1; };
    this.input.on('pointerup', release); this.input.on('pointerupoutside', release); this.input.on('gameout', release);
    this.game.events.on(Phaser.Core.Events.BLUR, () => { if (this.running && !this.paused) this.pauseRun('已暂停'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.running && !this.paused) this.pauseRun('已暂停'); });
    this.home();
    document.dispatchEvent(new Event('game-ready'));
  }
  private reset() {
    for (const view of this.views.values()) this.destroyView(view);
    this.views.clear(); this.bursts = [];
    for (const e of this.explosions) e.image.destroy(); this.explosions = [];
    this.audio.stop(); this.world = new World(1337); this.targetX = 360;
    this.accumulator = 0; this.activePointer = -1; this.flashTime = 0; this.shotGlow = 0; this.lastTutorial = '';
  }
  startRun() { this.reset(); this.running = true; this.paused = false; this.ui.playing(); void this.audio.unlock(); }
  pauseRun(reason = '暂停') {
    if (!this.running || this.world.phase === 'dead') return;
    this.paused = true; this.accumulator = 0; this.activePointer = -1; this.audio.stop(); this.ui.paused(reason);
  }
  resumeRun() {
    if (!this.running || this.world.phase === 'dead') return;
    this.paused = false; this.accumulator = 0; this.activePointer = -1;
    this.targetX = this.world.player.x; this.ui.playing(); void this.audio.unlock();
  }
  home() {
    this.reset(); this.running = false; this.paused = false;
    this.player.setFrame(2); this.ui.menu();
  }
  update(_time: number, delta: number) {
    if (!this.ui) return;
    const dt = Math.min(delta / 1000, 0.1);
    if (this.running && !this.paused && this.world.phase !== 'dead') {
      this.frameTimes.push(delta); if (this.frameTimes.length > 36000) this.frameTimes.shift();
      if (delta > 250) this.pauseRun('运行中断，已暂停');
      else {
        this.accumulator += dt;
        const right = this.keys.D.isDown || this.keys.RIGHT.isDown;
        const left = this.keys.A.isDown || this.keys.LEFT.isDown;
        if (right || left) this.targetX = clamp(this.world.player.x + (Number(right) - Number(left)) * C.moveSpeed * dt, C.minX, C.maxX);
        let steps = 0;
        while (this.accumulator + 1e-9 >= C.step && steps++ < 5) {
          this.world.step(C.step, this.targetX); this.accumulator -= C.step;
          for (const effect of this.world.drainEffects()) this.effect(effect);
        }
        if (this.accumulator > C.step * 2) this.pauseRun('设备暂时繁忙，已暂停');
        if (this.world.player.hp <= 0) { this.running = false; this.audio.stop(); this.ui.result(this.world); }
        this.tutorial();
      }
    }
    const animDt = this.paused ? 0 : dt;
    if (!this.paused) this.ground.tilePositionY -= (this.running ? this.world.scrollSpeed : 12) * animDt / this.ground.tileScaleY;
    this.renderWorld(animDt); this.ui.update(this.world);
  }
  private tutorial() {
    const time = this.world.time;
    const key = time < 3 ? '左右拖动 · 自动开火' : time > 8 && time < 10 ? '打碎装备箱，再靠近领取' : time > 20 && time < 22 ? '把奖励打高，穿过数字门领取' : '';
    if (key && key !== this.lastTutorial) { this.lastTutorial = key; this.ui.notify(key); }
  }
  private makeView(b: Body): View {
    const frames: Record<string, number> = { drone: 3, sniper: 3, guard: 5, charger: 4, armor: 5, elite: 6, boss: 7 };
    const prop = b.kind === 'gate' || b.kind === 'crate' || b.kind === 'pickup';
    const frame = b.kind === 'gate' ? b.rewardKind === 'energy' ? 4 : 3 : b.kind === 'crate' ? 0 : b.kind === 'pickup' ? 2 : frames[b.kind];
    const sprite = this.add.image(b.x, b.y, b.kind==='conduit'?'conduit':prop ? 'props' : 'units', b.kind==='conduit'?undefined:frame).setDepth(20);
    let width = b.width * 1.4, height = b.height * 1.55;
    if (b.kind === 'gate') { width = b.width + 72; height = 225; }
    else if (b.kind === 'crate') { width = 124; height = 134; }
    else if (b.kind === 'pickup') { width = 65; height = 65; }
    else if (b.kind === 'boss') { width = 420; height = 370; }
    sprite.setDisplaySize(width, height);
    const view: View = { sprite, shadow: this.add.ellipse(b.x + 5, b.y + b.height * 0.27, b.width * 0.9, b.height * 0.4, 0, 0.35).setDepth(8) };
    if (b.kind === 'gate') {
      view.plate = this.add.rectangle(b.x, b.y, b.width - 10, 108, 0x071927, 0.95).setStrokeStyle(1, 0x3b839f).setDepth(78);
      view.sub = this.add.text(b.x, b.y - 35, '穿过领取 · 火力', { fontFamily: font, fontSize: '26px', color: '#a8d8ec' }).setOrigin(0.5).setDepth(80);
      view.label = this.add.text(b.x, b.y + 7, '+10%', { fontFamily: font, fontSize: '50px', fontStyle: 'bold', color: '#ecfaff' }).setOrigin(0.5).setDepth(80);
      view.bar = this.add.graphics().setDepth(80);
    } else if (b.kind === 'crate' || b.kind === 'pickup') {
      view.label = this.add.text(b.x, b.y - 85, '', { fontFamily: font, fontSize: '28px', fontStyle: 'bold', color: '#fff1cd', stroke: '#111922', strokeThickness: 6 }).setOrigin(0.5).setDepth(80);
      view.bar = this.add.graphics().setDepth(80);
    } else if (b.kind === 'elite' || b.kind === 'boss' || b.kind === 'armor') view.bar = this.add.graphics().setDepth(70);
    this.views.set(b.id, view); return view;
  }
  private destroyView(v: View) { v.sprite.destroy(); v.shadow.destroy(); v.label?.destroy(); v.sub?.destroy(); v.bar?.destroy(); v.plate?.destroy(); }
  private renderWorld(dt: number) {
    const w = this.world;
    const menu = !this.running && w.phase !== 'dead';
    const playerY = menu ? 750 : C.playerY;
    this.player.setDisplaySize(menu ? 200 : 132, menu ? 267 : 176);
    this.player.setPosition(w.player.x, playerY + Math.sin(w.time * 15) * (this.running ? 1.5 : 0));
    this.playerShadow.setPosition(w.player.x + 5, playerY + 32);
    if (this.running || w.phase === 'dead') this.player.setFrame(w.growth.stage - 1);
    this.player.setAlpha(w.player.hp <= 0 ? 0 : w.player.invulnerable > 0 && Math.floor(w.time * 15) % 2 === 0 ? 0.35 : 1);
    const active = new Set(w.bodies.map(b => b.id));
    for (const [id, v] of this.views) if (!active.has(id)) { this.destroyView(v); this.views.delete(id); }
    this.dangerGraphics.clear();
    this.bossLabel.setVisible(w.phase === 'boss' || w.phase === 'boss-entry');
    for (const b of w.bodies) {
      const v = this.views.get(b.id) ?? this.makeView(b);
      v.sprite.setPosition(b.x, b.y); v.shadow.setPosition(b.x + 5, b.y + b.height * 0.27);
      if (b.hit > 0) v.sprite.setTint(0xbceeff); else v.sprite.clearTint();
      if (b.kind === 'crate') {
        v.sprite.setFrame(b.hp < b.maxHp * 0.55 ? 1 : 0);
        const duplicate = w.growth.stage >= b.stage;
        v.label!.setPosition(b.x, b.y - 90).setText(`T${b.stage} ${duplicate ? '充能 +30' : '装备'} · ${Math.ceil(b.hp)}`);
        this.bar(v.bar!, b.x, b.y - 65, 102, b.hp / b.maxHp, 0xe6b96a);
      } else if (b.kind === 'pickup') {
        v.sprite.setAngle(Math.sin(w.time * 5) * 8); v.label!.setPosition(b.x, b.y - 50).setText(`拾取 T${b.stage}`);
        v.bar?.clear();
      } else if (b.kind === 'gate') {
        const value = gateValue(b.energy, b.rewardKind), preview = previewReward(w.growth, value, b.rewardKind);
        let main = preview.power ? `+${preview.power}%` : preview.energy ? `+${preview.energy}` : '+0';
        let caption = preview.power ? '穿过领取 · 火力' : preview.energy ? '穿过领取 · 超载' : '储能已满';
        if (preview.power && preview.energy) { main = `+${preview.power}% / ${preview.energy}`; caption = '火力 / 超载'; }
        const calibration=calibrationGateReward(b);
        if(calibration){caption=`${weaponNames[calibration.kind]} · 精校门`;main=calibration.ready?`精校+1 / 充能+${calibration.charge}`:`充能+${calibration.charge} · 射至${CALIBRATION_GATE.threshold}`;}
        v.plate!.setPosition(b.x, b.y); v.sub!.setPosition(b.x, b.y - 35).setText(caption);
        v.label!.setPosition(b.x, b.y + 6).setText(main).setFontSize(calibration?24:main.length > 9 ? 34 : 50);
        const tier = C.thresholds.findIndex(threshold => threshold > b.energy);
        const progress = tier < 0 ? 1 : (b.energy - C.thresholds[tier - 1]) / (C.thresholds[tier] - C.thresholds[tier - 1]);
        this.bar(v.bar!, b.x, b.y + 46, b.width - 32, progress, b.rewardKind === 'energy' ? 0xe6b96a : 0x5bddff);
      } else if (b.kind === 'boss') {
        this.bossLabel.setText(`重装首领　${Math.ceil(b.hp)} / ${Math.ceil(b.maxHp)}`);
        this.bar(v.bar!, 360, 188, 430, b.hp / b.maxHp, 0xff8e59);
      } else if (v.bar) this.bar(v.bar, b.x, b.y - b.height / 2 - 14, b.width, b.hp / b.maxHp, 0xf29e65);
      if (b.warning > 0) {
        const g = this.dangerGraphics;
        // Local charge only, matching the current Canvas entry: no future lanes.
        g.fillStyle(0xffdc95,.65+Math.sin(w.time*22)*.2).fillCircle(b.x,b.y+b.height/2,8);
      }
    }
    const bg = this.bulletsGraphics; bg.clear();
    for (const b of w.bullets) {
      if (b.hostile) {
        this.dangerGraphics.fillStyle(0x171a24, 1).fillTriangle(b.x - 12, b.y - 10, b.x + 12, b.y - 10, b.x, b.y + 15);
        this.dangerGraphics.fillStyle(0xff7756, 1).fillTriangle(b.x - 7, b.y - 6, b.x + 7, b.y - 6, b.x, b.y + 10);
        this.dangerGraphics.fillStyle(0xffecd6, 1).fillTriangle(b.x - 3, b.y - 4, b.x + 3, b.y - 4, b.x, b.y + 5);
      } else {
        const color = w.growth.overload > 0 ? 0xffc86c : 0x62dbff;
        bg.lineStyle(10, color, 0.10).lineBetween(b.x, b.y + 22, b.x, b.y - 8);
        bg.lineStyle(5, color, 0.8).lineBetween(b.x, b.y + 10, b.x, b.y - 9);
        bg.lineStyle(2, 0xe7fbff, 1).lineBetween(b.x, b.y + 6, b.x, b.y - 11);
      }
    }
    this.shotGlow = Math.max(0, this.shotGlow - dt);
    this.muzzleGraphics.clear();
    if (this.running && this.shotGlow > 0) for (const offset of C.weapon[w.growth.stage - 1].offsets) {
      this.muzzleGraphics.fillStyle(0x92eaff, 0.8).fillEllipse(w.player.x + offset, C.playerY - 72, 12, 22);
      this.muzzleGraphics.fillStyle(0xf4feff, 1).fillEllipse(w.player.x + offset, C.playerY - 75, 5, 13);
    }
    this.renderEffects(dt);
  }
  private bar(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, ratio: number, color: number) {
    g.clear().fillStyle(0x07121b, 0.95).fillRect(x - width / 2 - 2, y - 2, width + 4, 12);
    g.fillStyle(0x34505f, 0.8).fillRect(x - width / 2, y, width, 8);
    g.fillStyle(color, 1).fillRect(x - width / 2, y, width * clamp(ratio, 0, 1), 8);
  }
  private effect(e: EffectEvent) {
    this.audio.event(e.type, this.world.growth.stage);
    if (e.type === 'fire') { this.shotGlow = 0.05; return; }
    if (e.text && !e.type.startsWith('impact') && e.type !== 'gate-level') this.ui.notify(e.text);
    if (e.type === 'hurt') { if (this.settings.shake) this.cameras.main.shake(90, 0.002); this.flashTime = 0.12; }
    if (e.type === 'upgrade' || e.type === 'overload') this.flashTime = 0.3;
    const explosion = ['kill', 'crate-break', 'boss-kill', 'crash', 'death'].includes(e.type);
    if (explosion && this.explosions.length < 4) {
      const size = e.size ?? 80;
      const image = this.add.image(e.x, e.y, 'props', 5).setDisplaySize(size * 1.8, size * 1.8).setDepth(44);
      this.explosions.push({ image, age: 0, size, life: e.type === 'boss-kill' ? 1 : 0.45 });
      if (e.type === 'boss-kill' && this.settings.shake) this.cameras.main.shake(160, 0.004);
    }
    const cap = this.settings.effects === 'weak' ? 50 : 160;
    const amount = explosion ? 14 : e.type.startsWith('impact') ? 2 : 7;
    const color = explosion ? 0xffb356 : e.type === 'hurt' ? 0xff7665 : 0x70ddff;
    for (let i = 0; i < amount && this.bursts.length < cap; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 40 + Math.random() * 180, life = 0.15 + Math.random() * 0.45;
      this.bursts.push({ x: e.x, y: e.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color, size: 1 + Math.random() * 3 });
    }
  }
  private renderEffects(dt: number) {
    const g = this.effectsGraphics; g.clear();
    for (const p of this.bursts) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt;
      g.lineStyle(p.size, p.color, Math.max(0, p.life / p.total)).lineBetween(p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    }
    this.bursts = this.bursts.filter(p => p.life > 0);
    this.explosions = this.explosions.filter(e => {
      e.age += dt; const f = e.age / e.life;
      if (f >= 1) { e.image.destroy(); return false; }
      e.image.setAlpha((1 - f) * (this.settings.effects === 'weak' ? 0.5 : 0.85)).setDisplaySize(e.size * (1.15 + f * 1.25), e.size * (1.15 + f * 1.25)); return true;
    });
    this.flashTime = Math.max(0, this.flashTime - dt);
    if (this.flashTime > 0 && this.world.player.hp > 0) {
      g.lineStyle(2, this.world.player.invulnerable > 0 ? 0xff7960 : 0x70dcff, Math.min(1, this.flashTime * 3));
      g.strokeCircle(this.world.player.x, C.playerY, 60 + (0.3 - this.flashTime) * 100);
    }
  }
  diagnostics() {
    const values = [...this.frameTimes].sort((a, b) => a - b);
    const percentile = (p: number) => values[Math.floor((values.length - 1) * p)] ?? 0;
    return { time: this.world.time, phase: this.world.phase, round: this.world.round, hp: this.world.player.hp,
      growth: { ...this.world.growth }, bodies: this.world.bodies.length, bullets: this.world.bullets.length,
      viewObjects: this.children.length, audioNodes: this.audio.activeNodes, peakBodies: this.world.peakBodies,
      peakBullets: this.world.peakBullets, score: this.world.score, frameSamples: values.length,
      p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) };
  }
}
