import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const data=JSON.parse(readFileSync('build/qa/Stage-238/normal.json','utf8'));assert.equal(data.rows.length,3);
for(const r of data.rows){assert.equal(r.frames,72000);assert.equal(r.hp,3);assert.ok(r.best>=9);assert.equal(r.score,r.baseScore+r.bonus);assert.equal(r.bursts.reduce((a,b)=>a+b.delta,0),r.bonus);assert.ok(r.bursts.every(b=>[10,15,25,40].includes(b.delta)||b.delta===50));}
const read=n=>JSON.parse(readFileSync('docs/stages/Stage-238/screenshots/'+n+'.json','utf8'));
for(const [n,count,bonus]of[['three-mobile',3,10],['six-mobile',6,25],['nine-mobile',9,50]]){const a=read(n);assert.equal(a.current.worldInjection,false);assert.equal(a.current.virtualClock,true);assert.equal(a.current.rapid.last.count,count);assert.equal(a.current.rapid.last.bonus,bonus);assert.equal(a.current.hp,3);}
const nine=read('nine-mobile');for(const n of['weak-mobile','desktop','paused-mobile','rules-mobile'])assert.deepEqual(read(n).physical,nine.physical);
const result=read('result-mobile');assert.equal(result.current.mode,'result');assert.equal(result.current.hp,0);assert.equal(result.current.rapid.best,13);assert.equal(result.current.rapid.totalBonus,740);assert.equal(result.current.score,10880);
const restart=read('restart-mobile');assert.equal(restart.current.mode,'playing');assert.equal(restart.current.time,0);assert.equal(restart.current.score,0);assert.equal(restart.current.rapid.totalBonus,0);assert.equal(restart.current.rapid.last,null);assert.deepEqual(read('browser-logs'),[]);
console.log('3 x72000 combat-equivalent frames; score ledger; normally earned3/6/9; same World weak/desktop/pause/rules; real death report and restart reset; logs empty. PNGs inspected separately.');
