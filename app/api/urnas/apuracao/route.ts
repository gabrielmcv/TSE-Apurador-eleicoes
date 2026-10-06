import {getStorage} from '../../../../db';
import {coverageQuery,urnCoverage} from '../../../../lib/urn-coverage';
export const dynamic='force-dynamic';
export async function GET(){try{const {db}=getStorage();const rows=await db.prepare(coverageQuery).all<{uf:string;normalized:string;received:string}>();return Response.json({states:urnCoverage(rows.results),scope:'Presidente · 1º turno',checked:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});}catch(error){console.error('Urn coverage unavailable',error);return Response.json({error:'Não foi possível consultar a apuração por UF.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
