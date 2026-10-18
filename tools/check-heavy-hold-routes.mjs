import{build}from'esbuild';import{writeFile}from'node:fs/promises';import assert from'node:assert/strict';import{heavyPressureCandidate}from'./run-heavy-durability-candidate.mjs';
const round=Number(process.env.HEAVY_ROUND??3),bundle=`build/qa/Stage-250/heavy-hold-routes-r${round}.mjs`;
await build({stdin:{contents:"export {observedNoFireRoute} from './tests/helpers/observed-route-driver';export{World}from './src/core/world';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:bundle,plugins:[heavyPressureCandidate(3,3.2)]});
const{observedNoFireRoute}=await import('../'+bundle);const rows=[],out=`build/qa/Stage-250/heavy-hold-routes-r${round}.json`;
if(![3,6,9,12].includes(round))throw Error('Unsupported round');
for(const plan of[0,1,2])for(const start of[68,360,652]){
 const row=observedNoFireRoute(round,plan,start);rows.push(row);console.log(JSON.stringify(row));
 await writeFile(out,JSON.stringify({complete:false,method:'Isolated no-fire routes, 450ms delayed observation, real collision oracle. Not human difficulty.',rows},null,2)+'\n');
 assert.equal(row.failureTime,null);assert.equal(row.hp,3);assert.equal(row.phase,'boss-entry');assert.equal(row.unknownEmitterBullets,0);
}
await writeFile(out,JSON.stringify({complete:true,method:'Isolated no-fire routes, 450ms delayed observation, real collision oracle. Not human difficulty.',rows},null,2)+'\n');
