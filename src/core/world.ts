import { C, clamp } from './config';
import type { EnemyKind } from './config';
import { sweep } from './collision';
import { activateOverload, gateValue, grantEquipment, grantGate } from './rewards';
import type { Growth } from './rewards';
import { timeline } from './director';
import type { Spawn } from './director';
import { safeRoute } from './reachability';

export type BodyKind = EnemyKind | 'crate' | 'gate' | 'pickup';
export interface Body {
  id: number; kind: BodyKind; x: number; y: number; px: number; py: number;
  width: number; height: number; hp: number; maxHp: number; speed: number;
  active: boolean; age: number; timer: number; warning: number; hit: number;
  energy: number; row: number; stage: number; rewardKind: 'power' | 'energy'; attack: number; lane: number;
}
export interface Bullet {
  id: number; x: number; y: number; px: number; py: number;
  vx: number; vy: number; damage: number; age: number; active: boolean; hostile: boolean;
}
export interface EffectEvent { type: string; x: number; y: number; text?: string; size?: number }
interface Contact { t: number; rank: number; id: number; apply: () => void }
export type Phase = 'running' | 'boss-entry' | 'boss' | 'recovery' | 'dead';

/** Rendering-free authoritative simulation. Instances are discarded on restart. */
export class World {
  readonly growth: Growth = { stage: 1, bonus: 0, energy: 0, overload: 0 };
  player = { x: 360, px: 360, hp: 3, invulnerable: 0 };
  bodies: Body[] = [];
  bullets: Bullet[] = [];
  effects: EffectEvent[] = [];
  phase: Phase = 'running';
  round = 1; time = 0; roundTime = 0; phaseTime = 0; score = 0;
  shots = 0; hits = 0; kills = 0; cratesBroken = 0; pickups = 0; gatesTaken = 0;
  maxStage = 1; peakBodies = 0; peakBullets = 0; fallbackCount = 0;
  private nextId = 1;
  private nextRow = 1;
  private fireTimer = 0;
  private scheduled: Spawn[];
  private scheduleIndex = 0;
  private bossVictory = false;
  private secondChance = false;
  private readonly seed: number;

  constructor(seed = 1337) { this.seed = seed; this.scheduled = timeline(1, seed); }
  emit(type: string, x: number, y: number, text?: string, size?: number) {
    this.effects.push({ type, x, y, text, size });
  }
  drainEffects() { const out = this.effects; this.effects = []; return out; }

  spawn(kind: BodyKind, x: number, y = -80, stage = 2): Body {
    const enemy = kind in C.enemies ? C.enemies[kind as EnemyKind] : null;
    const hpScale = kind === 'boss' ? Math.min(1.35, 1 + (this.round - 1) * 0.1)
      : kind === 'drone' ? 1 : Math.min(1.6, 1 + (this.round - 1) * 0.15);
    const hp = enemy ? enemy.hp * hpScale : kind === 'crate' ? stage === 3 ? 112 : 48 : 1;
    const body: Body = {
      id: this.nextId++, kind, x, y, px: x, py: y,
      width: enemy?.width ?? (kind === 'gate' ? 240 : kind === 'pickup' ? 46 : 96),
      height: enemy?.height ?? (kind === 'gate' ? 138 : kind === 'pickup' ? 54 : 110),
      hp, maxHp: hp, speed: enemy ? enemy.speed * Math.min(1.15, 1 + (this.round - 1) * 0.05) : this.scrollSpeed,
      active: true, age: 0, timer: kind === 'boss' ? 2.8 : 2.4, warning: 0, hit: 0,
      energy: 0, row: 0, stage, rewardKind: this.growth.bonus >= 100 ? 'energy' : 'power', attack: 0, lane: 360,
    };
    this.bodies.push(body); return body;
  }
  get scrollSpeed() { return C.scrollSpeed + Math.min(2, this.round - 1) * 10; }
  private spawnGates(x: number, pair: boolean) {
    const row = this.nextRow++;
    for (const cx of pair ? [222, 498] : [x]) {
      const g = this.spawn('gate', cx, 180); g.row = row;
      if (!pair && x === 360) g.width = 264;
    }
  }
  private director(dt: number) {
    if (this.phase === 'running') {
      this.roundTime += dt;
      if (!this.secondChance && this.roundTime >= 25 && this.growth.stage === 1) {
        this.spawn('crate', 480, 180, 2); this.secondChance = true;
      }
      while (this.scheduleIndex < this.scheduled.length && this.scheduled[this.scheduleIndex].at <= this.roundTime) {
        const s = this.scheduled[this.scheduleIndex++];
        if (s.kind === 'gates') {
          if (this.growth.overload > 0 && this.growth.energy >= 100) this.spawn('drone', 360);
          else this.spawnGates(s.x, !!s.pair);
        } else if (s.kind === 'crate') this.spawn('crate', s.x, 180, s.stage);
        else {
          const enemyCount = this.bodies.filter(b => b.active && b.kind in C.enemies).length;
          if (enemyCount >= C.limits.enemies) { this.scheduleIndex--; break; }
          const candidate = this.spawn(s.kind, s.x);
          if (!safeRoute(this.player.x, this.bodies, this.bullets, Math.max(3, (C.playerY - candidate.y) / candidate.speed + 1))) {
            candidate.active = false; this.fallbackCount++;
            // Defer an unsafe new threat. Existing advertised objects remain intact.
          }
        }
      }
      if (this.roundTime >= 72 && this.scheduleIndex >= this.scheduled.length && !this.bodies.some(b => b.active)) {
        this.phase = 'boss-entry'; this.phaseTime = 0;
        const boss = this.spawn('boss', 360, -150); boss.speed = 0;
        this.emit('alert', 360, 360, '重装首领 · 警戒');
      }
    } else if (this.phase === 'boss-entry') {
      this.phaseTime += dt;
      const boss = this.bodies.find(b => b.kind === 'boss' && b.active);
      if (boss) boss.y = -150 + Math.min(1, this.phaseTime / 2) * 410;
      if (this.phaseTime >= 2) { this.phase = 'boss'; this.phaseTime = 0; }
    } else if (this.phase === 'boss') this.phaseTime += dt;
    else if (this.phase === 'recovery') {
      this.phaseTime += dt;
      if (this.phaseTime >= 4) {
        this.round++; this.roundTime = 0; this.phaseTime = 0; this.phase = 'running';
        this.scheduleIndex = 0; this.secondChance = this.growth.stage > 1;
        this.scheduled = timeline(this.round, this.seed + this.round * 719);
        this.emit('round', 360, 400, `第 ${this.round} 轮 · 继续突围`);
      }
    }
  }

