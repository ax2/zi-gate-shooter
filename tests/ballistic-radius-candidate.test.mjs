import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
class Candidate extends World{constructor(seed,radius){super(seed);this.radius=radius;}profileFor(kind){const p=super.profileFor(kind);return kind==='scatter'&&p.splashRadius?{...p,splashRadius:this.radius}:p;}}
it('measures finite splash range candidates on actual normal encounters',()=>{const runs=[];
for(const radius of [70,110,140,170])for(const seed of [1337,77]){const w=new Candidate(seed,radius);let x=360;
for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){const a=w.build.available(w.growth.mastery??0);const r=a.includes('ballistic')&&w.build.ranks.ballistic<3?'ballistic':a.includes('electric')&&w.build.ranks.electric===0?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)w.chooseBuild(r,r==='ballistic'&&w.build.ranks.ballistic===1?'fragment':undefined);if(frame%6===0)x=progressionTarget(w);w.step(C.step,x);w.drainEffects();}
runs.push({radius,seed,time:w.time,hp:w.player.hp,kills:w.kills,splashHits:w.scatterSplashHits,bursts:w.scatterBursts,peakBullets:w.peakBullets});}
for(const r of runs){expect(r.time).toBeCloseTo(300);expect(r.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
mkdirSync('build/qa/Stage-137',{recursive:true});writeFileSync('build/qa/Stage-137/radius-candidates.json',JSON.stringify(runs,null,2));},60000);
