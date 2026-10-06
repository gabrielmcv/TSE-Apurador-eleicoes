import {electionContext} from '../../../lib/election-context';
import {domesticHistory} from '../../../lib/domestic-history';
import {withCandidatePhotos} from '../../../lib/photos';
import {getStorage} from '../../../db';
import {endpoint} from '../../../lib/tse';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,uf=p.get('uf')??'BR',cargo=p.get('cargo')??'1';
 try{endpoint(uf,cargo,electionContext());}catch{return Response.json({error:'Seleção inválida.'},{status:400});}
 try{const {db,bucket}=getStorage();
 if(uf==='BR'&&cargo==='1'&&p.get('exterior')==='0')return await domesticHistory(request,db);
 if(p.has('id')){
 const id=Number(p.get('id'));if(!Number.isSafeInteger(id)||id<1)return Response.json({error:'ID inválido'},{status:400});
 const row=await db.prepare('SELECT * FROM snapshots WHERE id=? AND uf=? AND cargo=?').bind(id,uf,cargo).first<any>();if(!row)return Response.json({error:'Registro não encontrado.'},{status:404});
 if(p.get('download')==='1'){const obj=await bucket.get(row.object_key);if(!obj)return Response.json({error:'Arquivo arquivado indisponível.'},{status:503});const bytes=await obj.arrayBuffer();const raw=new TextDecoder().decode(bytes);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(hash!==row.hash)return Response.json({error:'Falha na conferência de integridade.'},{status:503});return Response.json({metadata:{id:row.id,source:row.source,idg:row.idg,generated:row.generated,totalization:row.totalization,received:row.received,saved:row.saved,sha256:row.hash,timezone:'Horários do TSE preservados; recebimento e armazenamento em UTC.',signatureVerified:false},rawText:raw,tse:JSON.parse(raw)},{headers:{'Content-Disposition':`attachment; filename="tse-${uf}-${cargo}-${id}.json"`,'Cache-Control':'no-store'}});}
 return Response.json({result:withCandidatePhotos(JSON.parse(row.normalized),cargo,uf),archive:{id:row.id,idg:row.idg,hash:row.hash,received:row.received,saved:row.saved},source:row.source});
 }
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)return Response.json({error:'Cursor inválido.'},{status:400});
 const rows=await db.prepare('SELECT id,idg,generated,totalization,received,saved,hash FROM snapshots WHERE uf=? AND cargo=? AND id<? ORDER BY id DESC LIMIT 51').bind(uf,cargo,before).all();const list=rows.results;return Response.json({records:list.slice(0,50),next:list.length>50?(list[49] as any).id:null},{headers:{'Cache-Control':'no-store'}});
 }catch(err){console.error(err);return Response.json({error:'Não foi possível acessar o arquivo persistente.'},{status:503});}
}
