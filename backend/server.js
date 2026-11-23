import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import {connect,demo,teams,id,list,put,update,remove,follow} from './data.js';
import {seed} from './seed.js';
const secret=process.env.JWT_SECRET||(demo&&crypto.randomBytes(48).toString('hex'));
if(!secret||secret.length<32)throw Error('Set JWT_SECRET (32+ characters)');
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const string=(v,max,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(400,'Check required fields and text length');return v.trim();};
const publicUser=({_id,name,email,team,role})=>({_id,name,email,team,role});
const scope=u=>u.role==='Student'?{owner:u._id}:u.role==='Staff'?{team:u.team}:{};
app.get('/api/config',(req,res)=>res.json({teams,demo}));
app.post('/api/auth/:action',async(req,res)=>{
 const {action}=req.params;if(!['login','register'].includes(action))fail(404,'Unknown action');
 const email=string(req.body.email,180).toLowerCase(),password=req.body.password;
 if(!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||!password||Buffer.byteLength(password)>72)fail(400,'Check email and password (maximum 72 bytes)');
 let [u]=await list('users',{email});
 if(action==='register'){
  if(password.length<8)fail(400,'Use at least 8 characters');if(u)fail(409,'Email already registered');
  u={_id:id(),email,name:string(req.body.name,80),role:'Student',team:'',hash:await bcrypt.hash(password,10)};await put('users',u);
 }else if(!u||!await bcrypt.compare(password,u.hash))fail(401,'Invalid login');
 res.json({token:jwt.sign({sub:u._id},secret,{expiresIn:'4h'}),user:publicUser(u)});
});
app.use('/api',async(req,res,next)=>{
 let payload;try{payload=jwt.verify((req.headers.authorization||'').replace(/^Bearer /,''),secret);}catch{fail(401,'Please sign in again');}
 [req.user]=await list('users',{_id:payload.sub});if(!req.user)fail(401,'Unknown account');next();
});
const listeners=new Set();
app.get('/api/events',(req,res)=>{
 res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache'});res.flushHeaders();
 const listener={res,user:req.user};listeners.add(listener);
 const heartbeat=setInterval(()=>res.write(': heartbeat\n\n'),20000);
 const expire=setTimeout(()=>res.end(),240000);
 req.on('close',()=>{listeners.delete(listener);clearInterval(heartbeat);clearTimeout(expire);});
});
app.use('/api',(req,res,next)=>{
 if(req.method!=='GET')res.on('finish',()=>{
  if(res.statusCode>=400)return;
  const shared=/^\/api\/(fixes|incidents)/.test(req.originalUrl);
  for(const listener of listeners){
   const u=listener.user,t=req.ticket;
   if(shared||u.role==='Admin'||u._id===req.user._id||u._id===t?.owner||u.team&&(u.team===t?.team||u.team===req.body?.team||u.team===teams[req.body?.category]))
    listener.res.write('data: refresh\n\n');
  }
 });
 next();
});
app.get('/api/tickets',async(req,res)=>res.json((await list('tickets',scope(req.user))).sort((a,b)=>b.updated.localeCompare(a.updated))));
function ticketFields(body){
 const category=string(body.category,60);if(!Object.hasOwn(teams,category))fail(400,'Unknown category');
 const image=body.image||'';
 if(typeof image!=='string'||image.length>720000||(image&&!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image)))fail(400,'Choose a PNG or JPEG under 500 KB');
 return {title:string(body.title,120),description:string(body.description,2500),category,team:teams[category],asset:string(body.asset||'',100,false),image,urgent:body.urgent===true};
}
app.post('/api/tickets',async(req,res)=>{
 const fields=ticketFields(req.body);const now=new Date().toISOString();
 const row={...fields,_id:id(),owner:req.user._id,status:'Reported',updated:now,revision:0,history:[{at:now,note:'Reported',by:req.user.name}]};
 await put('tickets',row);res.status(201).json(row);
});
app.use('/api/tickets/:key',async(req,res,next)=>{
 [req.ticket]=await list('tickets',{_id:req.params.key,...scope(req.user)});if(!req.ticket)fail(404,'Ticket unavailable');next();
});
app.patch('/api/tickets/:key',async(req,res)=>{
 const t=req.ticket,u=req.user,b=req.body;let fields={},note;
 if(!Number.isInteger(b.revision)||b.revision!==t.revision)fail(409,"Refresh the ticket before updating it");
 if(b.action==='edit'&&t.owner===u._id&&t.status==='Reported'){fields=ticketFields(b);note='Updated report';}
 else if(b.action==='assign'&&u.role==='Admin'&&Object.values(teams).includes(b.team)){fields.team=b.team;note='Assigned to '+b.team;}
 else if(b.action==='start'&&u.role!=='Student'&&t.status==='Reported'){fields.status='In progress';note='Work started';}
 else if(b.action==='resolve'&&u.role!=='Student'&&['Reported','In progress'].includes(t.status)){fields.status='Resolved';note=string(b.note,800);}
 else if(b.action==='confirm'&&u._id===t.owner&&t.status==='Resolved'){fields.status='Closed';note='Fix confirmed';}
 else if(b.action==='reopen'&&u._id===t.owner&&['Closed','Resolved'].includes(t.status)){fields.status='Reported';note=string(b.note,800);}
 else fail(403,'Action unavailable for this role or status');
 const now=new Date().toISOString();const saved=await update('tickets',{_id:t._id,revision:b.revision},{...fields,updated:now,revision:t.revision+1,history:[...t.history,{at:now,by:u.name,note}]});
 if(!saved)fail(409,'Ticket changed. Refresh before trying again');res.json(saved);
});
app.delete('/api/tickets/:key',async(req,res)=>{
 const t=req.ticket;if(t.owner!==req.user._id||t.status!=='Reported')fail(403,'Only your open reports can be deleted');
 if(!await remove('tickets',{_id:t._id,revision:t.revision}))fail(409,'Refresh the ticket');res.sendStatus(204);
});
app.get('/api/fixes',async(req,res)=>res.json(await list('fixes')));
app.post('/api/fixes',async(req,res)=>{
 if(req.user.role==='Student')fail(403,'Staff only');
 const category=string(req.body.category,60);if(!Object.hasOwn(teams,category))fail(400,'Unknown category');
 const row={_id:id(),category,title:string(req.body.title,120),body:string(req.body.body,1500)};await put('fixes',row);res.status(201).json(row);
});
app.get('/api/incidents',async(req,res)=>res.json((await list('incidents')).map(({followers,...r})=>({...r,count:followers.length,following:followers.includes(req.user._id)}))));
app.post('/api/incidents',async(req,res)=>{
 if(req.user.role==='Student')fail(403,'Staff only');
 await put('incidents',{_id:id(),title:string(req.body.title,120),body:string(req.body.body,800),team:req.user.team||'Helpdesk coordinator',active:true,followers:[]});res.sendStatus(204);
});
app.patch('/api/incidents/:key',async(req,res)=>{
 if(req.body.action==='follow'){if(!await follow(req.params.key,req.user._id))fail(404,'Incident unavailable');}
 else if(req.body.action==='close'&&req.user.role!=='Student'){
 const q={_id:req.params.key,...(req.user.role==='Staff'?{team:req.user.team}:{})};if(!await update('incidents',q,{active:false}))fail(404,'Incident unavailable');
 }else fail(403,'Action unavailable');res.sendStatus(204);
});
app.use('/api',(req,res)=>res.status(404).json({error:'Unknown endpoint'}));
app.use(express.static(path.resolve('dist')));
app.use((err,req,res,next)=>{const status=err.code===11000?409:err.status||500;res.status(status).json({error:status===500?'Server error':err.code===11000?'Already exists':err.message});});
await connect();if(demo)await seed();
app.listen(process.env.PORT||3000,demo?'127.0.0.1':'0.0.0.0',()=>console.log('Campus Helpdesk ready on port '+(process.env.PORT||3000)));
