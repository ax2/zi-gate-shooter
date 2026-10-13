import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const root='build/qa/Stage-35';
await mkdir(root,{recursive:true});
const baseline='c99fc68';
const before=execFileSync('git',['show',baseline+':src/game/frame-window.ts'],{encoding:'utf8'});
await build({stdin:{contents:before,loader:'ts'},format:'esm',outfile:`${root}/before.mjs`});
await build({entryPoints:['src/game/frame-window.ts'],format:'esm',outfile:`${root}/after.mjs`});
const result={scope:'Node diagnostics microbenchmark, 100 full-window snapshots; not browser/device leak or performance acceptance',runs:[]};
for(const name of ['before','after','after','before']){
 const {FrameWindow}=await import(`../build/qa/Stage-35/${name}.mjs`);
 const window=new FrameWindow();for(let i=0;i<36000;i++)window.add((i*7919%1000)/10);
 for(let i=0;i<5;i++)window.snapshot();global.gc();const startHeap=process.memoryUsage().heapUsed;let peak=startHeap;const start=performance.now();let value;
 for(let i=0;i<100;i++){value=window.snapshot();peak=Math.max(peak,process.memoryUsage().heapUsed);}
 const elapsed=performance.now()-start;global.gc();result.runs.push({name,elapsedMs:elapsed,startHeap,peakObservedHeap:peak,postGcHeap:process.memoryUsage().heapUsed,value});
}
await writeFile(`${root}/benchmark.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
