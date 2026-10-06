import type {Result} from './tse';
export type Change={key:string;kind:string;candidate:string|null;name:string;before:number|null;after:number|null;delta:number|null};
export function changes(before:Result|null,after:Result,oldHash:string|null,newHash:string):Change[]{
 const events:Change[]=[];
 const flag=(kind:string)=>events.push({key:kind,kind,candidate:null,name:'Arquivo da fonte',before:null,after:null,delta:null});
 if(before&&after.generationTime<before.generationTime){flag('geracao_anterior');return events;}
 if(before&&oldHash===newHash)return events;
 if(before&&before.id===after.id)flag('mesmo_idg');
 const old=new Map((before?.candidates??[]).map(c=>[c.id,c]));const next=new Map(after.candidates.map(c=>[c.id,c]));
 for(const id of new Set([...old.keys(),...next.keys()])){
 const a=old.get(id),b=next.get(id);const delta=a&&b?b.votes-a.votes:null;
 const kind=!before?'base':!b?'candidato_ausente':!a?'candidato_incluido':delta!==null&&delta<0?'reducao':delta!==null&&delta>0?'aumento':a.status!==b.status||a.destination!==b.destination||a.elected!==b.elected?'situacao_alterada':null;
 if(kind)events.push({key:`${kind}:${id}`,kind,candidate:id,name:b?.name??a!.name,before:a?.votes??null,after:b?.votes??null,delta});
 }
 return events;
}
export async function recordAudit(db:any,last:any,uf:string,cargo:string,result:Result,hash:string,snapshot:number,log:number,received:string){
 const events=changes(last?JSON.parse(last.normalized):null,result,last?.hash??null,hash);
 if(!events.length)return;
 const statements=events.map(e=>db.prepare('INSERT INTO audit_events(uf,cargo,log_id,snapshot_id,previous_id,event_key,kind,candidate,name,before_votes,after_votes,delta,received) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(log_id,event_key) DO NOTHING').bind(uf,cargo,log,snapshot,last?.id??null,e.key,e.kind,e.candidate,e.name,e.before,e.after,e.delta,received));
 for(let i=0;i<statements.length;i+=100)await db.batch(statements.slice(i,i+100));
}
