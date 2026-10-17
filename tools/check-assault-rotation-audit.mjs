import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=n=>JSON.parse(readFileSync('build/qa/Stage-231/'+n+'.json','utf8'));
const routes=read('routes');assert.equal(routes.length,90);for(const r of routes){assert.equal(r.hp,3);assert.equal(r.failureTime,null);assert.equal(r.phase,'boss-entry');assert.equal(r.kills,0);assert.equal(r.cratesBroken,0);assert.equal(r.unknownEmitterBullets,0);assert.ok(r.minObservationSeconds>=.45);}
const short=read('normal-300'),long=read('normal-1200');assert.equal(short.runs.length,9);assert.equal(long.runs.length,3);
for(const {before,after}of[...short.runs,...long.runs]){
 assert.ok(after.peakBodies<=32&&after.peakBullets<=128);
 if(after.policy==='safe'){assert.equal(after.hp,3);assert.ok(after.time>=299.99);assert.ok(after.round>=4);}
 if(after.policy==='safe'&&after.time<301)assert.ok(after.chapters[0].meanVisible>before.chapters[0].meanVisible*1.1);
}
for(const {after}of long.runs){assert.ok(after.time>=1199.99);assert.ok(after.round>=13);assert.ok(after.sources.some(s=>s.round===5&&Math.abs(s.roundTime-10)<.02&&s.pattern==='lockshot'&&s.shots.length>0));assert.ok(after.sources.some(s=>s.round===6&&Math.abs(s.roundTime-13.6)<.02&&s.pattern==='bankshot'&&s.shots.length>0));}
assert.ok(long.runs.some(({after})=>after.sources.some(s=>s.round===8&&Math.abs(s.roundTime-10)<.02&&s.pattern==='relocate'&&s.shots.length===3)));
console.log('90 delayed observation routes; nine short old/new pairs; three20min old/new pairs; real lockshot/bankshot fire verified.');
