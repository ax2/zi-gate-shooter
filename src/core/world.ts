import { FRACTURE } from './combos';
import { enemyHealthScale, firstAttackDelay } from './difficulty';
import { Contract, contracts, type ContractKind } from './contracts';
import { BuildTree, type Route } from './build-tree';
import { armoryOffers } from './armory-offers';
import { supportProfile, supportMilestone } from './support-profile';
import { C, clamp } from './config';
import type { EnemyKind } from './config';
import { sweep } from './collision';
import { activateOverload, gateValue, gateRewardLabel, grantEquipment, grantGate, permanentPower } from './rewards';
import type { Growth } from './rewards';
import { timeline, sectorIndex, sectorNames } from './director';
import type { Spawn } from './director';
import { safeRoute } from './reachability';
import { advanceBody, guardClosed } from './behavior';
import { weaponProfile, weaponNames } from './weapons';
import type { WeaponKind } from './weapons';

export type BodyKind = EnemyKind | 'crate' | 'gate' | 'pickup';
export interface Body {
  id: number; kind: BodyKind; x: number; y: number; px: number; py: number;
  width: number; height: number; hp: number; maxHp: number; speed: number;
  active: boolean; age: number; timer: number; warning: number; hit: number;
  energy: number; row: number; stage: number; rewardKind: 'power' | 'energy'; attack: number; lane: number;
  attackCycle: number; burst: number; fractureHits?:number; fractureReadyAt?:number;
  weaponKind?: WeaponKind; pattern?: 'weave' | 'flank' | 'fan'; bossVariant?: number;
}
export interface Bullet {
  id: number; x: number; y: number; px: number; py: number;
  vx: number; vy: number; damage: number; age: number; active: boolean; hostile: boolean;
  weaponKind?: WeaponKind; remainingTargets?: number; hitBodies?: number[]; splashRadius?: number; chainHops?: number;
}
export interface EffectEvent { type: string; x: number; y: number; targetX?: number; targetY?: number; prism?: boolean; text?: string; detail?: string; size?: number; enemyKind?: EnemyKind; bossVariant?: number; equipmentStage?: number; weaponKind?: WeaponKind }
interface Contact { t: number; rank: number; id: number; apply: () => void }
export type Phase = 'running' | 'boss-entry' | 'boss' | 'recovery' | 'dead';

