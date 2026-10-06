import {UFS,type Result} from './tse';
export type DomesticSnapshot={id:number;uf:string;normalized:string;generated:string;generation_ms:number;received:string;hash:string};
export const domesticQuery=`SELECT id,uf,normalized,generated,generation_ms,received,hash FROM (SELECT id,uf,normalized,generated,generation_ms,received,hash,ROW_NUMBER() OVER(PARTITION BY uf ORDER BY generation_ms DESC,id DESC) AS rn FROM snapshots WHERE cargo='1' AND uf NOT IN ('BR','ZZ')) WHERE rn=1`;
export function domesticResult(rows:DomesticSnapshot[]){
 const byUf=new Map(rows.map(row=>[row.uf,row]));const missing=UFS.filter(uf=>!byUf.has(uf));if(missing.length)throw Error(`Ainda faltam resultados arquivados de ${missing.join(', ')} para calcular o Brasil sem exterior.`);
 const sources=UFS.map(uf=>byUf.get(uf)!);if(rows.length!==27||byUf.size!==27)throw Error('A composição deve conter uma versão de cada uma das 27 UFs.');
 const parsed=sources.map(row=>({row,result:JSON.parse(row.normalized) as Result}));
 const sum=(field:'total'|'valid'|'blank'|'nullVotes'|'sections'|'totalSections')=>parsed.reduce((total,item)=>total+item.result[field],0);
 const valid=sum('valid'),sections=sum('sections'),totalSections=sum('totalSections');const candidates=new Map<string,Result['candidates'][number]>();
 for(const {result} of parsed)for(const candidate of result.candidates){const current=candidates.get(candidate.id);if(current)current.votes+=candidate.votes;else candidates.set(candidate.id,{...candidate,votes:candidate.votes,percent:0,status:'',destination:'',elected:false});}
 for(const candidate of candidates.values())candidate.percent=valid?Math.round(candidate.votes/valid*10000)/100:0;
 const ordered=[...sources].sort((a,b)=>a.generation_ms-b.generation_ms||a.id-b.id),first=ordered[0],last=ordered[ordered.length-1];
 const result:Result={id:'ufs:'+sources.map(row=>row.id).join('-'),generated:first.generated===last.generated?last.generated:`${first.generated} — ${last.generated}`,generationTime:last.generation_ms,totalization:'Composição de 27 arquivos estaduais',progress:totalSections?Math.round(sections/totalSections*10000)/100:0,sections,totalSections,total:sum('total'),valid,blank:sum('blank'),nullVotes:sum('nullVotes'),status:parsed.every(item=>item.result.status==='Totalização finalizada')?'Totalização finalizada':'Apuração em andamento',candidates:Array.from(candidates.values())};
 return {result,composition:{kind:'sum_27_ufs',includesExterior:false,calculatedPercentages:true,sources:sources.map(row=>({uf:row.uf,snapshotId:row.id,generated:row.generated,received:row.received,hash:row.hash}))}};
}
