import {prepareExport} from '../../../lib/archive-export';
import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from '../../../lib/election-context';
import {urnFailuresQuery} from '../../../lib/urn-retry';
import {getStorage} from '../../../db';
import {seed,tick} from '../../../lib/urn-queue';
import {scopeUf,digits} from '../../../lib/urn-paths';
export const dynamic='force-dynamic';
export async function POST(){
 if(urnCollectionClosed())return Response.json({closed:true,election:electionInfo()});
 try{const {db}=getStorage();await seed();const now=Date.now();await db.prepare('INSERT INTO source_state(source,next_ms,lease_until) VALUES (?,0,0) ON CONFLICT(source) DO NOTHING').bind('urn-pump-gate').run();const lease=crypto.randomUUID();const acquired=await db.prepare('UPDATE source_state SET lease=?,lease_until=? WHERE source=? AND next_ms<=? AND lease_until<=? RETURNING source').bind(lease,now+60000,'urn-pump-gate',now,now).first();if(!acquired){const gate=await db.prepare('SELECT next_ms FROM source_state WHERE source=?').bind('urn-pump-gate').first<{next_ms:number}>();return Response.json({busy:true,nextPoll:Math.max(2000,(gate?.next_ms??0)-Date.now())});}
 const processed=[];let pauseMs=2000;try{for(let i=0;i<4&&Date.now()-now<20000;i++){const r=await tick(i===0);processed.push(r);if('pauseMs' in r && r.pauseMs){pauseMs=r.pauseMs;break;}if(!r.processed)break;}}finally{await db.prepare('UPDATE source_state SET lease=NULL,lease_until=0,next_ms=? WHERE source=? AND lease=?').bind(Date.now()+pauseMs,'urn-pump-gate',lease).run();}
 const acervo=await prepareExport();return Response.json({processed,acervo,nextPoll:pauseMs},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Coletor de arquivos de urna indisponível.'},{status:503});}}
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,uf=p.get('uf')??'ES',m=p.get('municipio'),z=p.get('zona'),s=p.get('secao');
 try{if(uf!=='BR')scopeUf(uf);else if(m||z||s)throw Error();if(m)digits(m,5);if(z)digits(z,4);if(s)digits(s,4);}catch{return Response.json({error:'Filtro inválido.'},{status:400});}
 try{const {db,bucket}=getStorage();
 if(p.has('file')){const id=Number(p.get('file'));if(!Number.isSafeInteger(id)||id<1)return Response.json({error:'Identificador inválido.'},{status:400});const row=await db.prepare('SELECT * FROM urn_files WHERE id=? AND uf=?').bind(id,uf).first<any>();if(!row||row.state!=='saved')return Response.json({error:'Arquivo ainda não arquivado.'},{status:404});const obj=await bucket.get(row.object_key);if(!obj)return Response.json({error:'Arquivo arquivado indisponível.'},{status:503});const bytes=await obj.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==row.sha256)return Response.json({error:'Falha na integridade da cópia.'},{status:503});return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${row.filename}"`,'Cache-Control':'no-store','X-Archive-SHA256':hash}});}
 const where=uf==='BR'?['1=1']:['uf=?'],values:(string|number)[]=uf==='BR'?[]:[uf];if(m){where.push('municipio=?');values.push(digits(m,5));}if(z){where.push('zona=?');values.push(digits(z,4));}if(s){where.push('secao=?');values.push(digits(s,4));}
 const municipalities=uf==='BR'?{results:[]}:await db.prepare('SELECT DISTINCT municipio,municipio_name FROM urn_sections WHERE uf=? ORDER BY municipio_name').bind(uf).all();
 const zones=m?await db.prepare('SELECT DISTINCT zona FROM urn_sections WHERE uf=? AND municipio=? ORDER BY zona').bind(uf,digits(m,5)).all():{results:[]};
 const sections=m&&z?await db.prepare('SELECT secao,principal,aux_generated FROM urn_sections WHERE uf=? AND municipio=? AND zona=? ORDER BY secao').bind(uf,digits(m,5),digits(z,4)).all():{results:[]};
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)return Response.json({error:'Cursor inválido.'},{status:400});
 const files=await db.prepare(`SELECT * FROM urn_files WHERE ${where.join(' AND ')} AND id<? ORDER BY id DESC LIMIT 51`).bind(...values,before).all();
 const counts=await db.prepare('SELECT state,count(*) AS n FROM urn_jobs GROUP BY state').all();const saved=await db.prepare("SELECT count(*) AS n,COALESCE(sum(size),0) AS bytes FROM urn_files WHERE state='saved'").first();
 const logs=await db.prepare("SELECT id,source,started,received,finished,state,http,error FROM collection_logs WHERE cargo='urna' AND uf=? ORDER BY id DESC LIMIT 20").bind(uf).all();
 const scopedSaved=await db.prepare(`SELECT count(*) AS n,COALESCE(sum(size),0) AS bytes FROM urn_files WHERE ${where.join(' AND ')} AND state='saved'`).bind(...values).first();const availableScopes=await db.prepare("SELECT uf,count(*) AS listed,sum(CASE WHEN state='saved' THEN 1 ELSE 0 END) AS saved FROM urn_files GROUP BY uf ORDER BY uf").all();
 const failures=await db.prepare(urnFailuresQuery).all();
 return Response.json({failures:urnCollectionClosed()?[]:failures.results,municipalities:municipalities.results,zones:zones.results,sections:sections.results,files:files.results.slice(0,50),next:files.results.length>50?(files.results[49] as any).id:null,queue:counts.results,saved,scopedSaved,availableScopes:availableScopes.results,collectionClosed:urnCollectionClosed(),logs:logs.results},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Arquivo de urnas indisponível.'},{status:503});}}
