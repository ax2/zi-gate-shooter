import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import {advanceBody} from '../src/core/behavior';
import {ACE_DUO} from '../src/core/ace-duo';
function gun(role:'fan'|'needle'){const w=new World(),b=w.spawn('elite',role==='fan'?220:500,500);b.aceRole=role;b.bountyRound=1;b.timer=0;return b;}
function advance(b:Body,seconds:number){const shots:{time:number;vx:number;vy:number}[]=[];for(let i=0;i<Math.round(seconds*60);i++)advanceBody(b,C.step,'running',0,(_x,_y,vx=0,vy=280)=>shots.push({time:b.age,vx,vy}));return shots;}
it('gives the two elites distinct three-line and three-shot attacks on the shared forecast clock',()=>{
 const fan=advance(gun('fan'),1.5),needle=advance(gun('needle'),1.5);
 expect(fan.map(s=>s.vx)).toEqual([...ACE_DUO.fanVx]);expect(fan.every(s=>s.vy===300)).toBe(true);
 expect(needle).toHaveLength(3);expect(needle.every(s=>s.vx===0&&s.vy===400)).toBe(true);
 expect(needle[1].time-needle[0].time).toBeCloseTo(1/6,5);
});
it.each(['fan','needle'] as const)('pending %s revenge waits for a fresh full charge and expands only the next attack',role=>{
 const b=gun(role);b.aceRagePending=true;const shots=advance(b,.9);expect(shots).toHaveLength(0);expect(b.aceEnraged).toBe(true);
 const volley=advance(b,1);expect(volley).toHaveLength(5);expect(b.warning).toBe(0);
 if(role==='fan')expect(volley.map(s=>s.vx)).toEqual([...ACE_DUO.rageFanVx]);else expect(volley.every(s=>s.vy===400&&s.vx===0)).toBe(true);
});
it('finishes an already advertised needle burst before applying revenge rather than adding unannounced shots',()=>{
 const b=gun('needle');const first=advance(b,.85);expect(first).toHaveLength(1);b.aceRagePending=true;
 expect(advance(b,.32)).toHaveLength(2);expect(b.aceEnraged).toBeUndefined();expect(b.aceRagePending).toBe(true);
 expect(advance(b,.2)).toHaveLength(0);expect(b.aceEnraged).toBe(true);expect(b.warning).toBe(1);
});
it('EMP freezes the active clock and leaves the original chapter velocity scale in force',()=>{
 const b=gun('needle');b.shotScale=1.3;advance(b,.3);const timer=b.timer;b.empRemaining=.5;
 expect(advance(b,.5)).toHaveLength(0);expect(b.timer).toBeCloseTo(timer,8);
 const shots=advance(b,1);expect(shots).toHaveLength(3);expect(shots.every(s=>s.vy===520)).toBe(true);
});
function setup(){const w=new World(),p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pulse';w.step(C.step,360);expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);for(let i=0;i<60;i++)w.step(C.step,68);w.drainEffects();return w;}
function kill(w:World,b:Body,id:number){w.bullets.push({id,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10000,age:0,active:true,hostile:false});}
it('only a real same-pair death primes the survivor, preserves old shots and pays no early contract reward',()=>{
 const w=setup(),[a,b]=w.bodies.filter(b=>b.aceRole),other=w.spawn('elite',360,180);other.aceRole='fan';other.bountyRound=99;
 w.bullets.push({id:80000,x:68,y:600,px:68,py:600,vx:0,vy:300,damage:1,age:0,active:true,hostile:true,sourceId:a.id});kill(w,a,90000);w.step(C.step,500);
 expect(b.aceRagePending).toBe(true);expect(other.aceRagePending).toBeUndefined();expect(w.bullets.some(b=>b.id===80000)).toBe(true);expect(w.contract?.targetKills).toBe(1);expect(w.contractReward).toBeUndefined();
});
it('simultaneous actual deaths pay once without a phantom survivor phase',()=>{
 const w=setup(),targets=w.bodies.filter(b=>b.aceRole);targets.forEach((b,i)=>kill(w,b,90000+i));w.step(C.step,68);const events=w.drainEffects();
 expect(w.contract?.targetKills).toBe(2);expect(w.contractReward).toEqual({charge:150,round:1,research:1});expect(events.some(e=>e.text?.endsWith('王牌 · 暴走'))).toBe(false);
 expect(w.claimContractReward('energy')).toBe(true);expect(w.claimContractReward('energy')).toBe(false);
});
it('a failed encounter keeps its deployed survivor and does not grant the contract reward',()=>{
 const w=setup(),[a,b]=w.bodies.filter(b=>b.aceRole);w.contract!.elapsed=30;w.step(C.step,68);expect(w.contract?.status).toBe('failed');
 kill(w,a,90000);w.step(C.step,68);expect(b.aceRagePending).toBe(true);expect(b.active).toBe(true);expect(w.contractReward).toBeUndefined();
});
it('does not invent a muzzle impulse or revenge shot count when the hostile budget rejects a shot',()=>{
 const w=setup(),b=w.bodies.find(b=>b.aceRole==='needle')!;b.aceEnraged=true;b.warning=1;b.timer=0;
 w.bullets=Array.from({length:C.limits.hostile},(_,i)=>({id:80000+i,x:360,y:300,px:360,py:300,vx:0,vy:280,damage:1,age:0,active:true,hostile:true}));
 w.step(C.step,68);expect(b.aceFiredAt).toBeUndefined();expect(b.aceRageShots).toBeUndefined();expect(b.bountyShots).toBeUndefined();
});
