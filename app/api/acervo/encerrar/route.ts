import {getStorage} from '../../../../db';
import {authorized} from '../../coleta/automatica/route';
import {ELECTION} from '../../../../lib/election';
import {municipalLeader} from '../../../../lib/municipal';
export const dynamic='force-dynamic';
const complete=`CAST(json_extract(normalized,'$.totalSections') AS INTEGER)>0 AND CAST(json_extract(normalized,'$.sections') AS INTEGER)>=CAST(json_extract(normalized,'$.totalSections') AS INTEGER)`;
const cutoff=(table:string)=>`SELECT source,MIN(received) cutoff FROM ${table} WHERE ${complete} GROUP BY source`;
const obsolete=(table:string)=>`SELECT s.id,s.source,s.object_key${table==='municipal_snapshots'?',s.ibge':''} FROM ${table} s JOIN (${cutoff(table)}) c ON c.source=s.source WHERE s.received>c.cutoff ORDER BY s.id LIMIT 500`;
const obsoleteLogs=`SELECT * FROM (SELECT l.id,l.object_key FROM collection_logs l JOIN (SELECT source,MIN(cutoff) cutoff FROM (${cutoff('snapshots')} UNION ALL ${cutoff('municipal_snapshots')}) GROUP BY source) c ON c.source=l.source WHERE l.started>c.cutoff UNION ALL SELECT l.id,l.object_key FROM (SELECT id,object_key,started,ROW_NUMBER() OVER(PARTITION BY source,COALESCE(hash,error),http ORDER BY id) rn FROM collection_logs WHERE cargo='urna') l WHERE l.rn>1 AND l.started>(SELECT MIN(received) FROM snapshots WHERE uf='BR' AND cargo='1' AND ${complete}) AND NOT EXISTS(SELECT 1 FROM urn_files f WHERE f.log_id=l.id)) ORDER BY id LIMIT 5000`;

