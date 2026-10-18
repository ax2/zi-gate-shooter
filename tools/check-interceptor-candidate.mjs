import {build} from 'esbuild';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
await build({stdin:{contents:"export {createRenderFixture} from './tests/helpers/render-fixture';export {interceptorArtFrame} from './src/game/interceptor-art';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'build/qa/Stage-250/interceptor-art-harness.mjs'});
const {createRenderFixture,interceptorArtFrame}=await import('../build/qa/Stage-250/interceptor-art-harness.mjs');
const {CanvasRuntime:Before}=await import('../build/qa/Stage-250/baseline.mjs');
const {CanvasRuntime:Candidate}=await import('../build/qa/Stage-250/interceptor-candidate.mjs');
class SizedCandidate extends Candidate{constructor(p){super({...p,image:async src=>src.endsWith('/interceptor-v2.png')?{src,width:1152,height:384}:p.image(src)});}}
const rows=[];
for(const weak of[false,true])for(const pattern of[undefined,'intercept']){
 const a=createRenderFixture(weak,undefined,undefined,Before),b=createRenderFixture(weak,undefined,undefined,SizedCandidate);
 for(const f of[a,b]){await f.runtime.load();f.runtime.start();const w=f.runtime.world;w.scheduled=[];w.bodies=[];w.bullets=[];w.player.x=w.player.px=652;const elite=w.spawn('elite',360,360);elite.pattern=pattern;elite.speed=0;elite.dropGrace=0;elite.hit=.05;}
 let observations=0;
 for(let i=0;i<300;i++){
  a.tick();b.tick();const left=JSON.stringify(a.runtime.world),right=JSON.stringify(b.runtime.world);assert.equal(right,left,`World parity weak=${weak} pattern=${pattern} frame=${i}`);
  const body=b.runtime.world.bodies.find(v=>v.kind==='elite');
  if(body?.active){const draws=b.calls.filter(c=>c.kind==='drawImage'&&String(c.args[0]?.src).includes(pattern?'interceptor-v2.png':'elite-v1.png'));assert.ok(draws.length,'body uses correct asset');if(pattern){assert.notEqual(draws[0].args[1],384,'all-port glow cell excluded');const frame=interceptorArtFrame(body);assert.ok(frame===0||frame===2);}observations++;}
 }
 rows.push({weak,pattern:pattern??'ordinary',callbacks:300,worldEqual:true,drawObservations:observations});
}
assert.equal(interceptorArtFrame({age:10,interceptFiredAt:9.9,empRemaining:1}),0,'offline does not show firing pose');
assert.equal(interceptorArtFrame({age:10,interceptFiredAt:10.1}),0,'future timestamp does not flash');
const report={method:'Synthetic Canvas calls and actual runtimes; controlled World setup, no pixels or performance claim.',rows,callbacks:1200,worldEqual:true,productionIntegration:false};
await writeFile('build/qa/Stage-250/interceptor-art-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
