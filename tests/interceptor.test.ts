import {it,expect} from 'vitest';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {timeline,SWARM} from '../src/core/director';
import {INTERCEPTOR} from '../src/core/interceptor';import {advanceBody} from '../src/core/behavior';
import {safeRoute} from '../src/core/reachability';import {awardAchievements,emptyAchievements,parseAchievements} from '../src/core/achievements';
function setup(round=2,x=68){const w=new World(1337,round);w.player.x=w.player.px=x;const b=w.spawn('elite',360,360);b.pattern='intercept';b.timer=INTERCEPTOR.opening;b.dropGrace=SWARM.grace;return {w,b};}
it('replaces at most one existing elite, retains first chapter and never scales its health to player growth',()=>{
 expect(timeline(1,1337).some(s=>s.pattern==='intercept')).toBe(false);
 for(let round=2;round<=12;round++){const list=timeline(round,1337),elite=list.filter(s=>s.kind==='elite'),variant=list.filter(s=>s.pattern==='intercept');expect(variant).toHaveLength(Math.min(1,elite.length));for(const s of variant){expect(s.drop).toBe(true);expect(s.dropY).toBe(360);}}
 const low=setup().b,high=new World(1337,2);high.growth.mastery=100;high.growth.bonus=100;expect(high.spawn('elite',360,360).maxHp).toBe(low.maxHp);
});
it('uses complete local wing and core charges before distinct actual volleys',()=>{
 const {b}=setup(1);const shots:{time:number;x:number;y:number;vx:number;vy:number}[]=[],warnings:{time:number;beat:number}[]=[];let prior=0;
 for(let i=0;i<150;i++){advanceBody(b,C.step,'running',0,(x,y,vx=0,vy=280)=>shots.push({time:b.age,x,y,vx,vy}));if(!prior&&b.warning)warnings.push({time:b.age,beat:b.burst});prior=b.warning;}
 expect(shots).toHaveLength(5);expect(warnings.map(s=>s.beat)).toEqual([0,1]);expect(shots[0].time-warnings[0].time).toBeCloseTo(.75);expect(shots[2].time-warnings[1].time).toBeCloseTo(.65);
 expect(shots[0].time).toBeCloseTo(.9);expect(shots[2].time).toBeCloseTo(1.8);expect(shots.slice(0,2).map(s=>s.x)).toEqual([308,412]);expect(shots.slice(0,2).map(s=>s.vx)).toEqual([-90,90]);expect(shots.slice(0,2).every(s=>s.vy===320)).toBe(true);expect(shots.slice(2).every(s=>s.x===360&&s.vx===0&&s.vy===360)).toBe(true);
 expect(shots[3].time-shots[2].time).toBeCloseTo(.15);expect(shots[4].time-shots[3].time).toBeCloseTo(.15);expect(shots[3].y-shots[2].y).toBeCloseTo(b.speed*.15);
});
it('counts and flashes only bullets actually admitted under the hostile cap',()=>{
 const {w,b}=setup();b.timer=0;b.warning=.75;b.dropGrace=0;
 for(let i=0;i<C.limits.hostile;i++)w.bullets.push({id:10000+i,x:600,y:700,px:600,py:700,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
 w.step(C.step,68);expect(b.interceptWingShots??0).toBe(0);expect(b.interceptFiredAt).toBeUndefined();expect(w.bullets.filter(b=>b.hostile)).toHaveLength(48);
});
it('EMP retains the advertised charge rather than silently firing or restarting it',()=>{
 const {b}=setup();b.speed=0;b.warning=.75;b.timer=.4;b.empRemaining=1.5;let shots=0;
 for(let i=0;i<90;i++)advanceBody(b,C.step,'running',0,()=>shots++);expect(shots).toBe(0);expect(b.timer).toBe(.4);expect(b.warning).toBe(.75);
 // A floating EMP remainder may consume one last fixed step on resumption.
 for(let i=0;i<25;i++)advanceBody(b,C.step,'running',0,()=>shots++);expect(shots).toBe(2);
});
it.each(['before','between','after'] as const)('a real kill %s volleys awards the deliberate timing badge only in the correct window',when=>{
 const {w,b}=setup();b.speed=0;b.dropGrace=0;
 const frames=when==='before'?0:when==='between'?55:109;
 for(let i=0;i<frames;i++){w.step(C.step,68);w.drainEffects();}
 const oldHostiles=w.bullets.filter(s=>s.hostile).length;b.hp=1;
 w.bullets.push({id:99999,x:360,y:b.y+40,px:360,py:b.y+40,vx:0,vy:-1200,damage:20,age:0,active:true,hostile:false});
 w.step(C.step,68);const effects=w.drainEffects();expect(b.active).toBe(false);expect(w.kills).toBe(1);expect(w.bullets.filter(s=>s.hostile)).toHaveLength(oldHostiles);expect(w.interceptorBreaks).toBe(when==='between'?1:0);
 const state=emptyAchievements(),fresh=awardAchievements(state,w.build.ranks,1,0,0,0,0,{interceptorBreaks:w.interceptorBreaks});expect(fresh.some(a=>a.id==='core-breaker')).toBe(when==='between');expect(parseAchievements(JSON.parse(JSON.stringify(state))).unlocked).toEqual(state.unlocked);expect(awardAchievements(state,w.build.ranks,1,0,0,0,0,{interceptorBreaks:w.interceptorBreaks})).toEqual([]);
 if(when==='between')expect(effects.some(e=>e.text?.startsWith('截击断核'))).toBe(true);
 const launched=b.interceptCoreShots??0;for(let i=0;i<30;i++)w.step(C.step,68);expect(b.interceptCoreShots??0).toBe(launched);
});
it('EMP pauses remaining core taps and resumes them without inventing an extra volley',()=>{
 const {w,b}=setup();b.speed=0;
 for(let i=0;i<108;i++){w.step(C.step,68);w.drainEffects();}expect(b.interceptCoreShots).toBe(1);b.empRemaining=.5;
 for(let i=0;i<30;i++){w.step(C.step,68);w.drainEffects();}expect(b.interceptCoreShots).toBe(1);
 for(let i=0;i<20;i++){w.step(C.step,68);w.drainEffects();}expect(b.interceptCoreShots).toBe(3);expect(b.interceptWingShots).toBe(2);
});
it('lets three starting lanes escape both beats at three projectile depths with 450ms reaction and no kills',()=>{
 for(const round of [2,4,12])for(const start of [68,360,652]){
  const {w,b}=setup(round,start);let path:number[]=[],planAt=0;
  for(let frame=0;frame<5*60;frame++){
   if(frame===0||frame-planAt>=60){const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{reaction:frame===0?.45:0});expect(route,`R${round} x${start} t${w.time}`).not.toBeNull();path=route??[];planAt=frame;}
   w.step(C.step,path[Math.floor((frame-planAt)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(s=>s.hostile);expect(w.player.hp).toBe(3);expect(w.kills).toBe(0);
  }
  expect(b.interceptWingShots).toBe(2);expect(b.interceptCoreShots).toBe(3);
 }
},30000);
