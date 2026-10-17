import {it,expect,vi} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import * as reach from '../src/core/reachability';
function setup(){const w=new World();const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';w.step(C.step,360);w.drainEffects();return w;}
it('freezes a legal explicit choice, atomically admits the durable fan and needle pair and preserves the default hunt',()=>{
 const w=setup();expect(w.acceptContract('precision',undefined,'crossfire')).toBe(false);expect(w.acceptContract('hunter',undefined,'unknown' as any)).toBe(false);expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);w.step(C.step,360);
 const targets=w.bodies.filter(b=>b.bountyRound===w.round);expect(targets).toHaveLength(2);expect(targets.map(b=>b.x)).toEqual([220,500]);expect(targets.every(b=>b.hp===320&&b.pattern==='fan')).toBe(true);expect(targets.map(b=>b.aceRole)).toEqual(['fan','needle']);expect(w.contract!.reinforcements).toBe(2);expect(w.acceptContract('hunter')).toBe(false);
 const old=setup();old.acceptContract('hunter');old.step(C.step,360);expect(old.contract!.reinforcements).toBe(1);expect(old.bodies.find(b=>b.bountyRound)?.hp).toBe(200);
});
it('capacity and safety rejection leave no marked half-encounter or false escape, and retry only later',()=>{
 const w=setup();w.acceptContract('hunter',undefined,'crossfire');for(let i=0;i<25;i++){const b=w.spawn('drone',100,-1000);b.speed=0;}w.step(C.step,360);expect(w.contract!.reinforcements).toBe(0);expect(w.bodies.some(b=>b.bountyRound!==undefined)).toBe(false);
 for(const b of w.bodies)b.active=false;w.contract!.nextReinforcement=0;const spy=vi.spyOn(reach,'safeRoute').mockReturnValueOnce(null);w.step(C.step,360);spy.mockRestore();expect(w.contract!.status).toBe('active');expect(w.contract!.reinforcements).toBe(0);expect(w.bodies.some(b=>b.bountyRound!==undefined)).toBe(false);
 w.step(C.step,360);expect(w.contract!.reinforcements).toBe(0);for(let i=0;i<31;i++)w.step(C.step,360);expect(w.contract!.reinforcements).toBe(2);
});
it.each(['energy','pulse'] as const)('two actual target kills unlock one %s reward plus exactly one research point on claim',choice=>{
 const w=setup();w.acceptContract('hunter',undefined,'crossfire');for(let i=0;i<60;i++)w.step(C.step,68);w.drainEffects();const targets=w.bodies.filter(b=>b.bountyRound===w.round),before=w.researchPoints;
 for(const [i,b] of targets.entries()){w.bullets=[{id:99990+i,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false}];w.step(C.step,68);}
 expect(w.contract!.status).toBe('won');expect(w.contractReward).toEqual({charge:150,round:1,research:1});expect(w.researchPoints).toBe(before);expect(w.claimContractReward('arc')).toBe(false);expect(w.researchPoints).toBe(before);
 expect(w.claimContractReward(choice)).toBe(true);expect(w.researchPoints).toBe(before+1);expect(w.claimContractReward(choice)).toBe(false);expect(w.researchPoints).toBe(before+1);expect(w.contractStats.claimed).toBe(1);
});
