import { C, clamp } from './config';
import type { EnemyKind } from './config';
import { sweep } from './collision';
import { activateOverload, gateValue, gateRewardLabel, grantEquipment, grantGate } from './rewards';
import type { Growth } from './rewards';
import { timeline, sectorIndex, sectorNames } from './director';
import type { Spawn } from './director';
import { safeRoute } from './reachability';
import { advanceBody } from './behavior';
import { weaponProfile, weaponNames } from './weapons';
import type { WeaponKind } from './weapons';

export type BodyKind = EnemyKind | 'crate' | 'gate' | 'pickup';
export interface Body {
  id: number; kind: BodyKind; x: number; y: number; px: number; py: number;
  width: number; height: number; hp: number; maxHp: number; speed: number;
  active: boolean; age: number; timer: number; warning: number; hit: number;
  energy: number; row: number; stage: number; rewardKind: 'power' | 'energy'; attack: number; lane: number;
  attackCycle: number; burst: number;
  weaponKind?: WeaponKind; pattern?: 'weave' | 'flank' | 'fan'; bossVariant?: number;
}
export interface Bullet {
  id: number; x: number; y: number; px: number; py: number;
  vx: number; vy: number; damage: number; age: number; active: boolean; hostile: boolean;
  weaponKind?: WeaponKind; remainingTargets?: number; hitBodies?: number[];
}
export interface EffectEvent { type: string; x: number; y: number; text?: string; size?: number; enemyKind?: EnemyKind; equipmentStage?: number }
interface Contact { t: number; rank: number; id: number; apply: () => void }
export type Phase = 'running' | 'boss-entry' | 'boss' | 'recovery' | 'dead';

/** Rendering-free authoritative simulation. Instances are discarded on restart. */
export class World {
  readonly growth: Growth = { stage: 1, bonus: 0, energy: 0, overload: 0 };
  weaponKind: WeaponKind = 'pulse';
  player = { x: 360, px: 360, hp: 3, invulnerable: 0 };
  bodies: Body[] = [];
  bullets: Bullet[] = [];
  effects: EffectEvent[] = [];
  phase: Phase = 'running';
  round = 1; time = 0; roundTime = 0; phaseTime = 0; score = 0;
  shots = 0; hits = 0; kills = 0; cratesBroken = 0; pickups = 0; gatesTaken = 0;
  maxStage = 1; peakBodies = 0; peakBullets = 0; fallbackCount = 0; attackDeferrals = 0;
  private nextId = 1;
  private nextRow = 1;
  private fireTimer = 0;
  private scheduled: Spawn[];
  private scheduleIndex = 0;
  private bossVictory = false;
  private secondChance = false;
  private nextSpawnRetry = 0;
  private readonly seed: number;

