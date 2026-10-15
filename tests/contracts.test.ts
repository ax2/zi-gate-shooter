import {it,expect} from 'vitest';
import {Contract} from '../src/core/contracts';
import {World} from '../src/core/world';
it('requires full interval, enough kills and no forbidden changes',()=>{
 const c=new Contract('precision',1,10,1,0);
 expect(c.update(29,25,1,0,true)).toBe(false);
 expect(c.update(1,25,1,1,true)).toBe(true);expect(c.status).toBe('failed');
 const s=new Contract('specialist',1,0,2,0);s.update(30,20,3,0,true);expect(s.reason).toBe('新增了武器种类');
 const low=new Contract('precision',1,0,1,0);low.update(30,14,1,0,true);expect(low.status).toBe('failed');
});
it('grants actual charge once and disallows repeated acceptance in same round',()=>{
 const w=new World();expect(w.acceptContract('precision')).toBe(true);
 expect(w.acceptContract('specialist')).toBe(false);
 w.contract!.elapsed=29.99;w.kills=15;w.step(1/60);
 expect(w.contract!.status).toBe('won');expect(w.growth.mastery??0).toBe(0);
 expect(w.contractReward?.charge).toBe(100);expect(w.claimContractReward('energy')).toBe(true);expect(w.growth.mastery).toBe(1);
 expect(w.claimContractReward('energy')).toBe(false);
 w.step(1/60);expect(w.growth.mastery).toBe(1);
 expect(w.acceptContract('precision')).toBe(false);
 w.round++;expect(w.acceptContract('specialist')).toBe(true);
 expect(new World().contract).toBeUndefined();
});
it('death at the completion boundary awards nothing and recovery does not advance the clock',()=>{
 const w=new World();w.acceptContract('precision');w.phase='recovery';w.step(1/60);expect(w.contract!.elapsed).toBe(0);
 w.phase='running';w.contract!.elapsed=29.99;w.kills=15;w.player.hp=0;w.step(1/60);
 expect(w.contract!.status).toBe('failed');expect(w.growth.mastery??0).toBe(0);
});
it('supplies real reinforcement enemies within caps and closes late acceptance',()=>{
 const w=new World();w.roundTime=41;expect(w.acceptContract('precision')).toBe(false);
 w.roundTime=0;expect(w.acceptContract('precision')).toBe(true);
 w.step(1/60);expect(w.contract!.reinforcements).toBe(1);
 expect(w.bodies.some(b=>b.kind==='drone'&&b.y>=180)).toBe(true);
});
it('chooses a single owned upgrade and preserves other weapon levels',()=>{
 const w=new World();w.growth.mastery=1;w.chooseBuild('ballistic');
 w.acceptContract('precision');w.contract!.elapsed=29.99;w.kills=15;w.step(1/60);
 expect(w.claimContractReward('blast')).toBe(false);expect(w.contractReward).toBeDefined();
 expect(w.claimContractReward('pulse')).toBe(true);
 expect(w.weaponStage('pulse')).toBe(2);expect(w.weaponStage('scatter')).toBe(1);
 expect(w.weaponKind).toBe('pulse');expect(w.claimContractReward('energy')).toBe(false);
 expect(w.activeWeapons).toEqual(['pulse','scatter']);
});
it('allows tier3 specialization without changing other guns, projectile counts or consuming a second reward',()=>{
 const w=new World();w.growth.stage=3;w.growth.mastery=1;w.chooseBuild('electric');
 w.acceptContract('precision');w.contract!.elapsed=29.99;w.kills=15;w.step(1/60);
 const before=w.profileFor('pulse'),arc=w.profileFor('arc');
 w.round++;expect(w.acceptContract('precision')).toBe(false);
 expect(w.claimContractReward('pulse')).toBe(true);
 expect(w.weaponCalibration('pulse')).toBe(1);expect(w.profileFor('pulse').damage[0]).toBe(before.damage[0]*1.5);
 expect(w.profileFor('arc')).toEqual(arc);expect(w.profileFor('pulse').offsets).toEqual(before.offsets);
 expect(w.claimContractReward('pulse')).toBe(false);
 expect(new World().weaponCalibration('pulse')).toBe(0);
});
