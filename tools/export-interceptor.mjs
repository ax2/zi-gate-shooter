import './pack-interceptor-candidate.mjs';import{copyFile,readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
await copyFile('build/art/Stage-250/interceptor-runtime-v2.png','public/assets/interceptor-v2.png');
const bytes=await readFile('public/assets/interceptor-v2.png');await writeFile('build/art/Stage-250/interceptor-export.json',JSON.stringify({source:'art/source/interceptor-strip-v2.png',output:'public/assets/interceptor-v2.png',size:[1152,384],frames:3,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),note:'Technical export for integrated prototype; not user final art approval.'},null,2)+'\n');
console.log('Exported three-cell interceptor atlas; ordinary elite asset preserved.');
