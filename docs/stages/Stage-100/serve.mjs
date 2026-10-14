import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, sep, extname } from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'});
  if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end();}
}).listen(5190,'127.0.0.1',()=>console.log('火力突围：http://127.0.0.1:5190/ ；按 Ctrl+C 停止'));
