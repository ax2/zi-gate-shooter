import sharp from'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';
const source='art/source/flight-projectiles-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(meta.width!==1536||meta.height!==1024||!meta.hasAlpha)throw Error('Reinspect source atlas');
const tiles=[],frames=[];
for(let i=0;i<6;i++){
 const box={left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512},data=await sharp(bytes).extract(box).ensureAlpha().raw().toBuffer();let edge=0,visible=0;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const a=data[(y*512+x)*4+3];if(a>16){visible++;if(x<3||y<3||x>=509||y>=509)edge++;}}
 if(!visible||edge)throw Error('Unsafe cell '+i);
 const tile=await sharp(bytes).extract(box).resize(224,224).extend({top:16,bottom:16,left:16,right:16,background:'#0000'}).png().toBuffer();tiles.push({input:tile,left:i%3*256,top:Math.floor(i/3)*256});frames.push({frame:i,box,edge,visible});
}
const output=await sharp({create:{width:768,height:512,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();await writeFile('public/assets/flight-projectiles-v1.png',output);await mkdir('build/art',{recursive:true});
const record=JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,export:'Whole cells preserved, resized224 and extended16; no threshold erasure, masking, recoloring or retouching. Runtime pivots correct source centering.',bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2);
await writeFile('build/art/flight-projectiles-v1.json',record);await writeFile('art/flight-projectiles-v1.json',record);console.log(JSON.stringify({bytes:output.length,frames:frames.length,edge:frames.reduce((n,f)=>n+f.edge,0)}));
