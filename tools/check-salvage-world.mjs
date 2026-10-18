import{build}from'esbuild';import assert from'node:assert/strict';import{writeFile}from'node:fs/promises';import{bossSalvageCandidate}from'./boss-salvage-candidate.mjs';
await build({stdin:{contents:"export{World}from './src/core/world';export{C}from './src/core/config';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'build/qa/Stage-251/salvage-world.mjs',plugins:[bossSalvageCandidate()]});
const{World,C}=await import('../build/qa/Stage-251/salvage-world.mjs');const rows=[];
function setup(round=4){const w=new World(1337,round);Object.assign(w,{phase:'boss',scheduled:[],spawnEscorts(){},shoot(){}});const b=w.spawn('boss',360,360);b.hp=b.maxHp=100;b.speed=0;w.player.x=w.player.px=68;return{w,b};}
function hit(w,damage){w.bullets.push({id:10000+w.hits,x:360,y:400,px:360,py:400,vx:0,vy:-1200,age:0,damage,active:true,hostile:false});w.step(C.step,68);return w.drainEffects();}
for(const round of[1,2,3,4,12]){
 const{w,b}=setup(round),receipts=[];for(let i=0;i<5;i++)receipts.push(...hit(w,20).filter(e=>e.type==='boss-salvage'));
 assert.equal(receipts.length,round>=4?4:0);assert.equal(w.bossWins,1);assert.equal(w.bossRewardRound,round);assert.equal(w.growth.energy,round>=4?30:50);assert.equal(w.growth.mastery??0,round>=4?1:0);assert.ok(w.claimBossReward('research'));assert.equal(w.bossLootStats.claimed,1);rows.push({round,receipts:receipts.length,energy:w.growth.energy,mastery:w.growth.mastery??0,loot:w.bossLootStats});
}
const{w,b}=setup();const due=hit(w,1000),salvage=due.filter(e=>e.type==='boss-salvage');assert.equal(salvage.length,1);assert.equal(salvage[0].gain,4);assert.equal(w.growth.energy,30);assert.equal(w.bossWins,1);assert.equal(b.hp,0);
const shielded=setup();shielded.w.bossShieldActive=()=>true;const before=shielded.b.hp;hit(shielded.w,20);assert.ok(shielded.b.hp<before);assert.equal(shielded.w.growth.energy,shielded.b.hp<=80?20:0,'actual HP, not nominal damage, gates reward');
await writeFile('build/qa/Stage-251/world-check.json',JSON.stringify({method:'Controlled fixture, actual projectile collision/World contacts and original boss victory/loot path. Not natural progression or pixels.',rows,lethalCoalesced:true,shieldUsesActualHP:true},null,2));console.log('World contact/victory/loot checks passed');
