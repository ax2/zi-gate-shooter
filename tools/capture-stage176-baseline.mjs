import {existsSync} from 'node:fs';if(existsSync('docs/stages/Stage-176/baseline-timelines.json'))throw Error('Refusing to overwrite preserved pre-Stage176 evidence');
import {build} from 'esbuild';
const code=`import {timeline} from './src/core/director.ts';import {writeFileSync} from 'node:fs';const rows=[];for(const round of [1,2,3,4,5,6,7,8,9,11,14,17])for(const seed of [1,77,1337])rows.push({round,seed,timeline:timeline(round,seed)});writeFileSync('docs/stages/Stage-176/baseline-timelines.json',JSON.stringify(rows,null,2));`;
const out=await build({stdin:{contents:code,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
