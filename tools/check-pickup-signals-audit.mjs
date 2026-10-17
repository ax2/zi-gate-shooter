import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=f=>JSON.parse(readFileSync(f,'utf8')),base='docs/stages/Stage-232/screenshots/';
for(const [seconds,count]of[[300,3],[1200,1]]){
 const a=read('build/qa/Stage-232/runtime-'+seconds+'.json');assert.equal(a.results.length,count);
 for(const r of a.results){assert.equal(r.serializedWorldModeSaveEqual,true);assert.equal(r.hp,3);assert.ok(r.time>=seconds-1e-8);assert.ok(r.urgentFrames>0&&r.framesWithPassedPickup>0&&r.noticeFrames>0);}
}
for(const stem of ['urgent','crowded']){
 const a=read(base+stem+'-new-mobile.json'),b=read(base+stem+'-old-mobile.json');assert.deepEqual(a.physical,b.physical);assert.equal(a.current.worldInjection,false);assert.equal(b.current.worldInjection,false);assert.equal(a.physical.player.hp,3);
}
const u=read(base+'urgent-new-mobile.json');assert.ok(u.current.pickupSignals.some(s=>s.collectible&&s.urgent));assert.equal(u.physical.pickups,0);
const c=read(base+'crowded-new-mobile.json'),weak=read(base+'crowded-new-mobile-weak.json');assert.deepEqual(c.physical,weak.physical);assert.ok(c.current.pickupSignals.some(s=>!s.collectible));assert.equal(c.current.combatNotice.y,1208);assert.equal(c.current.combatNotice.text,'折返盾炮');
console.log('Three300s and one1200s old/new runtime pairs; two real rendered checkpoints same World; weak same World; actual notice and pending/passed pickup states verified. Pixel readability was inspected separately.');