  // initialRound supports deterministic replay fixtures; normal UI always starts
  // with the default round 1, T1 and zero bonus.
  constructor(seed = 1337, initialRound = 1) {
    this.seed = seed; this.round = Math.max(1, Math.floor(initialRound));
    this.scheduled = timeline(this.round, seed);
  }
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
      energy: 0, row: 0, stage, rewardKind: this.growth.bonus >= 100 ? 'energy' : 'power', attack: 0, lane: kind === 'boss' ? 360 : x, attackCycle: 0, burst: 0,
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
  private admit(candidate: Body) {
    const horizon = Math.max(3, (C.playerY - candidate.y) / Math.max(1, candidate.speed) + 1);
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
          const choices: WeaponKind[][] = [['scatter', 'pierce'], ['pulse', 'pierce'], ['pulse', 'scatter']];
          const crates = [222, 498].map((x, i) => { const b = this.spawn('crate', x, 180, Math.max(2, this.growth.stage)); b.row = row; b.weaponKind = choices[sectorIndex(this.round)][i]; return b; });
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
          if (!this.admit(this.spawn('crate', s.x, 180, s.stage))) { this.scheduleIndex--; break; }
        }
        else {
          const enemyCount = this.bodies.filter(b => b.active && b.kind in C.enemies).length;
          if (enemyCount >= C.limits.enemies) { this.scheduleIndex--; break; }
          const candidate = this.spawn(s.kind, s.x);
          candidate.pattern = s.pattern; candidate.lane = s.lane ?? s.x;
          // Preserve the queued item; wait with an empty lane, never swallow rewards
          // or cancel any already advertised body/attack to manufacture a safe route.
          if (!this.admit(candidate)) { this.scheduleIndex--; break; }
        }
      }
      if (this.roundTime >= 72 && this.scheduleIndex >= this.scheduled.length && !this.bodies.some(b => b.active)) {
        this.phase = 'boss-entry'; this.phaseTime = 0;
        const boss = this.spawn('boss', 360, -150); boss.speed = 0;
        boss.bossVariant = sectorIndex(this.round); boss.attackCycle = boss.bossVariant;
        this.emit('alert', 360, 360, `${sectorNames[sectorIndex(this.round)]} · 首领警戒`);
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
        this.scheduleIndex = 0; this.secondChance = this.growth.stage > 1; this.nextSpawnRetry = 0;
        this.scheduled = timeline(this.round, this.seed + this.round * 719);
        this.emit('round', 360, 400, `第 ${this.round} 轮 · ${sectorNames[sectorIndex(this.round)]}`);
      }
    }
  }

  private shoot(dt: number) {
    this.fireTimer -= dt;
    if (this.phase === 'boss-entry' || this.phase === 'recovery') { this.fireTimer = 0; return; }
    const w = weaponProfile(this.weaponKind, this.growth.stage);
    while (this.fireTimer <= 1e-9) {
      if (this.bullets.filter(b => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error('Player bullet budget exceeded');
      for (let i = 0; i < w.offsets.length; i++) {
        const x = this.player.x + w.offsets[i], y = C.playerY - 72;
        this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx: w.vx[i], vy: -C.bulletSpeed,
          damage: w.damage[i] * (1 + this.growth.bonus / 100) * (this.growth.overload > 0 ? 1.35 : 1),
          age: 0, active: true, hostile: false, weaponKind: this.weaponKind, remainingTargets: w.targets, hitBodies: [] });
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
    for (const b of this.bodies) {
      b.px = b.x; b.py = b.y;
      const previousWarning = b.warning;
      advanceBody(b, dt, this.phase, this.phaseTime, (x, y, vx, vy) => this.hostile(x, y, vx, vy));
      if (b.kind === 'boss' && previousWarning <= 0 && b.warning > 0
        && !safeRoute(this.player.x, this.bodies, this.bullets, 4, { phase: this.phase, phaseTime: this.phaseTime })) {
        // The warning has not been rendered yet. Delay the unannounced attack;
        // once displayed its geometry and duration are never changed.
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
          bullet.active = false; this.hurt();
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
          if (bullet.remainingTargets <= 0 || body.kind === 'gate' || body.kind === 'crate') bullet.active = false;
          this.hit(body, bullet.damage);
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
          if (b.weaponKind) this.weaponKind = b.weaponKind;
          if (b.row) for (const alternative of this.bodies) if (alternative.row === b.row) alternative.active = false;
          const result = grantEquipment(this.growth, b.stage);
          this.maxStage = Math.max(this.maxStage, this.growth.stage);
          this.emit(result.upgraded ? 'upgrade' : 'pickup', this.player.x, C.playerY, result.upgraded ? `T${b.stage} 火力进化` : '超载充能 +30', b.stage);
          if (previousWeapon !== this.weaponKind) this.emit('weapon', this.player.x, C.playerY, `${weaponNames[this.weaponKind]} · T${this.growth.stage}`);
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
            this.emit('gate-taken', chosen.x, C.playerY, gateRewardLabel(result), chosen.width);
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
    this.bullets = this.bullets.filter(b => b.active && b.y > (b.hostile ? -90 : C.playerShotTop) && b.y < 1370 && b.x > -40 && b.x < 760 && b.age < (b.hostile ? 6 : C.bulletLife));
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
      this.cratesBroken++;
      const pickup = this.spawn('pickup', b.x, b.y, b.stage); pickup.weaponKind = b.weaponKind; pickup.row = b.row;
      this.effects.push({ type: 'crate-break', x: b.x, y: b.y, text: '靠近领取', size: 110, equipmentStage: b.stage });
    } else {
      this.kills++; this.score += C.enemies[b.kind as EnemyKind].score;
      this.effects.push({ type: b.kind === 'boss' ? 'boss-kill' : 'kill', x: b.x, y: b.y, size: b.width * 1.4, enemyKind: b.kind as EnemyKind });
      if (b.kind === 'boss') this.bossVictory = true;
    }
  }
}
