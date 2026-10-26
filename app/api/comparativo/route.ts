import photos from '../../../lib/candidate-photos.json';
import {env} from 'cloudflare:workers';
import catalog from '../../../lib/municipal-catalog.json';
import {comparisonQuery,compareMunicipality,type ComparisonSnapshot} from '../../../lib/round-comparison';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
 const db=env.DB;if(!db)throw Error('Acervo indisponível.');
 const latest=await db.prepare("SELECT normalized FROM r2_snapshots WHERE cargo='1' AND uf='BR' ORDER BY generation_ms DESC,id DESC LIMIT 1").first<{normalized:string}>();
 const fallback=latest??await db.prepare('SELECT normalized FROM r2_municipal_snapshots ORDER BY generation_ms DESC,id DESC LIMIT 1').first<{normalized:string}>();
 const candidates=(fallback?JSON.parse(fallback.normalized).candidates:[]).map((c:any)=>({id:String(c.id),name:String(c.name),number:String(c.number),party:String(c.party),photo:photos.photos.find(p=>p.sqcand===String(c.id))?.url}));
 const selected=new URL(request.url).searchParams.get('candidato')??candidates[0]?.id;
 if(selected&&!candidates.some((c:any)=>c.id===selected))return Response.json({error:'Candidato não encontrado no segundo turno.'},{status:400});
 if(!selected)return Response.json({candidates,municipalities:[],checked:new Date().toISOString()});
 const [first,second]=await Promise.all([db.prepare(comparisonQuery('')).bind(selected).all<ComparisonSnapshot>(),db.prepare(comparisonQuery('r2_')).bind(selected).all<ComparisonSnapshot>()]);
 const a=new Map(first.results.map(r=>[r.ibge,r])),b=new Map(second.results.map(r=>[r.ibge,r]));
 const municipalities=catalog.map(m=>({...m,...compareMunicipality(a.get(m.ibge),b.get(m.ibge))}));
 return Response.json({candidates,selected,municipalities,checked:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Comparativo indisponível',e);return Response.json({error:'Não foi possível consultar os acervos dos dois turnos.'},{status:503});}
}
