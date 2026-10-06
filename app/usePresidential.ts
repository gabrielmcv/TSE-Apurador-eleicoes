'use client';
import {isSecondPage,roundFetch} from '../lib/round-client';
import {useEffect,useRef,useState} from 'react';
import type {Result} from '../lib/tse';
export type PresidentialData={result:Result|null;error:string|null;source:string;checked:string;nextPoll:number;http?:number;latency?:number;cadence?:{configuredMs:number;observedMs:number|null};archive?:{id:number;hash:string;received:string;saved:string}|null};
export default function usePresidential(initialData:PresidentialData|null=null){
 const [data,setData]=useState<PresidentialData|null>(initialData),[loading,setLoading]=useState(!initialData);const generation=useRef(initialData?.result?.generationTime??-Infinity);
 useEffect(()=>{let active=true;const controller=new AbortController();
 async function poll(){let delay=2000;try{const response=await roundFetch('/api/resultados?uf=BR&cargo=1',{cache:'no-store',signal:controller.signal});const next:PresidentialData=await response.json();if(!response.ok)throw Error(next.error??'Falha ao consultar a fonte.');if(!active)return;
 if(!next.result||next.result.generationTime>=generation.current){if(next.result)generation.current=next.result.generationTime;setData(next);}delay=next.nextPoll??2000;
 }catch(error){if(active)setData(old=>({result:old?.result??null,error:error instanceof Error?error.message:'Falha de conexão.',source:old?.source??'',checked:old?.checked??'',archive:old?.archive,nextPoll:15000}));delay=15000;}
 finally{if(active){setLoading(false);if(isSecondPage())setTimeout(poll,Math.max(2000,delay));}}}
 poll();return()=>{active=false;controller.abort();};},[]);
 return {data,loading};
}