  private shoot(dt: number) {
    this.fireTimer -= dt;
    if (this.phase === 'boss-entry' || this.phase === 'recovery') { this.fireTimer = 0; return; }
    const w = C.weapon[this.growth.stage - 1];
    while (this.fireTimer <= 1e-9) {
      if (this.bullets.filter(b => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error('Player bullet budget exceeded');
      for (let i = 0; i < w.offsets.length; i++) {
        const x = this.player.x + w.offsets[i], y = C.playerY - 72;
        this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx: 0, vy: -C.bulletSpeed,
          damage: w.damage[i] * (1 + this.growth.bonus / 100) * (this.growth.overload > 0 ? 1.35 : 1),
          age: 0, active: true, hostile: false });
        this.shots++;
      }
      this.emit('fire', this.player.x, C.playerY - 70, undefined, this.growth.stage);
      this.fireTimer += 1 / w.rate;
    }
  }
  private hostile(x: number, y: number, vx = 0, vy = 280) {
    if (this.bullets.filter(b => b.active && b.hostile).length >= C.limits.hostile) return;
    this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx, vy, damage: 1, age: 0, active: true, hostile: true });
  }
  private tickBody(b: Body, dt: number) {
    b.age += dt; b.hit = Math.max(0, b.hit - dt); b.timer -= dt;
    if (b.kind === 'boss') {
      if (this.phase !== 'boss') return;
      b.x = 360 + Math.sin(this.phaseTime * 0.4) * 65;
      if (b.timer <= 0) {
        if (b.warning <= 0) {
          b.warning = 1.35; b.timer = 1.35;
          b.attack = Math.floor(this.phaseTime / 3.5) % 2;
          b.lane = [200, 360, 520][Math.floor(this.phaseTime / 4) % 3];
        }
        else {
          const attack = b.attack;
          const lane = b.lane;
          if (!attack) for (let i = 0; i < 5; i++) this.hostile(lane, b.y + 90 - i * 45, 0, 320);
          else for (const x of [200, 360]) for (let i = 0; i < 3; i++) this.hostile(x, b.y + 90 - i * 60, 0, 300);
          b.warning = 0; b.timer = this.phaseTime > 35 ? 3.5 : 2.8;
        }
      }
    } else if (b.kind === 'charger') {
      if (b.age > 1.8 && b.age < 2.6) b.warning = 2.6 - b.age;
      if (b.age >= 2.6) { b.warning = 0; b.speed = 380; }
      b.y += b.speed * dt;
    } else {
      b.y += b.speed * dt;
      if ((b.kind === 'armor' || b.kind === 'elite') && b.y > 0 && b.y < 600) {
        if (b.timer <= 0) {
          if (b.warning <= 0) { b.warning = 0.6; b.timer = 0.6; }
          else { this.hostile(b.x, b.y + b.height / 2); b.warning = 0; b.timer = 2.4; }
        }
      } else if (b.y >= 600) b.warning = 0;
    }
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
      if (activateOverload(this.growth)) this.emit('overload', this.player.x, C.playerY, '超载启动');
    }
    this.director(dt);
    this.shoot(dt);
    for (const b of this.bodies) { b.px = b.x; b.py = b.y; this.tickBody(b, dt); }
    for (const b of this.bullets) { b.px = b.x; b.py = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; }
    const contacts: Contact[] = [];
    const add = (t: number | null, rank: number, id: number, apply: () => void) => { if (t !== null) contacts.push({ t, rank, id, apply }); };
    for (const bullet of this.bullets) {
      if (bullet.hostile) {
        add(sweep(bullet.px, bullet.py, bullet.x, bullet.y, this.player.px, C.playerY, this.player.x, C.playerY, 27, 31), 1, bullet.id, () => {
          if (!bullet.active || this.player.hp <= 0) return;
          bullet.active = false; this.hurt();
        });
      } else for (const body of this.bodies) {
        if (!body.active || body.kind === 'pickup' || (body.kind === 'boss' && this.phase !== 'boss')) continue;
        add(sweep(bullet.px, bullet.py, bullet.x, bullet.y, body.px, body.py, body.x, body.y, body.width / 2 + 3, body.height / 2 + 8), 0, bullet.id, () => {
          if (!bullet.active || !body.active) return;
          bullet.active = false; this.hit(body, bullet.damage);
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
          const result = grantEquipment(this.growth, b.stage);
          this.maxStage = Math.max(this.maxStage, this.growth.stage);
          this.emit(result.upgraded ? 'upgrade' : 'pickup', this.player.x, C.playerY, result.upgraded ? `T${b.stage} 火力进化` : '超载充能 +30', b.stage);
          if (result.activated) this.emit('overload', this.player.x, C.playerY, '超载启动');
        });
      } else {
        add(sweep(this.player.px, C.playerY, this.player.x, C.playerY, b.px, b.py, b.x, b.y,
          b.width / 2 + C.playerRadius, b.height / 2 + C.playerRadius), 1, b.id, () => {
          if (!b.active || this.player.hp <= 0) return;
          b.active = false; this.hurt(); this.emit('crash', b.x, b.y, undefined, b.width);
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
            const result = grantGate(this.growth, gateValue(chosen.energy), chosen.rewardKind);
            this.gatesTaken++;
            this.emit('gate-taken', chosen.x, C.playerY, result.power ? `火力 +${result.power}%` : result.energy ? `超载 +${result.energy}` : '储能已满');
            if (result.activated) this.emit('overload', this.player.x, C.playerY, '超载启动');
          }
          for (const gate of gates) gate.active = false;
        });
      }
    }
    contacts.sort((a, b) => Math.round(a.t * 1e8) - Math.round(b.t * 1e8) || a.rank - b.rank || a.id - b.id);
    for (const contact of contacts) contact.apply();
    if (this.player.hp <= 0) {
      this.phase = 'dead'; this.emit('death', this.player.x, C.playerY, '本次突围结束', 150);
    } else if (this.bossVictory) {
      this.bossVictory = false; this.bullets = []; this.bodies = [];
      this.player.hp = Math.min(3, this.player.hp + 1); this.player.invulnerable = 1;
      this.phase = 'recovery'; this.phaseTime = 0;
      this.emit('victory', 360, 430, '首领击破 · 装甲恢复 +1');
    }
    this.bodies = this.bodies.filter(b => b.active && b.y < 1344);
    this.bullets = this.bullets.filter(b => b.active && b.y > -90 && b.y < 1370 && b.x > -40 && b.x < 760 && b.age < (b.hostile ? 6 : C.bulletLife));
    this.peakBodies = Math.max(this.peakBodies, this.bodies.length);
    this.peakBullets = Math.max(this.peakBullets, this.bullets.length);
  }
  private hurt() {
    if (this.player.invulnerable > 0 || this.player.hp <= 0) return;
    this.player.hp--; this.player.invulnerable = C.invulnerability;
    this.emit('hurt', this.player.x, C.playerY);
  }
  private hit(b: Body, damage: number) {
    this.hits++; b.hit = 0.07;
    if (b.kind === 'gate') {
      const before = gateValue(b.energy); b.energy = Math.min(144, b.energy + damage);
      if (gateValue(b.energy) > before) this.emit('gate-level', b.x, b.y, `+${gateValue(b.energy)}${b.rewardKind === 'power' ? '%' : ''}`);
      this.emit('impact-gate', b.x, b.y); return;
    }
    b.hp = Math.max(0, b.hp - damage);
    this.emit('impact', b.x, b.y, undefined, b.width);
    if (b.hp > 0) return;
    b.active = false;
    if (b.kind === 'crate') {
      this.cratesBroken++; this.spawn('pickup', b.x, b.y, b.stage);
      this.emit('crate-break', b.x, b.y, '靠近领取', 110);
    } else {
      this.kills++; this.score += C.enemies[b.kind as EnemyKind].score;
      this.emit(b.kind === 'boss' ? 'boss-kill' : 'kill', b.x, b.y, undefined, b.width * 1.4);
      if (b.kind === 'boss') this.bossVictory = true;
    }
  }
}
