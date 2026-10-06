import {getStorage} from '../../../db';
import {pumpResults} from '../../../lib/result-queue';
import {resultScopes} from '../../../lib/result-scopes';
export const dynamic='force-dynamic';
export async function POST(){try{return Response.json(await pumpResults(),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Não foi possível executar a coleta de resultados.'},{status:503});}}
export async function GET(){try{const {db}=getStorage();
 const rows=await db.prepare('SELECT j.uf,j.cargo,s.checked,s.http,s.error,s.latency,(SELECT count(*) FROM snapshots v WHERE v.uf=j.uf AND v.cargo=j.cargo) AS versions,(SELECT max(received) FROM snapshots v WHERE v.uf=j.uf AND v.cargo=j.cargo) AS received FROM result_jobs j LEFT JOIN source_state s ON s.source=j.source ORDER BY j.uf,j.cargo').all();
 return Response.json({total:resultScopes().length,scopes:rows.results},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'Não foi possível consultar a cobertura da coleta.'},{status:503});}}
