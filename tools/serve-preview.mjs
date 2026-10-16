import http from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,sep,extname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
if(!existsSync(resolve(root,'index.html'))){console.error('尚无可玩构建，请先运行 npm run build，再运行 npm run play。');process.exit(1);}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-cache','Content-Length':info.size});
  if(req.method==='HEAD')res.end();else createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end();}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'5178端口已被占用。请先查看现有预览，或关闭旧预览后重新启动。':error.message);process.exitCode=1;});
server.listen(5178,'127.0.0.1',()=>console.log('火力突围固定入口：http://127.0.0.1:5178/\n保持此窗口运行；按 Ctrl+C 停止。'));