/** Rendering-free authoritative simulation. Instances are discarded on restart. */
export class World {
  readonly build = new BuildTree();
  chooseBuild(route: Route) {
    if(!this.build.choose(route,this.growth.mastery??0))return false;
    const kind=route==='ballistic'?'scatter':route==='electric'?'arc':null;
    if(kind && !this.activeWeapons.includes(kind)) {
      for(const owned of this.activeWeapons){this.weaponStages.set(owned,this.weaponStage(owned));this.acquiredWeapons.add(owned);}
      this.weaponStages.set(kind,1);this.acquiredWeapons.add(kind);
    }
    return true;
  }
  fractureBursts=0;
  private announcedFracture=false;
  fractureUnlocked(){return this.activeWeapons.includes('pierce')&&this.activeWeapons.includes('blast')&&this.weaponStage('pierce')>=2&&this.weaponStage('blast')>=2;}
  private announceFracture(){
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
    const p=weaponProfile(kind,this.weaponStage(kind)),rank=this.build.ranks;
    const refinement=1+.1*this.build.refinements[kind==='arc'?'electric':'ballistic'];
    return {...p,damage:p.damage.map(n=>n*(1+.5*this.weaponCalibration(kind))*refinement*(kind==='scatter'?(rank.ballistic>=2?1.3:rank.ballistic>=1?1.1:1):1)),
      chainHops:kind==='arc'?(p.chainHops??0)+(rank.electric>=1?1:0):kind==='scatter'&&rank.ballistic>=3?1:p.chainHops};
  }
  supportProfile() {
    const p=supportProfile(this.growth.mastery),rank=this.build.ranks.optical;
    return {...p,laserUnlocked:p.laserUnlocked||rank>0,laserDamage:p.laserDamage*(rank>0?1.15:1)*(1+.1*this.build.refinements.optical),
      laserInterval:p.laserInterval*(rank>=2?.75:1),laserTargets:p.laserTargets+(rank>=3?2:0),prism:rank>=3&&this.build.ranks.ballistic>=1};
  }
  contract?: Contract;
  contractReward?: {charge:number;round:number};
  claimContractReward(kind:WeaponKind|'energy'){
    if(!this.contractReward||this.player.hp<=0)return false;
    if(kind!=='energy'&&!this.activeWeapons.includes(kind))return false;
    const reward=this.contractReward;this.contractReward=undefined;
    if(kind==='energy'){
      const result=grantGate(this.growth,reward.charge,'energy');
      if(result.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'reward',x:this.player.x,y:C.playerY,text:`契约奖励 · 充能+${reward.charge}`,detail:this.chargeReceipt(result.activated)});
    }else{
      for(const owned of this.activeWeapons)if(!this.weaponStages.has(owned))this.weaponStages.set(owned,this.weaponStage(owned));
      const stage=this.weaponStage(kind);
      if(stage<3){this.weaponStages.set(kind,stage+1);this.growth.stage=Math.max(this.growth.stage,stage+1);this.maxStage=Math.max(this.maxStage,stage+1);}
      else this.calibrations.set(kind,this.weaponCalibration(kind)+1);
      this.effects.push({type:'upgrade',x:this.player.x,y:C.playerY,weaponKind:kind,text:stage<3?`${weaponNames[kind]} · 升至T${stage+1}`:`${weaponNames[kind]} · 专属精校${this.weaponCalibration(kind)}`,detail:stage<3?'其他配件与已有火力保留':`该武器伤害系数 ${100+this.weaponCalibration(kind)*50}%`});
    }
    this.announceFracture();
    return true;
  }
  damageTaken=0;
  acceptContract(kind:ContractKind){
    if(this.contractReward||this.phase!=='running'||this.roundTime>40||this.player.hp<=0||this.contract?.status==='active'||this.contract?.round===this.round)return false;
    this.contract=new Contract(kind,this.round,this.kills,this.activeWeapons.length,this.damageTaken);return true;
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
          const choices: WeaponKind[][] = this.round > 3 ? [['arc', 'scatter'], ['blast', 'pierce'], ['pulse', 'arc']] : [['scatter', 'pierce'], ['blast', 'arc'], ['pulse', 'blast']];
          const chapterChoices = choices[sectorIndex(this.round)];
          const offered = armoryOffers(this.activeWeapons, chapterChoices);
          const crates = [222, 498].map((x, i) => { const b = this.spawn('crate', x, 180, Math.max(2, s.stage ?? 2, this.growth.stage)); b.row = row; b.weaponKind = offered[i]; return b; });
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
        boss.bossVariant = sectorIndex(this.round);
        // Show each chapter's signature before high firepower can skip it.
        boss.attackCycle = [0, 2, 3][boss.bossVariant];
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
    if (this.phase === 'boss-entry' || this.phase === 'recovery') { this.fireTimers.clear(); this.laserTimer=0; return; }
    for (const kind of this.activeWeapons) {
    let timer = (this.fireTimers.get(kind) ?? 0) - dt;
    const w = this.profileFor(kind);
    while (timer <= 1e-9) {
      if (this.bullets.filter(b => b.active && !b.hostile).length + w.offsets.length > C.limits.bullets) throw new Error('Player bullet budget exceeded');
      for (let i = 0; i < w.offsets.length; i++) {
        const x = this.player.x + w.offsets[i], y = C.playerY - (w.muzzleY ?? 72);
        this.bullets.push({ id: this.nextId++, x, y, px: x, py: y, vx: w.vx[i], vy: -C.bulletSpeed,
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
        const start=C.playerY-100;
        for(const side of support.prism?[0,-1,1]:[0]) {
          const x=this.player.x+side*42, topX=this.player.x+side*180;
          const beamX=(y:number)=>x+(topX-x)*(start-y)/(start-C.playerShotTop);
          const targets=this.bodies.filter(b=>b.active && b.kind!=='pickup' && (b.kind!=='boss'||this.phase==='boss') && b.y>=C.playerShotTop && b.y<start
            && Math.abs(b.x-beamX(b.y))<=b.width/2+8).sort((a,b)=>b.y-a.y || a.id-b.id);
          let end=C.playerShotTop, count=0;
          for(const body of targets){
            const blocked=body.kind==='crate'||body.kind==='gate'||guardClosed(body);
            this.hit(body,support.laserDamage*(side===0?1:.45)*(1+permanentPower(this.growth)/100)*(this.growth.overload>0?1.35:1),'pulse');
            if(blocked || ++count>=support.laserTargets){end=body.y+body.height/2;break;}
          }
          this.effects.push({type:'laser',x,y:start,targetX:beamX(end),targetY:end,prism:side!==0});
        }
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
    if(challenge?.status==='active'&&this.phase==='running'&&challenge.reinforcements<22&&challenge.elapsed>=challenge.nextReinforcement){
      const count=this.bodies.filter(b=>b.active&&b.kind in C.enemies).length;
      if(count<C.limits.enemies){
        const x=[200,360,520,360][challenge.reinforcements%4];
        const candidate=this.spawn('drone',x,180);
        if(this.admit(candidate)){challenge.reinforcements++;challenge.nextReinforcement=challenge.elapsed+.8;}
      }
    }
    this.shoot(dt);
    for (const b of this.bodies) {
      b.px = b.x; b.py = b.y;
      const previousWarning = b.warning;
      advanceBody(b, dt, this.phase, this.phaseTime, (x, y, vx, vy) => this.hostile(x, y, vx, vy));
      if (b.kind === 'boss' && previousWarning <= 0 && b.warning > 0
        && !safeRoute(this.player.x, this.bodies, this.bullets, b.attack === 3 ? 8 : 4, { phase: this.phase, phaseTime: this.phaseTime })) {
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
          if (bullet.remainingTargets <= 0 || body.kind === 'gate' || body.kind === 'crate' || guardClosed(body)) bullet.active = false;
          this.hit(body, bullet.damage, bullet.weaponKind);
          if(bullet.weaponKind==='pierce')this.fracture(body,bullet.damage);
          const support=this.supportProfile();
          if (support.refractionTargets > 0 && bullet.weaponKind === 'pulse' && body.kind in C.enemies && !guardClosed(body)) {
            const reflected=this.bodies.filter(other=>other!==body && other.active && other.kind in C.enemies
              && other.y>=C.playerShotTop && other.y<=C.playerY && Math.hypot(other.x-body.x,other.y-body.y)<=support.refractionRange)
              .sort((a,b)=>Math.hypot(a.x-body.x,a.y-body.y)-Math.hypot(b.x-body.x,b.y-body.y)||a.id-b.id).slice(0,support.refractionTargets);
            for(const next of reflected){
              this.effects.push({type:'refract',x:body.x,y:body.y,targetX:next.x,targetY:next.y});
              this.hit(next,bullet.damage*support.refractionDamage,'pulse');
            }
          }
          if (bullet.chainHops && body.kind in C.enemies) {
            const visited = new Set([body.id]); let origin = body, damage = bullet.damage;
            for (let hop = 0; hop < bullet.chainHops && !guardClosed(origin); hop++) {
              const candidates = this.bodies.filter(other => other.active && !visited.has(other.id) && other.kind in C.enemies
                && other.y >= C.playerShotTop && other.y <= C.playerY
                && Math.hypot(other.x-origin.x,other.y-origin.y) <= (this.build.ranks.electric>=2?220:160));
              candidates.sort((a,b) => Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y) || a.id-b.id);
              const next = candidates[0]; if (!next) break;
              visited.add(next.id); damage *= this.build.ranks.electric>=3?0.8:0.65;
              this.effects.push({type:'arc',x:origin.x,y:origin.y,targetX:next.x,targetY:next.y});
              this.hit(next,damage,bullet.weaponKind); origin = next;
            }
          }
          if (bullet.splashRadius && body.kind in C.enemies) {
            // No secondary explosions, reward charging or off-screen farming.
            this.effects.push({type:'blast',x:body.x,y:body.y,size:bullet.splashRadius,weaponKind:bullet.weaponKind});
            for (const other of this.bodies) if (other !== body && other.active && other.kind in C.enemies
              && other.y >= C.playerShotTop && other.y <= C.playerY
              && Math.hypot(other.x-body.x,other.y-body.y) <= bullet.splashRadius)
              this.hit(other,bullet.damage*0.5,bullet.weaponKind);
          }
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
          const title = addedWeapon ? `新增${weaponNames[this.weaponKind]} · ${this.activeWeapons.length}种火力叠加`
            : result.upgraded ? `${weaponNames[kind]} · 升至T${localGrowth.stage}` : '重复装备 · 充能+30';
          const detail = [result.upgraded ? `${weaponNames[kind]} T${localGrowth.stage} · 其他配件保留` : addedWeapon ? '充能+30' : '',
            result.activated ? this.chargeReceipt(true) : !result.upgraded ? `当前充能 ${this.growth.energy}/100` : ''].filter(Boolean).join(' · ');
          this.effects.push({type:result.upgraded?'upgrade':'pickup',x:this.player.x,y:C.playerY,text:title,detail,size:b.stage});
          this.announceFracture();
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
    if (this.player.hp <= 0) {
      this.phase = 'dead'; this.emit('death', this.player.x, C.playerY, '本次突围结束', 150);
    } else if (this.bossVictory) {
      this.bossVictory = false; this.bullets = []; this.bodies = [];
      const restored=this.player.hp<3;
      this.player.hp = Math.min(3, this.player.hp + 1); this.player.invulnerable = 1;
      this.phase = 'recovery'; this.phaseTime = 0;
      const reward=grantGate(this.growth,C.killCharge.boss,'energy');
      if(reward.activated)this.emit('overload',this.player.x,C.playerY);
      this.effects.push({type:'victory',x:360,y:430,text:`首领击破 · 充能+${C.killCharge.boss}`,
        detail:[restored?'装甲恢复+1':'装甲完好',this.chargeReceipt(reward.activated)].join(' · ')});
    }
    this.bodies = this.bodies.filter(b => b.active && b.y < 1344);
    this.bullets = this.bullets.filter(b => b.active && b.y > (b.hostile ? -90 : C.playerShotTop) && b.y < 1370 && b.x > -40 && b.x < 760 && b.age < (b.hostile ? 6 : C.bulletLife));
    const contract=this.contract;
    if(contract?.update(this.phase==='running'||this.phase==='boss'?dt:0,this.kills,this.activeWeapons.length,this.damageTaken,this.player.hp>0)){
      if(contract.status==='won'){
        this.contractReward={charge:contracts[contract.kind].charge,round:this.round};
      }
      this.effects.push({type:'contract',x:this.player.x,y:C.playerY,text:contract.status==='won'?'契约完成 · 选择强化奖励':`契约失败 · ${contract.reason}`,detail:'每轮可接取一次 · 失败仅失去额外奖励'});
    }
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
    this.hits++; b.hit = 0.07;
    if (b.kind === 'gate') {
      const before = gateValue(b.energy, b.rewardKind); b.energy = Math.min(144, b.energy + damage);
      if (gateValue(b.energy, b.rewardKind) > before) this.emit('gate-level', b.x, b.y, `+${gateValue(b.energy, b.rewardKind)}${b.rewardKind === 'power' ? '%' : ''}`);
      this.emit('impact-gate', b.x, b.y); return;
    }
    b.hp = Math.max(0, b.hp - damage * (guardClosed(b) ? 0.5 : 1));
    this.effects.push({ type: 'impact', x: b.x, y: b.y, size: b.width, weaponKind });
    if (b.hp > 0) return;
    b.active = false;
    if (b.kind === 'crate') {
      this.cratesBroken++;
      const pickup = this.spawn('pickup', b.x, b.y, b.stage); pickup.weaponKind = b.weaponKind; pickup.row = b.row;
      this.effects.push({ type: 'crate-break', x: b.x, y: b.y, text: '靠近领取', size: 110, equipmentStage: b.stage });
    } else {
      this.kills++; this.score += C.enemies[b.kind as EnemyKind].score;
      this.effects.push({ type: b.kind === 'boss' ? 'boss-kill' : 'kill', x: b.x, y: b.y, size: b.width * 1.4, enemyKind: b.kind as EnemyKind, bossVariant: b.bossVariant });
      if (b.kind === 'boss') this.bossVictory = true;
      else if(b.kind==='elite'){
        const reward=grantGate(this.growth,C.killCharge.elite,'energy');
        if(reward.activated)this.emit('overload',this.player.x,C.playerY);
        this.effects.push({type:'reward',x:b.x,y:b.y,text:`精英击破 · 充能+${C.killCharge.elite}`,detail:this.chargeReceipt(reward.activated)});
      }
    }
  }
}


