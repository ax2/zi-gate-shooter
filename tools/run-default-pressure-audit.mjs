import{build}from'esbuild';
await build({entryPoints:['tools/audit-default-pressure.ts'],bundle:true,platform:'node',format:'esm',outfile:'build/qa/Stage-214/pressure-audit.mjs'});
await import('../build/qa/Stage-214/pressure-audit.mjs');
