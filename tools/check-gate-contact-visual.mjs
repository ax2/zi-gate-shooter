import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=n=>JSON.parse(readFileSync('docs/stages/Stage-236/screenshots/'+n+'.json','utf8'));
const a=read('contact-mobile'),b=read('contact-old-mobile'),c=a.current.crossing,d=b.current.crossing;
assert.equal(a.current.worldInjection,false);assert.equal(a.current.stepObservation,true);assert.equal(a.current.virtualClock,true);assert.deepEqual(a.beforePhysical,b.beforePhysical);
assert.deepEqual(c.gates,d.gates);assert.equal(c.x,d.x);assert.equal(c.time,d.time);assert.equal(c.imageTime,c.stepBeforeTime);assert.equal(d.imageTime,d.stepBeforeTime);
assert.equal(c.takenDelta,1);assert.equal(d.takenDelta,0);assert.equal(c.growthAfter.energy-c.growthBefore.energy,60);assert.deepEqual(d.growthAfter,d.growthBefore);
const g=c.gates.find(g=>Math.abs(c.x-g.x)>g.width/2&&Math.abs(c.x-g.x)<g.width/2+20);assert.ok(g);assert.equal(g.x,498);assert.equal(g.energy,144);
const strip=({growth,gatesTaken,...world})=>world;assert.deepEqual(strip(a.physical),strip(b.physical));assert.equal(a.physical.gatesTaken,b.physical.gatesTaken+1);
const continued=read('continued-mobile'),oldContinued=read('continued-old-mobile');assert.equal(continued.physical.gatesTaken,a.physical.gatesTaken);assert.equal(continued.physical.growth.energy,60);assert.equal(continued.current.gateReceiptDetails.length,1);assert.equal(oldContinued.current.gateReceiptDetails.length,0);assert.deepEqual(continued.current.gateReceiptDetails[0].lines,['充能 +60']);assert.deepEqual(continued.physical,read('weak-mobile').physical);
const later=read('receipt-followup-mobile');assert.equal(later.physical.gatesTaken,a.physical.gatesTaken);assert.ok(later.current.gateReceiptDetails.some(r=>r.visible&&r.lines[0]==='充能 +60'&&r.age>0));
for(const name of['receipt-weak-mobile','receipt-desktop']){const r=read(name);assert.deepEqual(later.physical,r.physical);assert.ok(r.current.gateReceiptDetails.some(r=>r.visible&&r.lines[0]==='充能 +60'));}
assert.deepEqual(read('browser-logs'),{current:[],old:[]});
console.log('Equal full pre-contact World, true9.67px cockpit lip, exactly one+60 vs zero, no duplicate, deferred receipt actually visible, weak/desktop same World. PNG clarity reviewed separately.');
