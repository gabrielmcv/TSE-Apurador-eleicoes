import catalog from '../../../../lib/municipal-catalog.json';
import {getStorage} from '../../../../db';
import {withCandidatePhotos} from '../../../../lib/photos';
import {presidentialMap,type PresidentialMapSnapshot} from '../../../../lib/presidential-map';

export const dynamic='force-dynamic';

export async function GET(){
 try{
  const {db}=getStorage();
  const rows=await db.prepare(`SELECT id,uf,normalized,generated,received,hash FROM (SELECT id,uf,normalized,generated,received,hash,ROW_NUMBER() OVER(PARTITION BY uf ORDER BY generation_ms DESC,id DESC) AS rn FROM snapshots WHERE cargo='1' AND uf NOT IN ('BR','ZZ')) WHERE rn=1 ORDER BY uf`).all<PresidentialMapSnapshot>();
  const data=presidentialMap(rows.results,result=>withCandidatePhotos(result,'1','BR'));
  const municipal=await db.prepare('SELECT ibge,uf,municipio,name,summary,checked,error FROM municipal_jobs').all<any>();
  const identities=new Map(data.candidates.map(c=>[c.id,c]));
  const municipalities=municipal.results.filter(row=>row.summary).map(({summary,...row})=>{const {leaderCandidate,...values}=JSON.parse(summary);if(leaderCandidate&&!identities.has(leaderCandidate.id))identities.set(leaderCandidate.id,{...leaderCandidate,votes:0});return {...row,...values};});
  data.candidates=Array.from(identities.values());
  const retrying=municipal.results.filter(row=>!row.summary&&row.error).length;
  const collectionStatus={waiting:catalog.length-municipalities.length-retrying,retrying,withoutVotes:municipalities.filter(row=>!row.validVotes).length};
  return Response.json({...data,municipalities,collectionStatus,totalMunicipalities:catalog.length,collectedMunicipalities:municipalities.length,checked:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  console.error('Audit map unavailable',error);
  return Response.json({error:error instanceof Error?error.message:'Não foi possível consultar o mapa estadual.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
