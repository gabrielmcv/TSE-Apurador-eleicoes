'use client';
import {roundFetch} from '../lib/round-client';
import {useEffect} from 'react';
export default function UrnPump(){useEffect(()=>{let active=true,timer:ReturnType<typeof setTimeout>;const controller=new AbortController();async function pump(){let delay=15000;try{const r=await roundFetch('/api/urnas',{method:'POST',signal:controller.signal});const d=await r.json() as {nextPoll?:number};if(r.ok)delay=d.nextPoll??3000;}catch{}finally{if(active)timer=setTimeout(pump,Math.max(3000,delay));}}pump();return()=>{active=false;controller.abort();clearTimeout(timer);};},[]);return null;}
