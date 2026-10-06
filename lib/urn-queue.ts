import {electionContext} from './election-context';
import {urnRetry,urnClaimQuery,urnRetryClaimQuery} from './urn-retry';
import {getStorage} from '../db';
import {UFS} from './tse';
import {CONFIG,paths,sectionUrl,filesFromAux,digits} from './urn-paths';
import {capture} from './urn-capture';
async function enqueue(key:string,kind:string,uf:string,source:string|null,payload:unknown){const {db}=getStorage();return db.prepare('INSERT INTO urn_jobs(job_key,kind,uf,source,payload,updated) VALUES (?,?,?,?,?,?) ON CONFLICT(job_key) DO NOTHING').bind(key,kind,uf,source,JSON.stringify(payload),new Date().toISOString()).run();}
export async function seed(){await enqueue(`config-2026-${electionContext().round}`,'config','BR',CONFIG,{});}
export async function tick(retryTurn=false){
 const {db,bucket}=getStorage();
 const job=await db.prepare(retryTurn?urnRetryClaimQuery:urnClaimQuery).bind(Date.now()+60000,new Date().toISOString(),Date.now(),Date.now()).first<any>();
 if(!job)return {processed:false};
 let payload=JSON.parse(job.payload),reschedule=0,capturedLogId:number|undefined;
 try{
 if(job.kind==='import'){
 const obj=await bucket.get(payload.key);if(!obj)throw Error('Índice arquivado não encontrado.');const raw=JSON.parse(await obj.text());let i=0;const selected:any[]=[];const offset=Number(payload.offset??0);let hasMore=false;
 outer:for(const a of raw.abr??[]){if(String(a.cd).toUpperCase()!==job.uf)continue;for(const m of a.mu??[])for(const z of m.zon??[])for(const s of z.sec??[]){if(i++<offset)continue;if(selected.length===200){hasMore=true;break outer;}selected.push({m,z,s});}}
 const statements=[];
 for(const {m,z,s} of selected){const municipal=digits(m.cd,5),zona=digits(z.cd,4),secao=digits(s.ns,4);statements.push(db.prepare('INSERT INTO urn_sections(pleito,uf,municipio,municipio_name,zona,secao,principal,aux_generated,metadata) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(pleito,uf,municipio,zona,secao) DO UPDATE SET municipio_name=excluded.municipio_name,principal=excluded.principal,aux_generated=excluded.aux_generated,metadata=excluded.metadata').bind(payload.pleito,job.uf,municipal,String(m.nm),zona,secao,s.nsp?digits(s.nsp,4):null,s.da&&s.ha?`${s.da} ${s.ha}`:null,JSON.stringify(s)));
 if(!s.nsp&&s.da&&s.ha){const source=sectionUrl(payload,municipal,zona,secao),key=`aux:${source}:${s.da}:${s.ha}`;statements.push(db.prepare('INSERT INTO urn_jobs(job_key,kind,uf,source,payload,updated) VALUES (?,?,?,?,?,?) ON CONFLICT(job_key) DO NOTHING').bind(key,'aux',job.uf,source,JSON.stringify({...payload,m:municipal,z:zona,s:secao}),new Date().toISOString()));}}
 if(statements.length)await db.batch(statements);
 payload.offset=offset+selected.length;if(hasMore)reschedule=1;
 }else{
 const fileMetadata=job.kind==='file'?await db.prepare('SELECT * FROM urn_files WHERE id=?').bind(payload.fileId).first<any>():null;
 const archivePath=fileMetadata?`urnas/${fileMetadata.pleito}/${fileMetadata.uf}/${fileMetadata.municipio}/${fileMetadata.zona}/${fileMetadata.secao}/${fileMetadata.tse_hash}`:undefined;
 const response=await capture(job.source,job.uf,archivePath,fileMetadata?.filename);capturedLogId=response.logId;
 if(job.kind==='file'){
 await db.prepare("UPDATE urn_files SET state='saved',object_key=?,sha256=?,size=?,received=?,saved=?,log_id=? WHERE id=?").bind(response.key,response.hash,response.size,response.received,new Date().toISOString(),response.logId,payload.fileId).run();
 await db.prepare("UPDATE collection_logs SET state='arquivo_urna_salvo' WHERE id=?").bind(response.logId).run();
 }else{
 const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(response.bytes));
 if(job.kind==='config'){
 for(const uf of [...UFS,'ZZ']){const p=paths(raw,uf);await enqueue(`index:${p.index}`,'index',uf,p.index,p);}reschedule=electionContext().round===2&&!electionContext().discoveryClosed?300000:0;
 }else if(job.kind==='index'){
 if(raw.f!=='o'||String(raw.cdp)!==payload.pleito||!Array.isArray(raw.abr)||!raw.abr.some((a:any)=>String(a.cd).toUpperCase()===job.uf))throw Error('EA16 não corresponde ao pleito e abrangência.');
 await enqueue(`import:${job.uf}:${response.hash}`,'import',job.uf,null,{...payload,key:response.key,offset:0});reschedule=electionContext().round===2&&!electionContext().discoveryClosed?60000:0;
 }else if(job.kind==='aux'){
 for(const f of filesFromAux(raw,payload,payload.m,payload.z,payload.s)){
 await db.prepare('INSERT INTO urn_files(pleito,uf,municipio,zona,secao,tse_hash,filename,type,tse_received,tse_status,source) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(pleito,uf,municipio,zona,secao,tse_hash,filename) DO UPDATE SET tse_received=excluded.tse_received,tse_status=excluded.tse_status').bind(payload.pleito,job.uf,payload.m,payload.z,payload.s,f.hash,f.filename,f.type,f.tseReceived,f.tseStatus,f.source).run();
 const file=await db.prepare('SELECT id FROM urn_files WHERE source=?').bind(f.source).first<{id:number}>();if(!file)throw Error('Falha ao registrar arquivo da urna.');await enqueue(`file:${f.source}`,'file',job.uf,f.source,{fileId:file.id});}
 }
 }
 }
 await db.prepare('UPDATE urn_jobs SET state=?,lease_until=0,next_ms=?,payload=?,error=NULL,updated=? WHERE id=?').bind(reschedule?'pending':'done',Date.now()+reschedule,JSON.stringify(payload),new Date().toISOString(),job.id).run();return {processed:true,kind:job.kind,id:job.id};
 }catch(err){if(capturedLogId)await db.prepare('UPDATE collection_logs SET state=?,error=? WHERE id=?').bind('nao_publicado',err instanceof Error?err.message:String(err),capturedLogId).run();const http=(err as any)?.http,{delay,pauseMs}=urnRetry(http,job.attempts);await db.prepare("UPDATE urn_jobs SET state='retry',lease_until=0,next_ms=?,error=?,updated=? WHERE id=?").bind(Date.now()+delay,err instanceof Error?err.message:String(err),new Date().toISOString(),job.id).run();return {processed:true,id:job.id,pauseMs,error:err instanceof Error?err.message:String(err)};}
}
