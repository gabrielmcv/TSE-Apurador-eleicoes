import {electionContext} from '../../../../lib/election-context';
import {domesticSeries} from '../../../../lib/domestic-history';
import {getStorage} from '../../../../db';
import {endpoint} from '../../../../lib/tse';
import {completionQuery,voteTimeline,seriesPage,seriesQuery,type SeriesPoint} from '../../../../lib/audit-series';
export const dynamic='force-dynamic';
export async function GET(request:Request){const params=new URL(request.url).searchParams,uf=params.get('uf')??'BR',cargo=params.get('cargo')??'1',candidate=params.get('candidate')??'',before=Number(params.get('before')??Number.MAX_SAFE_INTEGER);try{endpoint(uf,cargo,electionContext());if(!/^\d{1,30}$/.test(candidate)||!Number.isSafeInteger(before)||before<1)throw Error();}catch{return Response.json({error:'Selecione um candidato válido.'},{status:400});}try{const {db}=getStorage();if(uf==='BR'&&cargo==='1'&&params.get('exterior')==='0')return await domesticSeries(params,db);
 const rows=await db.prepare(seriesQuery).bind(uf,cargo,before,candidate).all<SeriesPoint>();const completion=await db.prepare(completionQuery).bind(uf,cargo).first<{received:string}>();const timeline=await voteTimeline(db,uf,cargo);return Response.json({...timeline,...seriesPage(rows.results),completedAt:completion?.received??null},{headers:{'Cache-Control':'no-store'}});}catch(error){console.error('Audit series unavailable',error);return Response.json({error:'Não foi possível consultar a série histórica.'},{status:503});}}
