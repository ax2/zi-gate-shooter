import sharp from'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';
const source='art/source/flight-impacts-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(meta.width!==1536||meta.height!==1024||!meta.hasAlpha)throw Error('Inspect impact source dimensions/alpha');
const tiles=[],frames=[];
for(let i=0;i<6;i++){
 const box={left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512},raw=await sharp(bytes).extract(box).ensureAlpha().raw().toBuffer();let edge=0,visible=0;const bounds={left:512,top:512,right:0,bottom:0};
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(raw[(y*512+x)*4+3]>16){visible++;bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x);bounds.bottom=Math.max(bounds.bottom,y);if(x<4||y<4||x>507||y>507)edge++;}
 if(!visible||edge)throw Error('Unsafe impact cell '+i);
 const tile=await sharp(bytes).extract(box).resize(224,224).extend({top:16,bottom:16,left:16,right:16,background:'#0000'}).png().toBuffer();tiles.push({input:tile,left:i%3*256,top:Math.floor(i/3)*256});frames.push({frame:i,box,edge,visible,bounds});
}
const output=await sharp({create:{width:768,height:512,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();await writeFile('public/assets/flight-impacts-v1.png',output);await mkdir('build/art',{recursive:true});
const record=JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,export:'Whole original cells resized224 and extended16 transparent pixels; alpha preserved. No threshold erasure, masking, recoloring or retouching. Requested90px margins were not met; measured bounds are recorded.',bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2);await writeFile('art/flight-impacts-v1.json',record);await writeFile('build/art/flight-impacts-v1.json',record);console.log(JSON.stringify({bytes:output.length,frames:frames.length,edge:frames.reduce((n,f)=>n+f.edge,0)}));
