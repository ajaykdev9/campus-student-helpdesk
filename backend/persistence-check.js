import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {connect,id,list,put,remove} from './data.js';
if(process.env.DEMO_MODE==='1')throw Error('Requires a real test database');
await connect();
const key=id();
try{
 await put('tickets',{_id:key,title:'Persistence probe',revision:0});
 await mongoose.disconnect();await connect();
 assert.equal((await list('tickets',{_id:key}))[0]?.title,'Persistence probe');
 console.log('MongoDB reconnect and read passed.');
}finally{await remove('tickets',{_id:key});await mongoose.disconnect();}
