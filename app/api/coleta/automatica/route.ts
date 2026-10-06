import {discoverSecond,finishSecondDiscovery} from '../../../../lib/second-round-config';
import {pumpResults} from '../../../../lib/result-queue';
import {pumpMunicipal} from '../../../../lib/municipal-archive';
import {collectionClosed,urnCollectionClosed,electionInfo,electionContext} from '../../../../lib/election-context';
import {env,waitUntil} from 'cloudflare:workers';
import {getStorage} from '../../../../db';
import {POST as pumpUrns} from '../../urnas/route';
export const dynamic='force-dynamic';
export async function authorized(request:Request){
 const expected=(env as unknown as {COLLECTOR_KEY?:string}).COLLECTOR_KEY;
 const provided=request.headers.get('X-Collector-Key');
 if(!expected||!provided)return false;
 const digest=(value:string)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 const [a,b]=await Promise.all([digest(expected),digest(provided)]);
 const left=new Uint8Array(a),right=new Uint8Array(b);let mismatch=0;for(let i=0;i<left.length;i++)mismatch|=left[i]^right[i];return mismatch===0;
}
export async function POST(request:Request){
 if(!await authorized(request))return Response.json({error:'Acesso não autorizado.'},{status:401});
 if(electionContext().round===2&&collectionClosed())return Response.json({scheduled:true,election:electionInfo()});
 if(electionContext().round===2){const config=await discoverSecond();if(!electionContext().configured)return Response.json({configuration:config,nextPoll:config.nextPoll??60000,election:electionInfo()});}
 if(urnCollectionClosed())return Response.json({closed:true,election:electionInfo()});
 const started=Date.now();
 const task=(async()=>{
  const calls:Promise<unknown>[]=[];const names:string[]=[];if(electionContext().round===2){calls.push(pumpResults(),pumpMunicipal());names.push('resultados','municipios');}
 calls.push(pumpUrns().then(async response=>{const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error);return result;}));names.push('urnas');const records=await Promise.allSettled(calls);
  const results:Record<string,unknown>=Object.fromEntries(records.map((record,i)=>[names[i],record.status==='fulfilled'?record.value:{error:record.reason instanceof Error?record.reason.message:String(record.reason)}]));
  
  if(electionContext().round===2)await finishSecondDiscovery();
  const failures=records.filter(record=>record.status==='rejected').length;
  const {db}=getStorage();await db.prepare('INSERT INTO source_state(source,next_ms,lease_until,checked,http,latency,error) VALUES (?,0,0,?,?,?,?) ON CONFLICT(source) DO UPDATE SET checked=excluded.checked,http=excluded.http,latency=excluded.latency,error=excluded.error').bind('automatic-collector',new Date().toISOString(),failures?207:200,Date.now()-started,failures?'Um ou mais coletores falharam; consultar logs.':null).run();
  return {started:new Date(started).toISOString(),finished:new Date().toISOString(),results};
 })();
 waitUntil(task.catch(error=>console.error('Automatic collection failed',error)));
 try{return Response.json(await task,{headers:{'Cache-Control':'no-store'}});}catch(error){console.error(error);return Response.json({error:'Coleta automática temporariamente indisponível.'},{status:503});}
}
export async function GET(request:Request){
 if(!await authorized(request))return Response.json({error:'Acesso não autorizado.'},{status:401});
 const {db}=getStorage();
 const state=await db.prepare('SELECT checked,http,latency,error FROM source_state WHERE source=?').bind('automatic-collector').first();
 return Response.json({lastRun:state,closed:urnCollectionClosed(),votesClosed:collectionClosed(),scope:electionContext().round===2?'resultados,municipios,urnas':'urnas',election:electionInfo()},{headers:{'Cache-Control':'no-store'}});
}
