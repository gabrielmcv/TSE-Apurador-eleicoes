import {electionContext} from '../../../lib/election-context';
import {withCandidatePhotos} from '../../../lib/photos';
import {collect} from '../../../lib/archive';
import {endpoint} from '../../../lib/tse';
export const dynamic='force-dynamic';
export async function GET(request:Request){const p=new URL(request.url).searchParams;const uf=p.get('uf')??'BR',cargo=p.get('cargo')??'1';try{endpoint(uf,cargo,electionContext());}catch{ return Response.json({error:'Abrangência incompatível com o cargo.'},{status:400});}
 try{const data=await collect(uf,cargo);return Response.json({...data,result:data.result?withCandidatePhotos(data.result,cargo,uf):null},{headers:{'Cache-Control':'no-store'}});}catch(err){console.error('Archive unavailable',err);return Response.json({error:err instanceof Error?err.message:'Armazenamento indisponível.'},{status:503});}}
