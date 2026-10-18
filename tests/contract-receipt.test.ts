import {expect,it} from 'vitest';
import {createRenderFixture} from './helpers/render-fixture';

// Isolated renderer setup. Actual contract completion and reward rules execute;
// this deliberately does not claim a normal player earned these fixture kills.
async function completed(weak:boolean){
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();
 const w=f.runtime.world;Object.assign(w,{scheduled:[]});w.growth.mastery=1;w.chooseBuild('ballistic');
 expect(w.acceptContract('precision')).toBe(true);w.contract!.elapsed=29.99;w.kills=15;f.tick();
 expect(f.runtime.mode).toBe('contract-reward');return f;
}
const stale='契约完成 · 选择强化奖励';
it.each([false,true])('retires only the collected contract CTA and immediately explains the stronger weapon (weak=%s)',async weak=>{
 const f=await completed(weak),w=f.runtime.world;
 const before=w.profileFor('scatter').damage.reduce((a,b)=>a+b,0)*w.profileFor('scatter').rate,owned=[...w.activeWeapons],time=w.time;
 expect(f.runtime.activateControl('contract-claim:blast')).toBe(false);
 expect((f.runtime as any).notice).toBe(stale);expect(w.contractStats.claimed).toBe(0);
 expect(f.runtime.activateControl('contract-claim:scatter')).toBe(true);
 expect(w.profileFor('scatter').damage.reduce((a,b)=>a+b,0)*w.profileFor('scatter').rate).toBeGreaterThan(before);expect(w.activeWeapons).toEqual(owned);expect(w.time).toBe(time);
 expect(w.contractStats.claimed).toBe(1);expect((f.runtime as any).notice).not.toBe(stale);
 expect(f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='霰射炮 · T2')).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).includes('近距聚弹更强'))).toBe(true);
 expect(f.runtime.activateControl('contract-claim:scatter')).toBe(false);expect(w.contractStats.claimed).toBe(1);
});
it.each([false,true])('preserves the new energy notice after collecting the contract (weak=%s)',async weak=>{
 const f=await completed(weak);expect(f.runtime.activateControl('contract-claim:energy')).toBe(true);
 expect((f.runtime as any).notice).toBe('契约奖励 · 充能+100');
 expect(f.runtime.world.growth.overload).toBeGreaterThan(0);
 expect(f.runtime.world.contractStats.claimed).toBe(1);
});
it('preserves a different live notice instead of indiscriminately clearing reward feedback',async()=>{
 const f=await completed(false);(f.runtime as any).notice='另一项已获得奖励';(f.runtime as any).noticeUntil=10000;
 expect(f.runtime.activateControl('contract-claim:scatter')).toBe(true);expect((f.runtime as any).notice).toBe('另一项已获得奖励');
});
