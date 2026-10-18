import {build} from 'esbuild';import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';

// Bundle a reviewable candidate without modifying files being read by the full
// baseline suite. Only the interceptor's image/pose changes; core rules stay intact.
const dir='build/qa/Stage-250';await mkdir(dir,{recursive:true});
export function candidatePlugin(){return{name:'interceptor-art-candidate',setup(b){b.onLoad({filter:/[\\/]canvas-runtime\.ts$/},async args=>{
 let source=await readFile(args.path,'utf8');
 const replace=(from,to)=>{if(source.split(from).length!==2)throw Error('Recheck candidate patch: '+from);source=source.replace(from,to);};
 replace("import { eliteFrame } from './elite-motion';","import { eliteFrame } from './elite-motion';import {INTERCEPTOR_ART,interceptorArtFrame} from './interceptor-art';");
 replace("'elite-v1.png', 'conduit-v1.png'","'elite-v1.png', INTERCEPTOR_ART, 'conduit-v1.png'");
 replace('const frame = eliteFrame(b), width',"const frame = b.pattern==='intercept'?interceptorArtFrame(b):eliteFrame(b),eliteArt=b.pattern==='intercept'?INTERCEPTOR_ART:'elite-v1.png', width");
 replace("this.frameSprite('elite-v1.png', frame","this.frameSprite(eliteArt, frame");
 replace("this.hitSprite('elite-v1.png', frame","this.hitSprite(eliteArt, frame");
 return{contents:source,loader:'ts',resolveDir:path.dirname(args.path)};
});}};}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve('tools/build-interceptor-candidate.mjs')){
 await build({stdin:{contents:"export {CanvasRuntime} from './src/game/canvas-runtime';",resolveDir:process.cwd()},bundle:true,platform:'browser',format:'esm',outfile:dir+'/interceptor-candidate.mjs',plugins:[candidatePlugin()]});
 let fixture=await readFile('tools/visual-fixtures/interceptor.js','utf8');
 fixture=fixture.replace("'../../src/game/canvas-runtime.ts'","'/build/qa/Stage-250/interceptor-candidate.mjs'").replaceAll("'../../src/","'/src/").replaceAll("'../../tests/","'/tests/")
  .replace("image:src=>browserImage('/'+src)","image:src=>browserImage(src.endsWith('/interceptor-v2.png')?'/build/art/Stage-250/interceptor-runtime-v2.png':'/'+src)");
 await writeFile('build/qa/Stage-250/interceptor-candidate-fixture.js',fixture);
 let html=await readFile('tools/visual-fixtures/interceptor.html','utf8');
 html=html.replace('截击精英 · 正常奖励回放','截击新机体候选 · 正常奖励回放').replace('正常奖励 / 自动操作者 / 虚拟时钟','未接入正式游戏的新机体候选 / 正常奖励 / 自动操作者 / 虚拟时钟').replace('./interceptor.js','/build/qa/Stage-250/interceptor-candidate-fixture.js');
 await writeFile(dir+'/interceptor-candidate.html',html);
 await build({entryPoints:['src/canvas-preview.ts'],bundle:true,platform:'browser',format:'esm',outfile:dir+'/interceptor-play.mjs',plugins:[candidatePlugin(),{name:'candidate-browser-entry',setup(b){
  b.onLoad({filter:/[\\/]canvas-preview\.ts$/},async a=>({contents:(await readFile(a.path,'utf8')).replaceAll('zi-gate-shooter-v1','zi-gate-shooter-candidate250'),loader:'ts',resolveDir:path.dirname(a.path)}));
  b.onLoad({filter:/[\\/]browser-image\.ts$/},async a=>({contents:(await readFile(a.path,'utf8')).replace('image.src = src;',"image.src = src.endsWith('/interceptor-v2.png')?'/build/art/Stage-250/interceptor-runtime-v2.png':src;"),loader:'ts',resolveDir:path.dirname(a.path)}));
  b.onResolve({filter:/\?raw$/},a=>({path:path.resolve(a.resolveDir,a.path.slice(0,-4)),namespace:'candidate-raw'}));
  b.onLoad({filter:/.*/,namespace:'candidate-raw'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));
 }}]});
 await writeFile(dir+'/interceptor-play.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><base href="/"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><title>火力突围 · 截击新机体候选</title><body><script type="module" src="/build/qa/Stage-250/interceptor-play.mjs"></script></body></html>');
 console.log('Candidate bundle and real-browser fixture ready; production source/assets untouched.');
}
