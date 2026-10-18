import{build}from'esbuild';import{access,mkdir}from'node:fs/promises';import{execFileSync}from'node:child_process';import path from'node:path';
const dir='build/qa/Stage-252';await mkdir(dir,{recursive:true});
try{await access(dir+'/baseline.mjs');}catch{
 await build({stdin:{contents:"export{World}from './src/core/world';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:dir+'/baseline.mjs',plugins:[{name:'stage251-core-baseline',setup(b){b.onLoad({filter:/[\\/]src[\\/]core[\\/].*\.ts$/},a=>({contents:execFileSync('git',['show','7deb269:'+path.relative(process.cwd(),a.path).replaceAll('\\','/')],{encoding:'utf8',maxBuffer:8e6}),loader:'ts'}));}}]});
}
await build({entryPoints:['tools/audit-boss-reserves.ts'],bundle:true,platform:'node',format:'esm',outfile:dir+'/audit.mjs'});await import('../'+dir+'/audit.mjs');
