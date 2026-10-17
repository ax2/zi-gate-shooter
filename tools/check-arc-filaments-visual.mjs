import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(`docs/stages/Stage-234/screenshots/${n}.json`,'utf8'));
for(const style of ['electric','seeker','photon','decay']){
 const a=read(style+'-mobile'),b=read(style+'-old-mobile');
 assert.equal(a.current.worldInjection,false);assert.equal(a.current.virtualClock,true);
 assert.deepEqual(a.physical,b.physical);assert.deepEqual(a.current.arcStates,b.current.arcStates);
 assert.equal(a.physical.player.hp,3);
 if(style!=='decay')assert.ok(a.current.arcStates.some(l=>!l.focus&&!l.capacitorRelay&&Math.hypot(l.tx-l.x,l.ty-l.y)>=90&&(style==='photon'?l.photon:style==='seeker'?l.seeker:!l.photon&&!l.seeker)));
}
const p=read('photon-mobile'),d=read('decay-mobile'),w=read('weak-mobile'),desktop=read('photon-desktop');
assert.ok(Math.abs(d.current.time-p.current.time-.05)<1e-8);
const l=p.current.arcStates.find(l=>l.photon),later=d.current.arcStates.find(a=>a.photon&&a.x===l.x&&a.y===l.y&&a.tx===l.tx&&a.ty===l.ty);
assert.ok(later);assert.ok(Math.abs(l.life-later.life-.05)<1e-8);
for(const a of [w,desktop]){assert.deepEqual(d.physical,a.physical);assert.deepEqual(d.current.arcStates,a.current.arcStates);}
assert.equal(w.current.quality,'weak');assert.equal(desktop.current.quality,'standard');
assert.deepEqual(read('browser-logs'),{current:[],old:[]});
console.log('Normally earned green/gold/photon and three-frame decay pairs, full public World and retained arc states equal; weak/desktop same state. PNG readability reviewed separately.');
