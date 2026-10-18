import{build}from'esbuild';import{mkdir}from'node:fs/promises';import{bossSalvageCandidate}from'./boss-salvage-candidate.mjs';
const route=process.env.SALVAGE_ROUTE??'optical';if(!['ballistic','electric','optical'].includes(route))throw Error('Unknown route');await mkdir('build/qa/Stage-251',{recursive:true});
const output=`build/qa/Stage-251/salvage-${route}.mjs`;await build({entryPoints:['tools/audit-boss-salvage.ts'],bundle:true,platform:'node',format:'esm',outfile:output,plugins:[bossSalvageCandidate(true)]});await import('../'+output);
