import type {Candidate,Result} from './tse';
export function ranking(candidates:Candidate[]){
 const sorted=[...candidates].sort((a,b)=>b.votes-a.votes||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
 return sorted.map((candidate,index)=>({candidate,rank:sorted.findIndex(c=>c.votes===candidate.votes)+1,index}));
}
export function overtakes(before:Candidate[],after:Candidate[]){
 const old=new Map(before.map(c=>[c.id,c]));const oldRanks=new Map(ranking(before).map(r=>[r.candidate.id,r.rank]));const ranked=ranking(after);
 return ranked.flatMap(({candidate,rank})=>{const a=old.get(candidate.id);if(!a)return [];
 const passed=after.filter(b=>b.id!==candidate.id&&old.has(b.id)&&a.votes<=old.get(b.id)!.votes&&candidate.votes>b.votes);
 return passed.length?[{id:candidate.id,name:candidate.name,rank,previousRank:oldRanks.get(candidate.id)!,passed:passed.map(c=>c.name)}]:[];});
}
export function runoff(result:Result|null){
 const none={mode:'waiting' as string,ids:[] as string[],final:false,tied:false,threshold:0};
 if(!result||result.valid<=0||['Divulgação ainda não liberada','Aguardando totalização'].includes(result.status))return none;
 // Use exact vote counts: a displayed 50.00% can be rounded from either side.
 const sorted=ranking(result.candidates).map(c=>c.candidate);if(!sorted.length)return none;
 const final=result.status==='Totalização finalizada';const threshold=Math.floor(result.valid/2)+1;
 const majority=sorted.find(c=>c.votes>=threshold);
 if(majority)return {mode:'majority',ids:[majority.id],final,tied:false,threshold};
 if(sorted.length<2)return none;
 const tied=sorted.length>2&&sorted[2].votes===sorted[1].votes;
 return {mode:'runoff',ids:sorted.filter(c=>c.votes>=sorted[1].votes).map(c=>c.id),final,tied,threshold};
}

export function positionChanges(before:Candidate[],after:Candidate[]){
 const old=new Map(before.map(c=>[c.id,c]));const oldRanks=new Map(ranking(before).map(c=>[c.candidate.id,c.rank]));
 return ranking(after).flatMap(({candidate:c,rank})=>{const a=old.get(c.id);if(!a||c.percent<=0)return [];
 let up=false,down=false;
 for(const b of after){const previous=old.get(b.id);if(c.id===b.id||!previous)continue;
 if(a.votes<=previous.votes&&c.votes>b.votes)up=true;
 if(a.votes>=previous.votes&&c.votes<b.votes)down=true;
 }
 const previousRank=oldRanks.get(c.id)!;
 const direction=rank<previousRank?'up':rank>previousRank?'down':up&&!down?'up':down&&!up?'down':null;
 return direction&&((direction==='up'&&up)||(direction==='down'&&down))?[{id:c.id,rank,previousRank,direction}]:[];
 });
}
export function hasPlacement(candidate:Candidate){return candidate.percent>0;}
