import mongoose from 'mongoose';
import crypto from 'node:crypto';
export const teams = {
  'Cloud labs':'Cloud lab faculty', 'IT & Wi-Fi':'IT support', Academics:'Department coordinator',
  Attendance:'Department coordinator', Exams:'Exam cell', Fees:'Accounts', Documents:'Student services',
  Hostel:'Hostel office', Maintenance:'Facilities', Library:'Library desk', Transport:'Transport office',
  'Other / Not sure':'Helpdesk coordinator'
};
export const initialFixes = [
  ['Cloud labs','AWS EC2 connection timeout','Check that the instance is running. Record the connection method and exact error for the lab assistant. Follow the network settings specified in your lab sheet.'],
  ['Cloud labs','AWS EBS volume attach','Compare the Availability Zone of the instance and volume. Check the volume state and the selected instance ID before requesting help.'],
  ['Cloud labs','Google Cloud API permission denied','Check the active account and project against your lab instructions. If the assigned lab account lacks permission, ask the instructor to verify the lab role.'],
  ['Cloud labs','Cloud lab account login','Check the account shown in the console against your assigned lab credentials. Open the lab sign-in link in a separate browser profile if a personal account is selected.']
];
const schema = fields => new mongoose.Schema({_id:String,...fields},{versionKey:false});
const models = {
 users:mongoose.model('User',schema({name:String,email:{type:String,unique:true},hash:String,role:String,team:String})),
 tickets:mongoose.model('Ticket',schema({owner:String,title:String,description:String,category:String,team:String,asset:String,image:String,status:String,urgent:Boolean,revision:Number,history:Array,updated:String})),
 fixes:mongoose.model('Fix',schema({category:String,title:String,body:String})),
 incidents:mongoose.model('Incident',schema({title:String,body:String,team:String,active:Boolean,followers:[String]}))
};
const memory = Object.fromEntries(Object.keys(models).map(k=>[k,new Map()]));
export const demo = process.env.DEMO_MODE==='1';
export async function connect(){
 if(!demo){await mongoose.connect(process.env.MONGODB_URI);await Promise.all(Object.values(models).map(m=>m.init()));}
}
export const id = ()=>crypto.randomUUID();
function matches(row,query){return Object.entries(query).every(([k,v])=>row[k]===v);}
export async function list(k,q={}){
 if(!demo)return models[k].find(q).lean();
 return [...memory[k].values()].filter(r=>matches(r,q)).map(r=>structuredClone(r));
}
export async function put(k,row){
 if(!demo)return models[k].create(row);
 if(memory[k].has(row._id)||(k==='users'&&[...memory.users.values()].some(u=>u.email===row.email)))throw Object.assign(new Error('Already exists'),{code:11000});
 memory[k].set(row._id,structuredClone(row));return row;
}
export async function update(k,q,fields){
 if(!demo)return models[k].findOneAndUpdate(q,{$set:fields},{new:true}).lean();
 const row=[...memory[k].values()].find(r=>matches(r,q));
 if(row)Object.assign(row,structuredClone(fields));return row;
}
export async function follow(key,user){
 if(!demo)return models.incidents.findOneAndUpdate({_id:key,active:true},{$addToSet:{followers:user}},{new:true});
 const row=memory.incidents.get(key);if(!row?.active)return null;
 if(!row.followers.includes(user))row.followers.push(user);return row;
}
export async function remove(k,q){
 if(!demo)return (await models[k].deleteOne(q)).deletedCount;
 const row=[...memory[k].values()].find(r=>matches(r,q));return row&&memory[k].delete(row._id);
}