export async function POST(request:Request){
 if(!await authorized(request))return Response.json({error:'Acesso não autorizado.'},{status:401});
 const {db,bucket}=getStorage();const params=new URL(request.url).searchParams;
 if(params.get('sweep')==='1'){const prefix=params.get('prefix');if(!['responses/ele2026/','municipios/ele2026/'].includes(prefix??''))return Response.json({error:'Prefixo inválido.'},{status:400});const listed=await bucket.list({prefix:prefix!,limit:1000,cursor:params.get('cursor')??undefined});const keys=listed.objects.map(o=>o.key);const refs=await db.prepare('SELECT object_key FROM snapshots WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM municipal_snapshots WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM collection_logs WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM urn_files WHERE object_key IN (SELECT value FROM json_each(?))').bind(...Array(4).fill(JSON.stringify(keys))).all<{object_key:string}>();const retained=new Set(refs.results.map(row=>row.object_key)),orphaned=keys.filter(key=>!retained.has(key));if(orphaned.length)await bucket.delete(orphaned);return Response.json({objects:orphaned.length,next:listed.truncated?listed.cursor:null});}
 const [snapshots,municipal,logs]=await Promise.all([db.prepare(obsolete('snapshots')).all<any>(),db.prepare(obsolete('municipal_snapshots')).all<any>(),db.prepare(obsoleteLogs).all<any>()]);
 const counts={snapshots:snapshots.results.length,municipal:municipal.results.length,logs:logs.results.length};
 if(new URL(request.url).searchParams.get('apply')!=='1')return Response.json({election:ELECTION,candidates:counts});
 // Persist the archive identity before removing post-completion records.
 await bucket.put('elections/2026-1/manifest.json',JSON.stringify({election:ELECTION,collectionClosed:true,closedAt:new Date().toISOString(),resultSource:'snapshots',municipalSource:'municipal_snapshots',urnSource:'urn_files',cleanupRule:'Manter primeira captura com todas as seções apuradas por fonte; excluir capturas e consultas posteriores.'}),{httpMetadata:{contentType:'application/json'}});
 const ids=JSON.stringify(snapshots.results.map(r=>r.id)),mids=JSON.stringify(municipal.results.map(r=>r.id)),lids=JSON.stringify(logs.results.map(r=>r.id));
 await db.batch([
 db.prepare('DELETE FROM audit_events WHERE snapshot_id IN (SELECT value FROM json_each(?)) OR previous_id IN (SELECT value FROM json_each(?)) OR log_id IN (SELECT value FROM json_each(?))').bind(ids,ids,lids),
 db.prepare('UPDATE collection_logs SET snapshot_id=NULL WHERE snapshot_id IN (SELECT value FROM json_each(?)) AND cargo<>?').bind(ids,'municipal'),
 db.prepare('DELETE FROM snapshots WHERE id IN (SELECT value FROM json_each(?))').bind(ids),
 db.prepare('DELETE FROM municipal_snapshots WHERE id IN (SELECT value FROM json_each(?))').bind(mids),
 db.prepare('DELETE FROM collection_logs WHERE id IN (SELECT value FROM json_each(?))').bind(lids),
 db.prepare('UPDATE result_jobs SET snapshot_id=(SELECT id FROM snapshots s WHERE s.source=result_jobs.source ORDER BY generation_ms DESC,id DESC LIMIT 1),lease_until=0')]);
 const stale=await db.prepare('SELECT ibge FROM municipal_jobs j WHERE snapshot_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM municipal_snapshots s WHERE s.id=j.snapshot_id) LIMIT 200').all<{ibge:string}>();
 const affected=[...new Set([...municipal.results,...stale.results].map(r=>r.ibge))];
 const replacements=await db.prepare('WITH ranked AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY ibge ORDER BY generation_ms DESC,id DESC) rn FROM municipal_snapshots WHERE ibge IN (SELECT value FROM json_each(?))) SELECT * FROM ranked WHERE rn=1').bind(JSON.stringify(affected)).all<any>();
 const updates=replacements.results.map(row=>{const result=JSON.parse(row.normalized),leadership=municipalLeader(result),winner=result.candidates.find((c:any)=>c.id===leadership.leaderId);const summary={...leadership,leaderCandidate:winner?{id:winner.id,name:winner.name,number:winner.number,party:winner.party}:null,validVotes:result.valid,progress:result.progress,generated:row.generated,received:row.received,snapshotId:row.id,hash:row.hash};return db.prepare('UPDATE municipal_jobs SET snapshot_id=?,summary=?,lease_until=0 WHERE ibge=?').bind(row.id,JSON.stringify(summary),row.ibge);});
 for(let i=0;i<updates.length;i+=60)await db.batch(updates.slice(i,i+60));
 const keys=[...new Set([...snapshots.results,...municipal.results,...logs.results].map(r=>r.object_key).filter(Boolean))] as string[];
 let objects=0;if(keys.length){const refs=await db.prepare('SELECT object_key FROM snapshots WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM municipal_snapshots WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM collection_logs WHERE object_key IN (SELECT value FROM json_each(?)) UNION SELECT object_key FROM urn_files WHERE object_key IN (SELECT value FROM json_each(?))').bind(...Array(4).fill(JSON.stringify(keys))).all<{object_key:string}>();const retained=new Set(refs.results.map(row=>row.object_key));const orphaned=keys.filter(key=>!retained.has(key));for(let i=0;i<orphaned.length;i+=1000)await bucket.delete(orphaned.slice(i,i+1000));objects=orphaned.length;}
 const remaining=await Promise.all([db.prepare(obsolete('snapshots')).first(),db.prepare(obsolete('municipal_snapshots')).first(),db.prepare(obsoleteLogs).first()]);
 return Response.json({election:ELECTION,deleted:counts,objects,done:remaining.every(row=>!row)},{headers:{'Cache-Control':'no-store'}});
}
