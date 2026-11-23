import bcrypt from 'bcryptjs';
import {connect,demo,id,list,put,initialFixes,teams} from './data.js';
import {pathToFileURL} from 'node:url';
export async function seed(){
 const password=demo?'CampusDemo2026!':process.env.SEED_PASSWORD;
 if(!password||password.length<12)throw Error('Set SEED_PASSWORD to at least 12 characters');
 const hash=await bcrypt.hash(password,10);
 const accounts=[['student','Student',''],['admin','Admin',''],...Array.from(new Set(Object.values(teams))).map((t,i)=>['staff'+(i+1),'Staff',t])];
 for(const [login,role,team] of accounts){
  const email=login+'@campus.test';
  if(!(await list('users',{email})).length)await put('users',{_id:id(),name:login,email,role,team,hash});
 }
 for(const [category,title,body] of initialFixes)if(!(await list('fixes',{title})).length)await put('fixes',{_id:id(),category,title,body});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await connect();await seed();console.log('Demo accounts and help articles ready.');process.exit(0);
}
