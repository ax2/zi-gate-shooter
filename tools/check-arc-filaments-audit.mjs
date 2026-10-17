import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
for(const seconds of [300,600]){
 const d=read(`build/qa/Stage-234/runtime-${seconds}.json`);
 assert.equal(d.results.length,seconds===300?4:1);
 for(const r of d.results){assert.equal(r.serializedWorldModeSaveEqual,true);assert.equal(r.hp,3);assert.ok(r.time>=seconds-1e-6);assert.ok(r.peakArcs<=12);assert.ok(r.arcFrames>0);}
 const b=d.results.find(r=>r.route==='balanced');
 for(const k of ['greenArcSamples','seekerArcSamples','photonArcSamples'])assert.ok(b[k]>0);
}
console.log('Four 300s and one 600s old/new Runtime pairs checked; balanced routes exercise all three arc styles.');
