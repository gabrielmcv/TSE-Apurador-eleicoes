import {UFS,type Candidate,type Result} from './tse';

export type PresidentialMapSnapshot={id:number;uf:string;normalized:string;generated:string;received:string;hash:string};
export type PresidentialMapCandidate=Pick<Candidate,'id'|'name'|'number'|'party'|'photo'>&{votes:number};
export type PresidentialMapState={uf:string;progress:number;validVotes:number;status:string;generated:string;received:string;results:{candidateId:string;votes:number;percent:number}[]};

export function presidentialMap(rows:PresidentialMapSnapshot[],decorate:(result:Result)=>Result){
 const parsed=rows.filter(row=>UFS.includes(row.uf)).map(row=>({row,result:decorate(JSON.parse(row.normalized) as Result)}));
 const totals=new Map<string,PresidentialMapCandidate>();
 for(const {result} of parsed)for(const candidate of result.candidates){const current=totals.get(candidate.id);if(current)current.votes+=candidate.votes;else totals.set(candidate.id,{id:candidate.id,name:candidate.name,number:candidate.number,party:candidate.party,photo:candidate.photo,votes:candidate.votes});}
 const candidates=[...totals.values()].sort((a,b)=>b.votes-a.votes||a.name.localeCompare(b.name,'pt-BR'));
 const states=parsed.map(({row,result})=>{const byId=new Map(result.candidates.map(candidate=>[candidate.id,candidate]));return {uf:row.uf,progress:result.progress,validVotes:result.valid,status:result.status,generated:row.generated,received:row.received,results:candidates.map(candidate=>{const value=byId.get(candidate.id);return {candidateId:candidate.id,votes:value?.votes??0,percent:value?.percent??0};})};}).sort((a,b)=>UFS.indexOf(a.uf)-UFS.indexOf(b.uf));
 const present=new Set(states.map(state=>state.uf));
 return {candidates,states,missingStates:UFS.filter(uf=>!present.has(uf))};
}
