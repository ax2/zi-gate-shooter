import { expect, it } from 'vitest';
import { C } from '../src/core/config';
import { World } from '../src/core/world';
import { advanceBody, bossWarningLanes } from '../src/core/behavior';
import { safeRoute } from '../src/core/reachability';

it.each([[1, 0], [2, 2], [3, 3], [4, 0], [5, 2], [6, 3]])('round %s opens with chapter signature %s through the real director', (round, signature) => {
  const world = new World(1337, round);
  // Remove pre-boss enemies/rewards only to isolate the director entry;
  // the boss itself must be created by the production round transition.
  for (let frame = 0; frame < 90 * 60 && world.phase === 'running'; frame++) {
    world.bodies = []; world.bullets = [];
    world.step(C.step); world.drainEffects();
  }
  expect(world.phase).toBe('boss-entry');
  const boss = world.bodies.find(body => body.kind === 'boss')!;
  expect(boss).toBeDefined(); expect(boss.attackCycle).toBe(signature);
  boss.y = C.bossY; boss.timer = 0;
  advanceBody(boss, C.step, 'boss', 0, () => { throw new Error('shot before warning'); });
  expect(boss.attack).toBe(signature); expect(boss.warning).toBe(1.35);
  for (const start of [C.minX, 360, C.maxX])
    expect(safeRoute(start, [boss], [], 5, { phase: 'boss', phaseTime: 0 })).not.toBeNull();
});

it.each([3,7,11])('later fortress cycle%s uses four six-port pulses around its rotating gap',cycle=>{
 const world=new World(),boss=world.spawn('boss',360,C.bossY);boss.bossVariant=2;boss.attackCycle=cycle;boss.timer=0;
 const shots:{x:number;y:number;vx:number;vy:number;time:number;beat:number}[]=[];let time=1;
 const tick=()=>{time+=C.step;advanceBody(boss,C.step,'boss',time,(x,y,vx=0,vy=280)=>shots.push({x,y,vx,vy,time,beat:boss.barrageShotBeat!}));};
 tick();expect(boss.attack).toBe(3);expect(boss.warning).toBe(1.35);expect(shots).toHaveLength(0);
 const firstGap=[140,360,580][Math.floor(cycle/4)],secondGap=firstGap===360?580:360;expect(boss.lane).toBe(firstGap);
 for(const start of[C.minX,360,C.maxX])expect(safeRoute(start,[boss],[],8,{phase:'boss',phaseTime:time})).not.toBeNull();
 for(let f=0;f<300&&shots.length<24;f++)tick();expect(shots).toHaveLength(24);
 for(let beat=0;beat<4;beat++){
  const row=shots.filter(p=>p.beat===beat),gap=beat<2?firstGap:secondGap,targets=[80,150,220,290,360,430,500,570,640].filter(x=>Math.abs(x-gap)>=110);
  expect(row).toHaveLength(6);expect(row[0].time-shots[0].time).toBeCloseTo([0,.2,1.8,2][beat]);
  for(const[p,i]of row.map((p,i)=>[p,i]as const))expect(p.x+p.vx*(C.playerY-p.y)/p.vy).toBeCloseTo(targets[i]);
 }
 expect(boss.attackCycle).toBe(cycle+1);expect(boss.burst).toBe(0);expect(boss.warning).toBe(0);
});

it.each([1,2])('chapter %s sustains its own four-attack phrase and full double-lock route', variant => {
  const world = new World(); const boss = world.spawn('boss',360,C.bossY);
  boss.bossVariant=variant;boss.attackCycle=variant===1?2:3;boss.timer=0;
  const phrase:number[]=[];let cycle=-1;
  for(let frame=0;frame<40*60 && phrase.length<8;frame++){
    advanceBody(boss,C.step,'boss',frame*C.step,()=>{});
    if(boss.warning>0 && boss.attackCycle!==cycle){
      cycle=boss.attackCycle;phrase.push(boss.attack);
      for(const start of [C.minX,360,C.maxX])
        expect(safeRoute(start,[boss],[],8,{phase:'boss',phaseTime:frame*C.step}),`variant ${variant}, cycle ${cycle}, x ${start}`).not.toBeNull();
    }
  }
  expect(phrase).toEqual(variant===1?[2,1,2,0,2,1,2,0]:[3,0,3,1,3,0,3,1]);
});

