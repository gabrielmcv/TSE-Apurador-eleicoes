import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from './election-context';
import {getStorage} from '../db';
import catalog from './municipal-catalog.json';
import {municipalEndpoint,normalizeMunicipal,municipalLeader,type Municipality} from './municipal';
const GATE='municipal-pump-gate';
const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
export async function collectMunicipal(job:Municipality&{ibge:string;source:string}){
 const {db,bucket}=getStorage();const started=Date.now();let http=0,logId:number|undefined,delay=60000,error:string|null=null;
 try{
 const last=await db.prepare('SELECT * FROM municipal_snapshots WHERE ibge=? ORDER BY generation_ms DESC,id DESC LIMIT 1').bind(job.ibge).first<any>();
 if(last){const result=JSON.parse(last.normalized);if(result.totalSections>0&&result.sections>=result.totalSections){delay=31536000000;return {ibge:job.ibge,http:304,error:null};}}
 const headers:Record<string,string>={Accept:'application/json'};if(last?.etag)headers['If-None-Match']=last.etag;else if(last?.modified)headers['If-Modified-Since']=last.modified;
 const log=await db.prepare('INSERT INTO collection_logs(source,uf,cargo,started,state,request_headers) VALUES (?,?,?,?,?,?) RETURNING id').bind(job.source,job.uf,'municipal',new Date(started).toISOString(),'consultando',JSON.stringify(headers)).first<{id:number}>();if(!log)throw Error('Não foi possível registrar a consulta municipal.');logId=log.id;
 const response=await fetch(job.source,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});http=response.status;const received=new Date().toISOString(),responseHeaders=JSON.stringify(Object.fromEntries(response.headers.entries()));
 if(http===304){if(!last)throw Error('Resposta 304 sem versão municipal arquivada.');await db.prepare('UPDATE collection_logs SET state=?,http=?,received=?,finished=?,latency=?,idg=?,response_headers=? WHERE id=?').bind('municipio_sem_alteracao',http,received,received,Date.now()-started,last.idg,responseHeaders,logId).run();}
 else{
 const bytes=await response.arrayBuffer(),hash=await sha(bytes),key=`municipios/ele2026/${job.uf}/${job.municipio}/${hash}.bin`;
 await bucket.put(key,bytes,{httpMetadata:{contentType:response.headers.get('content-type')??'application/octet-stream'},customMetadata:{sha256:hash}});
 await db.prepare('UPDATE collection_logs SET state=?,http=?,received=?,hash=?,object_key=?,size=?,response_headers=? WHERE id=?').bind('resposta_arquivada',http,received,hash,key,bytes.byteLength,responseHeaders,logId).run();
 if(!response.ok){delay=http===403||http===429?610000:http===404?300000:60000;throw Error(`TSE respondeu HTTP ${http} para ${job.name}.`);}
 const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));const result=normalizeMunicipal(raw,job,electionContext()),saved=new Date().toISOString();
 await db.prepare('INSERT INTO municipal_snapshots(ibge,uf,municipio,source,idg,generation_ms,generated,received,saved,hash,object_key,normalized,etag,modified,log_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(ibge,idg,hash) DO NOTHING').bind(job.ibge,job.uf,job.municipio,job.source,result.id,result.generationTime,result.generated,received,saved,hash,key,JSON.stringify(result),response.headers.get('etag'),response.headers.get('last-modified'),logId).run();
 const current=await db.prepare('SELECT * FROM municipal_snapshots WHERE ibge=? ORDER BY generation_ms DESC,id DESC LIMIT 1').bind(job.ibge).first<any>();if(!current)throw Error('Versão municipal não confirmada.');
 const selected=JSON.parse(current.normalized),leadership=municipalLeader(selected),winner=selected.candidates.find((c:any)=>c.id===leadership.leaderId);const summary={...leadership,leaderCandidate:winner?{id:winner.id,name:winner.name,number:winner.number,party:winner.party}:null,validVotes:selected.valid,progress:selected.progress,generated:current.generated,received:current.received,snapshotId:current.id,hash:current.hash};
 await db.prepare('UPDATE municipal_jobs SET snapshot_id=?,summary=? WHERE ibge=?').bind(current.id,JSON.stringify(summary),job.ibge).run();
 await db.prepare('UPDATE collection_logs SET state=?,finished=?,latency=?,idg=?,generated=?,totalization=? WHERE id=?').bind(last&&result.generationTime<last.generation_ms?'municipio_geracao_anterior':'municipio_versao_arquivada',saved,Date.now()-started,result.id,result.generated,result.totalization,logId).run();
 }
 }catch(reason){error=reason instanceof Error?reason.message:String(reason);if(logId)await db.prepare('UPDATE collection_logs SET state=?,http=?,error=?,finished=?,latency=? WHERE id=?').bind(http>=400?'erro_http':'erro_coleta',http,error,new Date().toISOString(),Date.now()-started,logId).run();}
 finally{await db.prepare('UPDATE municipal_jobs SET lease_until=0,next_ms=?,checked=?,http=?,error=? WHERE ibge=?').bind(Date.now()+delay,new Date().toISOString(),http,error,job.ibge).run();}
 return {ibge:job.ibge,http,error};
}
export async function pumpMunicipal(){
 if(collectionClosed()||(electionContext().round===2&&!electionContext().configured))return {closed:true,election:electionInfo(),nextPoll:0};
 const {db}=getStorage();const now=Date.now(),lease=crypto.randomUUID();
 await db.prepare('INSERT INTO source_state(source,next_ms,lease_until) VALUES (?,0,0) ON CONFLICT(source) DO NOTHING').bind(GATE).run();
 const gate=await db.prepare('UPDATE source_state SET lease=?,lease_until=? WHERE source=? AND next_ms<=? AND lease_until<=? RETURNING source').bind(lease,now+90000,GATE,now,now).first();if(!gate)return {busy:true,nextPoll:3000};
 let pause=3000;
 try{
 // Seed a bounded round-robin batch. State and national collectors keep their
 // own gates and budgets; municipal collection never delays those requests.
 const count=await db.prepare('SELECT count(*) n FROM municipal_jobs').first<{n:number}>();const offset=count?.n??0;
 if(offset<catalog.length){const rows=catalog.slice(offset,offset+150) as Municipality[];await db.batch(rows.map((m,index)=>db.prepare('INSERT INTO municipal_jobs(ibge,uf,municipio,name,source,ordinal) VALUES (?,?,?,?,?,?) ON CONFLICT(ibge) DO NOTHING').bind(m.ibge,m.uf,m.municipio,m.name,municipalEndpoint(m,electionContext().president),offset+index)));}
 const jobs=await db.prepare('UPDATE municipal_jobs SET lease_until=? WHERE ibge IN (SELECT ibge FROM municipal_jobs WHERE next_ms<=? AND lease_until<=? ORDER BY next_ms,ordinal LIMIT 24) RETURNING *').bind(now+60000,now,now).all<any>();
 const records=[];let done=0;try{for(let offset=0;offset<jobs.results.length&&Date.now()-now<10000;offset+=4){const batch=jobs.results.slice(offset,offset+4);records.push(...await Promise.all(batch.map(collectMunicipal)));done=offset+batch.length;}}finally{const unprocessed=jobs.results.slice(done);if(unprocessed.length)await db.batch(unprocessed.map(job=>db.prepare('UPDATE municipal_jobs SET lease_until=0 WHERE ibge=?').bind(job.ibge)));}if(records.some(r=>r.http===403||r.http===429))pause=610000;
 return {processed:records.length,nextPoll:pause};
 }finally{await db.prepare('UPDATE source_state SET lease=NULL,lease_until=0,next_ms=? WHERE source=? AND lease=?').bind(Date.now()+pause,GATE,lease).run();}
}
