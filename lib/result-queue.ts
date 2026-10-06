import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from './election-context';
import {getStorage} from '../db';
import {collect} from './archive';
import {resultScopes} from './result-scopes';
const GATE='result-pump-gate';
export async function seedResults(){const {db}=getStorage();const scopes=resultScopes();
 const statements=scopes.map(s=>db.prepare('INSERT INTO result_jobs(source,uf,cargo,next_ms,lease_until) VALUES (?,?,?,0,0) ON CONFLICT(source) DO NOTHING').bind(s.source,s.uf,s.cargo));
 for(let i=0;i<statements.length;i+=50)await db.batch(statements.slice(i,i+50));
}
export async function pumpResults(){
 if(collectionClosed()||(electionContext().round===2&&!electionContext().configured))return {closed:true,election:electionInfo(),nextPoll:0};
 const {db}=getStorage();const now=Date.now(),lease=crypto.randomUUID();
 await db.prepare('INSERT INTO source_state(source,next_ms,lease_until) VALUES (?,0,0) ON CONFLICT(source) DO NOTHING').bind(GATE).run();
 const gate=await db.prepare('UPDATE source_state SET lease=?,lease_until=? WHERE source=? AND next_ms<=? AND lease_until<=? RETURNING source').bind(lease,now+90000,GATE,now,now).first();
 if(!gate){const state=await db.prepare('SELECT next_ms FROM source_state WHERE source=?').bind(GATE).first<any>();return {busy:true,nextPoll:Math.max(2000,(state?.next_ms??0)-now)};}
 let pause=2000;
 try{
 const seeded=await db.prepare('SELECT count(*) AS n FROM result_jobs').first<{n:number}>();if((seeded?.n??0)<resultScopes().length)await seedResults();
 const jobs=await db.prepare('UPDATE result_jobs SET lease_until=? WHERE source IN (SELECT source FROM result_jobs WHERE next_ms<=? AND lease_until<=? ORDER BY next_ms,source LIMIT 8) RETURNING source,uf,cargo').bind(now+90000,now,now).all<{source:string;uf:string;cargo:string}>();
 const records=await Promise.all(jobs.results.map(async job=>{
 let error:string|null=null,http:number|null=null,next=5000,snapshot:number|null=null;
 try{const data=await collect(job.uf,job.cargo);error=data.error;http=data.http??null;next=data.nextPoll;snapshot=data.archive?.id??null;}catch(e){error=e instanceof Error?e.message:'Falha na coleta';}
 const checked=new Date().toISOString();await db.prepare('UPDATE result_jobs SET lease_until=0,next_ms=?,checked=?,http=?,error=?,snapshot_id=? WHERE source=?').bind(Date.now()+next,checked,http,error,snapshot,job.source).run();
 return {uf:job.uf,cargo:job.cargo,error,http,snapshot};
 }));
 if(records.some(r=>r.http===403||r.http===429))pause=610000;
 return {records,nextPoll:pause};
 }finally{await db.prepare('UPDATE source_state SET lease=NULL,lease_until=0,next_ms=? WHERE source=? AND lease=?').bind(Date.now()+pause,GATE,lease).run();}
}
