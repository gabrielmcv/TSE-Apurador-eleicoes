import {electionContext} from '../../../lib/election-context';
import {domesticAudit} from '../../../lib/domestic-history';
import {getStorage} from '../../../db';
import {endpoint} from '../../../lib/tse';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,uf=p.get('uf')??'BR',cargo=p.get('cargo')??'1',candidate=p.get('candidate'),alerts=p.get('alerts')==='1',before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);
 try{endpoint(uf,cargo,electionContext());if(!Number.isSafeInteger(before)||before<1)throw Error();}catch{return Response.json({error:'Seleção inválida.'},{status:400});}
 try{const {db}=getStorage();if(uf==='BR'&&cargo==='1'&&p.get('exterior')==='0')return await domesticAudit(p,db);const where=['a.uf=?','a.cargo=?','a.id<?'];const values:any[]=[uf,cargo,before];if(candidate){where.push('a.candidate=?');values.push(candidate);}if(alerts)where.push("a.kind IN ('reducao','candidato_ausente','mesmo_idg','geracao_anterior')");
 const rows=await db.prepare(`SELECT a.*,s.idg,s.generated,s.totalization,s.hash,s.source,s.saved,p.hash AS previous_hash,p.generated AS previous_generated FROM audit_events a JOIN snapshots s ON s.id=a.snapshot_id LEFT JOIN snapshots p ON p.id=a.previous_id WHERE ${where.join(' AND ')} ORDER BY a.id DESC LIMIT 51`).bind(...values).all();const records=rows.results.slice(0,50);return Response.json({records,next:rows.results.length>50?(records[49] as any).id:null},{headers:{'Cache-Control':'no-store'}});
 }catch(err){console.error(err);return Response.json({error:'Não foi possível consultar a auditoria.'},{status:503});}
}
