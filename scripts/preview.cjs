const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=fs.realpathSync(path.resolve(__dirname,'..'));
const prefix='/SHADOWGRAPH/';
const port=Number(process.env.SHADOWGRAPH_PREVIEW_PORT||8653);
const types={
  '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon',
  '.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2',
  '.wasm':'application/wasm','.vtt':'text/vtt; charset=utf-8'
};
function handle(request,response){
  let relative;
  try{
    const url=new URL(request.url,'http://localhost');
    if(!url.pathname.startsWith(prefix))throw Error();
    relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  }catch{
    response.writeHead(404).end();return;
  }
  if(!['GET','HEAD'].includes(request.method)){
    response.writeHead(405,{Allow:'GET, HEAD'}).end();return;
  }
  if(relative.split(/[\\/]/).some(part=>part.startsWith('.'))){
    response.writeHead(404).end();return;
  }
  try{
    const canonical=fs.realpathSync(path.resolve(root,relative));
    if(!canonical.startsWith(root+path.sep)||path.relative(root,canonical).split(path.sep).some(part=>part.startsWith('.')))throw Error();
    const stat=fs.statSync(canonical);
    if(!stat.isFile())throw Error();
    const headers={
      'Content-Type':types[path.extname(canonical).toLowerCase()]||'application/octet-stream',
      'Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
    };
    response.writeHead(200,headers);
    if(request.method==='HEAD'){response.end();return}
    const stream=fs.createReadStream(canonical);
    stream.on('error',()=>response.destroy());
    response.on('close',()=>stream.destroy());
    stream.pipe(response);
  }catch{
    response.writeHead(404).end();
  }
}
http.createServer(handle).listen(port,'127.0.0.1',()=>console.log('SHADOWGRAPH · http://127.0.0.1:'+port+prefix));
