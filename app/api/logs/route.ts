import {electionContext} from '../../../lib/election-context';
import {getStorage} from '../../../db';
import {endpoint,UFS} from '../../../lib/tse';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,uf=p.get('uf')??'BR',cargo=p.get('cargo')??'1';
 try{if(cargo==='urna'||cargo==='municipal'){if(!['BR','ZZ',...UFS].includes(uf))throw Error('Abrangência inválida.');}else endpoint(uf,cargo,electionContext());}catch{return Response.json({error:'Seleção inválida.'},{status:400});}
 try{const {db,bucket}=getStorage();const scopeWhere=['municipal','urna'].includes(cargo)&&uf==='BR'?'cargo=?':'uf=? AND cargo=?',scopeValues=['municipal','urna'].includes(cargo)&&uf==='BR'?[cargo]:[uf,cargo];
 if(p.has('id')){
 const id=Number(p.get('id'));if(!Number.isSafeInteger(id)||id<1)return Response.json({error:'ID inválido.'},{status:400});
 const row=await db.prepare(`SELECT * FROM collection_logs WHERE id=? AND ${scopeWhere}`).bind(id,...scopeValues).first<any>();if(!row)return Response.json({error:'Log não encontrado.'},{status:404});
 let rawText:string|null=null,parsed:unknown=null;
 if(row.object_key){const obj=await bucket.get(row.object_key);if(!obj)return Response.json({error:'Resposta arquivada indisponível.'},{status:503});const bytes=await obj.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==row.hash)return Response.json({error:'Falha na integridade do arquivo.'},{status:503});
 if(p.get('download')==='raw')return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="tse-resposta-${id}.bin"`,'Cache-Control':'no-store'}});
 rawText=new TextDecoder().decode(bytes);try{parsed=JSON.parse(rawText);}catch{/* Kept as received, even when non-JSON. */}}
 const payload={log:{...row,request_headers:JSON.parse(row.request_headers),response_headers:row.response_headers?JSON.parse(row.response_headers):null},rawText,parsed,signatureVerified:false};
 return Response.json(payload,{headers:{'Cache-Control':'no-store',...(p.get('download')==='json'?{'Content-Disposition':`attachment; filename="tse-log-${id}.json"`}:{})}});
 }
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)return Response.json({error:'Cursor inválido.'},{status:400});
 const rows=await db.prepare(`SELECT id,source,uf,cargo,started,received,finished,state,http,latency,size,hash,snapshot_id,idg,generated,totalization,error FROM collection_logs WHERE ${scopeWhere} AND id<? ORDER BY id DESC LIMIT 51`).bind(...scopeValues,before).all();
 return Response.json({records:rows.results.slice(0,50),next:rows.results.length>50?(rows.results[49] as any).id:null},{headers:{'Cache-Control':'no-store'}});
 }catch(err){console.error('Logs indisponíveis',err);return Response.json({error:'Não foi possível consultar os logs persistentes.'},{status:503});}
}
