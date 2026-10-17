import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=n=>JSON.parse(readFileSync('docs/stages/Stage-235/screenshots/'+n+'.json','utf8'));
for(const[n,round,pattern]of[['corridor-lock-mobile',4,'lockshot'],['flank-single-mobile',5,'relocate'],['heavy-bank-mobile',6,'bankshot'],['corridor-sweep-mobile',7,'sweep'],['flank-double-mobile',8,'relocate'],['heavy-sweep-mobile',9,'sweep']]){
 const a=read(n);assert.equal(a.current.worldInjection,false);assert.equal(a.current.virtualClock,true);assert.equal(a.physical.round,round);assert.equal(a.physical.player.hp,3);assert.equal(a.current.activeWeapons.length,5);
 const units=a.physical.bodies.filter(b=>b.active&&b.pattern===pattern&&a.physical.roundTime-b.age>=20.9&&a.physical.roundTime-b.age<27);assert.ok(units.length>0);
 if(round===4||round===7)assert.equal(units.length,2);
 if(round===5||round===8)assert.ok(units.some(b=>Math.abs(b.x-b.lane)>15));
 if(round===6||round===9)assert.equal(a.physical.bodies.filter(b=>b.active&&b.controlGroup===-round).length,3);
}
const s=read('heavy-sweep-mobile');for(const n of['heavy-sweep-weak','heavy-sweep-desktop'])assert.deepEqual(s.physical,read(n).physical);
assert.equal(read('heavy-sweep-weak').current.quality,'weak');assert.equal(read('heavy-sweep-desktop').current.quality,'standard');assert.deepEqual(read('browser-logs'),[]);
console.log('Six normally earned middle checkpoints, two corridor guns, side first moving sentry, heavy breach trio and successor; same public World in weak/desktop. Side images show first arrival, not both later sentries. PNG clarity inspected separately.');
