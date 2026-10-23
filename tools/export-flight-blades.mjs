import sharp from'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';
const source='art/source/flight-blades-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();if(meta.width!==2172||meta.height!==724||!meta.hasAlpha)throw Error('Reinspect blade atlas dimensions/alpha');
const frames=[],tiles=[];
for(let i=0;i<3;i++){const cell={left:i*724,top:0,width:724,height:724},{data}=await sharp(bytes).extract(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=724,y0=724,x1=0,y1=0,visible=0,edge=0;
 for(let y=0;y<724;y++)for(let x=0;x<724;x++){const alpha=data[(y*724+x)*4+3];if(alpha){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(alpha>16){visible++;if(x<3||y<3||x>=721||y>=721)edge++;}}
 if(!visible||edge)throw Error(`Unsafe blade cell${i}: ${edge} foreground edge pixels`);
 const trim={left:Math.max(0,x0-8),top:Math.max(0,y0-8),width:Math.min(724,x1+9)-Math.max(0,x0-8),height:Math.min(724,y1+9)-Math.max(0,y0-8)};
 const tile=await sharp(bytes).extract({left:cell.left+trim.left,top:trim.top,width:trim.width,height:trim.height}).resize(224,224,{fit:'contain',background:'#0000'}).png().toBuffer();tiles.push({input:tile,left:i*256+16,top:16});frames.push({frame:i,cell,trim,visible,edge});
}
const output=await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();await writeFile('public/assets/flight-blades-v1.png',output);await mkdir('build/art',{recursive:true});await writeFile('build/art/flight-blades-v1.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2));console.log(`Blade atlas ${output.length} bytes; transparent-only trim and three safe cells.`);
