import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='docs/stages/Stage-245/screenshots',read=name=>JSON.parse(fs.readFileSync(`${dir}/${name}.json`,'utf8'));
const names=['first-six','echo-twelve','second-eighteen','fourth-twentyfour'],states=names.map(read);
for(let i=0;i<4;i++){assert.equal(states[i].current.boss.barrageShots,(i+1)*6);assert.equal(states[i].current.boss.barrageFiredPorts,63);assert.equal(states[i].current.hp,3);assert.equal(states[i].current.worldInjection,false);assert.ok(Math.abs(states[i].current.phaseTime-states[0].current.phaseTime-[0,.2,1.8,2][i])<1e-8);}
assert.deepEqual(read('fourth-weak').physical,states[3].physical);
assert.deepEqual(read('fourth-desktop').physical,states[3].physical);
const charge=read('charge').physical,old=read('old-charge').physical;
for(const b of charge.bodies)delete b.barrageBeat;
assert.deepEqual(charge,old);
const gap=read('gap-change'),oldGap=read('old-gap-change');
assert.ok(Math.abs(gap.current.phaseTime-oldGap.current.phaseTime)<1e-8);
assert.ok(gap.current.hostileProjectiles.some(p=>p.y>950));
const win=read('victory').current,claim=read('claimed').current;
assert.equal(win.mode,'boss-reward');assert.equal(win.round,3);assert.equal(win.hp,3);assert.equal(win.bodies,0);assert.equal(win.bullets,0);
assert.equal(claim.mode,'choice');assert.equal(claim.researchPoints,win.researchPoints+1);assert.equal(claim.unspentBuildPoints,win.unspentBuildPoints+1);assert.equal(claim.bossLootStats.claimed,win.bossLootStats.claimed+1);assert.deepEqual(claim.weaponLevels,win.weaponLevels);assert.equal(claim.activeWeapons.length,5);
const pngs=fs.readdirSync(dir).filter(f=>f.endsWith('.png'));for(const file of pngs){const b=fs.readFileSync(`${dir}/${file}`),width=b.readUInt32BE(16),height=b.readUInt32BE(20);assert.deepEqual([width,height],file.includes('desktop')?[1440,900]:[390,844]);}
for(const entries of Object.values(read('console')))assert.deepEqual(entries,[]);
const result={passed:true,pngs:pngs.length,accepted:[6,12,18,24],timing:[0,.2,1.8,2],sameWorld:['weak','desktop','old-new-charge'],victory:{hp:win.hp,round:win.round,research:[win.researchPoints,claim.researchPoints],unspent:[win.unspentBuildPoints,claim.unspentBuildPoints]},method:'Normal menu and earned touch-driven progression, isolated memory save and virtual60Hz; not human input or device performance.'};
fs.writeFileSync('build/qa/Stage-245/visual-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
