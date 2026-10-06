import {waitUntil} from 'cloudflare:workers';
import {getStorage} from '../../../db';
import {pumpMunicipal} from '../../../lib/municipal-archive';
import catalog from '../../../lib/municipal-catalog.json';
import {withCandidatePhotos} from '../../../lib/photos';
export const dynamic='force-dynamic';
export async function POST(){try{const task=pumpMunicipal();waitUntil(task.catch(error=>console.error('Municipal collection failed',error)));return Response.json(await task,{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Coleta municipal temporariamente indisponível.'},{status:503});}}
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,ibge=p.get('ibge');
 if(!ibge||!catalog.some(m=>m.ibge===ibge))return Response.json({error:'Município inválido.'},{status:400});
 try{const {db,bucket}=getStorage();let row;
 if(p.has('id')){const id=Number(p.get('id'));if(!Number.isSafeInteger(id)||id<1)return Response.json({error:'ID inválido.'},{status:400});row=await db.prepare('SELECT * FROM municipal_snapshots WHERE ibge=? AND id=?').bind(ibge,id).first<any>();}
 else row=await db.prepare('SELECT * FROM municipal_snapshots WHERE ibge=? ORDER BY generation_ms DESC,id DESC LIMIT 1').bind(ibge).first<any>();
 if(!row)return Response.json({error:'Este município ainda não tem uma versão arquivada.'},{status:404});
 const {normalized,object_key,...archive}=row;
 if(p.get('download')==='1'){const object=await bucket.get(object_key);if(!object)throw Error('Cópia original indisponível.');const bytes=await object.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==row.hash)throw Error('Falha de integridade da cópia.');return Response.json({metadata:archive,rawText:new TextDecoder().decode(bytes),tse:JSON.parse(new TextDecoder().decode(bytes))},{headers:{'Cache-Control':'no-store','Content-Disposition':`attachment; filename="tse-municipio-${ibge}-${row.id}.json"`}});}
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)return Response.json({error:'Cursor inválido.'},{status:400});
 const history=await db.prepare('SELECT id,idg,generated,received,saved,hash FROM municipal_snapshots WHERE ibge=? AND id<? ORDER BY id DESC LIMIT 21').bind(ibge,before).all<any>();
 return Response.json({result:withCandidatePhotos(JSON.parse(normalized),'1','BR'),archive,history:history.results.slice(0,20),next:history.results.length>20?history.results[19].id:null},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:e instanceof Error?e.message:'Não foi possível consultar o município.'},{status:503});}
}
