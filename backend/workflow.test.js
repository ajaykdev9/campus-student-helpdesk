import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
test('student, staff and coordinator workflows',async t=>{
 const port=32191,server=spawn(process.execPath,['demo.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
 t.after(()=>server.kill());await once(server.stdout,'data');
 async function api(route,method='GET',body,token){
 const r=await fetch('http://127.0.0.1:'+port+'/api/'+route,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(token||'')},body:body?JSON.stringify(body):undefined});
 return {status:r.status,data:r.status===204?null:await r.json()};
 }
 const auth=async name=>(await api('auth/login','POST',{email:name+'@campus.test',password:'CampusDemo2026!'})).data.token;
 const student=await auth('student'),admin=await auth('admin'),cloud=await auth('staff1');
 const other=(await api('auth/register','POST',{name:'Second',email:'other@example.test',password:'Second123!',role:'Admin'})).data;
 assert.equal(other.user.role,'Student');assert.equal((await api('tickets')).status,401);
 const report={title:'EBS attachment',category:'Cloud labs',description:'Volume missing',asset:'Lab 2'};
 const ticket=(await api('tickets','POST',report,student)).data,route='tickets/'+ticket._id;
 assert.equal(ticket.team,'Cloud lab faculty');assert.equal((await api('tickets','GET',null,other.token)).data.length,0);
 assert.equal((await api(route,'DELETE',null,other.token)).status,404);
 let rev=0;async function change(action,token,extra={}){const r=await api(route,'PATCH',{action,revision:rev,...extra},token);assert.equal(r.status,200);rev++;return r.data;}
 await change('edit',student,{...report,title:'Volume issue'});await change('start',cloud);
 assert.equal((await api(route,'PATCH',{action:'resolve',revision:0,note:'Old'},cloud)).status,409);
 await change('resolve',cloud,{note:'Checked zone'});await change('confirm',student);await change('reopen',student,{note:'Still missing'});
 await change('assign',admin,{team:'IT support'});assert.equal((await api('tickets','GET',null,cloud)).data.length,0);
 assert.equal((await api(route,'DELETE',null,student)).status,204);
 assert.equal((await api('fixes','GET',null,student)).data.length,4);
 assert.equal((await api('fixes','POST',{category:'Cloud labs',title:'Example',body:'Verified steps'},cloud)).status,201);
 assert.equal((await api('incidents','POST',{title:'Lab outage',body:'Investigating'},cloud)).status,204);
 const incident=(await api('incidents','GET',null,student)).data[0],key='incidents/'+incident._id;
 for(let i=0;i<2;i++)assert.equal((await api(key,'PATCH',{action:'follow'},student)).status,204);
 assert.equal((await api('incidents','GET',null,student)).data[0].count,1);
 assert.equal((await api(key,'PATCH',{action:'close'},cloud)).status,204);
});
