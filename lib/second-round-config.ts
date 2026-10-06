import {env} from 'cloudflare:workers';
import {electionContext,secondElection,SECOND_START} from './election-context';
import {getStorage} from '../db';
import {capture} from './urn-capture';
import {CONFIG} from './urn-paths';
import {UFS} from './tse';
export async function loadSecondContext(){if(!env.BUCKET)throw Error('Acervo indisponível');const obj=await env.BUCKET.get('elections/2026-2/config/selection.json');return obj?{...secondElection,...await obj.json<Partial<typeof secondElection>>(),round:2 as const}:{...secondElection};}
export async function discoverSecond(){
 const c=electionContext();if(c.discoveryClosed)return {configured:true,complete:true};
 if(c.round!==2||Date.now()<Date.parse(SECOND_START))return {scheduled:true,startsAt:SECOND_START};
 const {db,bucket}=getStorage();const gate=await db.prepare('SELECT next_ms FROM source_state WHERE source=?').bind('second-config').first<{next_ms:number}>();if((gate?.next_ms??0)>Date.now())return {configured:c.configured,nextPoll:gate!.next_ms-Date.now()};
 let delay=60000,error:string|null=null;
 try{const response=await capture(CONFIG,'BR');const raw=JSON.parse(new TextDecoder().decode(response.bytes));if(raw.f!=='o')throw Error('Configuração não oficial.');const pleito=raw.pl?.find((p:any)=>p.c==='ele2026'&&p.dt==='25/10/2026');if(!pleito)throw Error('TSE ainda não publicou configuração do segundo turno.');
 const presidential=pleito.e?.find((e:any)=>String(e.t)==='2'&&e.abr?.some((a:any)=>a.cp?.some((cp:any)=>String(cp.cd)==='1')));
 const statewide=pleito.e?.find((e:any)=>String(e.t)==='2'&&e.abr?.some((a:any)=>a.cp?.some((cp:any)=>String(cp.cd)==='3')));
 if(!presidential||!/^\d+$/.test(String(presidential.cd))||!/^\d+$/.test(String(pleito.cd)))throw Error('Configuração presidencial do segundo turno incompleta.');
 const governors=(statewide?.abr??[]).filter((a:any)=>a.cp?.some((cp:any)=>String(cp.cd)==='3')).flatMap((a:any)=>String(a.cd).toUpperCase()==='BR'?UFS:[String(a.cd).toUpperCase()]).filter((uf:string)=>UFS.includes(uf));
 Object.assign(c,{president:String(presidential.cd),state:statewide?String(statewide.cd):c.state,pleito:String(pleito.cd),governors:[...new Set(governors)],configured:true});await bucket.put('config/selection.json',JSON.stringify(c));
 }catch(e){error=e instanceof Error?e.message:String(e);if(/403|429/.test(error))delay=610000;}
 await db.prepare('INSERT INTO source_state(source,next_ms,lease_until,error,checked) VALUES (?,?,0,?,?) ON CONFLICT(source) DO UPDATE SET next_ms=excluded.next_ms,error=excluded.error,checked=excluded.checked').bind('second-config',Date.now()+delay,error,new Date().toISOString()).run();return {configured:c.configured,error,nextPoll:delay};
}

export async function finishSecondDiscovery(){const c=electionContext();if(c.round!==2||!c.configured||c.discoveryClosed)return;const {db,bucket}=getStorage();const [results,municipal]=await Promise.all([db.prepare(`SELECT count(*) n,sum(CASE WHEN CAST(json_extract(s.normalized,'$.totalSections') AS INTEGER)>0 AND CAST(json_extract(s.normalized,'$.sections') AS INTEGER)>=CAST(json_extract(s.normalized,'$.totalSections') AS INTEGER) THEN 1 ELSE 0 END) done FROM result_jobs j LEFT JOIN snapshots s ON s.id=(SELECT id FROM snapshots WHERE source=j.source ORDER BY generation_ms DESC,id DESC LIMIT 1)`).first<{n:number;done:number}>(),db.prepare(`SELECT count(*) n,sum(CASE WHEN CAST(json_extract(s.normalized,'$.totalSections') AS INTEGER)>0 AND CAST(json_extract(s.normalized,'$.sections') AS INTEGER)>=CAST(json_extract(s.normalized,'$.totalSections') AS INTEGER) THEN 1 ELSE 0 END) done FROM municipal_jobs j LEFT JOIN municipal_snapshots s ON s.id=j.snapshot_id`).first<{n:number;done:number}>()]);if(results&&results.n>=29+c.governors.length&&results.done===results.n&&municipal&&municipal.n===5571&&municipal.done===municipal.n){c.discoveryClosed=true;await bucket.put('config/selection.json',JSON.stringify(c));}}
