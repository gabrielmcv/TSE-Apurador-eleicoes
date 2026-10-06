import {getStorage} from '../db';
import {officialUrl} from './urn-paths';
export async function capture(source:string,uf:string,archivePath?:string,filename?:string){
 source=officialUrl(source);const {db,bucket}=getStorage(),start=Date.now();const record=await db.prepare('INSERT INTO collection_logs(source,uf,cargo,started,state,request_headers) VALUES (?,?,?,?,?,?) RETURNING id').bind(source,uf,'urna',new Date(start).toISOString(),'consultando','{}').first<{id:number}>();if(!record)throw Error('Falha ao iniciar log.');let http=0;
 try{const response=await fetch(source,{cache:'no-store',signal:AbortSignal.timeout(15000)});http=response.status;const bytes=await response.arrayBuffer(),received=new Date().toISOString();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');const key=archivePath&&filename?`${archivePath}/${hash}/${filename}`:`urnas/respostas/${hash}.bin`;
 await bucket.put(key,bytes,{httpMetadata:{contentType:response.headers.get('content-type')??'application/octet-stream'}});
 await db.prepare('UPDATE collection_logs SET state=?,http=?,received=?,finished=?,latency=?,size=?,hash=?,object_key=?,response_headers=?,error=? WHERE id=?').bind(response.ok?'resposta_arquivada':'erro_http',http,received,new Date().toISOString(),Date.now()-start,bytes.byteLength,hash,key,JSON.stringify(Object.fromEntries(response.headers.entries())),response.ok?null:`HTTP ${http}`,record.id).run();
 if(!response.ok)throw Object.assign(Error(`TSE respondeu HTTP ${http}`),{http});return {bytes,key,hash,received,size:bytes.byteLength,logId:record.id};
 }catch(e){await db.prepare('UPDATE collection_logs SET state=?,finished=?,latency=?,error=? WHERE id=?').bind(http>=400?'erro_http':'erro_coleta',new Date().toISOString(),Date.now()-start,e instanceof Error?e.message:String(e),record.id).run();throw e;}
}
