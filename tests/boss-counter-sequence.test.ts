import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{advanceBody}from'../src/core/behavior';import{BOSS_COUNTER,counterSequence,counterVolley}from'../src/core/boss-counter';import{dangerTimeline}from'../src/core/reachability';
function setup(variant:number){const w=new World(1337,4);w.phase='boss';w.player.x=w.player.px=68;const b=w.spawn('boss',360,C.bossY);b.bossVariant=variant;b.hp=b.maxHp*.49;return{w,b};}
it.each([1,2])('variant%s emits six real shots in distinct beats, then preserves the original cycle period',variant=>{
 const {b}=setup(variant),p=counterSequence(variant),shots:{time:number;beat:number;x:number;vx:number;vy:number}[]=[];let time=0;
 const tick=()=>{time+=C.step;advanceBody(b,C.step,'boss',time,(x,_y,vx=0,vy=280)=>shots.push({time,beat:b.counterShotBeat!,x,vx,vy}));};
 for(let f=0;f<200&&shots.length<6;f++)tick();expect(shots).toHaveLength(6);expect(b.counterVolleys).toBe(1);expect(b.burst).toBe(0);
 for(let beat=0;beat<p.beats;beat++){const rows=shots.filter(s=>s.beat===beat);expect(rows).toHaveLength(6/p.beats);expect(rows.every(s=>Math.abs(s.time-shots[0].time-beat*p.spacing)<1e-8)).toBe(true);expect(rows.every(s=>s.vy===624)).toBe(true);}
 if(variant===1){expect(shots.map(s=>s.vx)).toEqual([-234,0,234,-234,0,234]);expect(shots[0].x).toBeLessThan(shots[3].x-200);}
 else expect(shots.map(s=>s.vx)).toEqual([234,-234,0,-0,-234,234]);
 for(let f=0;f<200&&!b.warning;f++)tick();expect(time-shots[0].time).toBeCloseTo(BOSS_COUNTER.recovery);expect(b.warning).toBeGreaterThan(0);
});
it.each([1,2])('variant%s forecasts every later beat using the real movement and projectile rules without changing live state',variant=>{
 const {b}=setup(variant);b.counterfire=true;b.counterReady=false;b.attack=4;b.warning=b.timer=BOSS_COUNTER.warning;b.counterBeat=0;const before=JSON.stringify(b),forecast=dangerTimeline([b],[],5,{phase:'boss',phaseTime:0});expect(JSON.stringify(b)).toBe(before);
 const bullets:{x:number;y:number;vx:number;vy:number}[]=[];for(let f=0;f<300;f++){
  advanceBody(b,C.step,'boss',(f+1)*C.step,(x,y,vx=0,vy=280)=>bullets.push({x,y,vx,vy}));
  for(const s of bullets){const py=s.y;s.x+=s.vx*C.step;s.y+=s.vy*C.step;if(Math.min(py,s.y)-31<=C.playerY&&Math.max(py,s.y)+31>=C.playerY)expect(forecast[Math.floor(f/6)].some(([lo,hi])=>lo<=s.x-27&&hi>=s.x+27)).toBe(true);}
 }
 expect(b.counterVolleys).toBeGreaterThan(0);
});
it('does not flash or count rejected emissions when the live hostile pool is full',()=>{
 const {w,b}=setup(1);Object.assign(w,{scheduled:[]});b.counterfire=true;b.attack=4;b.warning=BOSS_COUNTER.warning;b.timer=C.step;
 w.bullets=Array.from({length:C.limits.hostile},(_,i)=>({id:900000+i,x:652,y:300,px:652,py:300,vx:0,vy:0,damage:1,age:0,active:true,hostile:true}));
 w.step(C.step,68);const events=w.drainEffects();expect(b.counterShotAge).toBeDefined();expect(b.counterFiredAt).toBeUndefined();expect(b.counterShots??0).toBe(0);expect(events.some(e=>e.type==='counter-fire')).toBe(false);
});
it('stops the remaining beats after a kill or outside the boss phase, without changing existing projectiles',()=>{
 const {b}=setup(2);b.counterfire=true;b.attack=4;b.warning=1.1;b.timer=C.step;const shots:unknown[]=[];advanceBody(b,C.step,'boss',0,(...s)=>shots.push(s));expect(shots).toHaveLength(2);
 const before=JSON.stringify(shots);b.active=false;for(let i=0;i<60;i++)advanceBody(b,C.step,'boss',1,()=>{throw Error('dead emitter fired');});expect(JSON.stringify(shots)).toBe(before);
 const {b:entry}=setup(2);entry.counterfire=true;entry.attack=4;entry.burst=1;entry.counterBeat=1;entry.timer=C.step;advanceBody(entry,C.step,'recovery',0,()=>{throw Error('recovery fired');});expect(entry.counterBeat).toBe(1);
 expect(counterVolley(b,0)).toHaveLength(2);
});
