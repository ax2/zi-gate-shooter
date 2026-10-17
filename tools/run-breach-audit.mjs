import {build} from 'esbuild';
await build({entryPoints:['tools/audit-breach.ts'],bundle:true,platform:'node',format:'esm',outfile:'build/qa/Stage-216/pressure-audit.mjs',plugins:[{name:'old-world',setup(b){b.onResolve({filter:/build\/qa\/Stage-216\/baseline\.mjs$/},()=>({path:new URL('../build/qa/Stage-216/baseline.mjs',import.meta.url).href,external:true}));}}]});
await import('../build/qa/Stage-216/pressure-audit.mjs');
