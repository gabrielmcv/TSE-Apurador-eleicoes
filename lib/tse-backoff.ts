import {env} from 'cloudflare:workers';
const KEY='tse-shared-backoff';
export const RESULT_INTERVAL=10000;
export function retryUntil(value:string|null,now=Date.now()){
 const seconds=value&&/^\d+$/.test(value)?Number(value)*1000:0;
 const date=value?Date.parse(value):NaN;
 return Math.max(now+60000,seconds?now+seconds:0,Number.isFinite(date)?date:0);
}
export async function tsePause(){
 if(!env.DB)return 0;
 const state=await env.DB.prepare('SELECT next_ms FROM source_state WHERE source=?').bind(KEY).first<{next_ms:number}>();
 return Math.max(0,(state?.next_ms??0)-Date.now());
}
export class TsePausedError extends Error{readonly code='TSE_PAUSED';constructor(public retryAt:number){super('Consultas ao TSE temporariamente pausadas por limite de acesso.');}}
export async function requireTseAvailable(){const wait=await tsePause();if(wait)throw new TsePausedError(Date.now()+wait);}
export async function recordTseBackoff(response:Response){
 if(!env.DB||![403,429].includes(response.status))return;
 const until=retryUntil(response.headers.get('retry-after'));
 await env.DB.prepare('INSERT INTO source_state(source,next_ms,lease_until,error,checked,http) VALUES (?,?,0,?,?,?) ON CONFLICT(source) DO UPDATE SET next_ms=MAX(source_state.next_ms,excluded.next_ms),error=excluded.error,checked=excluded.checked,http=excluded.http').bind(KEY,until,`TSE respondeu HTTP ${response.status}`,new Date().toISOString(),response.status).run();
}
