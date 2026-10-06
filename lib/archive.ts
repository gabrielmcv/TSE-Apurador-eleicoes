import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from './election-context';
import {recordAudit} from './audit';
import {getStorage} from '../db';
import {endpoint,normalize} from './tse';
export async function latest(uf:string,cargo:string){const {db}=getStorage();return db.prepare('SELECT * FROM snapshots WHERE uf=? AND cargo=? ORDER BY generation_ms DESC,id DESC LIMIT 1').bind(uf,cargo).first<any>();}
export async function collect(uf:string,cargo:string){
 const source=endpoint(uf,cargo,electionContext());const {db,bucket}=getStorage();
 const now=Date.now(),lease=crypto.randomUUID();
 if(!collectionClosed())await db.prepare('INSERT INTO source_state(source,next_ms,lease_until) VALUES (?,0,0) ON CONFLICT(source) DO NOTHING').bind(source).run();
 const previous=await latest(uf,cargo);const totalized=previous?JSON.parse(previous.normalized):null;const complete=!!totalized&&totalized.totalSections>0&&totalized.sections>=totalized.totalSections;
 const acquired=collectionClosed()||complete||(electionContext().round===2&&!electionContext().configured)?null:await db.prepare('UPDATE source_state SET lease=?,lease_until=? WHERE source=? AND next_ms<=? AND lease_until<=? RETURNING source').bind(lease,now+45000,source,now,now).first();
 if(acquired){
 const start=Date.now();let status=0,error:string|null=null,delay=2000,logId:number|undefined;
 try{
 const last=await latest(uf,cargo);const headers:Record<string,string>={Accept:'application/json'};
 if(last?.etag)headers['If-None-Match']=last.etag;else if(last?.modified)headers['If-Modified-Since']=last.modified;
 const log=await db.prepare('INSERT INTO collection_logs(source,uf,cargo,started,state,request_headers) VALUES (?,?,?,?,?,?) RETURNING id').bind(source,uf,cargo,new Date(start).toISOString(),'consultando',JSON.stringify(headers)).first<{id:number}>();
 if(!log)throw Error('Não foi possível iniciar o registro da coleta.');logId=log.id;
 const response=await fetch(source,{headers,cache:'no-store',signal:AbortSignal.timeout(20000)});status=response.status;
 const responseHeaders=JSON.stringify(Object.fromEntries(response.headers.entries()));
 if(status===304){
 await db.prepare('UPDATE collection_logs SET state=?,http=?,received=?,finished=?,latency=?,snapshot_id=?,idg=?,response_headers=? WHERE id=?').bind('sem_alteracao',status,new Date().toISOString(),new Date().toISOString(),Date.now()-start,last?.id??null,last?.idg??null,responseHeaders,logId).run();
 }else{
 const bytes=await response.arrayBuffer();const received=new Date().toISOString();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 const objectKey=`responses/ele2026/${uf}/${cargo}/${hash}.bin`;
 // Archive before parsing: unknown fields, unsupported JSON and HTTP error bodies survive.
 await bucket.put(objectKey,bytes,{httpMetadata:{contentType:response.headers.get('content-type')??'application/octet-stream'},customMetadata:{sha256:hash}});
 await db.prepare('UPDATE collection_logs SET state=?,http=?,received=?,size=?,hash=?,object_key=?,response_headers=? WHERE id=?').bind('resposta_arquivada',status,received,bytes.byteLength,hash,objectKey,responseHeaders,logId).run();
 if(!response.ok){delay=status===403||status===429?610000:status===404?60000:15000;throw Error(status===404?'Arquivo indisponível no TSE. Nova consulta em 60 segundos.':`TSE respondeu HTTP ${status}. Consultas temporariamente pausadas.`);}
 const rawText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const raw=JSON.parse(rawText);
 await db.prepare('UPDATE collection_logs SET idg=?,generated=?,totalization=? WHERE id=?').bind(raw.idg==null?null:String(raw.idg),raw.dg&&raw.hg?`${raw.dg} ${raw.hg}`:null,raw.dt&&raw.ht?`${raw.dt} ${raw.ht}`:null,logId).run();
 const result=normalize(raw,cargo,uf,electionContext());
 let duplicate=await db.prepare('SELECT id FROM snapshots WHERE source=? AND idg=? AND hash=?').bind(source,result.id,hash).first<{id:number}>();
 const isDuplicate=!!duplicate;
 if(!duplicate){
 const saved=new Date().toISOString();
 await db.prepare('INSERT INTO snapshots(source,uf,cargo,idg,generation_ms,generated,totalization,received,saved,hash,object_key,normalized,etag,modified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source,idg,hash) DO NOTHING').bind(source,uf,cargo,result.id,result.generationTime,result.generated,result.totalization,received,saved,hash,objectKey,JSON.stringify(result),response.headers.get('etag'),response.headers.get('last-modified')).run();
 duplicate=await db.prepare('SELECT id FROM snapshots WHERE source=? AND idg=? AND hash=?').bind(source,result.id,hash).first<{id:number}>();
 }
 if(!duplicate)throw Error('Resposta arquivada, mas a gravação da versão não foi confirmada.');
 await recordAudit(db,last,uf,cargo,result,hash,duplicate.id,logId,received);
 await db.prepare('UPDATE collection_logs SET state=?,snapshot_id=?,finished=?,latency=? WHERE id=?').bind(isDuplicate?'versao_repetida':'versao_inserida',duplicate.id,new Date().toISOString(),Date.now()-start,logId).run();
 }
 }catch(err){const originalError=err instanceof Error?err.message:'Falha na coleta.';const timeout=err instanceof Error&&(err.name==='TimeoutError'||/timeout|timed out/i.test(err.message));error=timeout?'A consulta ao TSE excedeu o tempo de espera. Nova tentativa automática em 5 segundos.':originalError;if(delay===2000)delay=timeout?5000:15000;
 if(logId){try{await db.prepare('UPDATE collection_logs SET state=?,error=?,finished=?,latency=? WHERE id=?').bind(status>=400?'erro_http':status===200?'nao_publicado':'erro_coleta',originalError,new Date().toISOString(),Date.now()-start,logId).run();}catch(logError){console.error('Falha ao salvar log',logError);}}
 }
 await db.prepare('UPDATE source_state SET next_ms=?,lease=NULL,lease_until=0,error=?,checked=?,http=?,latency=? WHERE source=? AND lease=?').bind(Date.now()+delay,error,new Date().toISOString(),status,Date.now()-start,source,lease).run();
 }
 const state=await db.prepare('SELECT * FROM source_state WHERE source=?').bind(source).first<any>();const last=await latest(uf,cargo);
 const timing=await db.prepare('SELECT started FROM collection_logs WHERE uf=? AND cargo=? ORDER BY id DESC LIMIT 2').bind(uf,cargo).all<{started:string}>();
 const observedMs=timing.results.length===2?Date.parse(timing.results[0].started)-Date.parse(timing.results[1].started):null;
 return {election:electionInfo(),collectionClosed:collectionClosed(),result:last?JSON.parse(last.normalized):null,error:collectionClosed()?null:state?.error??null,source,checked:state?.checked,latency:state?.latency,http:state?.http,cadence:{configuredMs:2000,observedMs},nextPoll:complete?31536000000:Math.max(2000,(state?.next_ms??0)-Date.now()),archive:last?{id:last.id,idg:last.idg,hash:last.hash,received:last.received,saved:last.saved}:null};
}
