import{build}from'esbuild';import{access,mkdir}from'node:fs/promises';import{execFileSync}from'node:child_process';import path from'node:path';
const dir='build/qa/Stage-254';await mkdir(dir,{recursive:true});
try{await access(dir+'/baseline-runtime.mjs');}catch{
 await build({stdin:{contents:"export{CanvasRuntime}from './src/game/canvas-runtime';",resolveDir:process.cwd()},bundle:true,platform:'browser',format:'esm',outfile:dir+'/baseline-runtime.mjs',plugins:[{name:'before-stage254',setup(b){b.onLoad({filter:/[\\/]src[\\/].*\.ts$/},a=>({contents:execFileSync('git',['show','a13fae3:'+path.relative(process.cwd(),a.path).replaceAll('\\','/')],{encoding:'utf8',maxBuffer:8e6}),loader:'ts'}));}}]});
}
await build({entryPoints:['tools/visual-fixtures/boss-rupture.js'],bundle:true,platform:'browser',format:'esm',outfile:dir+'/boss-rupture.mjs'});
console.log('Built normal earned-input fixture and pinned a13fae3 runtime comparison.');
