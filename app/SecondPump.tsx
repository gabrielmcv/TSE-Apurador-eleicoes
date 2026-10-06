'use client';
import {useEffect} from 'react';
import {isSecondPage,roundFetch} from '../lib/round-client';
export default function SecondPump(){useEffect(()=>{if(!isSecondPage())return;let active=true,timer:ReturnType<typeof setTimeout>;const c=new AbortController();async function pump(){let delay=60000;try{const r=await roundFetch('/api/coleta/segundo-turno',{method:'POST',signal:c.signal});const d=await r.json() as {nextPoll?:number};if(r.ok)delay=d.nextPoll??3000;}catch{}finally{if(active)timer=setTimeout(pump,Math.max(3000,delay));}}pump();return()=>{active=false;c.abort();clearTimeout(timer);};},[]);return null;}
