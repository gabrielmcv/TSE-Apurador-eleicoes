import {voteTimeline} from './audit-series';
import {domesticResult,type DomesticSnapshot} from './domestic-result';
import {changes} from './audit';
// An anchor is an accepted state snapshot. Reconstruct only information saved
// by this anchor; never borrow a newer state generation from the future.
const accepted=`s.cargo='1' AND s.uf NOT IN ('BR','ZZ') AND NOT EXISTS(SELECT 1 FROM snapshots p WHERE p.uf=s.uf AND p.cargo='1' AND p.id<s.id AND p.generation_ms>s.generation_ms)`;
export async function domesticVersions(db:any,before:number,limit=51,id?:number){
 const anchors=await db.prepare(`SELECT s.id,s.received,s.saved FROM snapshots s WHERE ${accepted} AND ${id?'s.id=?':'s.id<?'} ORDER BY s.id DESC LIMIT ?`).bind(id??before,limit).all();
 if(!anchors.results.length)return [];
 const ids=anchors.results.map((r:any)=>r.id);
 const states=await db.prepare(`WITH ranked AS (SELECT CAST(a.value AS INTEGER) anchor,s.id,s.uf,s.normalized,s.generated,s.generation_ms,s.received,s.hash,ROW_NUMBER() OVER(PARTITION BY a.value,s.uf ORDER BY s.generation_ms DESC,s.id DESC) rn FROM json_each(?) a JOIN snapshots s ON s.id<=CAST(a.value AS INTEGER) WHERE s.cargo='1' AND s.uf NOT IN ('BR','ZZ')) SELECT * FROM ranked WHERE rn=1`).bind(JSON.stringify(ids)).all();
 const groups=new Map<number,DomesticSnapshot[]>();for(const row of states.results){const group=groups.get(row.anchor)??[];group.push(row);groups.set(row.anchor,group);}
 const versions=[];
 for(const anchor of anchors.results){const sources=groups.get(anchor.id)??[];if(sources.length!==27)continue;const data=domesticResult(sources);const manifest=JSON.stringify(data.composition.sources);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(manifest))),x=>x.toString(16).padStart(2,'0')).join('');versions.push({...data,id:anchor.id,idg:data.result.id,generated:data.result.generated,generation_ms:data.result.generationTime,totalization:data.result.progress.toString(),received:anchor.received,saved:anchor.saved,hash});}
 return versions;
}
export async function domesticHistory(request:Request,db:any){
 const p=new URL(request.url).searchParams,id=p.has('id')?Number(p.get('id')):undefined,before=Number(p.get('before')??Number.MAX_SAFE_INTEGER);
 if(!Number.isSafeInteger(before)||before<1||(id!==undefined&&(!Number.isSafeInteger(id)||id<1)))return Response.json({error:'Cursor ou ID inválido.'},{status:400});
 const versions=await domesticVersions(db,before,id?1:51,id);
 if(id){const row=versions[0];if(!row)return Response.json({error:'Composição completa não encontrada.'},{status:404});const {result,composition,...archive}=row;return Response.json({result,composition,archive:{...archive,composition},source:`/api/historico?uf=BR&cargo=1&exterior=0&id=${id}`},{headers:{'Cache-Control':'no-store',...(p.get('download')==='1'?{'Content-Disposition':`attachment; filename="brasil-sem-exterior-${id}.json"`}:{})}});}
 return Response.json({records:versions.slice(0,50).map(({result,...row})=>row),next:versions.length>50?versions[49].id:null},{headers:{'Cache-Control':'no-store'}});
}
export async function domesticSeries(p:URLSearchParams,db:any){
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER),candidate=p.get('candidate');const versions=await domesticVersions(db,before,501);
 const completion=await db.prepare(`WITH first_complete AS (SELECT uf,MIN(s.id) id FROM snapshots s WHERE ${accepted} AND CAST(json_extract(normalized,'$.totalSections') AS INTEGER)>0 AND CAST(json_extract(normalized,'$.sections') AS INTEGER)>=CAST(json_extract(normalized,'$.totalSections') AS INTEGER) GROUP BY uf) SELECT MAX(id) id FROM first_complete HAVING COUNT(*)=27`).first();
 const completed=completion?.id?(await domesticVersions(db,Number.MAX_SAFE_INTEGER,1,completion.id))[0]:null;
 const completedAt=completed&&completed.result.totalSections>0&&completed.result.sections>=completed.result.totalSections?completed.received:null;
 const timeline=await voteTimeline(db,'BR','1',true);const page=versions.slice(0,500);return Response.json({...timeline,completedAt,points:page.reverse().map(({result,composition,...row})=>{const c=result.candidates.find(c=>c.id===candidate);return {...row,composition,progress:result.progress,votes:c?.votes??null,percent:c?.percent??null,name:c?.name??null};}),next:versions.length>500?versions[499].id:null},{headers:{'Cache-Control':'no-store'}});
}
export async function domesticAudit(p:URLSearchParams,db:any){
 // One cursor page covers 50 composition transitions. All candidate events in
 // each transition are kept together so pagination cannot drop a candidate.
 const before=Number(p.get('before')??Number.MAX_SAFE_INTEGER),candidate=p.get('candidate'),alerts=p.get('alerts')==='1';
 const versions=await domesticVersions(db,before,51),records=[];
 for(let i=0;i<Math.min(50,versions.length);i++){const current=versions[i];let previous=versions[i+1];if(!previous){previous=(await domesticVersions(db,current.id,1))[0];}
 for(const event of changes(previous?.result??null,current.result,previous?.hash??null,current.hash)){
 if(candidate&&event.candidate!==candidate)continue;if(alerts&&!['reducao','candidato_ausente','mesmo_idg','geracao_anterior'].includes(event.kind))continue;
 records.push({...current,result:undefined,id:`${current.id}:${event.key}`,snapshot_id:current.id,previous_id:previous?.id??null,previous_hash:previous?.hash??null,kind:event.kind,candidate:event.candidate,name:event.name,before_votes:event.before,after_votes:event.after,delta:event.delta});
 }}
 return Response.json({records,next:versions.length>50?versions[49].id:null},{headers:{'Cache-Control':'no-store'}});
}
