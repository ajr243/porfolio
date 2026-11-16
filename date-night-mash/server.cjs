// No dependencies. Run: node date-night-mash/server.cjs
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {generate}=require('./ideas.js');
const allowed={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/ideas.js':'ideas.js','/app.js':'app.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/generate'&&req.method==='POST'){
    res.setHeader('Content-Type','application/json');
    try{let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)throw new Error('Request too large.');}const input=JSON.parse(body);if(!Array.isArray(input.selected)||input.selected.some(id=>typeof id!=='string'))throw new Error('Select valid options.');const plan=generate(input.budget,input.setting,input.selected);res.end(JSON.stringify(plan));}catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message}));}return;
  }
  if(req.method!=='GET'||!allowed[url.pathname]){res.writeHead(404);res.end('Not found');return;}
  const file=path.join(__dirname,allowed[url.pathname]);res.setHeader('Content-Type',types[path.extname(file)]);fs.createReadStream(file).pipe(res);
}).listen(8787,'127.0.0.1',()=>console.log('Date Night MASH: http://localhost:8787'));
