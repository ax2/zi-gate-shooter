import {build} from 'esbuild';import{readFile}from'node:fs/promises';import{execFileSync}from'node:child_process';
import path from 'node:path';
// The cached comparison is valid only while these original inputs are unchanged.
// This new opt-in module is not imported by the baseline World. Its candidate
// hook is separate; all pre-existing core/driver inputs still must match.
execFileSync('git',['diff','--exit-code','efa2c4d','--','src/core','tests/helpers',':(exclude)src/core/boss-salvage.ts'],{stdio:'pipe'});
for(const file of['src/core/world.ts','src/core/director.ts','src/core/heavy-escorts.ts','tests/helpers/default-pressure-driver.ts','tests/helpers/progression-driver.ts']){
 const old=execFileSync('git',['rev-parse',`efa2c4d:${file}`],{encoding:'utf8'}).trim(),now=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();if(old!==now)throw Error('Cached baseline inputs changed: '+file);
}
export function heavyPressureCandidate(mult,hold){return{name:'fixed-heavy-gun-candidate',setup(b){b.onLoad({filter:/[\\/]world\.ts$/},async a=>{
 const src=await readFile(a.path,'utf8'),marker='if(s.opening!==undefined)candidate.timer=s.opening;';if(src.split(marker).length!==2)throw Error('Recheck World admission patch');
 return{contents:src.replace(marker,`if(s.heavyReserve&&s.kind==='armor'&&s.pattern!=='bankshot'){candidate.hp*=${mult};candidate.maxHp=candidate.hp;}\n          ${marker}`),loader:'ts'};
});b.onLoad({filter:/[\\/]behavior\.ts$/},async a=>{
 const src=await readFile(a.path,'utf8'),marker='!batteryHolding(b)&&!fireControlHolding(b)';if(src.split(marker).length!==2)throw Error('Recheck heavy holding behavior');
 return{contents:src.replace(marker,marker+`&&!(b.heavyReserve&&b.kind==='armor'&&b.age<${hold})`),loader:'ts'};
});}};}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve('tools/run-heavy-durability-candidate.mjs')){
 const mult=Number(process.env.HEAVY_DURABILITY??3),route=process.env.HEAVY_ROUTE??'optical',hold=Number(process.env.HEAVY_HOLD??0);
 if(![1,2,3,4].includes(mult)||![0,3.2].includes(hold)||!['ballistic','electric','optical'].includes(route))throw Error('Unsupported controlled candidate');
 const outfile=`build/qa/Stage-250/heavy-durability-${mult}-hold${hold}-${route}.mjs`;
 await build({entryPoints:['tools/audit-heavy-durability-candidate.ts'],bundle:true,platform:'node',format:'esm',outfile,plugins:[heavyPressureCandidate(mult,hold)]});await import('../'+outfile);
}
