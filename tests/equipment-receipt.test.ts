import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {captureEquipment,equipmentChanges,equipmentReceipt,EquipmentReceiptQueue} from '../src/game/equipment-receipt';
import type {WeaponKind} from '../src/core/weapons';
const kinds:WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
function pickup(w:World,kind:WeaponKind,tier:number,refit=false){const p=w.spawn('pickup',360,C.playerY,tier);p.weaponKind=kind;p.refit=refit;w.step(C.step,360);w.drainEffects();}
it.each(kinds)('%s records actual ownership, tier and calibration without mutating or promising overload/derived DPS',kind=>{
 const w=new World();w.phase='recovery';const before=captureEquipment(w),json=JSON.stringify(w);captureEquipment(w);expect(JSON.stringify(w)).toBe(json);
 pickup(w,kind,2);const changes=equipmentChanges(before,w);expect(changes).toHaveLength(1);const change=changes[0],p=w.profileFor(kind);expect(change.kind).toBe(kind);expect(change.before?.stage??0).toBe(kind==='pulse'?1:0);expect(change.after.stage).toBe(2);expect(change.after.direct).toBeCloseTo(p.damage.reduce((a,b)=>a+b,0)*p.rate);
 expect(equipmentReceipt(change).detail).toContain('领取时常态全弹直伤/秒');expect(equipmentReceipt(change).title).toContain(kind==='pulse'?'T1→T2':'新增');
 const stable=captureEquipment(w);w.growth.overload=6;expect(equipmentChanges(stable,w)).toEqual([]);expect(captureEquipment(w).get(kind)?.direct).toBe(stable.get(kind)?.direct);
 pickup(w,kind,3);const pre=captureEquipment(w);pickup(w,kind,3,true);const calibrated=equipmentChanges(pre,w)[0];expect(calibrated.after.calibration).toBe(1);expect(calibrated.after.direct).toBeCloseTo(pre.get(kind)!.direct*1.5);expect(equipmentReceipt(calibrated).title).toContain('精校0→1');
});
it('a repeated weapon grants normal charge without inventing an equipment upgrade; global boosts alone do not enqueue',()=>{
 const w=new World();w.phase='recovery';pickup(w,'pulse',2);const before=captureEquipment(w);pickup(w,'pulse',2);expect(w.growth.energy).toBe(30);expect(equipmentChanges(before,w)).toEqual([]);
 w.growth.bonus=80;w.growth.mastery=5;expect(equipmentChanges(before,w)).toEqual([]);
});
it('unread same-weapon changes merge earliest ownership to latest tier, and five distinct records stay bounded',()=>{
 const w=new World();w.phase='recovery';const q=new EquipmentReceiptQueue();
 for(const kind of kinds){const before=captureEquipment(w);pickup(w,kind,2);for(const change of equipmentChanges(before,w))q.push(change);}
 expect(q.pending).toHaveLength(5);const before=captureEquipment(w);pickup(w,'arc',3);const change=equipmentChanges(before,w)[0];q.push(change);change.after.stage=99;
 expect(q.pending).toHaveLength(5);const arc=q.pending.find(r=>r.kind==='arc')!;expect(arc.before).toBeUndefined();expect(arc.after.stage).toBe(3);expect(equipmentReceipt(arc).title).toContain('T3');
 const pulse=q.take()!;const next=captureEquipment(w);pickup(w,'pulse',3);q.push(equipmentChanges(next,w)[0]);q.interrupt(pulse);expect(q.pending).toHaveLength(5);expect(q.take()!.before!.stage).toBe(1);q.clear();expect(q.pending).toHaveLength(0);
});

it('interrupted reading keeps its remaining window, while a genuinely newer upgrade receives a fresh window',()=>{
 const w=new World();w.phase='recovery';const q=new EquipmentReceiptQueue(),before=captureEquipment(w);pickup(w,'pulse',2);q.push(equipmentChanges(before,w)[0]);const current=q.take()!;
 q.interrupt(current,1.1);expect(q.pending[0].remaining).toBe(1.1);const next=captureEquipment(w);pickup(w,'pulse',3);q.push(equipmentChanges(next,w)[0]);expect(q.pending[0].remaining).toBe(3.2);expect(q.pending[0].before?.stage).toBe(1);expect(q.pending[0].after.stage).toBe(3);
});
