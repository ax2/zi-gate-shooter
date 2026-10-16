import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {laserVisualBand} from '../src/core/support-profile';
function prepare(rank=1){const w=new World();w.growth.mastery=rank;for(let i=0;i<rank;i++)w.chooseBuild('optical');return w;}
it('empty laser pulses keep their range segment but never invent a hit crown',()=>{const w=prepare();w.step(C.step,360);const e=w.drainEffects();expect(e.filter(e=>e.type==='laser')).toHaveLength(1);expect(e.some(e=>e.type==='laser-impact')).toBe(false);expect(e.find(e=>e.type==='laser')!.opticalBand).toBe(1);});
it.each(['armor','guard','crate','gate','protected'] as const)('places a crown on actual %s damage/charging contacts and respects entry protection',kind=>{
 const w=prepare(2),b=w.spawn(kind==='protected'?'armor':kind,360,600);b.speed=0;b.timer=999;if(kind==='protected')b.dropGrace=1;const hp=b.hp,energy=b.energy;w.step(C.step,360);const e=w.drainEffects().filter(e=>e.type==='laser-impact');
 if(kind==='protected'){expect(e).toHaveLength(0);expect(b.hp).toBe(hp);return;}expect(e).toHaveLength(1);expect(e[0].targetX).toBe(360);expect(e[0].targetY).toBe(kind==='armor'?600:600+b.height/2);expect(e[0].opticalBand).toBe(2);expect(b.hp<hp||b.energy>energy).toBe(true);
});
it('snapshots the fired appearance before the same pulse earns the next mastery milestone',()=>{
 const w=new World();w.growth.mastery=7;w.growth.energy=90;const elite=w.spawn('elite',360,600);elite.hp=1;elite.speed=0;elite.timer=999;w.step(C.step,360);const e=w.drainEffects();expect(w.growth.mastery).toBe(8);expect(laserVisualBand(w.growth.mastery,0)).toBe(3);expect(e.find(e=>e.type==='laser')!.opticalBand).toBe(1);expect(e.find(e=>e.type==='laser-impact')!.opticalBand).toBe(1);
});