it('boss alternates A/B, sweeps in two timed beats, mirrors sides and keeps warnings locked', () => {
  const world = new World(); world.phase = 'boss'; world.player.x = 68;
  const boss = world.spawn('boss',360,C.bossY);
  const warnings: { attack: number; lane: number; time: number }[] = [];
  const batches: { xs: number[]; time: number }[] = [];
  const seen = new Set<number>();
  let previousWarning = 0, lockedLane = boss.lane;
  for (let frame = 0; frame < 55 * 60; frame++) {
    const previousCycle = boss.attackCycle;
    world.step(C.step, 68); world.drainEffects();
    if (previousWarning <= 0 && boss.warning > 0) {
      warnings.push({ attack: boss.attack, lane: boss.lane, time: world.time }); lockedLane = boss.lane;
      expect(bossWarningLanes(boss)).toEqual(boss.attack ? [boss.lane, 360] : [boss.lane]);
    } else if (boss.warning > 0 && boss.attackCycle === previousCycle) expect(boss.lane).toBe(lockedLane);
    if (boss.burst) expect(bossWarningLanes(boss)).toEqual([360]);
    const fresh = world.bullets.filter(b => b.hostile && !seen.has(b.id));
    if (fresh.length) batches.push({ xs: fresh.map(b => b.x), time: world.time });
    for (const shot of fresh) seen.add(shot.id);
    previousWarning = boss.warning;
  }
  expect(warnings.length).toBeGreaterThan(9);
  expect(warnings.map(w => w.attack)).toEqual(warnings.map((_w, i) => i % 2));
  expect(warnings.filter(w => w.attack === 1).slice(0, 4).map(w => w.lane)).toEqual([200, 520, 200, 520]);
  let index = 0;
  for (const warning of warnings) {
    const first = batches[index++]; if (!first) break;
    expect(first.time - warning.time).toBeGreaterThanOrEqual(1.35 - C.step);
    expect(first.xs).toEqual(Array(warning.attack ? 3 : 5).fill(warning.lane));
    if (warning.attack) {
      const second = batches[index++]; if (!second) break;
      expect(second.xs).toEqual([360, 360, 360]);
      expect(second.time - first.time).toBeGreaterThanOrEqual(0.35 - C.step);
      expect(second.time - first.time).toBeLessThanOrEqual(0.35 + C.step + 1e-8);
    }
  }
  expect(world.player.hp).toBe(3); expect(world.attackDeferrals).toBe(0);
});

it.each([1,3])('entry freezes boss cooldown and victory cancels unfinished attack %s second beat', attack => {
  const world = new World(); world.phase = 'boss-entry';
  const boss = world.spawn('boss', 360, -150); boss.timer = 2.8;
  for (let i = 0; i < 60; i++) { world.step(C.step); world.drainEffects(); }
  expect(boss.timer).toBe(2.8); expect(world.bullets).toHaveLength(0);
  world.phase = 'boss'; boss.y = C.bossY; boss.attack = attack; boss.burst = 1; boss.warning = 0.35; boss.timer = 0.35; boss.hp = 1;
  world.bullets.push({ id: 9999, x: boss.x, y: 380, px: boss.x, py: 380, vx: 0, vy: -1200, damage: 4, age: 0, active: true, hostile: false });
  world.step(C.step); world.drainEffects();
  expect(world.phase).toBe('recovery'); expect(world.bodies).toHaveLength(0);
  for (let i = 0; i < 60; i++) { world.step(C.step); world.drainEffects(); }
  expect(world.bullets).toHaveLength(0); expect(world.player.hp).toBe(3);
});
