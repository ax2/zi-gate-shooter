import {it,expect,vi} from 'vitest';import * as reach from '../src/core/reachability';import {World} from '../src/core/world';import {C} from '../src/core/config';import {advanceBody} from '../src/core/behavior';import {BOSS_COUNTER,counterMuzzles} from '../src/core/boss-counter';import {dangerTimeline} from '../src/core/reachability';
it.each([0,1,2])('half-health variant %s charges actual physical ports then emits one six-shot fan',variant=>{
 const w=new World(1337,4),b=w.spawn('boss',360,C.bossY);b.bossVariant=variant;b.hp=b.maxHp*.49;let time=0;const shots:{x:number;y:number;vx:number;vy:number;t:number}[]=[];
 const tick=()=>{time+=C.step;advanceBody(b,C.step,'boss',time,(x,y,vx=0,vy=280)=>shots.push({x,y,vx,vy,t:time}));};
 while(!b.warning)tick();expect(b.counterfire).toBe(true);expect(b.attack).toBe(4);const warningAt=time;
 while(!shots.length)tick();expect(time-warningAt).toBeCloseTo(BOSS_COUNTER.warning);expect(shots).toHaveLength(6);expect(b.counterVolleys).toBe(1);
 const mouths=counterMuzzles(b);expect(shots.map(s=>s.x)).toEqual(mouths.flatMap(m=>[m.x,m.x,m.x]));expect(shots.map(s=>s.vx)).toEqual([-234,0,234,-234,0,234]);expect(shots.every(s=>s.vy===624)).toBe(true);
 b.hp=b.maxHp;tick();expect(b.counterfire).toBe(true);
});
it.each([1,3])('half-health never cancels an already charging second beat of attack %s',attack=>{
 const w=new World(),b=w.spawn('boss',360,C.bossY);b.attack=attack;b.burst=1;b.warning=b.timer=attack===3?1.8:.35;b.lane=360;b.hp=b.maxHp*.49;
 const duration=b.timer,shots:{time:number;count:number;attack:number}[]=[];let time=0;
 const tick=()=>{time+=C.step;let count=0;advanceBody(b,C.step,'boss',time,()=>count++);if(count)shots.push({time,count,attack:b.attack});};
 while(!shots.length){tick();if(time<duration-C.step)expect(b.attack).toBe(attack);}
 expect(shots[0].time).toBeCloseTo(duration);expect(shots[0].attack).toBe(attack);expect(b.counterVolleys??0).toBe(0);
 while(shots.length<2)tick();expect(shots[1].attack).toBe(4);expect(shots[1].count).toBe(6);expect(shots[1].time-shots[0].time).toBeCloseTo(BOSS_COUNTER.lead+BOSS_COUNTER.warning);
});
it('entry freezes evolution and a low-health shared forecast does not mutate live bodies',()=>{
 const w=new World(),b=w.spawn('boss',360,C.bossY);b.hp=b.maxHp*.49;
 advanceBody(b,C.step,'boss-entry',0,()=>{throw Error('entry shot');});expect(b.counterfire).toBeUndefined();
 const before=JSON.stringify(b);const forecast=dangerTimeline([b],[],6,{phase:'boss'});expect(JSON.stringify(b)).toBe(before);expect(forecast.some(s=>s.length)).toBe(true);
});

it('keeps the first counter queued after an unannounced safety deferral',()=>{
 const w=new World();w.phase='boss';w.player.x=w.player.px=68;const b=w.spawn('boss',360,C.bossY);b.attackCycle=1;b.hp=b.maxHp*.49;
 // Unit-only forced admission rejection; natural route safety is tested separately.
 const gate=vi.spyOn(reach,'safeRoute').mockReturnValueOnce(null);
 try{for(let i=0;i<30&&w.attackDeferrals===0;i++){w.step(C.step,68);w.drainEffects();}
  expect(w.attackDeferrals).toBe(1);expect(b.counterReady).toBe(true);expect(b.warning).toBe(0);expect(b.counterVolleys??0).toBe(0);
 }finally{gate.mockRestore();}
 for(let i=0;i<120&&!(b.counterVolleys??0);i++){w.step(C.step,68);w.drainEffects();}
 expect(b.counterVolleys).toBe(1);expect(b.attack).toBe(4);
});
