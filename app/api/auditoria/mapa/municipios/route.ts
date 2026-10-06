import {getStorage} from '../../../../../db';
import catalog from '../../../../../lib/municipal-catalog.json';
import {UFS} from '../../../../../lib/tse';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams,uf=params.get('uf')??'',candidate=params.get('candidato')??'';
 if(!UFS.includes(uf)||!candidate||candidate.length>80)return Response.json({error:'Estado ou candidato inválido.'},{status:400});
 try{
  const {db}=getStorage();
  const records=await db.prepare(`SELECT j.ibge,s.id snapshotId,s.generated,s.received,s.hash,
   CAST(json_extract(c.value,'$.votes') AS INTEGER) votes,
   CAST(json_extract(c.value,'$.percent') AS REAL) percent
   FROM municipal_jobs j JOIN municipal_snapshots s ON s.id=j.snapshot_id
   LEFT JOIN json_each(s.normalized,'$.candidates') c ON CAST(json_extract(c.value,'$.id') AS TEXT)=?
   WHERE j.uf=?`).bind(candidate,uf).all<any>();
  const byId=new Map(records.results.map(row=>[row.ibge,row]));
  const municipalities=catalog.filter(m=>m.uf===uf).map(m=>({...m,...byId.get(m.ibge),votes:byId.get(m.ibge)?.votes??null,percent:byId.get(m.ibge)?.percent??null})).sort((a,b)=>(b.percent??-1)-(a.percent??-1)||(b.votes??-1)-(a.votes??-1)||a.name.localeCompare(b.name,'pt-BR'));
  return Response.json({uf,candidate,municipalities,collected:records.results.length,total:municipalities.length},{headers:{'Cache-Control':'no-store'}});
 }catch(error){console.error(error);return Response.json({error:'Não foi possível consultar os votos municipais.'},{status:503});}
}
