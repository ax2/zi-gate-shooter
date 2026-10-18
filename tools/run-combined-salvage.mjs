import{build}from'esbuild';import{bossSalvageCandidate}from'./boss-salvage-candidate.mjs';
const route=process.env.SALVAGE_ROUTE??'optical';if(!['ballistic','electric','optical'].includes(route))throw Error('Unknown route');const out=`build/qa/Stage-251/combined-${route}.mjs`;
await build({entryPoints:['tools/audit-combined-salvage.ts'],bundle:true,platform:'node',format:'esm',outfile:out,plugins:[bossSalvageCandidate()]});await import('../'+out);
